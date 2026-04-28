/**
 * Curriculum Controller for Chair Portal
 * 
 * HTTP request/response handling for curriculum and subjects operations.
 * Provides read-only access to curriculum data for department chairs.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { CurriculumService } from '../services/curriculum.service';
import { ValidationError } from '../../../shared/errors';
import { z } from 'zod';

/**
 * Query schema for curriculum list
 */
const curriculumListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  program: z.string().optional(),
  year: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
});

/**
 * Query schema for subjects list
 */
const subjectsListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  curriculum_id: z.string().uuid().optional(),
  year_level: z.coerce.number().int().min(1).max(4).optional(),
  semester: z.coerce.number().int().min(1).max(2).optional(),
  type: z.enum(['core', 'elective', 'major', 'minor', 'general_education']).optional(),
});

/**
 * ID parameter schema
 */
const idParamSchema = z.object({
  id: z.string().uuid(),
});

export class CurriculumController {
  constructor(private curriculumService: CurriculumService) {}

  /**
   * GET /api/v1/chair/curriculum
   * 
   * Get curriculum list with pagination and filters
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  getCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = curriculumListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const filters = validationResult.data;
      const result = await this.curriculumService.getCurriculum(filters);

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
   * GET /api/v1/chair/curriculum/:id
   * 
   * Get curriculum by ID
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  getCurriculumById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = idParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid curriculum ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;
      const curriculum = await this.curriculumService.getCurriculumById(id);

      res.json({
        success: true,
        data: curriculum,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/chair/subjects
   * 
   * Get subjects list with pagination and filters
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  getSubjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = subjectsListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const filters = validationResult.data;
      const result = await this.curriculumService.getSubjects(filters);

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
   * GET /api/v1/chair/subjects/:id
   * 
   * Get subject by ID
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  getSubjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = idParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid subject ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;
      const subject = await this.curriculumService.getSubjectById(id);

      res.json({
        success: true,
        data: subject,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/chair/curriculum/stats
   * 
   * Get curriculum statistics
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.curriculumService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/chair/curriculum/export/pdf
   * 
   * Export curriculum to PDF
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  exportToPDF = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = curriculumListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const filters = validationResult.data;
      const pdfStream = await this.curriculumService.exportToPDF(filters);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="curriculum-${Date.now()}.pdf"`);

      // Pipe PDF stream to response
      pdfStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/chair/curriculum/export/excel
   * 
   * Export curriculum to Excel
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  exportToExcel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = curriculumListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const filters = validationResult.data;
      const excelStream = await this.curriculumService.exportToExcel(filters);

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="curriculum-${Date.now()}.xlsx"`);

      // Pipe Excel stream to response
      excelStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };
}
