import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode token to check expiration
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = decoded.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;

        // If token will expire in less than 30 minutes, clear it
        if (timeUntilExpiry < 30 * 60 * 1000) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
          
          // Only redirect if we're not already on the login page or auth-related pages
          const currentPath = window.location.pathname;
          if (!['/login', '/recover-password', '/reset-password'].some(path => currentPath.startsWith(path))) {
            window.location.href = '/login?expired=true';
            return Promise.reject(new Error('Token expired'));
          }
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
      }
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

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/api/auth/login')) {
      // Clear auth data only for non-login 401 errors
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      
      console.warn('🔒 Authentication Error: Token expired or invalid');
      
      // Only redirect if we're not already on the login page or auth-related pages
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