import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import apiClient from '../index';
import styles from './Dashboard.module.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'Viewer',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpen = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        password: '' // Clear password field when editing
      });
    } else {
      setSelectedUser(null);
      setFormData({
        username: '',
        fullName: '',
        email: '',
        role: 'Viewer',
        password: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      
      // Only include password if it's provided or if creating new user
      if (!dataToSend.password && selectedUser) {
        delete dataToSend.password;
      }

      if (selectedUser) {
        await apiClient.put(`/api/users/${selectedUser._id}`, dataToSend);
      } else {
        await apiClient.post('/api/users', dataToSend);
      }
      handleClose();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiClient.delete(`/api/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>User Management</h1>
          <p className={styles.subtitle}>Manage system users</p>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleOpen()}
            style={{ marginTop: '16px' }}
          >
            Add New User
          </Button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Button 
                      color="primary" 
                      onClick={() => handleOpen(user)}
                      style={{ marginRight: '8px' }}
                    >
                      Edit
                    </Button>
                    <Button 
                      color="error" 
                      onClick={() => handleDelete(user._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                name="username"
                label="Username"
                type="text"
                fullWidth
                value={formData.username}
                onChange={handleChange}
                required
              />
              <TextField
                margin="dense"
                name="fullName"
                label="Full Name"
                type="text"
                fullWidth
                value={formData.fullName}
                onChange={handleChange}
                required
              />
              <TextField
                margin="dense"
                name="email"
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={handleChange}
                required
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Technician">Technician</MenuItem>
                  <MenuItem value="Viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
              {/* Show password field only when creating new user */}
              {!selectedUser && (
                <TextField
                  margin="dense"
                  name="password"
                  label="Password"
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              )}
              {/* Optional password field for editing */}
              {selectedUser && (
                <TextField
                  margin="dense"
                  name="password"
                  label="New Password (leave blank to keep current)"
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={handleChange}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" color="primary">
                {selectedUser ? 'Save' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </main>
    </div>
  );
}

export default UserManagement;