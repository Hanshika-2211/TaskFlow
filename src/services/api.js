import axios from 'axios';

const isProduction = import.meta.env.PROD;
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (isProduction ? '/api' : 'http://localhost:5050/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized access (e.g. token expired)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear storage and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are in the browser, trigger redirect
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  register: async (name, email, password) => {
    const response = await API.post('/auth/register', { name, email, password });
    return response.data;
  },
  login: async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    return response.data;
  },
};

// Task endpoints
export const taskService = {
  getAll: async (status) => {
    const response = await API.get('/tasks', {
      params: status ? { status } : {},
    });
    return response.data;
  },
  create: async (taskData) => {
    const response = await API.post('/tasks', taskData);
    return response.data;
  },
  update: async (id, taskData) => {
    const response = await API.put(`/tasks/${id}`, taskData);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/tasks/${id}`);
    return response.data;
  },
};

// User endpoints (for assignment selection)
export const userService = {
  getAll: async () => {
    const response = await API.get('/users');
    return response.data;
  },
  create: async (userData) => {
    const response = await API.post('/users', userData);
    return response.data;
  },
};

export default API;
