import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

function QRScanner() {
  const [scannedData, setScannedData] = useState(null);

  const handleScan = (data) => {
    if (data) {
      setScannedData(data);
      // Redirect to asset view
      window.location.href = `/asset/${data}`;
    }
  };

  return (
    <div>
      <Scanner onScan={handleScan} />
      {scannedData && <p>Scanned Asset ID: {scannedData}</p>}
    </div>
  );
}

export default QRScanner;