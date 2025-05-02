import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../index';
import styles from './EditAssetForm.module.css';

const EditAssetForm = ({ asset, onClose, onUpdate }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
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
  });
  const [error, setError] = useState('');
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        category: asset.category || '',
        status: asset.status || '',
        assignedTo: asset.assignedTo || '',
        location: asset.location || '',
        notes: asset.notes || '',
        serialNumber: asset.serialNumber || '',
        purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
        warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : '',
        licenseExpiry: asset.licenseExpiry ? new Date(asset.licenseExpiry).toISOString().split('T')[0] : '',
        nextMaintenance: asset.nextMaintenance ? new Date(asset.nextMaintenance).toISOString().split('T')[0] : '',
        maintenanceInterval: asset.maintenanceInterval || '',
        lastMaintenance: asset.lastMaintenance ? new Date(asset.lastMaintenance).toISOString().split('T')[0] : ''
      });
    }
  }, [asset]);

  const handleUserSearch = async (value) => {
    if (value.length < 2) {
      setUserSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.get(`/api/users/search?query=${value}`);
      setUserSuggestions(response.data);
    } catch (err) {
      console.error('Error searching users:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
        return;
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'assignedTo') {
      handleUserSearch(value);
    }
  };

  const handleUserSelect = (user) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: user.fullName
    }));
    setUserSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.put(`/api/assets/${asset._id}`, formData);
      onUpdate(response.data);
      onClose();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
        return;
      }
      setError(err.response?.data?.message || 'Error updating asset');
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2>Edit Asset</h2>
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="Laptop">Laptop</option>
            <option value="Desktop">Desktop</option>
            <option value="Server">Server</option>
            <option value="Mobile">Mobile</option>
            <option value="Software">Software</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="">Select Status</option>
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="purchaseDate">Purchase Date</label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="warrantyExpiry">Warranty Expiry</label>
          <input
            type="date"
            id="warrantyExpiry"
            name="warrantyExpiry"
            value={formData.warrantyExpiry}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="licenseExpiry">License Expiry</label>
          <input
            type="date"
            id="licenseExpiry"
            name="licenseExpiry"
            value={formData.licenseExpiry}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="lastMaintenance">Last Maintenance Date</label>
          <input
            type="date"
            id="lastMaintenance"
            name="lastMaintenance"
            value={formData.lastMaintenance}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="nextMaintenance">Next Maintenance Due</label>
          <input
            type="date"
            id="nextMaintenance"
            name="nextMaintenance"
            value={formData.nextMaintenance}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="maintenanceInterval">Maintenance Interval (days)</label>
          <input
            type="number"
            id="maintenanceInterval"
            name="maintenanceInterval"
            value={formData.maintenanceInterval}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="serialNumber">Serial Number</label>
          <input
            type="text"
            id="serialNumber"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="assignedTo">Assigned To</label>
          <div className={styles.autocompleteWrapper}>
            <input
              type="text"
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              autoComplete="off"
            />
            {isSearching && <div className={styles.loadingIndicator}>Searching...</div>}
            {userSuggestions.length > 0 && (
              <ul className={styles.suggestionsList}>
                {userSuggestions.map(user => (
                  <li
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className={styles.suggestionItem}
                  >
                    {user.fullName} ({user.username})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button type="submit" className={styles.submitButton}>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAssetForm;