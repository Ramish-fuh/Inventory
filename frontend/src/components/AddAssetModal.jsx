import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import apiClient from '../index';
import styles from './EditAssetForm.module.css';

const AddAssetModal = ({ open, onClose, onAssetAdded }) => {
  const initialFormData = {
    name: '',
    assetTag: '',
    category: '',
    status: '',
    assignedTo: '',
    location: '',
    notes: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    licenseExpiry: '',
    nextMaintenance: '',
    maintenanceInterval: '',
    lastMaintenance: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.assetTag) newErrors.assetTag = 'Asset tag is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.status) newErrors.status = 'Status is required';
    
    if (formData.maintenanceInterval && isNaN(formData.maintenanceInterval)) {
      newErrors.maintenanceInterval = 'Must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await apiClient.post('/api/assets', formData);
      onAssetAdded(response.data);
      setFormData(initialFormData);
      onClose();
    } catch (error) {
      const serverErrors = error.response?.data?.errors || {};
      setErrors(prev => ({
        ...prev,
        ...serverErrors,
        submit: error.response?.data?.message || 'Error creating asset'
      }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Asset</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {errors.submit && (
            <div className={styles.error} style={{ marginBottom: '1rem' }}>
              {errors.submit}
            </div>
          )}

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              required
            />

            <TextField
              label="Asset Tag"
              name="assetTag"
              value={formData.assetTag}
              onChange={handleChange}
              error={!!errors.assetTag}
              helperText={errors.assetTag}
              fullWidth
              required
            />

            <FormControl fullWidth error={!!errors.category} required>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Category"
              >
                <MenuItem value="Laptop">Laptop</MenuItem>
                <MenuItem value="Desktop">Desktop</MenuItem>
                <MenuItem value="Server">Server</MenuItem>
                <MenuItem value="Mobile">Mobile</MenuItem>
                <MenuItem value="Software">Software</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
              {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth error={!!errors.status} required>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="In Use">In Use</MenuItem>
                <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
              </Select>
              {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
            </FormControl>

            <TextField
              label="Serial Number"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              error={!!errors.serialNumber}
              helperText={errors.serialNumber}
              fullWidth
            />

            <TextField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              error={!!errors.location}
              helperText={errors.location}
              fullWidth
            />

            <TextField
              label="Purchase Date"
              name="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Warranty Expiry"
              name="warrantyExpiry"
              type="date"
              value={formData.warrantyExpiry}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="License Expiry"
              name="licenseExpiry"
              type="date"
              value={formData.licenseExpiry}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Maintenance Interval (days)"
              name="maintenanceInterval"
              type="number"
              value={formData.maintenanceInterval}
              onChange={handleChange}
              error={!!errors.maintenanceInterval}
              helperText={errors.maintenanceInterval}
              fullWidth
            />

            <TextField
              label="Last Maintenance"
              name="lastMaintenance"
              type="date"
              value={formData.lastMaintenance}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </div>

          <TextField
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
            style={{ marginTop: '1rem' }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Create Asset
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddAssetModal;