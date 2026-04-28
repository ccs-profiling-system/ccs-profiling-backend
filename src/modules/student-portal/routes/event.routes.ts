/**
 * Student Portal - Event Routes
 * Route definitions for event management endpoints
 * 
 * Provides endpoints for students to browse upcoming events,
 * view registered events, register for events, and unregister from events.
 * All routes require authentication and RBAC permission checks.
 * 
 */

import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create event routes
 * 
 * @param eventController - Event controller instance
 * @returns Express router with event routes
 */
export function createEventRoutes(
  eventController: EventController
): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/student/events/upcoming
   * List upcoming events
   * 
   * Permission: student.event.read
   * 
   * Returns paginated list of future events with available slots.
   * Supports pagination with page and limit query parameters.
   * 
   * Query Parameters:
   * - page: number (default 1)
   * - limit: number (default 10, max 50)
   * 
   * Response:
   * - 200: Events retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * 
   */
  router.get(
    '/upcoming',
    requirePermission('student.event.read'),
    eventController.listUpcomingEvents
  );

  /**
   * GET /api/student/events/registered
   * List events student has registered for
   * 
   * Permission: student.event.read
   * 
   * Returns list of events the student has registered for with status 'registered'.
   * Includes event details, registration date, and attendance status.
   * 
   * Response:
   * - 200: Registered events retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * 
   */
  router.get(
    '/registered',
    requirePermission('student.event.read'),
    eventController.listRegisteredEvents
  );

  /**
   * REMOVED: POST /api/student/events/:eventId/register
   * REMOVED: POST /api/student/events/:eventId/unregister
   * 
   * Reason: Event participation is assigned/tracked by Faculty/Secretary, not self-managed.
   * Students can view upcoming events and their registered events, but cannot self-register.
   */

  return router;
}
