import React, { useState } from 'react';
import apiClient from '../index';
import styles from './Login.module.css'; // Reusing login styles

const RecoverPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    apiClient.post('/api/auth/recover-password', { email })
      .then((response) => {
        setIsSuccess(true);
        setMessage(response.data.message);
      })
      .catch((error) => {
        setIsSuccess(false);
        setMessage('Error sending recovery email. Please try again.');
        console.error(error);
      });
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h1>Password Recovery</h1>
        <p className={styles.subtitle}>Enter your email to reset your password</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {message && (
            <div className={`${styles.message} ${isSuccess ? styles.success : styles.error}`}>
              {message}
            </div>
          )}
          
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.loginButton}>
            Send Recovery Email
          </button>

          <a href="/login" className={styles.forgotPassword}>
            Back to Login
          </a>
        </form>
      </div>
    </div>
  );
};

export default RecoverPassword;