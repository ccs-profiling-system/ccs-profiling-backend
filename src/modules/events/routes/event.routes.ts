/**
 * Event Routes
 * Route definitions for event endpoints
 * 
 */

import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createEventRoutes(eventController: EventController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/events/deleted
   * Get soft-deleted events (admin only)
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * 
   * Permission: event.delete
   * Accessible by: Admin
   */
  router.get('/deleted', requirePermission('event.delete'), eventController.getDeletedEvents);

  /**
   * GET /api/v1/admin/events
   * List events with pagination and filters
   * 
   * Permission: event.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/', requirePermission('event.read'), eventController.listEvents);

  /**
   * GET /api/v1/admin/events/:id/participants
   * Get all participants for an event
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * 
   * Permission: event.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:id/participants', requirePermission('event.read'), eventController.getParticipants);

  /**
   * GET /api/v1/admin/events/:id
   * Get event by ID
   * 
   * Permission: event.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:id', requirePermission('event.read'), eventController.getEvent);

  /**
   * POST /api/v1/admin/events
   * Create a new event
   * 
   * Permission: event.create
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.post('/', requirePermission('event.create'), eventController.createEvent);

  /**
   * POST /api/v1/admin/events/:id/participants
   * Add participant to event
   * 
   * Permission: event.record_attendance
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.post('/:id/participants', requirePermission('event.record_attendance'), eventController.addParticipant);

  /**
   * PUT /api/v1/admin/events/:id
   * Update event by ID
   * 
   * Permission: event.update
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.put('/:id', requirePermission('event.update'), eventController.updateEvent);

  /**
   * PATCH /api/v1/admin/events/:id/restore
   * Restore soft-deleted event
   * 
   * Permission: event.delete
   * Accessible by: Admin
   */
  router.patch('/:id/restore', requirePermission('event.delete'), eventController.restoreEvent);

  /**
   * DELETE /api/v1/admin/events/:id/permanent
   * Permanently delete event (hard delete)
   * 
   * Permission: event.delete
   * Accessible by: Admin
   */
  router.delete('/:id/permanent', requirePermission('event.delete'), eventController.permanentDeleteEvent);

  /**
   * DELETE /api/v1/admin/events/:id/participants/:participantId
   * Remove participant from event
   * 
   * Permission: event.record_attendance
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.delete('/:id/participants/:participantId', requirePermission('event.record_attendance'), eventController.removeParticipant);

  /**
   * DELETE /api/v1/admin/events/:id
   * Delete event by ID (soft delete)
   * 
   * Permission: event.delete
   * Accessible by: Admin
   */
  router.delete('/:id', requirePermission('event.delete'), eventController.deleteEvent);

  return router;
}
