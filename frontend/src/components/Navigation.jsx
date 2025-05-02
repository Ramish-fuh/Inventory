import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navigation.module.css';

const Navigation = () => {
  const location = useLocation();
  const userRole = localStorage.getItem('userRole');

  if (!localStorage.getItem('token')) return null;

  return (
    <nav className={styles.navigation}>
      <div className={styles.navContainer}>
        <div className={styles.navLinks}>
          {userRole === 'Admin' ? (
            <Link 
              to="/admin-dashboard" 
              className={`${styles.navLink} ${location.pathname === '/admin-dashboard' ? styles.active : ''}`}
            >
              Dashboard
            </Link>
          ) : (
            <Link 
              to="/user-dashboard" 
              className={`${styles.navLink} ${location.pathname === '/user-dashboard' ? styles.active : ''}`}
            >
              Dashboard
            </Link>
          )}
          {location.pathname.startsWith('/assets/') && (
            <span className={`${styles.navLink} ${styles.active}`}>
              Asset Details
            </span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;