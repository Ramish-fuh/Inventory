import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateRoute = ({ element, role }) => {
  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;

  if (!decoded) {
    return <Navigate to="/login" />;
  }

  const hasAccess = Array.isArray(role) 
    ? role.includes(decoded.role)
    : role === decoded.role || role === undefined;

  if (!hasAccess) {
    if (decoded.role === 'Admin' || decoded.role === 'Technician') {
      return <Navigate to="/admin-dashboard" />;
    } else {
      return <Navigate to="/user-dashboard" />;
    }
  }

  return element;
};

export default PrivateRoute;