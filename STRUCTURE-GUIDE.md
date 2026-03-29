# CCS Profiling System — Backend Structure Guide

## Overview

This backend is built using **Node.js + Express (TypeScript)** and follows a **modular, domain-driven architecture**.

The system is currently **Admin-only**, but is designed to support **future multi-role expansion (RBAC)** without refactoring.

---

## Architecture Principles

### 1. Domain-Driven Modules

Each feature is isolated inside `modules/`.

Examples:

* students
* faculty
* events
* scheduling
* research

---

### 2. Layered Structure per Module

Each module follows:

```
controllers → services → repositories → database
```

| Layer        | Responsibility               |
| ------------ | ---------------------------- |
| controllers  | Handle HTTP request/response |
| services     | Business logic               |
| repositories | Database access              |
| schemas      | Validation (Zod)             |
| types        | Type definitions             |

---

### 3. Shared Layer (Global)

Located in:

```
src/shared/
```

Contains:

* middleware (auth, error handling)
* utils
* constants
* error classes

⚠️ Rules:

* NO business logic
* NO direct DB writes

---

## Folder Structure

```
src/
├── config/
├── modules/
├── shared/
├── db/
├── routes/
├── app.ts
└── server.ts
```

---

## Modules Breakdown

### Core Modules

* students
* faculty
* events
* scheduling
* research
* instructions (curriculum, syllabus)

### Extensions

* skills
* affiliations
* violations
* academic-history
* enrollments

### System Modules

* dashboard (aggregated data)
* analytics
* reports
* audit-logs
* search

---

## Important Design Rules

### 1. ❗ Do NOT Overload Students Table

Student-related data must be separated:

* skills → `skills`
* violations → `violations`
* affiliations → `affiliations`
* academic history → `academic-history`

---

### 2. Profiles Module = Aggregator Only

The `profiles` module **does NOT store data**.

It combines:

* student
* skills
* violations
* affiliations
* academic history

---

### 3. Events = Central Hub

Events connect:

* students (activities)
* faculty (participation)
* research (defense)
* subjects

Design accordingly.

---

### 4. Dashboard & Analytics

* NO database tables
* Computed via services

---

## RBAC (Future-Ready)

Currently:

* Only `admin` role is used

Prepared for:

* faculty
* student

### Users Table

```
users
- id
- email
- password
- role
```

---

### Middleware

* `auth.middleware.ts`
* `role.middleware.ts` (future use)

---

## API Design

All routes are prefixed with:

```
/api/admin/*
```

Examples:

```
/api/admin/students
/api/admin/faculty
/api/admin/events
```

This allows future extension:

* `/api/student/...`
* `/api/faculty/...`

---

## 🗄️ Database Guidelines

### Use UUID for:

* users
* students
* faculty
* events
* research

### Avoid UUID for:

* enums / lookup tables

---

## ⚠️ Common Mistakes to Avoid

* Mixing business logic in controllers
* Direct DB access outside repositories
* Hardcoding admin logic everywhere
* Creating duplicate modules

---

## Best Practices

* Keep modules independent
* Use services for all logic
* Validate all inputs (Zod)
* Keep naming consistent across frontend

---

## Future Expansion

This structure supports:

* multi-role access (RBAC)
* student portal
* faculty portal
* real-time features
* advanced analytics

---

## Final Note

This system is not just CRUD.

It is a:

> **Relational + Analytical Profiling System**

Design with relationships and reporting in mind.
