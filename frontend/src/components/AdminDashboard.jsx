import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip, Grid, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import apiClient from '../index';
import EditAssetForm from './EditAssetForm';
import styles from './Dashboard.module.css';

function AdminDashboard() {
  const [assets, setAssets] = useState([]);
  const [displayedAssets, setDisplayedAssets] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [editingAsset, setEditingAsset] = useState(null);

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
        (asset.assignedTo && asset.assignedTo.toLowerCase().includes(query)) ||
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

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (assignedToFilter) params.append('assignedTo', assignedToFilter);

      const response = await axios.get(`/api/assets?${params.toString()}`);
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [searchQuery, categoryFilter, statusFilter, assignedToFilter]);

  const handleDelete = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await axios.delete(`/api/assets/${assetId}`);
        fetchAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  const generateQR = async (assetId) => {
    try {
      const response = await axios.get(`/api/qr/${assetId}`);
      // Open QR code in new window
      const qrWindow = window.open('', '_blank');
      qrWindow.document.write(`<img src="${response.data.qrCode}" alt="QR Code" />`);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

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
          <div className={styles.controls}>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Search assets"
                  variant="outlined"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Laptop">Laptop</MenuItem>
                    <MenuItem value="Desktop">Desktop</MenuItem>
                    <MenuItem value="Server">Server</MenuItem>
                    <MenuItem value="Mobile">Mobile</MenuItem>
                    <MenuItem value="Software">Software</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                   
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Available">Available</MenuItem>
                    <MenuItem value="In Use">In Use</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Retired">Retired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Assigned To"
                  variant="outlined"
                  value={assignedToFilter}
                  onChange={(e) => setAssignedToFilter(e.target.value)}
                  placeholder="Search by user name"
                />
              </Grid>
            </Grid>
          </div>

          <div className={styles.assetsGrid}>
            {displayedAssets.map(asset => (
              <Grid item xs={12} sm={6} md={4} key={asset._id}>
                <Card 
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
                    {asset.assignedTo && (
                      <Typography variant="body2" color="textSecondary" style={{ marginBottom: '8px' }}>
                        Assigned to: {asset.assignedTo}
                      </Typography>
                    )}
                    <Typography variant="body2" color="textSecondary" style={{ marginBottom: '8px' }}>
                      Serial: {asset.serialNumber}
                    </Typography>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <Tooltip title="Generate QR Code">
                        <IconButton onClick={() => generateQR(asset._id)}>
                          <QrCode2Icon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Asset">
                        <IconButton onClick={() => setEditingAsset(asset)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Asset">
                        <IconButton onClick={() => handleDelete(asset._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </div>
                    <Link 
                      to={`/assets/${asset._id}`} 
                      className={styles.viewDetailsLink}
                      style={{ marginTop: 'auto' }}
                    >
                      View Details
                    </Link>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </div>
        </section>
      </main>

      {editingAsset && (
        <EditAssetForm
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSave={() => {
            setEditingAsset(null);
            fetchAssets();
          }}
        />
      )}
    </div>
  );
}

export default AdminDashboard;