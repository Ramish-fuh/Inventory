import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  Pagination,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

const LogViewer = () => {
  const [activeTab, setActiveTab] = useState('activity');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    level: '',
    category: '',
    action: '',
    service: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    pages: 0
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.pageSize,
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
        ...(filters.level && { level: filters.level }),
        ...(filters.category && { category: filters.category }),
        ...(filters.action && { action: filters.action }),
        ...(filters.service && { service: filters.service })
      });

      const endpoint = activeTab === 'activity' ? 'activity' : 'system';
      const response = await fetch(`/api/logs/${endpoint}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        pages: data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.pageSize, filters.startDate, filters.endDate, filters.level, filters.category, filters.action, filters.service]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPagination(prev => ({ ...prev, page: 1 }));
    setFilters({
      startDate: null,
      endDate: null,
      level: '',
      category: '',
      action: '',
      service: ''
    });
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  const handlePageSizeChange = (event) => {
    setPagination(prev => ({
      ...prev,
      pageSize: event.target.value,
      page: 1
    }));
  };

  const getLevelIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warn':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return null;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Activity Logs" value="activity" />
          <Tab label="System Logs" value="system" />
        </Tabs>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) => setFilters({ ...filters, startDate: date })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) => setFilters({ ...filters, endDate: date })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        {activeTab === 'system' && (
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={filters.level}
                label="Level"
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        {activeTab === 'activity' && (
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Authentication">Authentication</MenuItem>
                <MenuItem value="Asset">Asset</MenuItem>
                <MenuItem value="User">User</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={3}>
          <IconButton 
            onClick={() => fetchLogs()} 
            color="primary"
            sx={{ mt: 1 }}
          >
            <RefreshIcon />
          </IconButton>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              {activeTab === 'system' && <TableCell>Level</TableCell>}
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              {activeTab === 'activity' ? (
                <>
                  <TableCell>Category</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Details</TableCell>
                </>
              ) : (
                <>
                  <TableCell>Service</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Details</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id}>
                  {activeTab === 'system' && (
                    <TableCell>
                      <Tooltip title={log.level}>
                        {getLevelIcon(log.level)}
                      </Tooltip>
                    </TableCell>
                  )}
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell>
                    {log.user ? `${log.user.fullName} (${log.user.username})` : 'System'}
                  </TableCell>
                  {activeTab === 'activity' ? (
                    <>
                      <TableCell>{log.category}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.details}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{log.service}</TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell>
                        {typeof log.details === 'object' 
                          ? JSON.stringify(log.details, null, 2) 
                          : log.details}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={2} direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Rows per page</InputLabel>
          <Select
            value={pagination.pageSize}
            label="Rows per page"
            onChange={handlePageSizeChange}
          >
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
        
        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Total: {pagination.total} entries
          </Typography>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Stack>
      </Stack>
    </Box>
  );
};

export default LogViewer;