# Asset Management System Documentation

## Overview
The Asset Management System is a comprehensive solution for tracking and managing organizational assets. It provides features for asset tracking, user management, QR code generation, and automated notifications.

## System Architecture

### Frontend (React + Vite)
- Modern React application using Vite
- Material UI components
- Real-time notifications
- QR code scanning capabilities
- Role-based access control

### Backend (Node.js + Express)
- RESTful API architecture
- MongoDB database integration
- JWT authentication
- Automated email notifications
- Logging system with Winston
- QR code generation

### Infrastructure (Docker)
- Containerized microservices architecture
- MongoDB database container
- Separate frontend and backend containers
- Docker Compose orchestration

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
- Asset categorization
- Location tracking
- Maintenance scheduling
- QR code generation for assets
- Export assets to PDF/Excel

### User Management
- Role-based access control (Admin, Technician, Viewer)
- User authentication
- Password recovery system
- Activity logging

### Notifications
- Automated maintenance reminders
- License expiry notifications
- Asset status updates
- Real-time notification system

## API Documentation

### Authentication Endpoints
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/recover-password
- POST /api/auth/reset-password

### Asset Endpoints
- GET /api/assets
- POST /api/assets
- GET /api/assets/:id
- PUT /api/assets/:id
- DELETE /api/assets/:id
- GET /api/assets/export/:format

### User Endpoints
- GET /api/users
- POST /api/users
- GET /api/users/:id
- PUT /api/users/:id
- DELETE /api/users/:id

### QR Code Endpoints
- GET /api/qr/:assetId

## Security Considerations
- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Secure password recovery flow
- API rate limiting
- CORS configuration

## Monitoring and Logging
- Winston logging implementation
- Console and file logging
- API request/response logging
- Error tracking
- User activity logging

## Maintenance and Updates
1. Regular database backups
2. Security patches
3. Dependency updates
4. Performance monitoring
5. Error monitoring and debugging