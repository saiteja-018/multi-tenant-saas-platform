import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user'
  });
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin]);

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data.data?.users || []);
    } catch (error) {
      alert('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.createUser(formData);
      setShowModal(false);
      setFormData({ email: '', password: '', fullName: '', role: 'user' });
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating user');
    }
  };

  const handleDelete = async (userId, email) => {
    if (window.confirm(`Delete user "${email}"?`)) {
      try {
        await userService.deleteUser(userId);
        loadUsers();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: { bg: '#fef3c7', text: '#92400e' },
      tenant_admin: { bg: '#dbeafe', text: '#1e40af' },
      user: { bg: '#e0e7ff', text: '#3730a3' }
    };
    return colors[role] || colors.user;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Navbar />
        <div style={styles.content}>
          <div style={styles.loading}>⏳ Loading users...</div>
        </div>
      </div>
    );
  }

  if (isSuperAdmin) {
    return (
      <div style={styles.container}>
        <Navbar />
        <div style={styles.content}>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>👥</div>
            <h3>Users Not Available for Super Admin</h3>
            <p>Super Admin manages organizations through the Tenants page.</p>
            <p>To view and manage users, login with a tenant account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.content} className="fade-in">
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Team Members</h1>
            <p style={styles.subtitle}>{users.length} {users.length === 1 ? 'user' : 'users'} in your organization</p>
          </div>
          {(user.role === 'tenant_admin' || user.role === 'super_admin') && (
            <button onClick={() => setShowModal(true)} style={styles.createBtn}>
              + Add User
            </button>
          )}
        </div>

        <div style={styles.userGrid} className="fade-in">
          {users.map(u => {
            const roleColor = getRoleBadgeColor(u.role);
            return (
              <div key={u.id} style={styles.userCard}>
                <div style={styles.userAvatar}>
                  {u.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <div style={styles.userInfo}>
                  <h3 style={styles.userName}>{u.fullName}</h3>
                  <p style={styles.email}>{u.email}</p>
                  <div style={styles.badges}>
                    <span style={{...styles.roleBadge, backgroundColor: roleColor.bg, color: roleColor.text}}>
                      {u.role.replace('_', ' ')}
                    </span>
                    {u.isActive ? (
                      <span style={styles.activeBadge}>● Active</span>
                    ) : (
                      <span style={styles.inactiveBadge}>● Inactive</span>
                    )}
                  </div>
                </div>

                {(user.role === 'tenant_admin' || user.role === 'super_admin') && u.id !== user.userId && (
                  <button 
                    onClick={() => handleDelete(u.id, u.email)} 
                    style={styles.deleteBtn}
                    title="Delete user"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {users.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>👥</div>
            <h3>No users yet</h3>
            <p>Add your first team member to get started</p>
          </div>
        )}

        {showModal && (
          <div style={styles.modal} onClick={() => setShowModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Add New User</h2>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                    placeholder="John Doe"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="john@company.com"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    placeholder="Strong password"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    style={styles.input}
                  >
                    <option value="user">User</option>
                    <option value="tenant_admin">Tenant Admin</option>
                    {user.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>

                <div style={styles.buttonGroup}>
                  <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitBtn} disabled={loading}>
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    paddingTop: '80px',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    margin: '0',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '16px',
    color: '#fff',
    opacity: 0.9,
    marginTop: '8px',
  },
  createBtn: {
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  userGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    position: 'relative',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'default',
  },
  userAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '700',
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 4px 0',
  },
  email: {
    fontSize: '14px',
    color: '#718096',
    margin: '0 0 12px 0',
  },
  badges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  roleBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  inactiveBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  deleteBtn: {
    background: 'transparent',
    border: '2px solid #ef4444',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#fff',
  },
  emptyIcon: {
    fontSize: '80px',
    marginBottom: '20px',
    opacity: 0.5,
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '40px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  modalTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '30px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#4a5568',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '14px 16px',
    fontSize: '15px',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#718096',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  submitBtn: {
    flex: 1,
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '14px',
  },
};

export default Users;
