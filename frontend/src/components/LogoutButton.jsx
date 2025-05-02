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
    <button 
      onClick={handleLogout} 
      style={{ 
        position: 'fixed',
        top: '8px', 
        right: '24px',
        zIndex: 1000,
        backgroundColor: 'transparent',
        color: 'var(--apple-blue)',
        padding: '8px 16px',
        border: '1px solid var(--apple-blue)',
        borderRadius: '6px',
        fontSize: '0.9rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--apple-blue)';
        e.currentTarget.style.color = 'white';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--apple-blue)';
      }}
    >
      Logout
    </button>
  );
};

export default LogoutButton;