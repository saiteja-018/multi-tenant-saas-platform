import api from './api';

export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email, password, subdomain) => {
    const response = await api.post('/auth/login', { email, password, subdomain });
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore logout errors
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

export const tenantService = {
  createTenant: async (data) => {
    const response = await api.post('/tenants', data);
    return response.data;
  },

  getCurrentTenant: async () => {
    const response = await api.get('/tenants/current');
    return response.data;
  },

  getAllTenants: async (params) => {
    const response = await api.get('/tenants', { params });
    return response.data;
  },

  getTenantById: async (id) => {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  },

  updateTenant: async (id, data) => {
    const response = await api.put(`/tenants/${id}`, data);
    return response.data;
  },

  deleteTenant: async (id) => {
    const response = await api.delete(`/tenants/${id}`);
    return response.data;
  }
};

export const userService = {
  createUser: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  getUsers: async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

export const projectService = {
  createProject: async (data) => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  getProjects: async (params) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  getProjectById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  updateProject: async (id, data) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  }
};

export const taskService = {
  createTask: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  getTasksByProject: async (projectId, params) => {
    const response = await api.get(`/tasks/project/${projectId}`, { params });
    return response.data;
  },

  getTaskById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  updateTask: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  updateTaskStatus: async (id, status) => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }
};
