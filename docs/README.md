# Asset Management System Documentation

## Overview
The Asset Management System is a comprehensive solution for tracking and managing organizational assets. It provides a modern, user-friendly interface with real-time notifications, asset tracking, and automated maintenance scheduling.

## System Architecture

### Frontend (React + Vite)
- Modern React application using Vite for optimal performance
- Material UI components for consistent design
- Real-time notification system with bell icon interface
- QR code scanning capabilities
- Role-based access control with distinct user interfaces
- Responsive design for various screen sizes

### Backend (Node.js + Express)
- RESTful API architecture
- MongoDB database with Mongoose ODM
- JWT-based authentication system
- Automated email notifications via Nodemailer
- Comprehensive logging system with Winston
- QR code generation for asset tracking

### Infrastructure
- Containerized microservices using Docker
- Separate containers for frontend, backend, and database
- Docker Compose for service orchestration
- Volume mounting for persistent data
- Network isolation for security

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB (for local development)

### Running with Docker
1. Clone the repository
2. Navigate to the root directory
3. Run:
```bash
docker-compose up --build
```

The services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- MongoDB: localhost:27017

### Local Development Setup
1. Backend Setup:
```bash
cd backend
npm install
npm start
```

2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

## Features

### Asset Management
- Create, read, update, and delete assets
- Asset categorization and tagging
- Location tracking
- Maintenance scheduling
- QR code generation for each asset
- Export assets to PDF/Excel
- Asset history tracking
- Asset assignment/unassignment

### User Management
- Role-based access control (Admin and User roles)
- Secure user authentication
- Password recovery system with email verification
- User activity logging
- Profile management
- Session management

### Notifications
- Real-time in-app notifications
- Color-coded notification types:
  - Blue: Maintenance notices
  - Orange: Warning alerts
  - Red: Critical alerts
- Email notifications for critical events
- Notification preferences management
- Read/unread status tracking
- Automated notifications for:
  - Maintenance schedules
  - License expiration
  - Warranty expiration
  - Asset assignments

## API Documentation

### Authentication Endpoints
- POST /api/auth/login - User authentication
- POST /api/auth/logout - User logout
- POST /api/auth/recover-password - Initiate password recovery
- POST /api/auth/reset-password - Complete password reset

### Asset Endpoints
- GET /api/assets - List all assets
- POST /api/assets - Create new asset
- GET /api/assets/:id - Get asset details
- PUT /api/assets/:id - Update asset
- DELETE /api/assets/:id - Delete asset
- GET /api/assets/export/:format - Export assets

### User Endpoints
- GET /api/users - List all users (admin only)
- POST /api/users - Create new user
- GET /api/users/:id - Get user details
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user

### Notification Endpoints
- GET /api/notifications - Get user notifications
- PUT /api/notifications/:id - Mark notification as read
- GET /api/notifications/unread - Get unread count

### QR Code Endpoints
- GET /api/qr/:assetId - Generate asset QR code
- POST /api/qr/scan - Process scanned QR code

## Security Considerations
- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Secure password recovery workflow
- API rate limiting
- CORS configuration
- Input validation and sanitization
- XSS protection
- CSRF protection

## Monitoring and Logging
- Winston logging implementation
- Multiple log levels (error, warn, info, debug)
- Console and file logging
- Log rotation and archiving
- API request/response logging
- Error tracking and monitoring
- User activity logging
- Performance monitoring

## Development Setup

### Prerequisites
- Node.js 18+
- MongoDB
- Docker and Docker Compose

### Environment Variables
Required environment variables in `.env`:
```
JWT_SECRET=your-secret-key
EMAIL_USER=your-email
EMAIL_PASS=your-email-password
MONGO_URI=your-mongodb-uri
```

### Local Development
1. Start MongoDB
2. Configure environment variables
3. Start backend server
4. Start frontend development server

### Docker Development
1. Configure environment variables
2. Run docker-compose up
3. Access services on configured ports

## Maintenance and Updates
1. Regular database backups (automated)
2. Security patches and updates
3. Dependency management
4. Performance optimization
5. Log rotation and cleanup
6. Error monitoring and debugging
7. User feedback collection

## UI/UX Features

### Styling System
- Modern Apple-inspired design system
- CSS modules for component-scoped styling
- Responsive layouts for all screen sizes
- Interactive feedback animations
- Consistent color variables:
  - --apple-light-gray: Background colors
  - --apple-white: Card backgrounds
  - --apple-blue: Primary actions
  - --apple-error: Error states
  - --apple-success: Success states

### User Interface Elements
- Card-based layouts with subtle shadows
- Smooth transitions and animations
- Interactive hover states
- Form validation feedback
- Loading and error states
- Toast notifications
- Modal dialogs

### Accessibility Features
- High contrast color schemes
- Proper input labeling
- Focus management
- Animation reduction options
- Keyboard navigation support