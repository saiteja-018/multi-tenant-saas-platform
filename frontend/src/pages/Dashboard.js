import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { tenantService, projectService, taskService } from '../services';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (user.tenantId) {
        const tenantData = await tenantService.getCurrentTenant();
        setTenant(tenantData.data);

        const projectsData = await projectService.getProjects({ limit: 5 });
        const recentProjects = projectsData.data?.projects || [];
        setProjects(recentProjects);

        const taskBuckets = await Promise.all(
          recentProjects.map((project) =>
            taskService.getTasksByProject(project.id, { assignedTo: user.id, limit: 5 })
              .then((resp) => (resp.data?.tasks || []).map((task) => ({
                ...task,
                projectName: project.name
              })))
          )
        );

        const flattenedTasks = taskBuckets.flat();
        flattenedTasks.sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return dateA - dateB;
        });
        setMyTasks(flattenedTasks.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.loading}>
          <div style={styles.spinner}>⏳</div>
          <p>Loading dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>Welcome back, {user.fullName}!</p>
          </div>
          <div style={styles.badge}>
            {user.role?.replace('_', ' ')}
          </div>
        </div>

        {tenant && (
          <div style={styles.statsGrid} className="fade-in">
            <div style={{...styles.statCard, ...styles.statCard1}}>
              <div style={styles.statIcon}>👥</div>
              <div>
                <p style={styles.statLabel}>Users</p>
                <p style={styles.statValue}>{tenant.stats?.totalUsers || 0} / {tenant.maxUsers}</p>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: `${((tenant.stats?.totalUsers || 0) / tenant.maxUsers) * 100}%`}}></div>
                </div>
              </div>
            </div>

            <div style={{...styles.statCard, ...styles.statCard2}}>
              <div style={styles.statIcon}>📁</div>
              <div>
                <p style={styles.statLabel}>Projects</p>
                <p style={styles.statValue}>{tenant.stats?.totalProjects || 0} / {tenant.maxProjects}</p>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: `${((tenant.stats?.totalProjects || 0) / tenant.maxProjects) * 100}%`}}></div>
                </div>
              </div>
            </div>

            <div style={{...styles.statCard, ...styles.statCard3}}>
              <div style={styles.statIcon}>✅</div>
              <div>
                <p style={styles.statLabel}>Tasks</p>
                <p style={styles.statValue}>{tenant.stats?.totalTasks || 0}</p>
                <p style={styles.statHint}>Total tasks created</p>
              </div>
            </div>

            <div style={{...styles.statCard, ...styles.statCard4}}>
              <div style={styles.statIcon}>📊</div>
              <div>
                <p style={styles.statLabel}>Plan</p>
                <p style={styles.statValue}>{tenant.subscriptionPlan?.toUpperCase()}</p>
                <p style={styles.statHint}>{tenant.name}</p>
              </div>
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div style={styles.recentSection} className="slide-in">
            <h2 style={styles.sectionTitle}>Recent Projects</h2>
            <div style={styles.projectGrid}>
              {projects.map(project => (
                <div
                  key={project.id}
                  style={styles.projectCard}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/projects/${project.id}`);
                    }
                  }}
                >
                  <div style={styles.projectHeader}>
                    <h3 style={styles.projectName}>{project.name}</h3>
                    <span style={styles.statusBadge}>
                      {project.status}
                    </span>
                  </div>
                  <p style={styles.projectDesc}>{project.description}</p>
                  <div style={styles.projectFooter}>
                    <div style={styles.projectStat}>
                      <span style={styles.projectStatIcon}>📝</span>
                      <span>{project.taskCount || 0} tasks</span>
                    </div>
                    <div style={styles.projectStat}>
                      <span style={styles.projectStatIcon}>✓</span>
                      <span>{project.completedTaskCount || 0} done</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {myTasks.length > 0 && (
          <div style={styles.recentSection} className="slide-in">
            <h2 style={styles.sectionTitle}>My Tasks</h2>
            <div style={styles.taskList}>
              {myTasks.map((task) => (
                <div key={task.id} style={styles.taskItem}>
                  <div style={styles.taskMain}>
                    <div style={styles.taskTitle}>{task.title}</div>
                    <div style={styles.taskMeta}>
                      <span style={styles.taskProject}>{task.projectName}</span>
                      <span style={styles.taskPriority}>{task.priority}</span>
                      {task.dueDate && (
                        <span style={styles.taskDue}>{new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <span style={styles.taskStatus}>{task.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {projects.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📁</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
          </div>
        )}
      </div>
    </>
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
    color: '#1f2937',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280'
  },
  badge: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ede9fe',
    color: '#6d28d9',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '600',
    textTransform: 'capitalize'
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '1.75rem',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    transition: 'all 0.3s ease'
  },
  statCard1: {
    borderLeft: '4px solid #8b5cf6'
  },
  statCard2: {
    borderLeft: '4px solid #3b82f6'
  },
  statCard3: {
    borderLeft: '4px solid #10b981'
  },
  statCard4: {
    borderLeft: '4px solid #f59e0b'
  },
  statIcon: {
    fontSize: '2rem',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    backgroundColor: 'rgba(139, 92, 246, 0.1)'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '0.25rem',
    lineHeight: '1'
  },
  statHint: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '0.25rem'
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    marginTop: '0.75rem',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '3px',
    transition: 'width 0.5s ease'
  },
  recentSection: {
    marginTop: '3rem'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '1.5rem'
  },
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem'
  },
  projectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '1.5rem',
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
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    textTransform: 'capitalize'
  },
  projectDesc: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '1.25rem',
    lineHeight: '1.5'
  },
  projectFooter: {
    display: 'flex',
    gap: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb'
  },
  projectStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  projectStatIcon: {
    fontSize: '1rem'
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
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  taskItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  taskMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  taskTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  taskMeta: {
    display: 'flex',
    gap: '0.75rem',
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  taskProject: {
    fontWeight: '600'
  },
  taskPriority: {
    textTransform: 'uppercase'
  },
  taskDue: {
    color: '#9ca3af'
  },
  taskStatus: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    fontWeight: '600',
    color: '#4b5563'
  }
};

export default Dashboard;
