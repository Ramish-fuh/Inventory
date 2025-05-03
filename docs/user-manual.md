# IT Asset Management System - User Manual

## Table of Contents
1. [Installation](#installation)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Features](#features)
5. [Troubleshooting](#troubleshooting)

## Installation

### Docker Installation (Recommended)
1. Install Docker and Docker Compose on your system
2. Clone the repository
3. Create `.env` file in backend directory with required environment variables:
   ```
   JWT_SECRET=your-secret-key
   EMAIL_USER=your-email@example.com
   EMAIL_PASS=your-email-password
   MONGO_URI=mongodb://admin:adminpassword@mongodb:27017/asset-manager?authSource=admin
   ```
4. Run `docker-compose up --build`
5. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001
   - API Documentation: http://localhost:5001/api-docs

### Manual Installation
1. Install Node.js 18+ and MongoDB
2. Set up backend:
   ```
   cd backend
   npm install
   npm start
   ```
3. Set up frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```

## Getting Started

### First-Time Setup
1. Access the application at http://localhost:5173
2. Log in with default admin credentials:
   - Username: admin
   - Password: admin123
3. Change the default password immediately
4. Set up additional users as needed

### Basic Navigation
- Top navigation bar for main sections
- Left sidebar for quick actions
- Bell icon for notifications
- User menu for profile and logout

## User Roles

### Administrator
- Full system access
- User management
- Asset creation and deletion
- System configuration
- Report generation
- All technician capabilities

### Technician
- View all assets
- Edit asset details
- Schedule maintenance
- Generate QR codes
- Cannot delete assets or manage users
- Cannot assign assets to users

### Regular User
- View assigned assets
- View asset details
- Scan QR codes
- Update profile
- Cannot modify asset information

## Features

### Asset Management

#### Creating Assets (Admin only)
1. Click "Add Asset" button
2. Fill in required fields:
   - Name
   - Asset Tag
   - Category
   - Location
3. Optional fields:
   - Serial Number
   - Purchase Date
   - Warranty Information
   - Maintenance Schedule
4. Click "Save" to create

#### Editing Assets (Admin & Technician)
1. Open asset details
2. Click "Edit" button
3. Modify necessary fields
4. Save changes

#### Asset Assignment (Admin only)
1. Edit asset
2. Change status to "In Use"
3. Select user from dropdown
4. Save changes

#### QR Code Management
1. Open asset details
2. Click "Generate QR" button
3. Print or save QR code
4. Use mobile app to scan

### Maintenance Management

#### Scheduling Maintenance
1. Edit asset
2. Set maintenance interval
3. Add maintenance notes
4. Save changes

#### Maintenance Alerts
- System automatically generates alerts
- Email notifications for upcoming maintenance
- In-app notifications with color coding

### Report Generation

#### Asset Reports
1. Go to Assets view
2. Click "Export" button
3. Choose format (PDF/Excel)
4. Select filters if needed
5. Generate and download

#### Activity Logs
1. Access Logs section
2. Apply date range filters
3. Select log type
4. Export if needed

### Notification System

#### Types of Notifications
- Maintenance due
- Warranty expiration
- License renewal
- Asset assignments
- System alerts

#### Managing Notifications
1. Click bell icon
2. View all notifications
3. Mark as read
4. Filter by type
5. Clear notifications

## Troubleshooting

### Common Issues

#### Login Problems
- Verify credentials
- Check caps lock
- Use password recovery if needed

#### Asset Creation Issues
- Ensure all required fields are filled
- Check for duplicate asset tags
- Verify file upload sizes

#### QR Code Scanning
- Ensure good lighting
- Hold device steady
- Check camera permissions

### Error Messages

#### "Access Denied"
- Verify user role
- Check permissions
- Contact administrator

#### "Invalid Input"
- Check required fields
- Verify data formats
- Remove special characters

### Support Contact
- Technical Support: support@example.com
- Emergency Contact: +1-xxx-xxx-xxxx
- Hours: 24/7