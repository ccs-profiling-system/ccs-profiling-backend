/**
 * Skill Controller
 * HTTP request/response handling for skill operations
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { SkillService } from '../services/skill.service';
import { ValidationError } from '../../../shared/errors';
import {
  createSkillSchema,
  updateSkillSchema,
  skillIdParamSchema,
  studentIdParamSchema,
  skillListQuerySchema,
} from '../schemas/skill.schema';

export class SkillController {
  constructor(private skillService: SkillService) {}

  /**
   * GET /api/v1/admin/skills
   * List skill records with pagination and filters
   */
  listSkills = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = skillListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.skillService.listSkills(filters);

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
   * GET /api/v1/admin/students/:studentId/skills
   * Get skill records by student ID
   */
  getSkillsByStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate student ID parameter
      const validationResult = studentIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid student ID', validationResult.error.errors);
      }

      const { studentId } = validationResult.data;

      const records = await this.skillService.getSkillsByStudent(studentId);

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/students/:studentId/skills
   * Create a new skill record
   */
  createSkill = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate student ID parameter
      const paramValidation = studentIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid student ID', paramValidation.error.errors);
      }

      const { studentId } = paramValidation.data;

      // Validate request body
      const bodyValidation = createSkillSchema.safeParse({
        ...req.body,
        student_id: studentId, // Override with param value
      });
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const data = bodyValidation.data;

      const record = await this.skillService.createSkill(data);

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/skills/:id
   * Update skill record by ID
   */
  updateSkill = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = skillIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid skill ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateSkillSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const record = await this.skillService.updateSkill(id, data);

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/skills/:id
   * Delete skill record by ID
   */
  deleteSkill = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = skillIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid skill ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.skillService.deleteSkill(id);

      res.json({
        success: true,
        data: {
          message: 'Skill record deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
