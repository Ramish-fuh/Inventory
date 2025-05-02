import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip, Button, Grid, Dialog } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import apiClient from '../index';
import EditAssetForm from './EditAssetForm';
import styles from './Dashboard.module.css';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import AddAssetModal from './AddAssetModal';
import ExportInfoModal from './ExportInfoModal';

function AdminDashboard() {
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
  const [deleteModalAsset, setDeleteModalAsset] = useState(null);
  const [exportType, setExportType] = useState(null);

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
        asset.name?.toLowerCase().includes(query) ||
        asset.category?.toLowerCase().includes(query) ||
        asset.assignedTo?.toLowerCase().includes(query) ||
        asset.location?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortOrder === 'asc' ? 1 : -1;

      // Convert to strings for string comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
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

      const response = await apiClient.get(`/api/assets?${params.toString()}`);
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [searchQuery, categoryFilter, statusFilter, assignedToFilter]);

  const handleDelete = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await apiClient.delete(`/api/assets/${assetId}`);
        fetchAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          navigate('/login');
        }
      }
    }
  };

  const generateQR = async (assetId) => {
    try {
      // Validate assetId
      if (!assetId) {
        console.error('Invalid asset ID:', assetId);
        alert('Invalid asset ID. Please try again.');
        return;
      }

      const response = await apiClient.get(`/api/qr/${assetId}`);

      // Create and style the QR code window
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
      } else if (error.response?.status === 400) {
        alert('Could not generate QR code. Please make sure the asset ID is valid.');
      } else {
        alert('Error generating QR code. Please try again later.');
      }
    }
  };

  const handleGenerateQR = (asset) => {
    if (!asset || !asset._id) {
      console.error('Asset or Asset ID is null:', asset);
      alert('Invalid asset. Cannot generate QR code.');
      return;
    }
    generateQR(asset._id);
  };

  const handleExport = async (format) => {
    try {
      const response = await apiClient.get(`/api/assets/export/${format}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asset-inventory.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
    }
  };

  const handleDeleteClick = (asset) => {
    setDeleteModalAsset(asset);
  };

  const handleDeleteConfirm = async (assetId) => {
    try {
      await apiClient.delete(`/api/assets/${assetId}`);
      fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
      }
    }
  };

  const handleExportClick = (format) => {
    setExportType(format);
  };

  const handleConfirmExport = async () => {
    if (!exportType) return;
    await handleExport(exportType);
    setExportType(null);
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
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsAddModalOpen(true)}
              style={{ marginRight: '8px' }}
            >
              Add Asset
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExportClick('pdf')}
              style={{ marginRight: '8px' }}
            >
              Export PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExportClick('excel')}
            >
              Export Excel
            </Button>
          </div>
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
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
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
                        Assigned to: {asset.assignedTo}
                      </Typography>
                    )}
                    <Typography variant="body2" color="textSecondary" style={{ marginBottom: '8px' }}>
                      Serial: {asset.serialNumber}
                    </Typography>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <Tooltip title="Generate QR Code">
                        <IconButton onClick={() => handleGenerateQR(asset)}>
                          <QrCode2Icon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Asset">
                        <IconButton onClick={() => setEditingAsset(asset)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Asset">
                        <IconButton onClick={() => handleDeleteClick(asset)}>
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
          </Grid>
        </section>
      </main>

      {/* Modals */}
      <AddAssetModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAssetAdded={(newAsset) => {
          fetchAssets();
        }}
      />

      <DeleteConfirmationModal
        open={!!deleteModalAsset}
        onClose={() => setDeleteModalAsset(null)}
        onConfirm={handleDeleteConfirm}
        asset={deleteModalAsset}
      />

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

      {/* Add ExportInfoModal */}
      <ExportInfoModal
        open={!!exportType}
        onClose={() => setExportType(null)}
        type={exportType}
        onConfirm={handleConfirmExport}
      />
    </div>
  );
}

export default AdminDashboard;