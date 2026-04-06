/**
 * Research Controller
 * HTTP request/response handling for research operations
 * 
 * Requirements: 12.1, 12.6, 12.7, 30.2
 */

import { Request, Response, NextFunction } from 'express';
import { ResearchService } from '../services/research.service';
import { ValidationError } from '../../../shared/errors';
import {
  createResearchSchema,
  updateResearchSchema,
  researchIdParamSchema,
  studentIdParamSchema,
  facultyIdParamSchema,
  researchListQuerySchema,
  addAuthorSchema,
  addAdviserSchema,
} from '../schemas/research.schema';

export class ResearchController {
  constructor(private researchService: ResearchService) {}

  /**
   * GET /api/v1/admin/research
   * List research with pagination and filters
   * Requirements: 12.1, 30.2
   */
  listResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = researchListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.researchService.listResearch(filters);

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
   * GET /api/v1/admin/research/:id
   * Get research by ID
   * Requirements: 12.1, 30.2
   */
  getResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = researchIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid research ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const research = await this.researchService.getResearch(id);

      res.json({
        success: true,
        data: research,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/research
   * Create a new research
   * Requirements: 12.1, 30.2
   */
  createResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = createResearchSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const data = validationResult.data;

      const research = await this.researchService.createResearch(data);

      res.status(201).json({
        success: true,
        data: research,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/research/:id
   * Update research by ID
   * Requirements: 12.1, 30.2
   */
  updateResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = researchIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid research ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateResearchSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const research = await this.researchService.updateResearch(id, data);

      res.json({
        success: true,
        data: research,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/research/:id
   * Delete research by ID (soft delete)
   * Requirements: 12.1, 30.2
   */
  deleteResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = researchIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid research ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.researchService.deleteResearch(id);

      res.json({
        success: true,
        data: {
          message: 'Research deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/research/:id/authors
   * Add author to research
   * Requirements: 12.6, 30.2
   */
  addAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = researchIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid research ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = addAuthorSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      await this.researchService.addAuthor(id, data);

      res.status(201).json({
        success: true,
        data: {
          message: 'Author added successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/research/:id/authors/:studentId
   * Remove author from research
   * Requirements: 12.6, 30.2
   */
  removeAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate research ID parameter
      const researchIdValidation = researchIdParamSchema.safeParse({ id: req.params.id });
      if (!researchIdValidation.success) {
        throw new ValidationError('Invalid research ID', researchIdValidation.error.errors);
      }

      // Validate student ID parameter
      const studentIdValidation = studentIdParamSchema.safeParse(req.params);
      if (!studentIdValidation.success) {
        throw new ValidationError('Invalid student ID', studentIdValidation.error.errors);
      }

      const { id } = researchIdValidation.data;
      const { studentId } = studentIdValidation.data;

      await this.researchService.removeAuthor(id, studentId);

      res.json({
        success: true,
        data: {
          message: 'Author removed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/research/:id/advisers
   * Add adviser to research
   * Requirements: 12.7, 30.2
   */
  addAdviser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = researchIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid research ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = addAdviserSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      await this.researchService.addAdviser(id, data);

      res.status(201).json({
        success: true,
        data: {
          message: 'Adviser added successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/research/:id/advisers/:facultyId
   * Remove adviser from research
   * Requirements: 12.7, 30.2
   */
  removeAdviser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate research ID parameter
      const researchIdValidation = researchIdParamSchema.safeParse({ id: req.params.id });
      if (!researchIdValidation.success) {
        throw new ValidationError('Invalid research ID', researchIdValidation.error.errors);
      }

      // Validate faculty ID parameter
      const facultyIdValidation = facultyIdParamSchema.safeParse(req.params);
      if (!facultyIdValidation.success) {
        throw new ValidationError('Invalid faculty ID', facultyIdValidation.error.errors);
      }

      const { id } = researchIdValidation.data;
      const { facultyId } = facultyIdValidation.data;

      await this.researchService.removeAdviser(id, facultyId);

      res.json({
        success: true,
        data: {
          message: 'Adviser removed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/research/deleted
   * Get soft-deleted research (admin only)
   * Requirements: 28.5, 30.2
   */
  getDeletedResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = researchListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.researchService.getDeletedResearch(filters);

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
   * PATCH /api/v1/admin/research/:id/restore
   * Restore soft-deleted research
   * Requirements: 28.7, 30.2
   */
  restoreResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = researchIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid research ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const research = await this.researchService.restoreResearch(id);

      res.json({
        success: true,
        data: research,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/research/:id/permanent
   * Permanently delete research (hard delete)
   * Requirements: 28.6, 30.2
   */
  permanentDeleteResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = researchIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid research ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.researchService.permanentDeleteResearch(id);

      res.json({
        success: true,
        data: {
          message: 'Research permanently deleted',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
