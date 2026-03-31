/**
 * Instruction Routes
 * Route definitions for instruction endpoints
 * 
 * Requirements: 14.1, 14.3, 14.4, 30.2
 */

import { Router } from 'express';
import { InstructionController } from '../controllers/instruction.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createInstructionRoutes(instructionController: InstructionController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/instructions
   * List instructions with pagination, search, and filters
   */
  router.get('/', instructionController.listInstructions);

  /**
   * GET /api/v1/admin/instructions/:id
   * Get instruction by ID
   */
  router.get('/:id', instructionController.getInstruction);

  /**
   * POST /api/v1/admin/instructions
   * Create a new instruction
   */
  router.post('/', instructionController.createInstruction);

  /**
   * PUT /api/v1/admin/instructions/:id
   * Update instruction by ID
   */
  router.put('/:id', instructionController.updateInstruction);

  /**
   * DELETE /api/v1/admin/instructions/:id
   * Soft delete instruction by ID
   */
  router.delete('/:id', instructionController.deleteInstruction);

  return router;
}
