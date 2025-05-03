import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../index';
import styles from './Login.module.css';

// Replace `jwtDecode` with a custom function to decode JWT tokens
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1]; // Get the payload part of the JWT
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Replace URL-safe characters
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    return JSON.parse(jsonPayload); // Parse the JSON payload
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setMessage('Your session has expired. Please log in again.');
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      // Clear any existing tokens first
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');

      const response = await apiClient.post('/api/auth/login', {
        username,
        password,
      });

      const { token, user } = response.data;
      
      // Validate token exists and can be decoded
      if (!token) {
        throw new Error('No token received');
      }

      // Decode and validate token
      const decoded = decodeJWT(token);
      if (!decoded || !decoded.id || !decoded.role || !decoded.exp) {
        throw new Error('Invalid token format');
      }

      // Validate token expiration
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      if (expirationTime <= Date.now()) {
        throw new Error('Token is already expired');
      }

      // Store auth data only after all validation passes
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', decoded.role);
      localStorage.setItem('userId', decoded.id);

      // Navigate based on role
      switch (decoded.role) {
        case 'Admin':
          navigate('/admin-dashboard', { replace: true });
          break;
        case 'Technician':
          navigate('/technician-dashboard', { replace: true });
          break;
        default:
          navigate('/user-dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
      
      // Clear any partial auth data on error
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h1>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to manage your inventory</p>
        
        <form onSubmit={handleLogin} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={`${styles.message} ${styles.info}`}>{message}</div>}
          
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.loginButton}>
            Sign In
          </button>

          <Link to="/recover-password" className={styles.forgotPassword}>
            Forgot Password?
          </Link>
        </form>
      </div>
    </div>
  );
}

export default Login;