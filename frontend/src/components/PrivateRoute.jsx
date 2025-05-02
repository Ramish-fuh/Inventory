import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';

const PrivateRoute = ({ element, role, ...rest }) => {
  const token = localStorage.getItem('token');
  const decoded = token ? jwt_decode(token) : null;

  // Check if the user is authenticated and has the correct role
  if (decoded && decoded.role === role) {
    return <Route {...rest} element={element} />;
  } else {
    return <Navigate to="/login" />;
  }
};

export default PrivateRoute;