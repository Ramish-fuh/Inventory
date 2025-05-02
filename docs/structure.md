# IT Asset Management System – Node.js Capstone Project

This project aims to design and implement a lightweight, scalable IT Asset Management System tailored for small businesses. It features asset tracking, QR/barcode scanning, user access control, and reporting capabilities. Built with Node.js and optionally React, the system will improve efficiency, security, and cost control.

---

## 📋 Project Workflow

### 1. 🚀 Project Setup & Initialization
- [ ] Define directory structure:
  - `/backend`: Node.js Express server
  - `/frontend`: React/Angular app (optional)
  - `/config`: Environment configs
  - `/docs`: System documentation
- [ ] Initialize Git repository
  - Setup `.gitignore`, `README.md`, `LICENSE`
- [ ] Initialize package manager
  - `npm init -y`
  - Install essentials: `express`, `dotenv`, `cors`, `nodemon`, etc.

---

### 2. 🗃️ Database Design
- [ ] Choose a database:
  - MongoDB (NoSQL) or PostgreSQL (SQL)
- [ ] Define schema/models:
  - `Assets`: ID, Name, Type, Status, Owner, Lifecycle, etc.
  - `Users`: ID, Name, Role, Email, Permissions
  - `Logs`: Changes, Check-ins/Check-outs
- [ ] Add migrations and seeders if using SQL (Knex.js/Sequelize)

---

### 3. 🔧 Backend Development (Node.js + Express)
- [ ] Setup Express server and routes
- [ ] Create `.env` file for secrets/configs
- [ ] Build RESTful APIs:
  - CRUD for Assets
  - User authentication (JWT)
  - Alerts and notifications
  - QR/Barcode handling
- [ ] Apply security best practices:
  - `helmet`, `express-rate-limit`, `cors`
- [ ] Write tests:
  - Use `jest` or `mocha/chai` for unit and integration tests

---

### 4. 🌐 Frontend Integration (Optional)
- [ ] Setup frontend with React or Angular
- [ ] Build UI components:
  - Dashboard, Asset View, QR Scanner
- [ ] Connect with backend using `axios` or `fetch`
- [ ] Implement role-based views

---

### 5. 📷 QR/Barcode Functionality
- [ ] Generate QR/barcodes with:
  - `qrcode` or `bwip-js`
- [ ] Add QR scanner using:
  - `react-qr-reader` or camera-based input

---

### 6. 📊 Reporting & Alerts
- [ ] Export reports to PDF/Excel:
  - Use `pdfkit`, `exceljs`
- [ ] Configure alerts and notifications:
  - License expiry, maintenance due
  - Use `nodemailer` or external email services

---

### 7. ☁️ Deployment & Hosting
- [ ] Local development with Docker
  - Setup `Dockerfile` and `docker-compose.yml`
- [ ] Deploy to cloud:
  - Heroku, Render, AWS, or DigitalOcean
- [ ] Configure domain name and HTTPS (SSL)

---

### 8. 📘 Documentation & Finalization
- [ ] Technical documentation:
  - API docs with Swagger
  - Architecture diagram (draw.io or Lucidchart)
- [ ] User manual:
  - Installation, login, asset management, reporting
- [ ] Capstone report and final reflection for submission

---

## 📦 Tech Stack
- **Backend:** Node.js, Express
- **Frontend:** React (optional)
- **Database:** PostgreSQL or MongoDB
- **Deployment:** Docker, Heroku/AWS
- **Testing:** Jest, Postman
- **Documentation:** Markdown, Swagger, Lucidchart

---

## 👤 Author
Ramish Shu

---

# Project Structure Documentation

## Directory Organization

```
Inventory/
├── backend/                  # Backend Node.js application
│   ├── Dockerfile           # Backend container configuration
│   ├── logs/               # Application logs directory
│   │   └── app.log        # Main log file
│   └── src/               # Source code
│       ├── config/        # Configuration files
│       ├── controllers/   # Request handlers
│       ├── models/       # Database models
│       ├── routes/       # API routes
│       ├── middleware/   # Custom middleware
│       ├── utils/        # Utility functions
│       └── services/     # Business logic
│
├── frontend/               # Frontend React application
│   ├── Dockerfile         # Frontend container configuration
│   ├── public/           # Static files
│   └── src/             # Source code
│       ├── components/  # React components
│       ├── assets/     # Static assets
│       └── styles/     # CSS modules and styles
│
├── docs/                  # Project documentation
│   ├── README.md         # Main documentation
│   ├── structure.md      # Project structure guide
│   └── technical-architecture.md  # Technical details
│
└── docker-compose.yml     # Container orchestration
```

## Component Relationships

### Backend Components

#### Config Layer
- `db.js`: Database configuration and connection
- Environment variables management

#### Controller Layer
- `assetController.js`: Asset management logic
- `authController.js`: Authentication handling
- `logController.js`: Activity logging
- `notificationController.js`: Notification management
- `userController.js`: User management

#### Model Layer
- `Asset.js`: Asset data model
- `Log.js`: Activity log model
- `Notification.js`: Notification model
- `User.js`: User account model

#### Helper Layer
- `mailer.js`: Email functionality
- `notificationHelper.js`: Notification utilities

#### Service Layer
- `notificationScheduler.js`: Automated notifications
- `genQr.js`: QR code generation
- `reportGenerator.js`: PDF/Excel exports

### Frontend Components

#### Core Components
- `App.jsx`: Main application component
- `index.js`: Entry point
- `main.jsx`: React initialization

#### Feature Components
- **Asset Management**
  - `AddAssetModal.jsx`: Asset creation
  - `EditAssetForm.jsx`: Asset editing
  - `AssetView.jsx`: Asset details view

- **Authentication**
  - `Login.jsx`: User login
  - `RecoverPassword.jsx`: Password recovery
  - `ResetPassword.jsx`: Password reset

- **Dashboard**
  - `AdminDashboard.jsx`: Admin view
  - `UserDashboard.jsx`: User view
  - `UserManagement.jsx`: User administration

- **Utility Components**
  - `Navigation.jsx`: Navigation bar
  - `NotificationBell.jsx`: Notification display
  - `QRScanner.jsx`: QR code scanning
  - `LogoutButton.jsx`: Session management

#### Styling
- CSS Modules for component-specific styles
- Material-UI theming
- Responsive design implementations

## File Naming Conventions

### Backend
- Controllers: `*Controller.js`
- Models: PascalCase.js
- Routes: `*Routes.js`
- Utilities: camelCase.js

### Frontend
- Components: PascalCase.jsx
- Styles: ComponentName.module.css
- Utilities: camelCase.js

## Code Organization Standards

### Backend Standards
1. Route definitions separate from controllers
2. Model validation in schema definitions
3. Business logic in service layer
4. Error handling middleware
5. Centralized logging configuration

### Frontend Standards
1. Component-based architecture
2. CSS Modules for styling
3. Props validation
4. Error boundary implementation
5. Context for state management

## Development Workflow

### Local Development
1. Backend server with hot reload
2. Frontend development server
3. Local MongoDB instance
4. Environment-specific configuration

### Docker Development
1. Containerized services
2. Volume mounts for development
3. Hot reload enabled
4. Connected container network

### Production Deployment
1. Optimized builds
2. Environment variables
3. Production logging
4. Health monitoring
5. Backup procedures