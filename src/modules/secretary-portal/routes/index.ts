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
 * Audit Context Flow:
 * 1. auditContextMiddleware extracts IP address, user agent, and user ID
 * 2. Attaches audit context to req.auditContext for use in audit logging
 * 
 */

import { Router } from 'express';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { auditContextMiddleware } from '../../../shared/middleware/auditContext.middleware';
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
import { CurriculumController } from '../controllers/curriculum.controller';
import { CurriculumService } from '../services/curriculum.service';
import { createCurriculumRoutes, createSubjectsRoutes } from './curriculum.routes';

/**
 * Secretary Portal Router
 * 
 * All routes under this router are protected by JWT authentication.
 * The authMiddleware is applied globally to all secretary portal routes.
 * The auditContextMiddleware is applied after authentication to capture audit context.
 * 
 * - Valid JWT token in Authorization header (Bearer <token>)
 * - Token must not be expired
 * - Token signature must be valid
 * 
 * On Success:
 * - req.user is populated with { userId, email, role }
 * - req.auditContext is populated with { user_id, ip_address, user_agent }
 * - Request proceeds to next middleware/handler
 * 
 * On Failure:
 * - HTTP 401 Unauthorized is returned
 * - Error message indicates authentication failure reason
 */
export const secretaryPortalRouter = Router();

// Apply authentication middleware to all secretary portal routes
// This validates JWT tokens for all API requests
secretaryPortalRouter.use(authMiddleware);

// Apply audit context middleware after authentication
// This captures IP address, user agent, and user ID for audit logging
secretaryPortalRouter.use(auditContextMiddleware);

// Initialize curriculum service and controller
const curriculumService = new CurriculumService();
const curriculumController = new CurriculumController(curriculumService);

// Create curriculum route modules
const curriculumRoutes = createCurriculumRoutes(curriculumController);
const subjectsRoutes = createSubjectsRoutes(curriculumController);

// Register module routes with appropriate prefixes
// All routes have requirePermission middleware applied at the route level

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

// Curriculum management routes - /api/secretary/curriculum
secretaryPortalRouter.use('/curriculum', curriculumRoutes);

// Subjects management routes - /api/secretary/subjects
secretaryPortalRouter.use('/subjects', subjectsRoutes);

