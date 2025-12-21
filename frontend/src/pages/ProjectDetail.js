import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { taskService, projectService, userService } from '../services';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assignedTo: '',
    dueDate: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [projectData, tasksData, usersData] = await Promise.all([
        projectService.getProjectById(id),
        taskService.getTasksByProject(id),
        userService.getUsers()
      ]);
      
      setProject(projectData.data);
      setTasks(tasksData.data);
      setUsers(usersData.data);
    } catch (error) {
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await taskService.createTask({ ...formData, projectId: id });
      setShowModal(false);
      setFormData({ title: '', description: '', priority: 'medium', status: 'todo', assignedTo: '', dueDate: '' });
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      loadData();
    } catch (error) {
      alert('Error updating task status');
    }
  };

  const handleDelete = async (taskId, title) => {
    if (window.confirm(`Delete task "${title}"?`)) {
      try {
        await taskService.deleteTask(taskId);
        loadData();
      } catch (error) {
        alert('Error deleting task');
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Navbar />
        <div style={styles.content}>
          <div style={styles.loading}>Loading project details...</div>
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
            <h1 style={styles.title}>{project?.name}</h1>
            <p style={styles.subtitle}>{project?.description}</p>
          </div>
          <button onClick={() => setShowModal(true)} style={styles.createBtn}>
            + Add Task
          </button>
        </div>

        <div style={styles.boardContainer}>
          {['todo', 'in_progress', 'completed'].map(status => {
            const statusTasks = tasks.filter(t => t.status === status);
            return (
              <div key={status} style={styles.column}>
                <div style={styles.columnHeader}>
                  <h3 style={styles.columnTitle}>
                    {status === 'todo' ? '📋 To Do' : status === 'in_progress' ? '⚡ In Progress' : '✅ Completed'}
                  </h3>
                  <span style={styles.taskCount}>{statusTasks.length}</span>
                </div>
                
                <div style={styles.columnContent}>
                  {statusTasks.map(task => (
                    <div key={task.id} style={styles.taskCard} className="slide-in">
                      <h4 style={styles.taskTitle}>{task.title}</h4>
                      {task.description && <p style={styles.taskDesc}>{task.description}</p>}
                      
                      <div style={styles.taskMeta}>
                        <span style={{...styles.priorityBadge, ...getPriorityStyle(task.priority)}}>
                          {task.priority}
                        </span>
                        {task.assigned_to_name && (
                          <span style={styles.assigneeBadge}>
                            <span style={styles.assigneeAvatar}>{task.assigned_to_name.charAt(0).toUpperCase()}</span>
                            {task.assigned_to_name}
                          </span>
                        )}
                      </div>

                      {task.due_date && (
                        <p style={styles.dueDate}>📅 {new Date(task.due_date).toLocaleDateString()}</p>
                      )}

                      <div style={styles.taskActions}>
                        {status !== 'completed' && (
                          <button 
                            onClick={() => handleStatusChange(task.id, status === 'todo' ? 'in_progress' : 'completed')}
                            style={styles.moveBtn}
                          >
                            {status === 'todo' ? '→ Start' : '→ Complete'}
                          </button>
                        )}
                        <button onClick={() => handleDelete(task.id, task.title)} style={styles.deleteBtn}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  {statusTasks.length === 0 && (
                    <div style={styles.emptyColumn}>
                      <div style={styles.emptyIcon}>
                        {status === 'todo' ? '📝' : status === 'in_progress' ? '⚙️' : '🎉'}
                      </div>
                      <p>No tasks here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {showModal && (
          <div style={styles.modal} onClick={() => setShowModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Create New Task</h2>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Task Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Enter task title"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Add task details..."
                    style={{...styles.input, minHeight: '100px', resize: 'vertical'}}
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      style={styles.input}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      style={styles.input}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Assign To</label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                      style={styles.input}
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.buttonGroup}>
                  <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitBtn}>
                    Create Task
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

const getPriorityStyle = (priority) => {
  const styles = {
    high: { backgroundColor: '#fee2e2', color: '#991b1b' },
    medium: { backgroundColor: '#fef3c7', color: '#92400e' },
    low: { backgroundColor: '#dbeafe', color: '#1e40af' }
  };
  return styles[priority] || styles.medium;
};

const styles = {
  container: {
    minHeight: '100vh',
    paddingTop: '80px',
  },
  content: {
    maxWidth: '1600px',
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
    whiteSpace: 'nowrap',
  },
  boardContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  column: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    minHeight: '500px',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
  },
  columnTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  taskCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
  },
  columnContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  taskCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
  },
  taskTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 8px 0',
  },
  taskDesc: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  taskMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  priorityBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  assigneeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
  },
  assigneeAvatar: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '700',
  },
  dueDate: {
    fontSize: '13px',
    color: '#718096',
    marginBottom: '12px',
  },
  taskActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  moveBtn: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  deleteBtn: {
    background: 'transparent',
    border: '2px solid #ef4444',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
  },
  emptyColumn: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#fff',
    opacity: 0.6,
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
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
    maxWidth: '600px',
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
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
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
};

export default ProjectDetail;
