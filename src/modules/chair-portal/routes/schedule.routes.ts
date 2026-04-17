/**
 * Schedule Routes for Department Chair Portal
 * 
 * Defines HTTP routes for schedule management operations with RBAC protection.
 * All routes require JWT authentication and specific chair.schedule.* permissions.
 * 
 * Routes:
 * - GET /api/chair/schedules - List schedules with filtering
 * - POST /api/chair/schedules - Create a new schedule with conflict detection
 * - POST /api/chair/schedules/:id/approve - Approve a schedule
 * - GET /api/chair/schedules/conflicts - Check for schedule conflicts
 * 
 * Requirements: 5.1, 5.4, 5.9, 5.11, 14.1
 */

import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create schedule routes with dependency injection
 * 
 * @param scheduleController - Schedule controller instance
 * @returns Express router with configured routes
 */
export function createScheduleRoutes(scheduleController: ScheduleController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * GET /api/chair/schedules/conflicts
   * 
   * Check for schedule conflicts
   * 
   * IMPORTANT: This route must be defined BEFORE the /:id routes to prevent
   * "conflicts" from being interpreted as an ID parameter.
   * 
   * Query Parameters:
   * - faculty_id: Faculty member ID (required)
   * - room: Room number/name (required)
   * - day: Day of week (required)
   * - time_start: Start time in HH:MM format (required)
   * - time_end: End time in HH:MM format (required)
   * 
   * Permissions: chair.schedule.read
   * 
   * Responses:
   * - 200: Success with conflict details (empty array if no conflicts)
   * - 400: Bad Request (invalid query parameters)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.schedule.read permission)
   * - 404: Not Found (user has no department affiliation)
   * - 500: Internal Server Error
   */
  router.get('/conflicts', requirePermission('chair.schedule.read'), scheduleController.checkConflicts);

  /**
   * GET /api/chair/schedules
   * 
   * List schedules with filtering
   * 
   * Query Parameters:
   * - semester: Filter by semester (1st, 2nd, summer) (optional)
   * - year: Filter by academic year (optional)
   * - faculty_id: Filter by faculty member (optional)
   * - subject_code: Filter by subject code (optional)
   * 
   * Permissions: chair.schedule.read
   * 
   * Responses:
   * - 200: Success with schedule list
   * - 400: Bad Request (invalid query parameters)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.schedule.read permission)
   * - 404: Not Found (user has no department affiliation)
   * - 500: Internal Server Error
   */
  router.get('/', requirePermission('chair.schedule.read'), scheduleController.listSchedules);

  /**
   * POST /api/chair/schedules
   * 
   * Create a new schedule with conflict detection
   * 
   * Request Body:
   * - subject_code: Subject code (required)
   * - faculty_id: Faculty member ID (required)
   * - semester: Semester (1st, 2nd, summer) (required)
   * - year: Academic year (required)
   * - day: Day of week (required)
   * - time_start: Start time in HH:MM format (required)
   * - time_end: End time in HH:MM format (required)
   * - room: Room number/name (required)
   * 
   * Permissions: chair.schedule.create
   * 
   * Responses:
   * - 201: Created with schedule details
   * - 400: Bad Request (invalid request body)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.schedule.create permission)
   * - 404: Not Found (user has no department affiliation or faculty not found)
   * - 422: Unprocessable Entity (schedule conflicts detected)
   * - 500: Internal Server Error
   */
  router.post('/', requirePermission('chair.schedule.create'), scheduleController.createSchedule);

  /**
   * POST /api/chair/schedules/:id/approve
   * 
   * Approve a schedule
   * 
   * Path Parameters:
   * - id: Schedule ID
   * 
   * Permissions: chair.schedule.approve
   * 
   * Responses:
   * - 200: Success with schedule details
   * - 400: Bad Request (invalid state for approval)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.schedule.approve permission)
   * - 404: Not Found (schedule not found or outside department scope)
   * - 500: Internal Server Error
   */
  router.post('/:id/approve', requirePermission('chair.schedule.approve'), scheduleController.approveSchedule);

  return router;
}
