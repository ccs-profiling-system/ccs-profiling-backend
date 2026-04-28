/**
 * Instruction Routes
 * Route definitions for instruction endpoints
 * 
 */

import { Router } from 'express';
import { InstructionController } from '../controllers/instruction.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createInstructionRoutes(instructionController: InstructionController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/instructions/deleted
   * Get soft-deleted instructions (admin only)
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * 
   * Permission: instruction.delete
   * Accessible by: Admin
   */
  router.get('/deleted', requirePermission('instruction.delete'), instructionController.getDeletedInstructions);

  /**
   * GET /api/v1/admin/instructions
   * List instructions with pagination, search, and filters
   * 
   * Permission: instruction.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/', requirePermission('instruction.read'), instructionController.listInstructions);

  /**
   * GET /api/v1/admin/instructions/:id
   * Get instruction by ID
   * 
   * Permission: instruction.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:id', requirePermission('instruction.read'), instructionController.getInstruction);

  /**
   * POST /api/v1/admin/instructions
   * Create a new instruction
   * 
   * Permission: instruction.create
   * Accessible by: Admin, Faculty (with ownership)
   */
  router.post('/', requirePermission('instruction.create'), instructionController.createInstruction);

  /**
   * PUT /api/v1/admin/instructions/:id
   * Update instruction by ID
   * 
   * Permission: instruction.update
   * Accessible by: Admin, Faculty (with ownership check)
   */
  router.put('/:id', requirePermission('instruction.update'), instructionController.updateInstruction);

  /**
   * PATCH /api/v1/admin/instructions/:id/restore
   * Restore soft-deleted instruction
   * 
   * Permission: instruction.delete
   * Accessible by: Admin
   */
  router.patch('/:id/restore', requirePermission('instruction.delete'), instructionController.restoreInstruction);

  /**
   * DELETE /api/v1/admin/instructions/:id/permanent
   * Permanently delete instruction (hard delete)
   * 
   * Permission: instruction.delete
   * Accessible by: Admin
   */
  router.delete('/:id/permanent', requirePermission('instruction.delete'), instructionController.permanentDeleteInstruction);

  /**
   * DELETE /api/v1/admin/instructions/:id
   * Soft delete instruction by ID
   * 
   * Permission: instruction.delete
   * Accessible by: Admin
   */
  router.delete('/:id', requirePermission('instruction.delete'), instructionController.deleteInstruction);

  return router;
}
