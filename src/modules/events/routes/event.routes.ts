/**
 * Event Routes
 * Route definitions for event endpoints
 * 
 * Requirements: 11.1, 11.6, 30.2
 */

import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createEventRoutes(eventController: EventController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/events/deleted
   * Get soft-deleted events (admin only)
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   */
  router.get('/deleted', eventController.getDeletedEvents);

  /**
   * GET /api/v1/admin/events
   * List events with pagination and filters
   */
  router.get('/', eventController.listEvents);

  /**
   * GET /api/v1/admin/events/:id/participants
   * Get all participants for an event
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   */
  router.get('/:id/participants', eventController.getParticipants);

  /**
   * GET /api/v1/admin/events/:id
   * Get event by ID
   */
  router.get('/:id', eventController.getEvent);

  /**
   * POST /api/v1/admin/events
   * Create a new event
   */
  router.post('/', eventController.createEvent);

  /**
   * POST /api/v1/admin/events/:id/participants
   * Add participant to event
   */
  router.post('/:id/participants', eventController.addParticipant);

  /**
   * PUT /api/v1/admin/events/:id
   * Update event by ID
   */
  router.put('/:id', eventController.updateEvent);

  /**
   * PATCH /api/v1/admin/events/:id/restore
   * Restore soft-deleted event
   */
  router.patch('/:id/restore', eventController.restoreEvent);

  /**
   * DELETE /api/v1/admin/events/:id/permanent
   * Permanently delete event (hard delete)
   */
  router.delete('/:id/permanent', eventController.permanentDeleteEvent);

  /**
   * DELETE /api/v1/admin/events/:id/participants/:participantId
   * Remove participant from event
   */
  router.delete('/:id/participants/:participantId', eventController.removeParticipant);

  /**
   * DELETE /api/v1/admin/events/:id
   * Delete event by ID (soft delete)
   */
  router.delete('/:id', eventController.deleteEvent);

  return router;
}
