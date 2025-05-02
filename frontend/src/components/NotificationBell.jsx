import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import apiClient from '../index';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/api/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await apiClient.put(`/api/notifications/${notification._id}`);
        fetchNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    handleClose();
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'license':
        return { color: '#f44336' }; // Red for license expiry
      case 'maintenance':
        return { color: '#ff9800' }; // Orange for maintenance
      default:
        return { color: 'inherit' };
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: '400px',
            width: '350px',
          },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem>
            <ListItemText primary="No notifications" />
          </MenuItem>
        ) : (
          notifications.map((notification, index) => (
            <React.Fragment key={notification._id}>
              <MenuItem 
                onClick={() => handleNotificationClick(notification)}
                style={{ 
                  backgroundColor: notification.read ? 'inherit' : 'rgba(0, 0, 0, 0.04)',
                  padding: '12px 16px'
                }}
              >
                <ListItemText
                  primary={
                    <Typography 
                      variant="subtitle2" 
                      style={getNotificationStyle(notification.type)}
                    >
                      {notification.message}
                    </Typography>
                  }
                  secondary={new Date(notification.createdAt).toLocaleString()}
                />
              </MenuItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;