import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import styles from './Navigation.module.css';
import { jwtDecode } from 'jwt-decode';
import LogoutButton from './LogoutButton';
import NotificationBell from './NotificationBell';
import ErrorBoundary from './ErrorBoundary';

function Navigation() {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;
  const userRole = decoded ? decoded.role : null;

  // Don't show navigation on login and password recovery pages
  if (['/login', '/recover-password'].includes(location.pathname) || 
      location.pathname.startsWith('/reset-password')) {
    return null;
  }

  if (!token) return null;

  return (
    <nav className={styles.navigation}>
      <div className={styles.navLinks}>
        {userRole === 'Admin' ? (
          <>
            <Link 
              to="/admin-dashboard" 
              className={`${styles.navLink} ${location.pathname === '/admin-dashboard' ? styles.active : ''}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/user-management" 
              className={`${styles.navLink} ${location.pathname === '/user-management' ? styles.active : ''}`}
            >
              User Management
            </Link>
          </>
        ) : (
          <Link 
            to="/user-dashboard" 
            className={`${styles.navLink} ${location.pathname === '/user-dashboard' ? styles.active : ''}`}
          >
            Dashboard
          </Link>
        )}
      </div>
      <div className={styles.rightControls}>
        {userRole === 'Admin' && (
          <ErrorBoundary fallback="Unable to load notifications">
            <NotificationBell />
          </ErrorBoundary>
        )}
        <Link to="/scan" className={styles.scanButton}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<QrCodeScannerIcon />}
            size="small"
          >
            Scan QR
          </Button>
        </Link>
        <LogoutButton />
      </div>
    </nav>
  );
}

export default Navigation;