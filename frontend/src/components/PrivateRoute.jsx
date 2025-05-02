import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateRoute = ({ element, role }) => {
  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;

  // Check if the user is authenticated and has the correct role
  if (decoded && decoded.role === role) {
    return element; // Render the protected component
  } else {
    return <Navigate to="/login" />; // Redirect to login
  }
};

export default PrivateRoute;