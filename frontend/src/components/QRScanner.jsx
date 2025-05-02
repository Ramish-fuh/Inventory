import React, { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';

function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();
  let scanner = null;

  const startScanning = () => {
    scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render(success, error);
    setScanning(true);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanning(false);
    }
  };

  const success = (decodedText) => {
    // Extract asset ID from URL
    const assetId = decodedText.split('/assets/')[1];
    if (assetId) {
      stopScanning();
      navigate(`/assets/${assetId}`);
    }
  };

  const error = (err) => {
    console.warn(err);
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
          <div id="reader" style={{ width: '100%' }}></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QRScanner;