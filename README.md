# CCS Profiling System — Backend

## Overview

The backend of the **CCS Comprehensive Profiling System**, built with **Node.js, Express, and TypeScript**, provides a modular and scalable API for managing academic and non-academic data within the College of Computer Studies.

This system is designed to centralize and analyze student and faculty information, including profiles, academic history, events, research, and institutional analytics.

---

## Key Features

* Student and Faculty Profiling
* Academic History and Enrollment Tracking
* Events and Participation Management
* Scheduling System (Classes, Exams, Rooms)
* Research Management (Authors, Advisers, Outputs)
* Curriculum and Instructional Content Management
* Centralized Dashboard and Analytics
* Report Generation (PDF/Excel)
* Audit Logs and Data Validation

---

## Architecture

The backend follows a **domain-driven modular architecture**:

```text
controllers → services → repositories → database
```

Each module is isolated for scalability and maintainability.

---

## Tech Stack

* **Runtime**: Node.js 18+
* **Framework**: Express.js
* **Language**: TypeScript 5+
* **Database**: PostgreSQL 14+ with Drizzle ORM
* **Authentication**: JWT with bcrypt password hashing
* **Validation**: Zod schemas
* **Testing**: Vitest

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd ccs-profiling-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure your database connection and other settings.

4. Run database migrations (once implemented):
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

---

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

---

## Access Control

Currently **Admin-only**, with a **future-ready RBAC structure** for:

* Faculty
* Students
* Other institutional roles

---

## API Documentation

All API routes are prefixed with `/api/v1/`

Admin routes: `/api/v1/admin/*`

Health check: `GET /health`

---

## Project Structure

```
src/
├── config/          # Configuration and environment variables
├── db/              # Database connection and schemas
├── modules/         # Domain-driven feature modules
├── shared/          # Shared utilities, middleware, errors
├── routes/          # Route definitions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

---

## Purpose

This backend serves as the **core data and analytics engine** of the CCS Profiling System, supporting data-driven decision-making and institutional reporting.

---

## Status

🚧 In active development — structured for scalability and future expansion.
