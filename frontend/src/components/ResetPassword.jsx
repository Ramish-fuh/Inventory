import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../index';
import styles from './Login.module.css'; // Reusing login styles

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setIsSuccess(false);
      setMessage('Passwords do not match');
      return;
    }

    apiClient.post('/api/auth/reset-password', { token, newPassword })
      .then((response) => {
        setIsSuccess(true);
        setMessage(response.data.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      })
      .catch((error) => {
        setIsSuccess(false);
        setMessage('Error resetting password. Please try again.');
        console.error(error);
      });
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h1>Reset Password</h1>
        <p className={styles.subtitle}>Enter your new password</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {message && (
            <div className={`${styles.message} ${isSuccess ? styles.success : styles.error}`}>
              {message}
            </div>
          )}
          
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.loginButton}>
            Reset Password
          </button>

          <a href="/login" className={styles.forgotPassword}>
            Back to Login
          </a>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;