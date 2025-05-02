import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import Login from './components/Login';
import { jwtDecode } from 'jwt-decode';
import PrivateRoute from './components/PrivateRoute';
import LogoutButton from './components/LogoutButton';
import RecoverPassword from './components/RecoverPassword';
import ResetPassword from './components/ResetPassword';

function App() {
  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;
  const userRole = decoded ? decoded.role : null;

  return (
    <Router>
      <div>
        {localStorage.getItem('token') && <LogoutButton />} {/* Show LogoutButton only if logged in */}
        <Routes>
          {/* Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Password Recovery and Reset Routes */}
          <Route path="/recover-password" element={<RecoverPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protect admin-dashboard with PrivateRoute */}
          <Route
            path="/admin-dashboard"
            element={<PrivateRoute element={<AdminDashboard />} role="Admin" />}
          />

          {/* Protect user-dashboard with PrivateRoute */}
          <Route
            path="/user-dashboard"
            element={<PrivateRoute element={<UserDashboard />} role="user" />}
          />

          {/* Default route */}
          <Route path="/" element={<div>Please log in</div>} />

          {/* Add a fallback route to handle unmatched locations */}
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;