import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import AssetView from './components/AssetView';
import Login from './components/Login';
import { jwtDecode } from 'jwt-decode';
import PrivateRoute from './components/PrivateRoute';
import RecoverPassword from './components/RecoverPassword';
import ResetPassword from './components/ResetPassword';
import Navigation from './components/Navigation';
import UserManagement from './components/UserManagement';
import QRScanner from './components/QRScanner';
import LogViewer from './components/LogViewer';

function App() {
  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;
  const userRole = decoded ? decoded.role : null;

  return (
    <Router>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--apple-light-gray)'
      }}>
        <Navigation />
        <Routes>
          {/* Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Password Recovery and Reset Routes */}
          <Route path="/recover-password" element={<RecoverPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* QR Scanner Route */}
          <Route path="/scan" element={<PrivateRoute element={<QRScanner />} role={userRole} />} />

          {/* Protect admin-dashboard with PrivateRoute */}
          <Route
            path="/admin-dashboard"
            element={<PrivateRoute element={<AdminDashboard />} role="Admin" />}
          />

          {/* Protect logs with PrivateRoute */}
          <Route
            path="/logs"
            element={<PrivateRoute element={<LogViewer />} role="Admin" />}
          />

          {/* Protect user-management with PrivateRoute */}
          <Route
            path="/user-management"
            element={<PrivateRoute element={<UserManagement />} role="Admin" />}
          />

          {/* Protect user-dashboard with PrivateRoute */}
          <Route
            path="/user-dashboard"
            element={<PrivateRoute element={<UserDashboard />} role="User" />}
          />

          {/* Protected Asset View Route */}
          <Route
            path="/assets/:id"
            element={<PrivateRoute element={<AssetView />} role={userRole} />}
          />

          {/* Default route - redirect to appropriate dashboard based on role */}
          <Route 
            path="/" 
            element={
              decoded ? 
                (decoded.role.toLowerCase() === 'admin' ? 
                  <Navigate to="/admin-dashboard" /> : 
                  <Navigate to="/user-dashboard" />
                ) : 
                <Navigate to="/login" />
            } 
          />

          {/* Add a fallback route to handle unmatched locations */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;