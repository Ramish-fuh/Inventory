# Technical Architecture Documentation

## Application Architecture

### Frontend Architecture
```
frontend/
├── src/
│   ├── components/         # React components
│   ├── assets/            # Static assets
│   ├── App.jsx            # Main application component
│   ├── index.js           # Application entry point
│   └── main.jsx           # React rendering setup
```

#### Key Technologies
- React 18+
- Vite
- Material UI
- Axios for API communication
- JWT for authentication
- HTML5 QR Scanner

#### Component Structure
- **Auth Components**: Login, RecoverPassword, ResetPassword
- **Dashboard Components**: AdminDashboard, UserDashboard
- **Asset Management**: AddAssetModal, EditAssetForm, AssetView
- **Utility Components**: QRScanner, NotificationBell, Navigation

### Backend Architecture
```
backend/
├── src/
│   ├── config/            # Configuration settings
│   ├── controllers/       # Request handlers
│   ├── models/           # Database models
│   ├── routes/           # API route definitions
│   ├── middleware/       # Custom middleware
│   ├── utils/           # Utility functions
│   └── services/        # Business logic
```

#### Key Technologies
- Node.js
- Express.js
- MongoDB with Mongoose
- Winston for logging
- JWT for authentication
- Nodemailer for emails

#### Database Schema

**User Model**
```javascript
{
  username: String,
  email: String,
  fullName: String,
  passwordHash: String,
  role: Enum['Admin', 'Technician', 'Viewer'],
  resetPasswordToken: String,
  resetPasswordExpires: Date
}
```

**Asset Model**
```javascript
{
  name: String,
  assetTag: String,
  category: String,
  status: Enum['Available', 'In Use', 'Under Maintenance', 'Retired'],
  assignedTo: ObjectId,
  location: String,
  serialNumber: String,
  purchaseDate: Date,
  warrantyExpiry: Date,
  licenseExpiry: Date,
  maintenanceInterval: Number,
  lastMaintenance: Date,
  nextMaintenance: Date,
  notes: String
}
```

**Log Model**
```javascript
{
  user: ObjectId,
  action: String,
  target: String,
  timestamp: Date,
  details: String,
  category: String
}
```

**Notification Model**
```javascript
{
  user: ObjectId,
  type: String,
  message: String,
  read: Boolean,
  createdAt: Date
}
```

## Infrastructure Architecture

### Docker Container Structure
```
Infrastructure/
├── MongoDB Container
│   └── Persistent Volume: mongodb_data
├── Backend Container
│   ├── Node.js Runtime
│   ├── Application Code
│   └── Logs Volume
└── Frontend Container
    ├── Node.js Runtime
    └── Vite Dev Server
```

### Network Architecture
- Frontend Container (Port 5173)
- Backend Container (Port 5001)
- MongoDB Container (Port 27017)
- Internal Docker Network for container communication

### Security Architecture

#### Authentication Flow
1. User submits credentials
2. Backend validates and generates JWT
3. Frontend stores JWT in localStorage
4. JWT included in Authorization header for subsequent requests
5. Backend middleware validates JWT for protected routes

#### Password Recovery Flow
1. User requests password reset
2. System generates unique token
3. Token sent via email
4. User submits new password with token
5. System validates token and updates password

### Logging Architecture

#### Frontend Logging
- Console logging for development
- API request/response logging
- Error tracking
- User interaction logging

#### Backend Logging
- Winston logger configuration
- Console transport for development
- File transport for production
- Log levels: error, warn, info, debug
- Request logging middleware
- Error handling middleware

### Monitoring and Metrics

#### Performance Monitoring
- API response times
- Database query performance
- Frontend load times
- Error rates and types

#### System Health Checks
- Database connectivity
- API endpoint availability
- Email service status
- Storage usage monitoring

## Deployment Architecture

### Development Environment
- Local development with hot reloading
- Local MongoDB instance
- Environment-specific configuration
- Debug logging enabled

### Production Environment
- Containerized deployment
- Production MongoDB instance
- Environment variables for configuration
- Log rotation and archiving
- Health monitoring
- Backup scheduling

### Deployment Process
1. Build Docker images
2. Push to container registry
3. Pull images on target environment
4. Start containers with docker-compose
5. Verify health checks
6. Monitor logs and metrics

## Maintenance Procedures

### Backup Strategy
- Daily MongoDB backups
- Log file archiving
- Container image versioning
- Configuration backup

### Update Procedures
1. Database schema migrations
2. Dependency updates
3. Security patches
4. Feature deployments
5. Rollback procedures

### Monitoring Strategy
1. System metrics collection
2. Error tracking and alerting
3. Performance monitoring
4. Security audit logging
5. User activity tracking