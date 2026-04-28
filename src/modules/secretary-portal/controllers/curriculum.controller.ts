/**
 * Curriculum Controller for Secretary Portal
 * 
 * HTTP request/response handling for curriculum and subjects operations.
 * Provides full CRUD access to curriculum data for secretaries.
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
  year: z.coerce.number().int().optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

/**
 * Query schema for subjects list
 */
const subjectsListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  curriculum_id: z.string().uuid().optional(),
  yearLevel: z.coerce.number().int().min(1).max(4).optional(),
  semester: z.coerce.number().int().min(1).max(2).optional(),
  type: z.enum(['core', 'elective', 'major', 'minor', 'general_education']).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

/**
 * Create curriculum schema
 */
const createCurriculumSchema = z.object({
  code: z.string().max(50),
  name: z.string().max(255),
  program: z.string().max(100),
  year: z.number().int(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  description: z.string().optional(),
});

/**
 * Update curriculum schema
 */
const updateCurriculumSchema = z.object({
  code: z.string().max(50).optional(),
  name: z.string().max(255).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  description: z.string().optional(),
});

/**
 * Create subject schema
 */
const createSubjectSchema = z.object({
  code: z.string().max(50),
  name: z.string().max(255),
  curriculum_id: z.string().uuid(),
  type: z.enum(['core', 'elective', 'major', 'minor', 'general_education']),
  units: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(2),
  year_level: z.number().int().min(1).max(4),
  lecture_hours: z.number().int().min(0),
  laboratory_hours: z.number().int().min(0),
  description: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
});

/**
 * Update subject schema
 */
const updateSubjectSchema = z.object({
  name: z.string().max(255).optional(),
  units: z.number().int().min(1).max(6).optional(),
  description: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
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
   * GET /api/secretary/curriculum
   */
  getCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = curriculumListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      // TODO: Extract department ID from authenticated user
      const departmentId = 'temp-department-id';

      const filters = validationResult.data;
      const result = await this.curriculumService.getCurriculum(departmentId, filters);

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
   * GET /api/secretary/curriculum/:id
   */
  getCurriculumById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = idParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid curriculum ID', validationResult.error.errors);
      }

      const departmentId = 'temp-department-id';
      const { id } = validationResult.data;
      const curriculum = await this.curriculumService.getCurriculumById(id, departmentId);

      res.json({
        success: true,
        data: curriculum,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/secretary/curriculum
   */
  createCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = createCurriculumSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid input data', validationResult.error.errors);
      }

      const departmentId = 'temp-department-id';
      const data = { ...validationResult.data, department_id: departmentId };
      const curriculum = await this.curriculumService.createCurriculum(data);

      res.status(201).json({
        success: true,
        data: curriculum,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/secretary/curriculum/:id
   */
  updateCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const paramValidation = idParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid curriculum ID', paramValidation.error.errors);
      }

      const bodyValidation = updateCurriculumSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Invalid input data', bodyValidation.error.errors);
      }

      const departmentId = 'temp-department-id';
      const { id } = paramValidation.data;
      const data = bodyValidation.data;
      const curriculum = await this.curriculumService.updateCurriculum(id, departmentId, data);

      res.json({
        success: true,
        data: curriculum,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/secretary/curriculum/:id
   */
  deleteCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = idParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid curriculum ID', validationResult.error.errors);
      }

      const departmentId = 'temp-department-id';
      const { id } = validationResult.data;
      await this.curriculumService.deleteCurriculum(id, departmentId);

      res.json({
        success: true,
        message: 'Curriculum deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/secretary/subjects
   */
  getSubjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = subjectsListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const departmentId = 'temp-department-id';
      const filters = validationResult.data;
      const result = await this.curriculumService.getSubjects(departmentId, filters);

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
   * GET /api/secretary/subjects/:id
   */
  getSubjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = idParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid subject ID', validationResult.error.errors);
      }

      const departmentId = 'temp-department-id';
      const { id } = validationResult.data;
      const subject = await this.curriculumService.getSubjectById(id, departmentId);

      res.json({
        success: true,
        data: subject,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/secretary/subjects
   */
  createSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = createSubjectSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid input data', validationResult.error.errors);
      }

      const departmentId = 'temp-department-id';
      const data = validationResult.data;
      const subject = await this.curriculumService.createSubject(data, departmentId);

      res.status(201).json({
        success: true,
        data: subject,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/secretary/subjects/:id
   */
  updateSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const paramValidation = idParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid subject ID', paramValidation.error.errors);
      }

      const bodyValidation = updateSubjectSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Invalid input data', bodyValidation.error.errors);
      }

      const departmentId = 'temp-department-id';
      const { id } = paramValidation.data;
      const data = bodyValidation.data;
      const subject = await this.curriculumService.updateSubject(id, departmentId, data);

      res.json({
        success: true,
        data: subject,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/secretary/subjects/:id
   */
  deleteSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = idParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid subject ID', validationResult.error.errors);
      }

      const departmentId = 'temp-department-id';
      const { id } = validationResult.data;
      await this.curriculumService.deleteSubject(id, departmentId);

      res.json({
        success: true,
        message: 'Subject deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/secretary/curriculum/stats
   */
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = 'temp-department-id';
      const stats = await this.curriculumService.getStats(departmentId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/secretary/curriculum/export/pdf
   */
  exportToPDF = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = curriculumListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const departmentId = 'temp-department-id';
      const filters = validationResult.data;
      const pdfStream = await this.curriculumService.exportToPDF(departmentId, filters);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="curriculum-${Date.now()}.pdf"`);

      pdfStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/secretary/curriculum/export/excel
   */
  exportToExcel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = curriculumListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const departmentId = 'temp-department-id';
      const filters = validationResult.data;
      const excelStream = await this.curriculumService.exportToExcel(departmentId, filters);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="curriculum-${Date.now()}.xlsx"`);

      excelStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };
}
