/**
 * Faculty Routes
 * 
 * Defines routes for secretary portal faculty operations.
 * All routes require authentication and appropriate permissions.
 * 
 */

import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import {
  getAllFacultyController,
  getFacultyByIdController,
  createFacultyController,
  updateFacultyController,
  deleteFacultyController,
  getTeachingLoadController,
} from '../controllers/faculty.controller';

/**
 * Create faculty router
 * 
 * Endpoints:
 * - GET /api/secretary/faculty - Get all faculty with pagination and filtering
 * - GET /api/secretary/faculty/:id - Get faculty by ID
 * - POST /api/secretary/faculty - Create a new faculty member
 * - PUT /api/secretary/faculty/:id - Update an existing faculty member
 * - DELETE /api/secretary/faculty/:id - Delete a faculty member (soft delete)
 * - GET /api/secretary/faculty/:id/teaching-load - Get teaching load for a faculty member
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Appropriate permission for the operation
 */
export function createFacultyRoutes(): Router {
  const router = Router();

  /**
   * GET /api/secretary/faculty
   * 
   * Retrieve all faculty with pagination and filtering.
   * 
   */
  router.get(
    '/',
    requirePermission('secretary.faculty.read'),
    getAllFacultyController
  );

  /**
   * GET /api/secretary/faculty/:id
   * 
   * Retrieve a faculty member by ID.
   * 
   */
  router.get(
    '/:id',
    requirePermission('secretary.faculty.read'),
    getFacultyByIdController
  );

  /**
   * POST /api/secretary/faculty
   * 
   * Create a new faculty member.
   * 
   */
  router.post(
    '/',
    requirePermission('secretary.faculty.create'),
    createFacultyController
  );

  /**
   * PUT /api/secretary/faculty/:id
   * 
   * Update an existing faculty member.
   * 
   */
  router.put(
    '/:id',
    requirePermission('secretary.faculty.update'),
    updateFacultyController
  );

  /**
   * DELETE /api/secretary/faculty/:id
   * 
   * Delete a faculty member (soft delete).
   * 
   */
  router.delete(
    '/:id',
    requirePermission('secretary.faculty.delete'),
    deleteFacultyController
  );

  /**
   * GET /api/secretary/faculty/:id/teaching-load
   * 
   * Retrieve teaching load for a faculty member.
   * 
   */
  router.get(
    '/:id/teaching-load',
    requirePermission('secretary.faculty.read'),
    getTeachingLoadController
  );

  return router;
}

// Default export for backward compatibility
export default createFacultyRoutes();
