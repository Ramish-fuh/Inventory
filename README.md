# IT Asset Management System

A comprehensive solution for managing organizational assets with features for tracking, maintenance scheduling, and automated notifications.


## Component Architecture Diagram

```mermaid
graph TB
    subgraph Frontend
        UI[React UI]
        Router[React Router]
        API[API Client]
        Components[React Components]
        Context[Context API]
        UI --> Router
        Router --> Components
        Components --> API
        Components --> Context
    end

    subgraph Backend
        Express[Express Server]
        Routes[API Routes]
        Controllers[Controllers]
        Services[Services]
        Models[MongoDB Models]
        Middleware[Middleware]
        
        Express --> Routes
        Routes --> Controllers
        Controllers --> Services
        Services --> Models
        Middleware --> Routes
    end

    subgraph Infrastructure
        MongoDB[(MongoDB)]
        Redis[(Redis Cache)]
        Logger[Winston Logger]
        Email[Email Service]
        Storage[File Storage]
    end

    API --> Express
    Services --> Redis
    Services --> Email
    Models --> MongoDB
    Controllers --> Logger
    Services --> Storage

```

## Features

### Asset Management
- Full asset lifecycle management from acquisition to retirement
- QR code generation and scanning for easy asset identification
- Real-time asset status tracking and location management
- Maintenance scheduling and automated reminders
- License and warranty expiration tracking
- Detailed asset history and audit logs
- Customizable asset categories and fields

## Asset Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Asset API
    participant N as Notification Service
    participant D as Database
    
    U->>F: Create/Update Asset
    F->>A: POST/PUT /api/assets
    A->>D: Save Asset Data
    D-->>A: Confirmation
    A->>N: Trigger Notifications
    N->>D: Save Notification
    A-->>F: Return Response
    F-->>U: Show Success Message
```


### User Management
- Role-based access control (Admin, Technician, User)
- Secure authentication with JWT
- Password recovery system with email verification
- User activity logging and audit trails

### Access Controls
- Admin: Full system access including user management and deletion capabilities
- Technician: Asset viewing, editing, and maintenance management
- User: View assigned assets and personal dashboard

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant D as Database
    
    U->>F: Enter Credentials
    F->>A: POST /api/auth/login
    A->>D: Validate User
    D-->>A: User Data
    A->>A: Generate JWT
    A-->>F: Return Token + User
    F->>F: Store Token
    F-->>U: Redirect to Dashboard
```

## Security Implementation

```mermaid
graph TD
    Auth[Authentication] --> JWT[JWT Token]
    JWT --> Valid{Valid Token?}
    Valid -->|Yes| RBAC[Role Check]
    Valid -->|No| Reject[Reject Request]
    RBAC --> Admin[Admin Access]
    RBAC --> Tech[Technician Access]
    RBAC --> User[User Access]
    Admin --> Full[Full Access]
    Tech --> Limited[Limited Access]
    User --> Restricted[View Only]
```

### Notifications & Alerts
- Real-time notification system with bell icon interface
- Color-coded notifications based on priority
- Email notifications for critical events
- Automated alerts for:
  - Maintenance schedules
  - License expirations
  - Warranty expirations
  - Asset assignments/unassignments

  ## Real-time Notification System

```mermaid
graph LR
    subgraph Backend
        NS[Notification Service]
        NQ[Notification Queue]
        NP[Notification Processor]
    end
    
    subgraph Frontend
        NC[Notification Component]
        NB[Bell Icon]
        NT[Toast Messages]
    end
    
    NS --> NQ
    NQ --> NP
    NP --> NC
    NC --> NB
    NC --> NT
```

### Reporting
- PDF/Excel report generation
- Asset status reports
- Maintenance history reports
- User activity reports
- Asset utilization analytics

## Data Flow

```mermaid
graph LR
    Client[Client Request] --> Auth[Auth Middleware]
    Auth --> Rate[Rate Limiter]
    Rate --> Route[Route Handler]
    Route --> Controller[Controller]
    Controller --> Service[Service Layer]
    Service --> Model[Data Model]
    Model --> DB[(Database)]
    Controller --> Log[Logger]
    Service --> Cache[(Redis Cache)]
```

## Quick Start

### Using Docker (Recommended)

1. Clone the repository
2. Create a `.env` file in the backend directory:
```env
JWT_SECRET=yourSuperSecretKeyHere
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
MONGO_URI=mongodb://admin:adminpassword@mongodb:27017/asset-manager?authSource=admin
```

3. Start the application:
```bash
docker-compose up --build
```

4. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

### Manual Setup

#### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create and configure `.env` file as shown above

4. Start the server:
```bash
npm start
```

#### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Documentation

Detailed documentation can be found in the `/docs` directory:

- [Main Documentation](docs/README.md)
- [Technical Architecture](docs/technical-architecture.md)
- [Project Structure](docs/structure.md)

## Development

### Prerequisites
- Node.js 18+
- MongoDB
- Docker and Docker Compose (for containerized deployment)

### Development Environment
The project includes:
- Hot reloading for both frontend and backend
- ESLint configuration
- Prettier formatting
- Development debugging configuration
- Winston logging system

### Testing
Run frontend tests:
```bash
cd frontend
npm test
```

Run backend tests:
```bash
cd backend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

