/**
 * Secretary Portal Routes
 * 
 * Aggregates all secretary portal routes under the /api/secretary prefix.
 * All routes require JWT authentication and secretary.* permissions.
 * 
 * Authentication Flow:
 * 1. authMiddleware validates JWT token and extracts user context (user_id, role)
 * 2. Returns HTTP 401 Unauthorized if authentication fails
 * 3. Attaches user info to req.user for downstream middleware
 * 
 * Requirements: 1.1, 1.4, 18.2, 19.2
 */

import { Router } from 'express';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { createDashboardRoutes } from './dashboard.routes';
import { createStudentRoutes } from './student.routes';
import { createFacultyRoutes } from './faculty.routes';
import { createScheduleRoutes } from './schedule.routes';
import { createDocumentRoutes } from './document.routes';
import { createEventRoutes } from './event.routes';
import { createResearchRoutes } from './research.routes';
import { createPendingChangesRoutes } from './pendingChanges.routes';
import { createReportRoutes } from './report.routes';
import { createFilterRoutes } from './filter.routes';

/**
 * Secretary Portal Router
 * 
 * All routes under this router are protected by JWT authentication.
 * The authMiddleware is applied globally to all secretary portal routes.
 * 
 * Authentication Requirements:
 * - Valid JWT token in Authorization header (Bearer <token>)
 * - Token must not be expired
 * - Token signature must be valid
 * 
 * On Success:
 * - req.user is populated with { userId, email, role }
 * - Request proceeds to next middleware/handler
 * 
 * On Failure:
 * - HTTP 401 Unauthorized is returned
 * - Error message indicates authentication failure reason
 */
export const secretaryPortalRouter = Router();

// Apply authentication middleware to all secretary portal routes
// This validates JWT tokens for all API requests
// Requirements: 1.1, 1.4, 18.2
secretaryPortalRouter.use(authMiddleware);

// Register module routes with appropriate prefixes
// All routes have requirePermission middleware applied at the route level
// Requirements: 1.2, 1.3, 1.5

// Dashboard routes - GET /api/secretary/dashboard
secretaryPortalRouter.use('/dashboard', createDashboardRoutes());

// Student management routes - /api/secretary/students
secretaryPortalRouter.use('/students', createStudentRoutes());

// Faculty management routes - /api/secretary/faculty
secretaryPortalRouter.use('/faculty', createFacultyRoutes());

// Schedule management routes - /api/secretary/schedules
secretaryPortalRouter.use('/schedules', createScheduleRoutes());

// Document management routes - /api/secretary/documents
secretaryPortalRouter.use('/documents', createDocumentRoutes());

// Event management routes - /api/secretary/events
secretaryPortalRouter.use('/events', createEventRoutes());

// Research management routes - /api/secretary/research
secretaryPortalRouter.use('/research', createResearchRoutes());

// Pending changes routes - /api/secretary/pending-changes
secretaryPortalRouter.use('/pending-changes', createPendingChangesRoutes());

// Report generation routes - /api/secretary/reports
secretaryPortalRouter.use('/reports', createReportRoutes());

// Filter options routes - /api/secretary/filters
secretaryPortalRouter.use('/filters', createFilterRoutes());

