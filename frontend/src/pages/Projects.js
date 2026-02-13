import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data.data?.projects || []);
    } catch (error) {
      alert('Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await projectService.createProject(formData);
      setShowModal(false);
      setFormData({ name: '', description: '' });
      loadProjects();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating project');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete project "${name}"?`)) {
      try {
        await projectService.deleteProject(id);
        loadProjects();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting project');
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Navbar />
        <div style={styles.content}>
          <div style={styles.loading}>⏳ Loading projects...</div>
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
            <div style={styles.emptyIcon}>🏢</div>
            <h3>Projects Not Available for Super Admin</h3>
            <p>Super Admin manages organizations through the Tenants page.</p>
            <p>To view and manage projects, login with a tenant account.</p>
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
            <h1 style={styles.title}>Projects</h1>
            <p style={styles.subtitle}>{projects.length} {projects.length === 1 ? 'project' : 'projects'}</p>
          </div>
          {user?.role === 'tenant_admin' && (
            <button onClick={() => setShowModal(true)} style={styles.createBtn}>
              + Add Project
            </button>
          )}
        </div>

        {projects.length > 0 ? (
          <div style={styles.projectGrid} className="fade-in">
            {projects.map(project => (
              <div key={project.id} style={styles.projectCard}>
                <div style={styles.projectHeader}>
                  <h3 style={styles.projectName}>{project.name}</h3>
                  <span style={styles.statusBadge}>{project.status}</span>
                </div>
                <p style={styles.description}>{project.description}</p>
                
                <div style={styles.stats}>
                  <div style={styles.stat}>
                    <span style={styles.statIcon}>📝</span>
                    <span>{project.taskCount || 0} tasks</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statIcon}>✓</span>
                    <span>{project.completedTaskCount || 0} done</span>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <button 
                    onClick={() => navigate(`/projects/${project.id}`)} 
                    style={styles.viewBtn}
                  >
                    View Tasks →
                  </button>
                  <button 
                    onClick={() => handleDelete(project.id, project.name)} 
                    style={styles.deleteBtn}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📁</div>
            <h3>No projects yet</h3>
            <p style={styles.emptyText}>Create your first project to get started</p>
            <button onClick={() => setShowModal(true)} style={styles.createBtn}>
              + Create Your First Project
            </button>
          </div>
        )}

        {showModal && (
          <div style={styles.modal} onClick={() => setShowModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Create New Project</h2>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    style={styles.input}
                    placeholder="Enter project name"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    style={{...styles.input, minHeight: '100px', resize: 'vertical'}}
                    placeholder="Describe your project"
                  />
                </div>

                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitBtn}>
                    Create Project
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
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
    minHeight: 'calc(100vh - 80px)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: '700',
    color: '#1f2937'
  },
  createBtn: {
    padding: '0.875rem 1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 80px)',
    fontSize: '1.25rem',
    color: '#6b7280'
  },
  spinner: {
    fontSize: '3rem',
    marginBottom: '1rem'
  },
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem'
  },
  projectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '1.75rem',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },
  projectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  projectName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  description: {
    color: '#6b7280',
    margin: '1rem 0',
    fontSize: '0.9rem',
    lineHeight: '1.5'
  },
  stats: {
    display: 'flex',
    gap: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
    marginBottom: '1rem'
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  statIcon: {
    fontSize: '1rem'
  },
  cardActions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.25rem'
  },
  viewBtn: {
    flex: 1,
    padding: '0.625rem 1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease'
  },
  deleteBtn: {
    padding: '0.625rem 1rem',
    backgroundColor: 'transparent',
    color: '#ef4444',
    border: '2px solid #ef4444',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s ease'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '2px dashed #e5e7eb'
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem'
  },
  emptyText: {
    color: '#6b7280',
    marginBottom: '2rem'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease'
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    padding: '2.5rem',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '540px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    animation: 'slideIn 0.3s ease'
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '1.5rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  input: {
    padding: '0.875rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '1rem',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '1rem'
  },
  cancelBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#fff',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease'
  },
  submitBtn: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease'
  }
};

export default Projects;
