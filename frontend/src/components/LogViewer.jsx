import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import apiClient from '../index';

const LogViewer = () => {
  const [activeTab, setActiveTab] = useState('activity');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportFilters, setExportFilters] = useState({
    startDate: null,
    endDate: null,
    category: '',
    level: '',
  });
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

  const debounceTimer = useRef(null);

  const adjustDateToUTC = (date) => {
    if (!date) return null;
    const d = new Date(date);
    // Create UTC date with the same day boundaries
    return new Date(Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds()
    ));
  };

  const debouncedFetchLogs = useCallback((newFilters) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(async () => {
      try {
        setLoading(true);
        
        let adjustedStartDate = adjustDateToUTC(newFilters.startDate);
        let adjustedEndDate = adjustDateToUTC(newFilters.endDate);

        if (adjustedStartDate) {
          adjustedStartDate.setUTCHours(0, 0, 0, 0);
        }

        if (adjustedEndDate) {
          adjustedEndDate.setUTCHours(23, 59, 59, 999);
        }

        const queryParams = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.pageSize.toString(),
          ...(adjustedStartDate && { startDate: adjustedStartDate.toISOString() }),
          ...(adjustedEndDate && { endDate: adjustedEndDate.toISOString() }),
          ...(newFilters.level && { level: newFilters.level }),
          ...(newFilters.category && { category: newFilters.category }),
          ...(newFilters.action && { action: newFilters.action }),
          ...(newFilters.service && { service: newFilters.service })
        });

        const endpoint = activeTab === 'activity' ? 'activity' : 'system';
        const response = await apiClient.get(`/api/logs/${endpoint}?${queryParams}`);
        
        setLogs(response.data.logs);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce
  }, [activeTab, pagination.page, pagination.pageSize]);

  useEffect(() => {
    debouncedFetchLogs(filters);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [debouncedFetchLogs, filters]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPagination(prev => ({ ...prev, page: 1 }));
    const newFilters = {
      startDate: null,
      endDate: null,
      level: '',
      category: '',
      action: '',
      service: ''
    };
    setFilters(newFilters);
    debouncedFetchLogs(newFilters);
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
    debouncedFetchLogs(filters);
  };

  const handlePageSizeChange = (event) => {
    setPagination(prev => ({
      ...prev,
      pageSize: event.target.value,
      page: 1
    }));
    debouncedFetchLogs(filters);
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

  const handleExport = async () => {
    try {
      let adjustedStartDate = adjustDateToUTC(exportFilters.startDate);
      let adjustedEndDate = adjustDateToUTC(exportFilters.endDate);

      if (adjustedStartDate) {
        adjustedStartDate.setUTCHours(0, 0, 0, 0);
      }

      if (adjustedEndDate) {
        adjustedEndDate.setUTCHours(23, 59, 59, 999);
      }

      const queryParams = new URLSearchParams({
        type: activeTab,
        format: exportFormat,
        ...(adjustedStartDate && { startDate: adjustedStartDate.toISOString() }),
        ...(adjustedEndDate && { endDate: adjustedEndDate.toISOString() }),
        ...(activeTab === 'activity' && exportFilters.category && { category: exportFilters.category }),
        ...(activeTab === 'system' && exportFilters.level && { level: exportFilters.level })
      });

      const response = await apiClient.get(`/api/logs/export?${queryParams}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: exportFormat === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${activeTab}-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const ExportDialog = () => (
    <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
      <DialogTitle>Export Logs</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={exportFormat}
                label="Format"
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <MenuItem value="excel">Excel</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={exportFilters.startDate}
                onChange={(date) => setExportFilters({ ...exportFilters, startDate: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={exportFilters.endDate}
                onChange={(date) => setExportFilters({ ...exportFilters, endDate: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>

          {activeTab === 'activity' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={exportFilters.category}
                  label="Category"
                  onChange={(e) => setExportFilters({ ...exportFilters, category: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Authentication">Authentication</MenuItem>
                  <MenuItem value="Asset">Asset</MenuItem>
                  <MenuItem value="User">User</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {activeTab === 'system' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={exportFilters.level}
                  label="Level"
                  onChange={(e) => setExportFilters({ ...exportFilters, level: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="warn">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleExport} variant="contained" color="primary">
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );

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
            onClick={() => debouncedFetchLogs(filters)} 
            color="primary"
            sx={{ mt: 1 }}
          >
            <RefreshIcon />
          </IconButton>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={() => setExportDialogOpen(true)}
            sx={{ mt: 1 }}
          >
            Export Logs
          </Button>
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

      <ExportDialog />
    </Box>
  );
};

export default LogViewer;