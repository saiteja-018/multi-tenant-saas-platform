import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/dashboard" style={styles.logo}>
          <div style={styles.logoIcon}>🚀</div>
          <span style={styles.logoText}>SaaS Platform</span>
        </Link>

        <div style={styles.menu}>
          <Link to="/dashboard" style={styles.menuItem}>
            📊 Dashboard
          </Link>
          {user?.role !== 'super_admin' && (
            <Link to="/projects" style={styles.menuItem}>
              📁 Projects
            </Link>
          )}
          {user?.role === 'tenant_admin' && (
            <Link to="/users" style={styles.menuItem}>
              👥 Users
            </Link>
          )}
          {user?.role === 'super_admin' && (
            <Link to="/tenants" style={styles.menuItem}>
              🏢 Tenants
            </Link>
          )}
        </div>

        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {user?.fullName?.charAt(0)?.toUpperCase()}
            </div>
            <div style={styles.userDetails}>
              <div style={styles.userName}>{user?.fullName}</div>
              <div style={styles.userRole}>{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '2rem'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '1.25rem',
    color: '#1f2937',
    transition: 'transform 0.2s ease'
  },
  logoIcon: {
    fontSize: '1.5rem'
  },
  logoText: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  menu: {
    display: 'flex',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center'
  },
  menuItem: {
    padding: '0.625rem 1.25rem',
    textDecoration: 'none',
    color: '#4b5563',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    fontSize: '0.95rem',
    fontWeight: '500',
    backgroundColor: 'transparent'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '1.1rem'
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem'
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  userRole: {
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'capitalize'
  },
  logoutButton: {
    padding: '0.5rem 1.25rem',
    backgroundColor: '#fff',
    color: '#ef4444',
    border: '2px solid #ef4444',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default Navbar;
