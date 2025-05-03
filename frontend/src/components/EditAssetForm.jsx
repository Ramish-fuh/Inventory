import React, { useState, useEffect } from 'react';
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
  FormHelperText,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import apiClient from '../index';
import styles from './EditAssetForm.module.css';

const EditAssetForm = ({ asset, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    assetTag: '',
    category: '',
    status: '',
    assignedTo: null,
    location: '',
    notes: '',
    serialNumber: '',
    purchaseDate: null,
    warrantyExpiry: null,
    licenseExpiry: null,
    nextMaintenance: null,
    maintenanceInterval: '',
    lastMaintenance: null
  });

  const [errors, setErrors] = useState({});
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'Admin';
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (asset) {
      // Convert dates to YYYY-MM-DD format for input fields
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
      };

      setFormData({
        name: asset.name || '',
        assetTag: asset.assetTag || '',
        category: asset.category || '',
        status: asset.status || '',
        assignedTo: asset.assignedTo?._id || null, // Store the user ID
        location: asset.location || '',
        notes: asset.notes || '',
        serialNumber: asset.serialNumber || '',
        purchaseDate: formatDate(asset.purchaseDate),
        warrantyExpiry: formatDate(asset.warrantyExpiry),
        licenseExpiry: formatDate(asset.licenseExpiry),
        nextMaintenance: formatDate(asset.nextMaintenance),
        maintenanceInterval: asset.maintenanceInterval || '',
        lastMaintenance: formatDate(asset.lastMaintenance)
      });

      // Set selected user if asset is assigned
      if (asset.assignedTo) {
        setSelectedUser({
          _id: asset.assignedTo._id,
          fullName: asset.assignedTo.fullName,
          username: asset.assignedTo.username
        });
      }
    }
  }, [asset]);

  const validateForm = () => {
    const newErrors = {};
    
    // Required field validations
    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.assetTag?.trim()) newErrors.assetTag = 'Asset tag is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.status) newErrors.status = 'Status is required';
    if (!formData.location?.trim()) newErrors.location = 'Location is required';
    
    // Date validations
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for date comparisons

    const validateDate = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) ? date : null;
    };

    const purchaseDate = validateDate(formData.purchaseDate);
    const warrantyExpiry = validateDate(formData.warrantyExpiry);
    const licenseExpiry = validateDate(formData.licenseExpiry);
    const lastMaintenance = validateDate(formData.lastMaintenance);
    const nextMaintenance = validateDate(formData.nextMaintenance);

    // Purchase date cannot be in the future
    if (purchaseDate && purchaseDate > today) {
      newErrors.purchaseDate = 'Purchase date cannot be in the future';
    }

    // Warranty expiry must be after purchase date
    if (warrantyExpiry && purchaseDate && warrantyExpiry < purchaseDate) {
      newErrors.warrantyExpiry = 'Warranty expiry must be after purchase date';
    }

    // License expiry validation
    if (licenseExpiry && purchaseDate && licenseExpiry < purchaseDate) {
      newErrors.licenseExpiry = 'License expiry must be after purchase date';
    }

    // Last maintenance cannot be in the future
    if (lastMaintenance && lastMaintenance > today) {
      newErrors.lastMaintenance = 'Last maintenance date cannot be in the future';
    }

    // Next maintenance must be in the future
    if (nextMaintenance && nextMaintenance < today) {
      newErrors.nextMaintenance = 'Next maintenance date must be in the future';
    }

    // Status-based validations
    if (formData.status === 'In Use' && !formData.assignedTo) {
      newErrors.assignedTo = 'Asset must be assigned to a user when status is In Use';
    }

    // Maintenance interval validation
    if (formData.maintenanceInterval) {
      const interval = Number(formData.maintenanceInterval);
      if (isNaN(interval) || interval <= 0 || !Number.isInteger(interval)) {
        newErrors.maintenanceInterval = 'Maintenance interval must be a positive whole number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUserSearch = async (value) => {
    if (!value || value.length < 2) {
      setUserSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.get(`/api/users/search?query=${value}`);
      setUserSuggestions(response.data);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Modified handleChange to work with Autocomplete
  const handleChange = (e, field, value) => {
    if (field === 'assignedTo') {
      setSelectedUser(value);
      setFormData(prev => ({
        ...prev,
        assignedTo: value ? value._id : null
      }));
    } else {
      const { name, value: fieldValue } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: fieldValue
      }));

      // Clear error when field is edited
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      }

      // Handle status change
      if (name === 'status' && fieldValue !== 'In Use') {
        setFormData(prev => ({
          ...prev,
          [name]: fieldValue,
          assignedTo: null
        }));
        setSelectedUser(null);
      }
    }
  };

  const prepareDataForSubmission = () => {
    const data = { ...formData };
    
    // Handle date fields
    const dateFields = ['purchaseDate', 'warrantyExpiry', 'licenseExpiry', 'nextMaintenance', 'lastMaintenance'];
    dateFields.forEach(field => {
      if (data[field]) {
        // Ensure date is in ISO format for MongoDB
        const date = new Date(data[field]);
        if (!isNaN(date.getTime())) {
          data[field] = date.toISOString();
        } else {
          data[field] = null;
        }
      } else {
        data[field] = null;
      }
    });

    // Convert maintenanceInterval to number or null
    if (data.maintenanceInterval === '') {
      data.maintenanceInterval = null;
    } else if (data.maintenanceInterval) {
      data.maintenanceInterval = Number(data.maintenanceInterval);
    }

    // Handle assignedTo field - ensure it's an ObjectId or null
    if (!data.assignedTo || data.assignedTo === '') {
      data.assignedTo = null;
    }

    // Convert empty strings to null for optional fields
    ['location', 'notes', 'serialNumber'].forEach(field => {
      if (data[field] === '') {
        data[field] = null;
      }
    });

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous submission error
    setErrors(prev => ({ ...prev, submit: undefined }));

    if (!validateForm()) return;

    try {
      const dataToSubmit = prepareDataForSubmission();
      console.log('Submitting form data:', JSON.stringify(dataToSubmit, null, 2));
      const response = await apiClient.put(`/api/assets/${asset._id}`, dataToSubmit);
      onUpdate(response.data);
      onClose();
    } catch (err) {
      console.error('Server validation error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.status === 400 && err.response?.data?.errors) {
        setErrors(prev => ({
          ...prev,
          ...err.response.data.errors,
          submit: err.response.data.message
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          submit: err.response?.data?.message || err.response?.data?.error || 'Error updating asset'
        }));
      }
    }
  };

  return (
    <>
      <DialogTitle>Edit Asset</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {errors.submit && (
            <div className={styles.error} style={{ marginBottom: '1rem', color: 'red' }}>
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
                onChange={(e) => handleChange(e)}
                label="Status"
                disabled={!isAdmin && formData.status === 'In Use'}
              >
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="In Use" disabled={!isAdmin}>In Use</MenuItem>
                <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
              </Select>
              {!isAdmin && formData.status === 'In Use' && (
                <FormHelperText>Only administrators can change assigned assets</FormHelperText>
              )}
            </FormControl>

            {isAdmin && formData.status === 'In Use' && (
              <FormControl fullWidth error={!!errors.assignedTo}>
                <Autocomplete
                  value={selectedUser}
                  onChange={(e, newValue) => handleChange(e, 'assignedTo', newValue)}
                  onInputChange={(e, newInputValue) => {
                    setSearchTerm(newInputValue);
                    handleUserSearch(newInputValue);
                  }}
                  options={userSuggestions}
                  getOptionLabel={(option) => `${option.fullName} (${option.username})`}
                  loading={isSearching}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assigned To"
                      error={!!errors.assignedTo}
                      helperText={errors.assignedTo}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </FormControl>
            )}

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
              required
            />

            <TextField
              label="Purchase Date"
              name="purchaseDate"
              type="date"
              value={formData.purchaseDate || ''}
              onChange={handleChange}
              error={!!errors.purchaseDate}
              helperText={errors.purchaseDate}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Warranty Expiry"
              name="warrantyExpiry"
              type="date"
              value={formData.warrantyExpiry || ''}
              onChange={handleChange}
              error={!!errors.warrantyExpiry}
              helperText={errors.warrantyExpiry}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="License Expiry"
              name="licenseExpiry"
              type="date"
              value={formData.licenseExpiry || ''}
              onChange={handleChange}
              error={!!errors.licenseExpiry}
              helperText={errors.licenseExpiry}
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
              value={formData.lastMaintenance || ''}
              onChange={handleChange}
              error={!!errors.lastMaintenance}
              helperText={errors.lastMaintenance}
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
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </>
  );
};

export default EditAssetForm;