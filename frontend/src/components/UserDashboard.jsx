import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Link } from '@mui/material';
import apiClient from '../index';
import styles from './Dashboard.module.css';

function UserDashboard() {
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
          <h1>User Dashboard</h1>
          <p className={styles.subtitle}>View and manage your assigned assets</p>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>My Assets</h3>
            <p className={styles.statNumber}>{assets.length}</p>
          </div>
          {/* Add more stat cards as needed */}
        </div>

        <section className={styles.assetsSection}>
          <h2>My Assets</h2>
          <div className={styles.assetsGrid}>
            {assets.map(asset => (
              <Card key={asset.id} className={styles.assetCard}>
                <CardContent>
                  <Typography variant="h5" className={styles.assetName}>
                    {asset.name}
                  </Typography>
                  <Typography variant="body1" className={styles.assetDescription}>
                    {asset.description}
                  </Typography>
                  <Link href={`/assets/${asset.id}`} className={styles.viewDetailsLink}>
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

export default UserDashboard;