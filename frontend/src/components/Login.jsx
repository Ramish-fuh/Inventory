import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
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
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        username,
        password,
      });

      const token = response.data.token;
      localStorage.setItem('token', token);
      
      const decoded = token ? decodeJWT(token) : null;
      const userRole = decoded.role;
      localStorage.setItem('userRole', userRole);

      window.location.href = userRole === 'Admin' ? '/admin-dashboard' : '/user-dashboard';
    } catch (error) {
      setError('Invalid credentials. Please try again.');
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