import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Link } from '@mui/material';
import apiClient from '../index';

function AdminDashboard() {
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/api/assets')
      .then(response => {
        if (Array.isArray(response.data)) {
          setAssets(response.data);
        } else {
          throw new Error('Invalid data format: Expected an array');
        }
      })
      .catch(err => {
        console.error('Error fetching assets:', err);
        setError('Failed to load assets. Please try again later.');
      });
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Admin Dashboard</h1>
      {assets.length > 0 ? (
        assets.map(asset => (
          <Card key={asset.id}>
            <CardContent>
              <Typography variant="h5">{asset.name}</Typography>
              <Typography variant="body1">{asset.description}</Typography>
              <Link href={`/assets/${asset.id}`}>View Details</Link>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography variant="body1">No assets available.</Typography>
      )}
    </div>
  );
}

export default AdminDashboard;