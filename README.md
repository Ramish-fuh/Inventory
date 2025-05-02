# IT Asset Management System

A comprehensive solution for managing organizational assets with features for tracking, maintenance scheduling, and automated notifications.

## Features

- Asset lifecycle management
- QR code generation and scanning
- Role-based access control
- Maintenance scheduling
- License and warranty tracking
- Real-time notifications
- Activity logging
- PDF/Excel report generation

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

3. Create and configure `.env` file

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

