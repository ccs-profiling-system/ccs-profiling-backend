/**
 * API Routes Registry
 * 
 * This module registers all module routes under the /api/v1 prefix.
 * 
 * ROUTE STRUCTURE:
 * - All routes are prefixed with /api/v1
 * - Admin routes are prefixed with /api/v1/admin
 * - Authentication routes are at /api/v1/auth
 * 
 * REGISTERED MODULES:
 * 
 * 1. Authentication Module (/v1/auth)
 *    - POST /login - User login
 *    - POST /logout - User logout
 *    - POST /refresh - Refresh access token
 *    - GET /me - Get current user
 *    - POST /change-password - Change password
 * 
 * 2. Users Module (/v1/admin/users)
 *    - CRUD operations for user accounts
 * 
 * 3. Students Module (/v1/admin/students)
 *    - CRUD operations for student profiles
 *    - Student enrollments (nested routes)
 *    - Student academic history (nested routes)
 *    - Student skills (nested routes)
 *    - Student violations (nested routes)
 *    - Student affiliations (nested routes)
 * 
 * 4. Faculty Module (/v1/admin/faculty)
 *    - CRUD operations for faculty profiles
 * 
 * 5. Instructions Module (/v1/admin/instructions)
 *    - CRUD operations for curriculum/subjects
 *    - Instruction enrollments (nested routes)
 * 
 * 6. Enrollments Module (/v1/admin/enrollments)
 *    - CRUD operations for student enrollments
 * 
 * 7. Academic History Module (/v1/admin/academic-history)
 *    - CRUD operations for student grades
 * 
 * 8. Scheduling Module (/v1/admin/schedules)
 *    - CRUD operations for class/exam schedules
 *    - Conflict detection
 * 
 * 9. Skills Module (/v1/admin/skills)
 *    - CRUD operations for student skills
 * 
 * 10. Violations Module (/v1/admin/violations)
 *     - CRUD operations for student violations
 * 
 * 11. Affiliations Module (/v1/admin/affiliations)
 *     - CRUD operations for student affiliations
 * 
 * 12. Events Module (/v1/admin/events)
 *     - CRUD operations for events
 *     - Event participant management
 * 
 * 13. Research Module (/v1/admin/research)
 *     - CRUD operations for research projects
 *     - Author and adviser management
 * 
 * 14. Uploads Module (/v1/admin/uploads)
 *     - File upload and management
 * 
 * 15. Audit Logs Module (/v1/admin/audit-logs)
 *     - View audit logs
 *     - Filter by user, entity, date range
 * 
 * 16. Dashboard Module (/v1/admin/dashboard)
 *     - System-wide metrics and statistics
 * 
 * 17. Analytics Module (/v1/admin/analytics)
 *     - GPA distribution
 *     - Skill distribution
 *     - Violation trends
 *     - Research metrics
 * 
 * 18. Reports Module (/v1/admin/reports)
 *     - Generate PDF and Excel reports
 * 
 * 19. Search Module (/v1/admin/search)
 *     - Global search across entities
 *     - Entity-specific search
 * 
 * Requirements: 30.1, 30.2
 */

import { Router } from 'express';
import { userRoutes } from '../modules/users/routes/user.routes';
import authRoutes from '../modules/auth/routes/auth.routes';
import { studentRoutes } from '../modules/students';
import { facultyRoutes } from '../modules/faculty';
import { instructionRoutes } from '../modules/instructions';
import { 
  enrollmentRoutes,
  studentEnrollmentRoutes,
  instructionEnrollmentRoutes,
} from '../modules/enrollments';
import {
  academicHistoryRoutes,
  studentAcademicHistoryRoutes,
} from '../modules/academic-history';
import { scheduleRoutes } from '../modules/scheduling';
import {
  skillRoutes,
  studentSkillRoutes,
} from '../modules/skills';
import {
  violationRoutes,
  studentViolationRoutes,
} from '../modules/violations';
import {
  affiliationRoutes,
  studentAffiliationRoutes,
} from '../modules/affiliations';
import { eventRoutes } from '../modules/events';
import { researchRoutes } from '../modules/research';
import { uploadRoutes } from '../modules/uploads';
import { auditLogRoutes } from '../modules/audit-logs';
import { dashboardRoutes } from '../modules/dashboard';
import { analyticsRoutes } from '../modules/analytics';
import { reportRoutes } from '../modules/reports';
import { searchRoutes } from '../modules/search';

export const routes = Router();

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES (No authentication required)
// ═══════════════════════════════════════════════════════════════════════════

// Authentication routes
routes.use('/v1/auth', authRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES (Authentication + Admin role required)
// ═══════════════════════════════════════════════════════════════════════════

// User Management
routes.use('/v1/admin/users', userRoutes);

// Core Entities
routes.use('/v1/admin/students', studentRoutes);
routes.use('/v1/admin/students', studentEnrollmentRoutes);
routes.use('/v1/admin/students', studentAcademicHistoryRoutes);
routes.use('/v1/admin/students', studentSkillRoutes);
routes.use('/v1/admin/students', studentViolationRoutes);
routes.use('/v1/admin/students', studentAffiliationRoutes);
routes.use('/v1/admin/faculty', facultyRoutes);
routes.use('/v1/admin/instructions', instructionRoutes);
routes.use('/v1/admin/instructions', instructionEnrollmentRoutes);

// Relationships
routes.use('/v1/admin/enrollments', enrollmentRoutes);
routes.use('/v1/admin/academic-history', academicHistoryRoutes);
routes.use('/v1/admin/schedules', scheduleRoutes);

// Activity System
routes.use('/v1/admin/skills', skillRoutes);
routes.use('/v1/admin/violations', violationRoutes);
routes.use('/v1/admin/affiliations', affiliationRoutes);

// Advanced Modules
routes.use('/v1/admin/events', eventRoutes);
routes.use('/v1/admin/research', researchRoutes);
routes.use('/v1/admin/uploads', uploadRoutes);
routes.use('/v1/admin/audit-logs', auditLogRoutes);

// System Layer
routes.use('/v1/admin/dashboard', dashboardRoutes);
routes.use('/v1/admin/analytics', analyticsRoutes);
routes.use('/v1/admin/reports', reportRoutes);
routes.use('/v1/admin/search', searchRoutes);
