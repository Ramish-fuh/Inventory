import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogContent, DialogTitle, Alert, Snackbar } from '@mui/material';

function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [scannerInstance, setScannerInstance] = useState(null);

  useEffect(() => {
    return () => {
      // Cleanup function
      if (scannerInstance) {
        scannerInstance.clear();
      }
    };
  }, [scannerInstance]);

  const startScanning = () => {
    try {
      const scanner = new Html5QrcodeScanner('reader', {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
        rememberLastUsedCamera: true,
      });

      scanner.render(success, handleError);
      setScannerInstance(scanner);
      setScanning(true);
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setError('Failed to start camera. Please make sure you have granted camera permissions.');
    }
  };

  const stopScanning = () => {
    if (scannerInstance) {
      try {
        scannerInstance.clear();
        setScannerInstance(null);
        setScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const validateAssetId = (id) => {
    // Check if id exists and isn't undefined
    if (!id || id === 'undefined') {
      return false;
    }
    
    // Basic MongoDB ObjectId validation (24 character hex string)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
  };

  const success = (decodedText) => {
    console.log('Raw QR scan data:', decodedText);
    let assetId;
    
    try {
      // Try to create a URL object from the decoded text
      const url = new URL(decodedText);
      console.log('Parsed URL:', {
        full: url.toString(),
        pathname: url.pathname,
        parts: url.pathname.split('/')
      });
      
      const pathParts = url.pathname.split('/');
      assetId = pathParts[pathParts.indexOf('assets') + 1];
      console.log('Extracted asset ID from URL:', assetId);
    } catch (err) {
      // If it's not a URL, check if it's just an ID
      console.log('Not a URL, checking if direct ID:', decodedText);
      assetId = decodedText.trim();
      console.log('Potential direct ID:', assetId);
    }

    if (validateAssetId(assetId)) {
      stopScanning();
      navigate(`/assets/${assetId}`);
    } else {
      setError('Invalid QR code format. Please scan a valid asset QR code.');
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
    }
  };

  const handleError = (err) => {
    console.warn(err);
    setError('Error scanning QR code. Please try again.');
    setTimeout(() => setError(''), 3000);
  };

  return (
    <Dialog 
      open={true} 
      onClose={() => {
        stopScanning();
        navigate(-1);
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Scan QR Code</DialogTitle>
      <DialogContent>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {!scanning ? (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={startScanning}
              style={{ marginBottom: '20px' }}
            >
              Start Scanning
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={stopScanning}
              style={{ marginBottom: '20px' }}
            >
              Stop Scanning
            </Button>
          )}
          <div id="reader" style={{ width: '100%', minHeight: '300px' }}></div>
        </div>
      </DialogContent>
      <Snackbar 
        open={!!error} 
        autoHideDuration={3000} 
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}

export default QRScanner;