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