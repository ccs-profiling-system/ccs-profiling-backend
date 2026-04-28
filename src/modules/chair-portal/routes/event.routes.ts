/**
 * Event Routes for Chair Portal
 * 
 * Defines HTTP routes for event management in the department chair portal.
 * All routes are protected by JWT authentication and RBAC permissions.
 * 
 * Base Path: /api/chair/events
 * 
 * Routes:
 * - GET    /                      - List events with pagination and filtering
 * - POST   /                      - Create a new event
 * - GET    /:id                   - Get event details
 * - PUT    /:id                   - Update event
 * - DELETE /:id                   - Delete event
 * - POST   /:id/approve           - Approve event
 * - POST   /:id/reject            - Reject event
 * - GET    /:id/participants      - Get event participants
 * 
 */

import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { EventService } from '../services/event.service';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create event routes with dependency injection
 * 
 * @returns Express router with event routes
 */
export function createEventRoutes(): Router {
  const router = Router();
  const eventService = new EventService();
  const eventController = new EventController(eventService);

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * GET /api/chair/events
   * 
   * List events with pagination and filtering
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   * - type: Filter by event type (optional)
   * - status: Filter by event status (optional)
   * - start_date: Filter events on or after this date (optional)
   * - end_date: Filter events on or before this date (optional)
   * 
   * Responses:
   * - 200: Success with paginated event list
   * - 400: Invalid query parameters
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing chair.event.read permission)
   * - 404: User has no department affiliation
   * - 500: Internal Server Error
   */
  router.get('/', requirePermission('chair.event.read'), eventController.listEvents);

  /**
   * POST /api/chair/events
   * 
   * Create a new event
   * 
   * Request Body:
   * - title: Event title (required)
   * - description: Event description (required)
   * - event_type: Type of event (required)
   * - event_date: Date of event (required)
   * - location: Event location (required)
   * - organizer: Event organizer (required)
   * - max_participants: Maximum number of participants (optional)
   * - registration_deadline: Registration deadline (optional)
   * 
   * Responses:
   * - 200: Success with created event details
   * - 400: Invalid request body
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing chair.event.create permission)
   * - 404: User has no department affiliation
   * - 500: Internal Server Error
   */
  router.post('/', requirePermission('chair.event.create'), eventController.createEvent);

  /**
   * GET /api/chair/events/:id
   * 
   * Get event details by ID
   * 
   * Path Parameters:
   * - id: Event ID
   * 
   * Responses:
   * - 200: Success with event details including participant count
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing chair.event.read permission)
   * - 404: Event not found or outside department scope
   * - 500: Internal Server Error
   */
  router.get('/:id', requirePermission('chair.event.read'), eventController.getEvent);

  /**
   * PUT /api/chair/events/:id
   * 
   * Update an event
   * 
   * Path Parameters:
   * - id: Event ID
   * 
   * Request Body: (all fields optional)
   * - title: Event title
   * - description: Event description
   * - event_type: Type of event
   * - event_date: Date of event
   * - location: Event location
   * - organizer: Event organizer
   * - max_participants: Maximum number of participants
   * - registration_deadline: Registration deadline
   * 
   * Responses:
   * - 200: Success with updated event details
   * - 400: Invalid request body or event not in valid state for update
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing chair.event.update permission)
   * - 404: Event not found or outside department scope
   * - 500: Internal Server Error
   */
  router.put('/:id', requirePermission('chair.event.update'), eventController.updateEvent);

  /**
   * DELETE /api/chair/events/:id
   * 
   * Delete an event
   * 
   * Path Parameters:
   * - id: Event ID
   * 
   * Responses:
   * - 200: Success with confirmation message
   * - 400: Event not in valid state for deletion
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing chair.event.delete permission)
   * - 404: Event not found or outside department scope
   * - 500: Internal Server Error
   */
  router.delete('/:id', requirePermission('chair.event.delete'), eventController.deleteEvent);

  /**
   * POST /api/chair/events/:id/approve
   * 
   * Approve an event
   * 
   * Path Parameters:
   * - id: Event ID
   * 
   * Request Body:
   * - approver_notes: Optional notes from the approver
   * 
   * Responses:
   * - 200: Success with updated event details
   * - 400: Invalid request body or event not in valid state for approval
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing chair.event.approve permission)
   * - 404: Event not found or outside department scope
   * - 500: Internal Server Error
   */
  router.post('/:id/approve', requirePermission('chair.event.approve'), eventController.approveEvent);

  /**
   * POST /api/chair/events/:id/reject
   * 
   * Reject an event
   * 
   * Path Parameters:
   * - id: Event ID
   * 
   * Request Body:
   * - rejection_reason: Required reason for rejection (10-1000 characters)
   * 
   * Responses:
   * - 200: Success with updated event details
   * - 400: Invalid request body or event not in valid state for rejection
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing chair.event.reject permission)
   * - 404: Event not found or outside department scope
   * - 500: Internal Server Error
   */
  router.post('/:id/reject', requirePermission('chair.event.reject'), eventController.rejectEvent);

  /**
   * GET /api/chair/events/:id/participants
   * 
   * Get event participants
   * 
   * Path Parameters:
   * - id: Event ID
   * 
   * Responses:
   * - 200: Success with list of event participants
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing chair.event.read permission)
   * - 404: Event not found or outside department scope
   * - 500: Internal Server Error
   */
  router.get('/:id/participants', requirePermission('chair.event.read'), eventController.getParticipants);

  return router;
}
