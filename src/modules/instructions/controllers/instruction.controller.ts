/**
 * Instruction Controller
 * HTTP request/response handling for instruction operations
 * 
 * Requirements: 14.1, 14.3, 14.4, 30.2
 */

import { Request, Response, NextFunction } from 'express';
import { InstructionService } from '../services/instruction.service';
import { ValidationError } from '../../../shared/errors';
import {
  createInstructionSchema,
  updateInstructionSchema,
  instructionIdParamSchema,
  instructionListQuerySchema,
} from '../schemas/instruction.schema';

export class InstructionController {
  constructor(private instructionService: InstructionService) {}

  /**
   * GET /api/v1/admin/instructions
   * List instructions with pagination, search, and filters
   * Requirements: 14.1, 30.2
   */
  listInstructions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = instructionListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.instructionService.listInstructions(filters);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/instructions/:id
   * Get instruction by ID
   * Requirements: 14.1, 30.2
   */
  getInstruction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = instructionIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid instruction ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const instruction = await this.instructionService.getInstruction(id);

      res.json({
        success: true,
        data: instruction,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/instructions
   * Create a new instruction
   * Requirements: 14.1, 14.3, 30.2
   */
  createInstruction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = createInstructionSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const data = validationResult.data;

      const instruction = await this.instructionService.createInstruction(data);

      res.status(201).json({
        success: true,
        data: instruction,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/instructions/:id
   * Update instruction by ID
   * Requirements: 14.1, 14.3, 30.2
   */
  updateInstruction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = instructionIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid instruction ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateInstructionSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const instruction = await this.instructionService.updateInstruction(id, data);

      res.json({
        success: true,
        data: instruction,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/instructions/:id
   * Soft delete instruction by ID
   * Requirements: 14.1, 14.4, 30.2
   */
  deleteInstruction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = instructionIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid instruction ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.instructionService.deleteInstruction(id);

      res.json({
        success: true,
        data: {
          message: 'Instruction deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/instructions/deleted
   * Get soft-deleted instructions (admin only)
   * Requirements: 28.5, 30.2
   */
  getDeletedInstructions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = instructionListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.instructionService.getDeletedInstructions(filters);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/instructions/:id/restore
   * Restore soft-deleted instruction
   * Requirements: 28.7, 30.2
   */
  restoreInstruction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = instructionIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid instruction ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const instruction = await this.instructionService.restoreInstruction(id);

      res.json({
        success: true,
        data: instruction,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/instructions/:id/permanent
   * Permanently delete instruction (hard delete)
   * Requirements: 28.6, 30.2
   */
  permanentDeleteInstruction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = instructionIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid instruction ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.instructionService.permanentDeleteInstruction(id);

      res.json({
        success: true,
        data: {
          message: 'Instruction permanently deleted',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
