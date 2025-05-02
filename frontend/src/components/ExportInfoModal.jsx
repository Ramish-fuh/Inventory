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
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

const ExportInfoModal = ({ open, onClose, type, onConfirm }) => {
  const isPdf = type === 'pdf';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon color="primary" />
        {isPdf ? 'PDF Export Information' : 'Excel Export Information'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          {isPdf ? (
            <>
              <Typography variant="body1" gutterBottom>
                The PDF export will contain a summary of your assets inventory with limited information:
              </Typography>
              <Box sx={{ mt: 2, pl: 2 }}>
                <Typography variant="body2" component="ul">
                  <li>Asset Name and Tag</li>
                  <li>Category and Status</li>
                  <li>Location and Assigned User</li>
                  <li>Purchase Date</li>
                </Typography>
              </Box>
              <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
                For a complete detailed report with all asset information, please use the Excel export option.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                The Excel export will contain complete detailed information about all assets, including:
              </Typography>
              <Box sx={{ mt: 2, pl: 2 }}>
                <Typography variant="body2" component="ul">
                  <li>All Asset Details and Properties</li>
                  <li>Maintenance History and Schedules</li>
                  <li>Warranty and License Information</li>
                  <li>Complete Assignment History</li>
                  <li>Notes and Additional Information</li>
                </Typography>
              </Box>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon fontSize="small" />
                  Due to the comprehensive nature of this report, the file size may be large and the download might take longer.
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={() => {
            onConfirm();
            onClose();
          }} 
          variant="contained" 
          color="primary"
        >
          Continue Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportInfoModal;