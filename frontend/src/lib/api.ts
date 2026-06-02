import axios from 'axios';

const apiHost = import.meta.env.VITE_API_URL || '';
const api = axios.create({
  baseURL: `${apiHost.endsWith('/') ? apiHost.slice(0, -1) : apiHost}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
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

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      localStorage.removeItem('token');
      // window.location.href = '/'; // Or use a cleaner state-based approach
    }
    return Promise.reject(error);
  }
);

export default api;
