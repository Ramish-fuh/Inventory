import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import Login from './components/Login';
import { jwtDecode } from 'jwt-decode';

function App() {
  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;
  const userRole = decoded ? decoded.role : null;

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Conditionally render routes based on user role */}
        {userRole === 'Admin' && (
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        )}
        {userRole === 'user' && (
          <Route path="/user-dashboard" element={<UserDashboard />} />
        )}
        {!userRole && (
          <Route path="*" element={<Login />} />
        )}

        {/* Default route */}
        <Route path="/" element={<div>Please log in</div>} />

        {/* Add a fallback route to handle unmatched locations */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;