import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import apiClient from '../index';
import styles from './Dashboard.module.css';

function AdminDashboard() {
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/assets')
      .then(response => {
        if (Array.isArray(response.data)) {
          setAssets(response.data);
        } else {
          throw new Error('Invalid data format: Expected an array');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching assets:', err);
        setError('Failed to load assets. Please try again later.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Admin Dashboard</h1>
          <p className={styles.subtitle}>Manage your inventory assets</p>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Assets</h3>
            <p className={styles.statNumber}>{assets.length}</p>
          </div>
          
          {/* Add more stat cards here */}
          <div className={styles.statCard}>
            <h3>Active Assets</h3>
            <p className={styles.statNumber}>
              {assets.filter(asset => asset.status === 'In Use').length}
            </p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Available Assets</h3>
            <p className={styles.statNumber}>
              {assets.filter(asset => asset.status === 'Available').length}
            </p>
          </div>
        </div>

        <section className={styles.assetsSection}>
          <h2>Assets Overview</h2>
          <div className={styles.assetsGrid}>
            {assets.map(asset => (
              <Card 
                key={asset._id} 
                className={styles.assetCard}
                style={{ margin: 0, padding: 0 }}
              >
                <CardContent style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h5" className={styles.assetName}>
                    {asset.name}
                  </Typography>
                  <Typography variant="body1" className={styles.assetDescription} style={{ flex: 1 }}>
                    {asset.description}
                  </Typography>
                  <Link 
                    to={`/assets/${asset._id}`} 
                    className={styles.viewDetailsLink}
                    style={{ marginTop: 'auto' }}
                  >
                    View Details
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;