import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Link } from 'react-router-dom';
import apiClient from '../index';
import styles from './Dashboard.module.css';

function UserDashboard() {
  const [assets, setAssets] = useState([]);
  const [displayedAssets, setDisplayedAssets] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    apiClient.get('/api/assets')
      .then(response => {
        if (Array.isArray(response.data)) {
          setAssets(response.data);
          setDisplayedAssets(response.data);
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

  // Handle search and sort whenever the criteria change
  useEffect(() => {
    let filtered = [...assets];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(query) ||
        asset.category.toLowerCase().includes(query) ||
        (asset.location && asset.location.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      // Handle case-insensitive string comparison
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setDisplayedAssets(filtered);
  }, [searchQuery, sortBy, sortOrder, assets]);

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
        </div>

        <section className={styles.assetsSection}>
          <div className={styles.controls}>
            <TextField
              placeholder="Search assets..."
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchField}
            />
            
            <FormControl variant="outlined" className={styles.sortSelect}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>

            <FormControl variant="outlined" className={styles.sortSelect}>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                label="Order"
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className={styles.assetsGrid}>
            {displayedAssets.map(asset => (
              <Card 
                key={asset._id} 
                className={styles.assetCard}
                style={{ margin: 0, padding: 0 }}
              >
                <CardContent style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h5" className={styles.assetName}>
                    {asset.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" style={{ marginBottom: '8px' }}>
                    {asset.category}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" style={{ marginBottom: '8px' }}>
                    Status: {asset.status}
                  </Typography>
                  {asset.location && (
                    <Typography variant="body2" color="textSecondary" style={{ marginBottom: '8px' }}>
                      Location: {asset.location}
                    </Typography>
                  )}
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

export default UserDashboard;