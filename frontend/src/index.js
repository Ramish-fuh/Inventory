import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request logging
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🌐 API Request: ${config.method.toUpperCase()} ${config.url}`, { 
      headers: config.headers,
      data: config.data 
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response and error logging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      
      console.warn('🔒 Authentication Error: Token expired or invalid');
      
      // Only redirect if we're not already on the login page
      const currentPath = window.location.pathname;
      if (!['/login', '/recover-password', '/reset-password'].some(path => currentPath.startsWith(path))) {
        window.location.href = '/login?expired=true';
      }
    } else {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;