import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, Typography } from '@mui/material';

function AssetView() {
  const { id } = useParams();
  // Fetch asset data using the id

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Asset ID: {id}</Typography>
        {/* Display asset details here */}
      </CardContent>
    </Card>
  );
}

export default AssetView;