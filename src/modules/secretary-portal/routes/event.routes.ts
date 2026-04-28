/**
 * Event Routes
 * 
 * Defines routes for secretary portal event operations.
 * All routes require authentication and appropriate permissions.
 * 
 */

import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import {
  getAllEventsController,
  getEventByIdController,
  createEventController,
  updateEventController,
  deleteEventController,
  submitEventController,
  getEventParticipantsController,
} from '../controllers/event.controller';

/**
 * Create event router
 * 
 * Endpoints:
 * - GET /api/secretary/events - Get all events with pagination and filtering
 * - GET /api/secretary/events/:id - Get event by ID
 * - POST /api/secretary/events - Create a new event
 * - PUT /api/secretary/events/:id - Update an existing event
 * - DELETE /api/secretary/events/:id - Delete an event (soft delete)
 * - POST /api/secretary/events/:id/submit - Submit an event for approval
 * - GET /api/secretary/events/:id/participants - Get participants for an event
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Appropriate permission for the operation
 */
export function createEventRoutes(): Router {
  const router = Router();

  /**
   * GET /api/secretary/events
   * 
   * Retrieve all events with pagination and filtering.
   * 
   */
  router.get(
    '/',
    requirePermission('secretary.event.read'),
    getAllEventsController
  );

  /**
   * GET /api/secretary/events/:id
   * 
   * Retrieve an event by ID.
   * 
   */
  router.get(
    '/:id',
    requirePermission('secretary.event.read'),
    getEventByIdController
  );

  /**
   * POST /api/secretary/events
   * 
   * Create a new event.
   * 
   */
  router.post(
    '/',
    requirePermission('secretary.event.create'),
    createEventController
  );

  /**
   * PUT /api/secretary/events/:id
   * 
   * Update an existing event.
   * 
   */
  router.put(
    '/:id',
    requirePermission('secretary.event.update'),
    updateEventController
  );

  /**
   * DELETE /api/secretary/events/:id
   * 
   * Delete an event (soft delete).
   * 
   */
  router.delete(
    '/:id',
    requirePermission('secretary.event.delete'),
    deleteEventController
  );

  /**
   * POST /api/secretary/events/:id/submit
   * 
   * Submit an event for approval.
   * Changes status from 'draft' to 'pending_approval'.
   * 
   */
  router.post(
    '/:id/submit',
    requirePermission('secretary.event.update'),
    submitEventController
  );

  /**
   * GET /api/secretary/events/:id/participants
   * 
   * Retrieve participants for an event.
   * 
   */
  router.get(
    '/:id/participants',
    requirePermission('secretary.event.read'),
    getEventParticipantsController
  );

  return router;
}

// Default export for backward compatibility
export default createEventRoutes();
