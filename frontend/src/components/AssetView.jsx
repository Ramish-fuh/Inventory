import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../index';
import styles from './Dashboard.module.css';

function AssetView() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get(`/api/assets/${id}`)
      .then(response => {
        setAsset(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching asset:', err);
        setError('Failed to load asset details.');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!asset) {
    return <div className={styles.error}>Asset not found</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>{asset.name}</h1>
          <p className={styles.subtitle}>Asset Details</p>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.assetDetails}>
          <section className={styles.detailCard}>
            <h2>General Information</h2>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <h3>Asset Tag</h3>
                <p>{asset.assetTag}</p>
              </div>
              <div className={styles.detailItem}>
                <h3>Category</h3>
                <p>{asset.category}</p>
              </div>
              <div className={styles.detailItem}>
                <h3>Status</h3>
                <p className={`${styles.status} ${styles[asset.status.toLowerCase()]}`}>
                  {asset.status}
                </p>
              </div>
              {asset.assignedTo && (
                <div className={styles.detailItem}>
                  <h3>Assigned To</h3>
                  <p>{asset.assignedTo}</p>
                </div>
              )}
              {asset.location && (
                <div className={styles.detailItem}>
                  <h3>Location</h3>
                  <p>{asset.location}</p>
                </div>
              )}
            </div>
          </section>

          {asset.notes && (
            <section className={`${styles.detailCard} ${styles.notes}`}>
              <h2>Notes</h2>
              <p>{asset.notes}</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default AssetView;