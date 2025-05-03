import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
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
          <Route path="/scan" element={<PrivateRoute element={<QRScanner />} role={['Admin', 'Technician', 'User']} />} />

          {/* Protected Admin Dashboard Route */}
          <Route
            path="/admin-dashboard"
            element={<PrivateRoute element={<AdminDashboard />} role="Admin" />}
          />

          {/* Protected Technician Dashboard Route */}
          <Route
            path="/technician-dashboard"
            element={<PrivateRoute element={<TechnicianDashboard />} role="Technician" />}
          />

          {/* Protected User Management Route */}
          <Route
            path="/user-management"
            element={<PrivateRoute element={<UserManagement />} role="Admin" />}
          />

          {/* Protected Logs Route */}
          <Route
            path="/logs"
            element={<PrivateRoute element={<LogViewer />} role="Admin" />}
          />

          {/* Protected User Dashboard Route */}
          <Route
            path="/user-dashboard"
            element={<PrivateRoute element={<UserDashboard />} role="User" />}
          />

          {/* Protected Asset View Route */}
          <Route
            path="/assets/:id"
            element={<PrivateRoute element={<AssetView />} role={['Admin', 'Technician', 'User']} />}
          />

          {/* Default route - redirect to appropriate dashboard based on role */}
          <Route 
            path="/" 
            element={
              decoded ? (
                decoded.role === 'Admin' ? 
                  <Navigate to="/admin-dashboard" /> :
                  decoded.role === 'Technician' ?
                    <Navigate to="/technician-dashboard" /> :
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