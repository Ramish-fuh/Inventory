import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip, Button, Grid, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EditIcon from '@mui/icons-material/Edit';
import apiClient from '../index';
import EditAssetForm from './EditAssetForm';
import styles from './Dashboard.module.css';
import AddAssetModal from './AddAssetModal';
import Dialog from '@mui/material/Dialog';

function TechnicianDashboard() {
  const navigate = useNavigate();
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (assignedToFilter) params.append('assignedTo', assignedToFilter);

      const response = await apiClient.get(`/api/assets?${params.toString()}`);
      const assetData = Array.isArray(response.data) ? response.data : response.data.assets || [];
      setAssets(assetData);
      setDisplayedAssets(assetData);
    } catch (error) {
      console.error('Error fetching assets:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
      }
      setError('Failed to load assets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [searchQuery, categoryFilter, statusFilter, assignedToFilter]);

  // Handle filtering and sorting
  useEffect(() => {
    if (!Array.isArray(assets)) return;
    
    let filtered = [...assets];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset =>
        (asset.name?.toLowerCase().includes(query)) ||
        (asset.category?.toLowerCase().includes(query)) ||
        (asset.location?.toLowerCase().includes(query)) ||
        (asset.serialNumber?.toLowerCase().includes(query))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(asset => asset.category === categoryFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (aValue === null || aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortOrder === 'asc' ? 1 : -1;

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setDisplayedAssets(filtered);
  }, [assets, searchQuery, categoryFilter, statusFilter, sortBy, sortOrder]);

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

  const renderActionButtons = (asset) => {
    return (
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
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box p={3}>
        <div className={styles.dashboardContainer}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <h1>Technician Dashboard</h1>
              <p className={styles.subtitle}>Manage inventory assets</p>
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
                <h3>Under Maintenance</h3>
                <p className={styles.statNumber}>
                  {assets.filter(asset => asset.status === 'Under Maintenance').length}
                </p>
              </div>
            </div>

            <section className={styles.assetsSection}>
              <div className={styles.controls}>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, lg: 3 }}>
                    <TextField
                      fullWidth
                      label="Search assets"
                      variant="outlined"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, lg: 3 }}>
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
                  <Grid size={{ xs: 12, lg: 3 }}>
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
                        <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                        <MenuItem value="Retired">Retired</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, lg: 3 }}>
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

              <Grid container spacing={3}>
                {displayedAssets.map(asset => (
                  <Grid size={{ xs: 12, lg: 6, xl: 4 }} key={asset._id}>
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
                            Assigned to: {typeof asset.assignedTo === 'object' ? asset.assignedTo.fullName || asset.assignedTo.username : asset.assignedTo}
                          </Typography>
                        )}
                        <Typography variant="body2" color="textSecondary" style={{ marginBottom: '8px' }}>
                          Serial: {asset.serialNumber}
                        </Typography>
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
                  </Grid>
                ))}
              </Grid>
            </section>
          </main>

          {editingAsset && (
            <Dialog open={true} onClose={() => setEditingAsset(null)} maxWidth="md" fullWidth>
              <EditAssetForm
                asset={editingAsset}
                onClose={() => setEditingAsset(null)}
                onUpdate={(updatedAsset) => {
                  setEditingAsset(null);
                  fetchAssets();
                }}
              />
            </Dialog>
          )}
        </div>
      </Box>
    </Box>
  );
}

export default TechnicianDashboard;