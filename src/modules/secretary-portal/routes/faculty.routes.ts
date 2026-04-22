/**
 * Faculty Routes
 * 
 * Defines routes for secretary portal faculty operations.
 * All routes require authentication and appropriate permissions.
 * 
 * Requirements: 4.7-4.10
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
   * Requirements: 4.1, 4.7
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
   * Requirements: 4.2, 4.7
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
   * Requirements: 4.3, 4.8
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
   * Requirements: 4.4, 4.9
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
   * Requirements: 4.5, 4.10
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
   * Requirements: 4.6, 4.7
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
