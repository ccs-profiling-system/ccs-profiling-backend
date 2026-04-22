/**
 * Event Routes
 * 
 * Defines routes for secretary portal event operations.
 * All routes require authentication and appropriate permissions.
 * 
 * Requirements: 7.8-7.11
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
   * Requirements: 7.1, 7.8
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
   * Requirements: 7.2, 7.8
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
   * Requirements: 7.3, 7.9
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
   * Requirements: 7.4, 7.10
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
   * Requirements: 7.5, 7.11
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
   * Requirements: 7.6, 7.10
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
   * Requirements: 7.7, 7.8
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
