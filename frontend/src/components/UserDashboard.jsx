import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EditIcon from '@mui/icons-material/Edit';
import apiClient from '../index';
import styles from './Dashboard.module.css';

function UserDashboard() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [displayedAssets, setDisplayedAssets] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const userRole = localStorage.getItem('userRole');
  const canEdit = userRole === 'Technician';

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
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          navigate('/login');
          return;
        }
        setError('Failed to load assets. Please try again later.');
        setLoading(false);
      });
  }, [navigate]);

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

  const generateQR = async (assetId) => {
    try {
      if (!assetId) {
        console.error('Invalid asset ID:', assetId);
        alert('Invalid asset ID. Please try again.');
        return;
      }

      const response = await apiClient.get(`/api/qr/${assetId}`);
      const qrWindow = window.open('', '_blank');
      qrWindow.document.write(`
        <html>
          <head>
            <title>Asset QR Code</title>
            <style>
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background-color: #f5f5f7;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              }
              .container {
                text-align: center;
                background: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              img {
                max-width: 300px;
                margin-bottom: 1rem;
              }
              .url {
                color: #666;
                margin-top: 1rem;
                word-break: break-all;
              }
              button {
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: #0066cc;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
              }
              button:hover {
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="${response.data.qrCode}" alt="QR Code" />
              <div class="url">${response.data.url}</div>
              <button onclick="window.print()">Print QR Code</button>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error generating QR code:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
      }
    }
  };

  const renderActionButtons = (asset) => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
      <Tooltip title="Generate QR Code">
        <IconButton onClick={() => generateQR(asset._id)}>
          <QrCode2Icon />
        </IconButton>
      </Tooltip>
      
      {canEdit && (
        <Tooltip title="Edit Asset">
          <IconButton onClick={() => navigate(`/assets/${asset._id}`)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );

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
          <h1>My Assets</h1>
          <p className={styles.subtitle}>View and manage your assigned assets</p>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Assigned Assets</h3>
            <p className={styles.statNumber}>{assets.length}</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Under Maintenance</h3>
            <p className={styles.statNumber}>
              {assets.filter(asset => asset.status === 'Under Maintenance').length}
            </p>
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
                  {renderActionButtons(asset)}
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