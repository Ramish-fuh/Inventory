import React, { useState } from 'react';
import apiClient from '../index';

const RecoverPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    apiClient.post('/api/auth/recover-password', { email })
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        setMessage('Error sending recovery email.');
        console.error(error);
      });
  };

  return (
    <div>
      <h2>Recover Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Recovery Email</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default RecoverPassword;