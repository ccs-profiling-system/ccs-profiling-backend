# CCS Comprehensive Profiling System Backend

A production-ready Node.js + Express + TypeScript REST API for managing academic and institutional data for the College of Computer Studies.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

The CCS Comprehensive Profiling System Backend is a modular, scalable API designed to centralize and analyze student and faculty information, including profiles, academic history, events, research, and institutional analytics. The system follows a domain-driven modular architecture with clean separation of concerns (Controller → Service → Repository).

### Architecture

```
Client → Express API → Auth Middleware → Controllers → Services → Repositories → PostgreSQL
```

Each module is isolated for scalability and maintainability, with shared utilities for cross-cutting concerns.

## Features

- **Student & Faculty Management** - Complete profile management with user account integration
- **Academic Tracking** - Academic history, enrollments, and GPA calculations
- **Scheduling System** - Class, exam, and room scheduling with conflict detection
- **Research Management** - Track thesis, capstone projects, and publications
- **Event Management** - Academic events with participant tracking
- **Skills & Competencies** - Student skill profiling with proficiency levels
- **Disciplinary Records** - Violation tracking with resolution status
- **Organization Affiliations** - Student organization memberships
- **Dashboard & Analytics** - Real-time metrics and statistical insights
- **Report Generation** - PDF and Excel report exports
- **Audit Logging** - Comprehensive activity tracking with before/after state capture
- **File Uploads** - Document management with metadata tracking
- **Global Search** - Search across all entities
- **JWT Authentication** - Secure token-based authentication
- **RBAC Infrastructure** - Role-based access control (currently admin-only)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14.x or higher ([Download](https://www.postgresql.org/download/))
- **npm** 9.x or higher (comes with Node.js)

### Verify Installation

```bash
node --version    # Should be v18.x or higher
npm --version     # Should be 9.x or higher
psql --version    # Should be 14.x or higher
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ccs-profiling-backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Express.js (web framework)
- TypeScript (type safety)
- Drizzle ORM (database toolkit)
- Zod (validation)
- JWT (authentication)
- And more...

## Environment Variables

The application requires environment variables for configuration. All variables are documented in `.env.example`.

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Configure Required Variables

Open `.env` and set the following **REQUIRED** variables:

#### Database Configuration

```env
DATABASE_URL=postgresql://username:password@localhost:5432/ccs_profiling
```

Replace `username`, `password`, and database name with your PostgreSQL credentials.

#### JWT Secrets

Generate strong secrets for JWT tokens:

```bash
# Generate JWT secret
openssl rand -base64 64

# Generate refresh token secret
openssl rand -base64 64
```

Add them to `.env`:

```env
JWT_SECRET=<your-generated-secret-here>
JWT_REFRESH_SECRET=<your-generated-refresh-secret-here>
```

**⚠️ SECURITY WARNING:** Never commit `.env` files to version control. Use strong, randomly generated secrets in staging/production.

### 3. Optional Variables

The following variables have sensible defaults but can be customized:

```env
# Server Configuration
NODE_ENV=development          # development | staging | production | test
PORT=3000                     # Server port

# Database Pool Settings
DB_POOL_MAX=10               # Maximum connections
DB_POOL_MIN=2                # Minimum connections
DB_POOL_IDLE_TIMEOUT=30000   # Idle timeout (ms)
DB_CONNECTION_TIMEOUT=30000  # Connection timeout (ms)

# JWT Expiration
JWT_EXPIRES_IN=7d            # Access token expiration
JWT_REFRESH_EXPIRES_IN=30d   # Refresh token expiration

# File Upload Configuration
UPLOAD_DIR=./uploads         # Upload directory
MAX_FILE_SIZE=10485760       # Max file size (10MB)

# CORS Configuration
CORS_ORIGIN=http://localhost:5173  # Allowed frontend origin
```

### Environment-Specific Configuration

#### Development
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ccs_profiling
JWT_EXPIRES_IN=7d
```

#### Production
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/ccs_profiling_prod?sslmode=require
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

## Database Setup

### 1. Create PostgreSQL Database

Connect to PostgreSQL and create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ccs_profiling;

# Create user (optional)
CREATE USER ccs_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ccs_profiling TO ccs_user;

# Exit psql
\q
```

### 2. Run Database Migrations

The project uses Drizzle ORM for database migrations. Run migrations to create all tables:

```bash
npm run db:migrate
```

This will create the following tables:
- `users` - User accounts and authentication
- `students` - Student profiles
- `faculty` - Faculty profiles
- `entity_counters` - Auto-incrementing ID counters
- `instructions` - Curriculum and subjects
- `enrollments` - Student course enrollments
- `academic_history` - Student grades
- `schedules` - Class and exam schedules
- `skills` - Student skills
- `violations` - Disciplinary records
- `affiliations` - Organization memberships
- `events` - Academic events
- `research` - Research projects
- `uploads` - File metadata
- `audit_logs` - Activity tracking

### 3. Seed Database (Optional)

Populate the database with sample data for development:

```bash
npm run db:seed
```

This creates:
- Admin user account
- Sample students and faculty
- Sample courses and enrollments
- Sample events and research projects

### 4. Reset Database (Development Only)

To drop all tables and start fresh:

```bash
npm run db:reset
```

**⚠️ WARNING:** This will delete all data. Only use in development.

## Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

You should see:
```
🚀 Server running on port 3000
✅ Database connected
📚 API Documentation: http://localhost:3000/api-docs
```

### Production Mode

Build and run the production server:

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Verify Server is Running

Check the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## Project Structure

```
ccs-profiling-backend/
├── src/
│   ├── config/              # Configuration and environment variables
│   │   ├── index.ts         # Config loader with validation
│   │   └── swagger.ts       # Swagger/OpenAPI configuration
│   ├── db/
│   │   ├── schema/          # Drizzle ORM schemas
│   │   │   ├── users.ts
│   │   │   ├── students.ts
│   │   │   ├── faculty.ts
│   │   │   └── ...
│   │   ├── repositories/    # Database access layer
│   │   ├── seeds/           # Database seeders
│   │   ├── index.ts         # Database connection
│   │   ├── migrate.ts       # Migration runner
│   │   └── reset.ts         # Database reset utility
│   ├── modules/             # Domain-driven feature modules
│   │   ├── students/
│   │   │   ├── controllers/ # HTTP request handlers
│   │   │   ├── services/    # Business logic
│   │   │   ├── repositories/# Data access
│   │   │   ├── types/       # DTOs and interfaces
│   │   │   ├── schemas/     # Zod validation schemas
│   │   │   └── routes/      # Route definitions
│   │   ├── faculty/
│   │   ├── auth/
│   │   └── ...
│   ├── shared/              # Cross-cutting concerns
│   │   ├── errors/          # Error classes
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utility functions
│   │   └── types/           # Shared types
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── drizzle/                 # Generated migration files
├── docs/                    # API documentation
│   ├── API_DOCUMENTATION.md
│   ├── ENDPOINTS_REFERENCE.md
│   └── ERROR_CODES.md
├── postman/                 # Postman collection
├── uploads/                 # File uploads (gitignored)
├── .env.example             # Environment variables template
├── drizzle.config.ts        # Drizzle ORM configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Available Scripts

### Development

```bash
npm run dev              # Start development server with hot reload
npm run build            # Build TypeScript to JavaScript
npm start                # Start production server
```

### Database

```bash
npm run db:generate      # Generate migration files from schema changes
npm run db:migrate       # Apply migrations to database
npm run db:push          # Push schema changes directly (dev only)
npm run db:seed          # Seed database with sample data
npm run db:reset         # Drop all tables and recreate (dev only)
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

### Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
```

## API Documentation

### Interactive Documentation (Swagger UI)

Access the interactive API documentation at:

**http://localhost:3000/api-docs**

The Swagger UI allows you to:
- Browse all endpoints with detailed descriptions
- View request/response schemas
- Test endpoints directly from the browser
- Download OpenAPI specification

### Documentation Files

Comprehensive documentation is available in the `docs/` directory:

- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - Complete API usage guide
- **[docs/ENDPOINTS_REFERENCE.md](./docs/ENDPOINTS_REFERENCE.md)** - Quick reference for all endpoints
- **[docs/ERROR_CODES.md](./docs/ERROR_CODES.md)** - Error code reference and troubleshooting

### API Structure

- **Base URL:** `http://localhost:3000/api`
- **Version:** `/api/v1/`
- **Auth Routes:** `/api/v1/auth/*` (public)
- **Admin Routes:** `/api/v1/admin/*` (requires authentication)

### Quick Start Example

1. **Login to get JWT token:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ccs.edu",
    "password": "admin123"
  }'
```

2. **Use token to access protected endpoints:**

```bash
curl -X GET http://localhost:3000/api/v1/admin/students \
  -H "Authorization: Bearer <your-token>"
```

## Testing

### Run Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Structure

Tests are co-located with source files using `.test.ts` suffix:

```
src/
├── config/
│   ├── index.ts
│   └── index.test.ts
├── db/
│   ├── index.ts
│   └── index.test.ts
└── modules/
    └── students/
        ├── services/
        │   ├── student.service.ts
        │   └── student.service.test.ts
```

## Troubleshooting

### Database Connection Issues

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env`
3. Ensure database exists: `psql -l`
4. Check PostgreSQL logs for errors

### Migration Errors

**Problem:** `Migration failed: relation already exists`

**Solution:**
```bash
# Reset database and re-run migrations
npm run db:reset
npm run db:migrate
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
1. Change PORT in `.env` to a different port
2. Or kill the process using port 3000:
   ```bash
   # Find process
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

### JWT Token Errors

**Problem:** `Error: JWT secret not configured`

**Solution:**
1. Ensure JWT_SECRET and JWT_REFRESH_SECRET are set in `.env`
2. Generate new secrets: `openssl rand -base64 64`
3. Restart the server

### File Upload Errors

**Problem:** `Error: ENOENT: no such file or directory, open './uploads/...'`

**Solution:**
1. Ensure UPLOAD_DIR exists: `mkdir -p uploads`
2. Check file permissions: `chmod 755 uploads`
3. Verify MAX_FILE_SIZE in `.env`

### Common Error Codes

| Code | Status | Description | Solution |
|------|--------|-------------|----------|
| `VALIDATION_ERROR` | 400 | Invalid input | Check request body against schema |
| `UNAUTHORIZED` | 401 | Invalid token | Login again to get new token |
| `FORBIDDEN` | 403 | Insufficient permissions | Check user role |
| `NOT_FOUND` | 404 | Resource not found | Verify resource ID |
| `CONFLICT` | 409 | Duplicate resource | Check unique constraints |

See [docs/ERROR_CODES.md](./docs/ERROR_CODES.md) for complete error reference.

## Contributing

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and write tests
3. Run linter: `npm run lint:fix`
4. Run tests: `npm test`
5. Commit changes: `git commit -m "feat: your feature"`
6. Push and create pull request

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier for formatting
- Write tests for new features
- Document public APIs with JSDoc comments
- Follow the existing module structure

### Adding New Endpoints

1. Add OpenAPI annotations in `docs/openapi-annotations.ts`
2. Update `docs/ENDPOINTS_REFERENCE.md` with examples
3. Document any new error codes in `docs/ERROR_CODES.md`
4. Test the Swagger UI to ensure documentation is correct

## License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## Additional Resources

- **API Documentation:** http://localhost:3000/api-docs
- **Postman Collection:** [postman/ccs-profiling-api.postman_collection.json](./postman/ccs-profiling-api.postman_collection.json)
- **Architecture Guide:** [STRUCTURE-GUIDE.md](./STRUCTURE-GUIDE.md)

## Support

For issues, questions, or contributions:
- **Email:** support@ccs.edu
- **Issues:** Report bugs or request features via GitHub Issues

---

**Status:** ✅ Production-ready - Structured for scalability and future expansion

**Version:** 1.0.0
