import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../index';

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    apiClient.post('/api/auth/reset-password', { token, newPassword })
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        setMessage('Error resetting password.');
        console.error(error);
      });
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter your new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ResetPassword;