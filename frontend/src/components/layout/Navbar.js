import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
        <Link to="/dashboard" style={styles.brand}>
          Multi-Tenant SaaS
        </Link>
        
        <div style={styles.menu}>
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>
          <Link to="/projects" style={styles.link}>Projects</Link>
          
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <Link to="/users" style={styles.link}>Users</Link>
          )}
          
          {user?.role === 'super_admin' && (
            <Link to="/tenants" style={styles.link}>Tenants</Link>
          )}
          
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.fullName}</span>
            <span style={styles.userRole}>({user?.role})</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#2c3e50',
    padding: '1rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  brand: {
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none'
  },
  menu: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center'
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem',
    transition: 'color 0.3s'
  },
  userInfo: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    color: 'white'
  },
  userName: {
    fontWeight: '500'
  },
  userRole: {
    fontSize: '0.9rem',
    opacity: 0.8
  },
  logoutBtn: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '0.5rem'
  }
};

export default Navbar;
