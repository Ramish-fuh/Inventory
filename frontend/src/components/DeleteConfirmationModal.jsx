import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

const DeleteConfirmationModal = ({ open, onClose, onConfirm, asset }) => {
  if (!asset) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Confirm Delete
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this asset?
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              {asset.name}
            </Typography>
            <Typography variant="body2">
              Asset Tag: {asset.assetTag}
            </Typography>
            <Typography variant="body2">
              Category: {asset.category}
            </Typography>
            <Typography variant="body2">
              Status: {asset.status}
            </Typography>
            {asset.serialNumber && (
              <Typography variant="body2">
                Serial Number: {asset.serialNumber}
              </Typography>
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="error">
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={() => {
            onConfirm(asset._id);
            onClose();
          }} 
          variant="contained" 
          color="error"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationModal;