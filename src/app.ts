/**
 * Main Application Entry Point
 * 
 * This module initializes the Express application and wires together all modules.
 * 
 * MIDDLEWARE STACK (in order):
 * 1. API Version Header - Adds X-API-Version to all responses
 * 2. Security - Helmet (security headers) and CORS
 * 3. Rate Limiting - Protects API endpoints from abuse
 * 4. Body Parsing - JSON and URL-encoded request bodies
 * 5. Static Files - Serves uploaded files
 * 6. Routes - All module routes (auth, students, faculty, etc.)
 * 7. 404 Handler - Catches unmatched routes
 * 8. Error Handler - Global error handling (must be last)
 * 
 * REGISTERED MODULES:
 * - Authentication (auth)
 * - Users Management (users)
 * - Students Management (students)
 * - Faculty Management (faculty)
 * - Instructions/Curriculum (instructions)
 * - Enrollments (enrollments)
 * - Academic History (academic-history)
 * - Scheduling (schedules)
 * - Skills (skills)
 * - Violations (violations)
 * - Affiliations (affiliations)
 * - Events (events)
 * - Research (research)
 * - File Uploads (uploads)
 * - Audit Logs (audit-logs)
 * - Dashboard (dashboard)
 * - Analytics (analytics)
 * - Reports (reports)
 * - Search (search)
 * 
 * Requirements: 1.1, 1.2
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { routes } from './routes';
import { errorHandler } from './shared/middleware/errorHandler';
import { helmetConfig, getCorsOptions } from './shared/middleware/security';
import { apiRateLimiter } from './shared/middleware/rateLimiter';
import { apiVersionMiddleware } from './shared/middleware/apiVersion.middleware';

export const app = express();

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL MIDDLEWARE (Applied to all requests)
// ═══════════════════════════════════════════════════════════════════════════

// 1. API Version Header - Adds X-API-Version: 1.0 to all responses
app.use(apiVersionMiddleware);

// 2. Security Middleware
// - Helmet: Sets security-related HTTP headers
// - CORS: Configures Cross-Origin Resource Sharing
app.use(helmetConfig);
app.use(cors(getCorsOptions()));

// 3. Rate Limiting - Protects API endpoints from abuse
// - 100 requests per minute per IP for API routes
// - Auth endpoints have stricter limits (5 requests per 15 minutes)
app.use('/api', apiRateLimiter);

// 4. Body Parsing Middleware
// - Parses JSON request bodies
// - Parses URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Static File Serving - Serves uploaded files from local storage
const uploadsPath = process.env.LOCAL_STORAGE_PATH || './uploads';
app.use('/uploads', express.static(path.resolve(uploadsPath)));

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Health Check Endpoint - Used for monitoring and load balancer health checks
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes - All module routes are registered here
// Routes are defined in src/routes/index.ts
// All routes are prefixed with /api/v1
app.use('/api', routes);

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

// 404 Handler - Catches all unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
    },
  });
});

// Global Error Handler - Catches all errors thrown in the application
// MUST be the last middleware in the stack
app.use(errorHandler);
