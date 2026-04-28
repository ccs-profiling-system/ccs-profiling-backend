/**
 * Faculty Portal - Event Routes
 * Route definitions for event management and participation endpoints
 * 
 * Provides endpoints for faculty members to view department events, track participation,
 * and register for events. All routes require authentication and RBAC permission checks.
 * Event access is validated by department membership.
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
export function createEventRoutes(eventController: EventController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/faculty/events
   * List events by faculty's department with pagination and filtering
   * 
   * Permission: faculty.event.read
   * 
   * Retrieves events filtered by the authenticated faculty member's department.
   * Supports pagination and filtering by event type and upcoming events.
   * 
   * Query Parameters:
   * - page (optional): Page number (default: 1)
   * - limit (optional): Items per page (default: 10, max: 100)
   * - type (optional): Filter by event type
   * - upcoming (optional): Filter events with event_date >= current date (boolean)
   * 
   * Response:
   * - 200: Paginated list of events with metadata
   * - 400: Bad Request (invalid query parameters)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "uuid",
   *       "title": "Event Title",
   *       "description": "Event description",
   *       "event_type": "seminar",
   *       "event_date": "2024-03-15",
   *       "location": "Room 101",
   *       "organizer": "Department Chair",
   *       "max_participants": 50,
   *       "registration_deadline": "2024-03-10",
   *       "registration_status": "open",
   *       "is_registered": false
   *     }
   *   ],
   *   "meta": {
   *     "total": 10,
   *     "page": 1,
   *     "limit": 10,
   *     "totalPages": 1
   *   }
   * }
   * 
   */
  router.get(
    '/events',
    requirePermission('faculty.event.read'),
    eventController.listEvents
  );

  /**
   * GET /api/faculty/events/my-participation
   * Get faculty's event participation
   * 
   * Permission: faculty.event.read
   * 
   * Retrieves all events the authenticated faculty member is registered for
   * with participation details including registration date and attendance status.
   * 
   * Response:
   * - 200: List of event participation records
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "event_id": "uuid",
   *       "event_name": "Event Title",
   *       "event_type": "seminar",
   *       "event_date": "2024-03-15",
   *       "location": "Room 101",
   *       "registration_date": "2024-03-01T00:00:00.000Z",
   *       "attendance_status": "registered",
   *       "participation_role": "participant"
   *     }
   *   ]
   * }
   * 
   */
  router.get(
    '/events/my-participation',
    requirePermission('faculty.event.read'),
    eventController.getMyParticipation
  );

  /**
   * POST /api/faculty/events/:eventId/register
   * Register faculty for an event
   * 
   * Permission: faculty.event.register
   * 
   * Creates a participation record for the authenticated faculty member.
   * Validates event exists, belongs to faculty's department, registration deadline,
   * capacity limits, and prevents duplicate registrations.
   * 
   * Route Parameters:
   * - eventId (required): UUID of the event
   * 
   * Response:
   * - 200: Created participation record with event details
   * - 400: Bad Request (invalid event ID, already registered, or registration deadline passed)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or event not in faculty's department)
   * - 404: Not Found (event doesn't exist)
   * - 422: Unprocessable Entity (event is full)
   * 
   * Response Body (Success):
   * {
   *   "success": true,
   *   "data": {
   *     "event_id": "uuid",
   *     "event_name": "Event Title",
   *     "event_type": "seminar",
   *     "event_date": "2024-03-15",
   *     "location": "Room 101",
   *     "registration_date": "2024-03-01T00:00:00.000Z",
   *     "attendance_status": "registered",
   *     "participation_role": "participant"
   *   },
   *   "message": "Successfully registered for event"
   * }
   * 
   * Response Body (Error - Already Registered):
   * {
   *   "success": false,
   *   "error": {
   *     "message": "Already registered for this event",
   *     "code": "ALREADY_REGISTERED",
   *     "timestamp": "2024-03-01T00:00:00.000Z"
   *   }
   * }
   * 
   * Response Body (Error - Registration Deadline Passed):
   * {
   *   "success": false,
   *   "error": {
   *     "message": "Registration deadline has passed",
   *     "code": "REGISTRATION_DEADLINE_PASSED",
   *     "timestamp": "2024-03-01T00:00:00.000Z"
   *   }
   * }
   * 
   * Response Body (Error - Event Full):
   * {
   *   "success": false,
   *   "error": {
   *     "message": "Event is full",
   *     "code": "EVENT_FULL",
   *     "timestamp": "2024-03-01T00:00:00.000Z"
   *   }
   * }
   * 
   */
  router.post(
    '/events/:eventId/register',
    requirePermission('faculty.event.register'),
    eventController.registerForEvent
  );

  return router;
}
