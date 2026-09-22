# Kunal Sarees Backend API

A clean, production-ready Node.js, Express.js, MySQL, and Sequelize ORM REST API backend for Kunal Sarees Wholesale E-Commerce.

---

## 1. Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Sequelize MySQL connection setup & test connection helper
│   ├── controllers/
│   │   └── health.controller.js # Health check controller
│   ├── middleware/
│   │   ├── errorHandler.js      # Centralized error handling middleware
│   │   └── notFoundHandler.js   # Centralized 404 handler middleware
│   ├── models/
│   │   └── index.js             # Sequelize models initialization entry point
│   ├── routes/
│   │   ├── health.routes.js     # Health route definitions
│   │   └── index.js             # Master API routing router
│   ├── services/                # Business logic layer
│   ├── utils/
│   │   ├── apiResponse.js       # Standardized success & error response formatters
│   │   └── appError.js          # Custom operational error class
│   ├── validations/             # Input validation schemas
│   ├── app.js                   # Express application & middleware configuration
│   └── server.js                # Server entry point & DB connection initialization
├── .env                         # Local environment variables
├── .env.example                 # Template for environment configuration
├── .gitignore                   # Git ignore file for node_modules, logs, and secrets
├── package.json                 # Node dependencies and scripts
└── README.md                    # Project documentation
```

---

## 2. Packages Installed

### Production Dependencies
- **`express`** (^4.19.2): Fast, unopinionated web framework for Node.js.
- **`mysql2`** (^3.9.7): High-performance MySQL database client driver for Node.js.
- **`sequelize`** (^6.37.3): Promise-based Node.js ORM for MySQL.
- **`jsonwebtoken`** (^9.0.2): JSON Web Token implementation for authentication.
- **`bcryptjs`** (^2.4.3): Password hashing library.
- **`dotenv`** (^16.4.5): Loads environment variables from `.env` file into `process.env`.
- **`cors`** (^2.8.5): Enables Cross-Origin Resource Sharing with custom origin configuration.
- **`helmet`** (^7.1.0): Helps secure Express apps by setting various HTTP headers.
- **`morgan`** (^1.10.0): HTTP request logger middleware for Node.js.

### Development Dependencies
- **`nodemon`** (^3.1.0): Automatically restarts the server when file changes are detected.

---

## 3. Environment Variables

Environment configuration is stored in `.env` (copied from `.env.example`):

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=kunal_sarees
DB_USER=root
DB_PASSWORD=

JWT_SECRET=supersecretjwtkey_kunal_sarees_2026_dev_key
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
```

---

## 4. How to Create the MySQL Database

Ensure MySQL server is running on your machine, then run the following command in your MySQL terminal or client (e.g. MySQL Workbench, phpMyAdmin, DBeaver):

```sql
CREATE DATABASE IF NOT EXISTS kunal_sarees CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 5. How to Start the Backend

1. Navigate into the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server with auto-reload:
   ```bash
   npm run dev
   ```

4. Start production server:
   ```bash
   npm start
   ```

---

## 6. Health-Check URL

- **URL**: `http://localhost:5000/api/health`
- **Method**: `GET`

---

## 7. Example API Responses

### Success Response (`GET /api/health`)

```json
{
  "success": true,
  "message": "Kunal Sarees API is running",
  "data": {
    "environment": "development",
    "timestamp": "2026-09-22T05:45:00.000Z",
    "database": "connected"
  }
}
```

### Error Response (e.g., 404 Not Found)

```json
{
  "success": false,
  "message": "Route not found: GET /api/invalid-endpoint",
  "error": {
    "path": "/api/invalid-endpoint",
    "method": "GET"
  }
}
```

### Error Response (e.g., Validation / Duplicate Entry)

```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "email": "email must be unique. Value 'test@example.com' already exists."
  }
}
```

---

## 8. Any Problems Found

- **No existing backend**: Confirmed no prior backend directory existed in the repository. Created a standalone `backend/` folder without touching the Next.js frontend or any existing files.
- **Database setup prerequisite**: Before starting the server, ensure MySQL service is running locally on port 3306 and database `kunal_sarees` is created. If MySQL is not running or credentials differ, update `DB_USER` and `DB_PASSWORD` in `.env`.
