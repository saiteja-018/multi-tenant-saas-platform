import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { tenantService } from '../services';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await tenantService.getAllTenants();
      setTenants(response.data?.tenants || []);
    } catch (error) {
      alert('Error loading tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.isEditing) {
        await tenantService.updateTenant(formData.id, {
          name: formData.name,
          description: formData.description
        });
      } else {
        await tenantService.createTenant({
          name: formData.name,
          description: formData.description
        });
      }
      setShowModal(false);
      setFormData({ name: '', description: '' });
      loadTenants();
    } catch (error) {
      alert(error.response?.data?.message || (formData.isEditing ? 'Error updating tenant' : 'Error creating tenant'));
    }
  };

  const handleDelete = async (tenantId, tenantName) => {
    if (window.confirm(`Delete tenant "${tenantName}"? This action cannot be undone.`)) {
      try {
        await tenantService.deleteTenant(tenantId);
        loadTenants();
      } catch (error) {
        alert('Error deleting tenant');
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Navbar />
        <div style={styles.content}>
          <div style={styles.loading}>⏳ Loading tenants...</div>
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
            <h1 style={styles.title}>Organizations</h1>
            <p style={styles.subtitle}>{tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'} in the system</p>
          </div>
          <button onClick={() => setShowModal(true)} style={styles.createBtn}>
            ➕ Create Tenant
          </button>
        </div>

        {showModal && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>
                {formData.isEditing ? 'Edit Organization' : 'Create New Organization'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Organization Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Acme Corporation"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    style={styles.input}
                    required
                    autoComplete="off"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description (optional)</label>
                  <textarea
                    placeholder="Brief description of the organization"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    style={{...styles.input, minHeight: '100px', resize: 'vertical'}}
                    autoComplete="off"
                  />
                </div>
                <div style={styles.modalActions}>
                  <button type="submit" style={styles.submitBtn}>
                    {formData.isEditing ? 'Update Tenant' : 'Create Tenant'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div style={styles.tenantGrid}>
          {tenants.map(tenant => (
            <div key={tenant.id} style={styles.tenantCard} className="slide-in">
              <div style={styles.tenantHeader}>
                <div style={styles.tenantAvatar}>
                  {tenant.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={styles.tenantInfo}>
                  <h3 style={styles.tenantName}>{tenant.name}</h3>
                  <p style={styles.tenantId}>ID: {tenant.id}</p>
                </div>
              </div>

              {tenant.description && (
                <p style={styles.description}>{tenant.description}</p>
              )}

              <div style={styles.stats}>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Created</span>
                    <span style={styles.statValue}>{new Date(tenant.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Status</span>
                    <span style={{...styles.statValue, ...styles.activeStatus}}>● {tenant.status}</span>
                </div>
              </div>

              <button 
                onClick={() => handleDelete(tenant.id, tenant.name)} 
                style={styles.deleteBtn}
                title="Delete tenant"
              >
                🗑️ Delete
              </button>
              <button 
                onClick={() => {
                  setFormData({ 
                    name: tenant.name, 
                    description: tenant.description || '',
                    id: tenant.id,
                    isEditing: true
                  });
                  setShowModal(true);
                }}
                style={styles.editBtn}
                title="Edit tenant"
              >
                ✏️ Edit
              </button>
            </div>
          ))}
        </div>

        {tenants.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🏢</div>
            <h3>No tenants yet</h3>
            <p>Create your first organization to get started</p>
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
    gap: '20px',
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
    padding: '12px 20px',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
    whiteSpace: 'nowrap',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'slideUp 0.3s ease',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '24px',
    margin: '0 0 24px 0',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  submitBtn: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#e2e8f0',
    color: '#4a5568',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tenantGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  tenantCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'default',
  },
  tenantHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  tenantAvatar: {
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
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 4px 0',
  },
  tenantId: {
    fontSize: '13px',
    color: '#718096',
    margin: 0,
    fontFamily: 'monospace',
  },
  description: {
    fontSize: '14px',
    color: '#4a5568',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    padding: '16px 0',
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '16px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a202c',
  },
  activeStatus: {
    color: '#065f46',
  },
  deleteBtn: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#ef4444',
    border: '2px solid #ef4444',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '8px',
  },
  editBtn: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
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
};

export default Tenants;
