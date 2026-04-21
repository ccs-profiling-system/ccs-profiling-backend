/**
 * Student Portal - Event Routes
 * Route definitions for event management endpoints
 * 
 * Provides endpoints for students to browse upcoming events,
 * view registered events, register for events, and unregister from events.
 * All routes require authentication and RBAC permission checks.
 * 
 * Requirements: 17.6, 18.4, 19.8, 20.6, 27.1, 27.2, 27.3, 27.4, 27.5
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
   * Requirements: 17.1, 17.6, 27.1, 27.2, 27.3, 27.4, 27.5
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
   * Requirements: 18.1, 18.4, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/registered',
    requirePermission('student.event.read'),
    eventController.listRegisteredEvents
  );

  /**
   * POST /api/student/events/:eventId/register
   * Register for an event
   * 
   * Permission: student.event.register
   * 
   * Creates a registration record for the student.
   * Validates registration deadline, event capacity, and duplicate registration.
   * 
   * Route Parameters:
   * - eventId: Event UUID
   * 
   * Response:
   * - 201: Registration created successfully
   * - 400: Bad Request (registration deadline passed or not registered)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 404: Not Found (event not found)
   * - 409: Conflict (already registered)
   * - 422: Unprocessable Entity (event at maximum capacity)
   * 
   * Requirements: 19.1, 19.8, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.post(
    '/:eventId/register',
    requirePermission('student.event.register'),
    eventController.registerForEvent
  );

  /**
   * POST /api/student/events/:eventId/unregister
   * Unregister from an event
   * 
   * Permission: student.event.register
   * 
   * Removes the student's registration record.
   * Validates student is currently registered and event date has not passed.
   * 
   * Route Parameters:
   * - eventId: Event UUID
   * 
   * Response:
   * - 200: Unregistration successful
   * - 400: Bad Request (not registered or event date passed)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 404: Not Found (event not found)
   * 
   * Requirements: 20.1, 20.6, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.post(
    '/:eventId/unregister',
    requirePermission('student.event.register'),
    eventController.unregisterFromEvent
  );

  return router;
}
