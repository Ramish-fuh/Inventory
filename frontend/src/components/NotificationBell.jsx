import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemText,
  Typography,
  Divider,
  Tooltip,
  Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BuildIcon from '@mui/icons-material/Build';
import KeyIcon from '@mui/icons-material/Key';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import apiClient from '../index';
import styles from './Navigation.module.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [showReadNotifications, setShowReadNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/api/notifications');
      setNotifications(response.data || []);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Unable to load notifications');
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
        // Update the notification in the local state
        setNotifications(notifications.map(n => 
          n._id === notification._id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const getNotificationStyle = (type, message) => {
    let color = 'inherit';
    let Icon = NotificationsIcon;
    
    // Check severity level
    if (message.startsWith('CRITICAL')) {
      color = '#d32f2f'; // Dark red
    } else if (message.startsWith('WARNING')) {
      color = '#ed6c02'; // Orange
    } else if (message.startsWith('NOTICE')) {
      color = '#0288d1'; // Blue
    }

    // Set icon based on type
    switch (type) {
      case 'maintenance':
        Icon = BuildIcon;
        break;
      case 'license':
        Icon = KeyIcon;
        break;
      case 'warranty':
        Icon = VerifiedUserIcon;
        break;
      default:
        Icon = NotificationsIcon;
    }

    return { color, Icon };
  };

  const toggleReadNotifications = () => {
    setShowReadNotifications(!showReadNotifications);
  };

  if (error) {
    return (
      <Tooltip title={error}>
        <IconButton color="inherit">
          <NotificationsIcon />
        </IconButton>
      </Tooltip>
    );
  }

  const filteredNotifications = showReadNotifications 
    ? notifications 
    : notifications.filter(n => !n.read);

  const renderMenuItems = () => {
    if (notifications.length === 0) {
      return [
        <MenuItem key="no-notifications">
          <ListItemText primary="No notifications" />
        </MenuItem>
      ];
    }

    const items = [
      <MenuItem key="toggle-button">
        <Button 
          onClick={toggleReadNotifications}
          fullWidth
          size="small"
        >
          {showReadNotifications ? 'Show Unread Only' : 'Show All Notifications'}
        </Button>
      </MenuItem>,
      <Divider key="top-divider" />
    ];

    if (filteredNotifications.length === 0) {
      items.push(
        <MenuItem key="no-filtered-notifications">
          <ListItemText primary={showReadNotifications ? 'No notifications' : 'No unread notifications'} />
        </MenuItem>
      );
    } else {
      filteredNotifications.forEach((notification, index) => {
        const { color, Icon } = getNotificationStyle(notification.type, notification.message);
        items.push(
          <MenuItem 
            key={notification._id}
            onClick={() => handleNotificationClick(notification)}
            style={{ 
              backgroundColor: notification.read ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
              padding: '12px 16px'
            }}
          >
            <Icon style={{ marginRight: '12px', color }} />
            <ListItemText
              primary={
                <Typography 
                  variant="subtitle2" 
                  style={{ color }}
                >
                  {notification.message}
                </Typography>
              }
              secondary={new Date(notification.createdAt).toLocaleString()}
            />
          </MenuItem>
        );

        if (index < filteredNotifications.length - 1) {
          items.push(<Divider key={`divider-${notification._id}`} />);
        }
      });
    }

    return items;
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        className={styles.notificationBell}
      >
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
        {renderMenuItems()}
      </Menu>
    </>
  );
};

export default NotificationBell;