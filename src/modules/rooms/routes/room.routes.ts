/**
 * Room Routes
 * Route definitions for room endpoints
 */

import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createRoomRoutes(roomController: RoomController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/rooms/deleted
   * Get soft-deleted rooms (admin only)
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * 
   * Permission: rooms.delete
   * Accessible by: Admin
   */
  router.get('/deleted', requirePermission('rooms.delete'), roomController.getDeletedRooms);

  /**
   * GET /api/v1/admin/rooms
   * List rooms with pagination, search, and filters
   * 
   * Permission: rooms.read
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.get('/', requirePermission('rooms.read'), roomController.listRooms);

  /**
   * GET /api/v1/admin/rooms/:id
   * Get room by ID
   * 
   * Permission: rooms.read
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.get('/:id', requirePermission('rooms.read'), roomController.getRoom);

  /**
   * POST /api/v1/admin/rooms
   * Create a new room
   * 
   * Permission: rooms.create
   * Accessible by: Admin, Department Chair
   */
  router.post('/', requirePermission('rooms.create'), roomController.createRoom);

  /**
   * PUT /api/v1/admin/rooms/:id
   * Update room by ID
   * 
   * Permission: rooms.update
   * Accessible by: Admin, Department Chair
   */
  router.put('/:id', requirePermission('rooms.update'), roomController.updateRoom);

  /**
   * PATCH /api/v1/admin/rooms/:id/restore
   * Restore soft-deleted room
   * 
   * Permission: rooms.delete
   * Accessible by: Admin
   */
  router.patch('/:id/restore', requirePermission('rooms.delete'), roomController.restoreRoom);

  /**
   * DELETE /api/v1/admin/rooms/:id/permanent
   * Permanently delete room (hard delete)
   * 
   * Permission: rooms.delete
   * Accessible by: Admin
   */
  router.delete('/:id/permanent', requirePermission('rooms.delete'), roomController.permanentDeleteRoom);

  /**
   * DELETE /api/v1/admin/rooms/:id
   * Soft delete room by ID
   * 
   * Permission: rooms.delete
   * Accessible by: Admin
   */
  router.delete('/:id', requirePermission('rooms.delete'), roomController.deleteRoom);

  return router;
}
