# Technical Architecture Documentation

## Application Architecture

### Frontend Architecture

The frontend is built using React with Vite, implementing role-based dashboards and access controls.

#### Component Structure
```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── AdminDashboard/   # Admin-specific views
│   │   ├── TechnicianDashboard/ # Technician views
│   │   ├── UserDashboard/   # Regular user views
│   │   ├── Asset/          # Asset management
│   │   ├── Auth/          # Authentication
│   │   └── Common/        # Shared components
│   ├── assets/             # Static assets
│   └── styles/            # CSS modules
```

#### Key Technologies
- React 18+
- Vite for build tooling
- Material UI for components
- Axios for API communication
- JWT for authentication
- QR Scanner implementation

#### Role-Based Interface
- **Admin Dashboard**
  - Full asset management capabilities
  - User management interface
  - System logs access
  - Asset deletion and creation
  - User role assignment

- **Technician Dashboard**
  - Asset viewing and editing
  - Maintenance management
  - QR code generation
  - No access to user management or logs
  - Cannot delete assets or change assignments

- **User Dashboard**
  - View assigned assets
  - Asset details access
  - QR code scanning
  - Personal profile management

#### Core Components
- **Asset Management**
  - `AddAssetModal.jsx`: Asset creation interface
  - `EditAssetForm.jsx`: Asset editing interface
  - `AssetView.jsx`: Asset details display
  
- **User Interface**
  - `Navigation.jsx`: Main navigation bar
  - `NotificationBell.jsx`: Real-time notifications
  - `QRScanner.jsx`: Asset scanning interface
  
- **Authentication**
  - `Login.jsx`: User authentication
  - `RecoverPassword.jsx`: Password recovery flow
  - `ResetPassword.jsx`: Password reset interface

#### UI Components Styling

**Login Component**
- Modern card-based layout with Apple-inspired design
- Responsive container with centered alignment
- Interactive form elements with smooth transitions
- Visual feedback for form interactions:
  - Input focus states with subtle shadows
  - Hover effects on interactive elements
  - Animated error and success messages
- Accessibility considerations:
  - High contrast text
  - Proper input padding
  - Clear visual hierarchy
- Animation Effects:
  - Smooth fade-in transitions for messages
  - Subtle transform animations on buttons
  - Error and success message animations

#### Animation Implementation
```css
/* Example of implemented animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Backend Architecture

The backend uses Node.js with Express, implementing a RESTful API architecture with strict access controls.

#### Service Structure
```
backend/
├── src/
│   ├── controllers/         # Request handlers
│   ├── models/             # Database schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Request processing
│   ├── services/           # Business logic
│   └── utils/             # Helper functions
```

#### Key Technologies
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Winston for logging
- Nodemailer for emails
- QR code generation

#### Access Control Implementation

**Middleware Layer**
- JWT validation
- Role verification
- Resource access control
- Operation authorization

**Permission Matrix**
```
Operation          | Admin | Technician | User
-------------------|--------|------------|-------
View All Assets    |   ✓    |     ✓      |   ✗
View Assigned      |   ✓    |     ✓      |   ✓
Create Asset       |   ✓    |     ✗      |   ✗
Edit Asset        |   ✓    |     ✓*     |   ✗
Delete Asset      |   ✓    |     ✗      |   ✗
Assign Asset      |   ✓    |     ✗      |   ✗
Manage Users      |   ✓    |     ✗      |   ✗
View Logs         |   ✓    |     ✗      |   ✗
Generate QR       |   ✓    |     ✓      |   ✗
Scan QR           |   ✓    |     ✓      |   ✓

* Technicians can edit asset details but cannot change assignments or delete assets
```

#### Core Components
- **Controllers**: Handle HTTP requests and responses
- **Models**: Define data structure and validation
- **Services**: Implement business logic
- **Middleware**: Process requests and authentication

#### Database Schema

**User Model**
```javascript
{
  username: String,
  email: String,
  fullName: String,
  passwordHash: String,
  role: String,            // 'Admin' or 'User'
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Asset Model**
```javascript
{
  name: String,
  assetTag: String,
  category: String,
  status: String,         // 'Available', 'In Use', 'Maintenance', 'Retired'
  assignedTo: ObjectId,   // Reference to User
  location: String,
  serialNumber: String,
  purchaseDate: Date,
  warrantyExpiry: Date,
  licenseExpiry: Date,
  maintenanceInterval: Number,
  lastMaintenance: Date,
  nextMaintenance: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Notification Model**
```javascript
{
  user: ObjectId,         // Reference to User
  type: String,          // 'asset', 'maintenance', 'license', 'warranty'
  message: String,
  read: Boolean,
  metadata: Object,      // Additional context
  createdAt: Date
}
```

**Log Model**
```javascript
{
  user: ObjectId,        // Reference to User
  action: String,
  category: String,
  target: ObjectId,      // Reference to affected entity
  details: String,
  timestamp: Date
}
```

## Infrastructure Architecture

### Container Architecture
```
Infrastructure/
├── Frontend Container (Port 5173)
│   └── Vite Development Server
├── Backend Container (Port 5001)
│   └── Node.js Application
└── MongoDB Container (Port 27017)
    └── Persistent Volume
```

### Security Implementation

#### Authentication Flow
1. User submits credentials
2. Backend validates and generates JWT
3. Token stored in localStorage
4. Token included in Authorization header
5. Middleware validates protected routes

#### Access Control
- Role-based permissions (Admin/User)
- Resource-level access control
- API route protection
- Asset assignment validation

### Logging Architecture

#### Application Logging
- Winston logger implementation
- Structured log format
- Multiple log levels
- File and console transports
- Log rotation configuration

#### Activity Tracking
- User actions logging
- Asset state changes
- Authentication events
- System operations

### Notification System

#### Real-time Notifications
- In-app notifications via UI
- Email notifications for critical events
- Automated maintenance reminders
- Asset status change alerts

#### Notification Types
- Maintenance schedules
- Warranty expirations
- License renewals
- Asset assignments

## Development & Deployment

### Development Environment
- Hot module replacement
- Environment-specific configs
- Development debugging tools
- Local MongoDB instance

### Production Deployment
- Docker container orchestration
- Environment variable management
- Database initialization
- Health monitoring setup
- Backup procedures