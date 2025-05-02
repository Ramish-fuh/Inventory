import React from 'react';
import apiClient from '../index';

const LogoutButton = () => {
  const handleLogout = () => {
    apiClient.post('/api/auth/logout')
      .then(() => {
        localStorage.removeItem('token'); // Clear the token from localStorage
        window.location.href = '/login'; // Redirect to login page
      })
      .catch((error) => {
        console.error('Error during logout:', error);
      });
  };

  return (
    <button onClick={handleLogout} style={{ position: 'absolute', top: 10, right: 10 }}>
      Logout
    </button>
  );
};

export default LogoutButton;