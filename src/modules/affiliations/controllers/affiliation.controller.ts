/**
 * Affiliation Controller
 * HTTP request/response handling for affiliation operations
 * 
 * Requirements: 7.1, 7.3, 7.4, 30.2
 */

import { Request, Response, NextFunction } from 'express';
import { AffiliationService } from '../services/affiliation.service';
import { ValidationError } from '../../../shared/errors';
import {
  createAffiliationSchema,
  updateAffiliationSchema,
  affiliationIdParamSchema,
  studentIdParamSchema,
  affiliationListQuerySchema,
  endAffiliationSchema,
} from '../schemas/affiliation.schema';

export class AffiliationController {
  constructor(private affiliationService: AffiliationService) {}

  /**
   * GET /api/v1/admin/affiliations
   * List affiliation records with pagination and filters
   * Requirements: 7.1, 30.2
   */
  listAffiliations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = affiliationListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.affiliationService.listAffiliations(filters);

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
   * GET /api/v1/admin/students/:studentId/affiliations
   * Get affiliation records by student ID
   * Requirements: 7.3, 30.2
   */
  getAffiliationsByStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate student ID parameter
      const validationResult = studentIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid student ID', validationResult.error.errors);
      }

      const { studentId } = validationResult.data;

      const records = await this.affiliationService.getAffiliationsByStudent(studentId);

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/students/:studentId/affiliations
   * Create a new affiliation record
   * Requirements: 7.1, 7.2, 30.2
   */
  createAffiliation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate student ID parameter
      const paramValidation = studentIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid student ID', paramValidation.error.errors);
      }

      const { studentId } = paramValidation.data;

      // Validate request body
      const bodyValidation = createAffiliationSchema.safeParse({
        ...req.body,
        student_id: studentId, // Override with param value
      });
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const data = bodyValidation.data;

      const record = await this.affiliationService.createAffiliation(data);

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/affiliations/:id
   * Get affiliation record by ID
   * Requirements: 7.1, 30.2
   */
  getAffiliation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = affiliationIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid affiliation ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const record = await this.affiliationService.getAffiliation(id);

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/affiliations/:id
   * Update affiliation record by ID
   * Requirements: 7.1, 30.2
   */
  updateAffiliation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = affiliationIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid affiliation ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateAffiliationSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const record = await this.affiliationService.updateAffiliation(id, data);

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/affiliations/:id
   * Delete affiliation record by ID
   * Requirements: 7.1, 30.2
   */
  deleteAffiliation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = affiliationIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid affiliation ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.affiliationService.deleteAffiliation(id);

      res.json({
        success: true,
        data: {
          message: 'Affiliation record deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/affiliations/:id/end
   * End an affiliation record
   * Requirements: 7.4, 30.2
   */
  endAffiliation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = affiliationIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid affiliation ID', paramValidation.error.errors);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = endAffiliationSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { end_date } = bodyValidation.data;

      const record = await this.affiliationService.endAffiliation(id, end_date);

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };
}
