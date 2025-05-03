import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateRoute = ({ element, role }) => {
  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;

  // Check if user is authenticated
  if (!decoded) {
    return <Navigate to="/login" />;
  }

  // If no specific role is required, allow access
  if (!role) {
    return element;
  }

  // Check if user is admin (admins can access everything)
  if (decoded.role.toLowerCase() === 'admin') {
    return element;
  }

  // For non-admin users, check if they're accessing user-level routes
  if (role.toLowerCase() === 'user' && decoded.role.toLowerCase() !== 'admin') {
    return element;
  }

  // If trying to access admin routes without admin role, redirect to user dashboard
  if (role.toLowerCase() === 'admin' && decoded.role.toLowerCase() !== 'admin') {
    return <Navigate to="/user-dashboard" />;
  }

  // Default case: redirect to appropriate dashboard based on role
  return decoded.role.toLowerCase() === 'admin' ? 
    <Navigate to="/admin-dashboard" /> : 
    <Navigate to="/user-dashboard" />;
};

export default PrivateRoute;