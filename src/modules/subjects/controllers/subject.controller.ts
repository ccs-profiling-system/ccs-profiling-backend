import { Request, Response, NextFunction } from 'express';
import { SubjectService } from '../services/subject.service';
import { 
  createSubjectSchema, 
  updateSubjectSchema, 
  listSubjectsQuerySchema 
} from '../schemas/subject.schema';
import { serializeSubject, serializeSubjects } from '../serializers/subject.serializer';

/**
 * Subject Controller
 * Handles HTTP requests for subject endpoints
 */
export class SubjectController {
  constructor(private subjectService: SubjectService) {}

  /**
   * List all subjects with pagination and filters
   * GET /api/v1/admin/subjects
   */
  listSubjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = listSubjectsQuerySchema.parse(req.query);
      const result = await this.subjectService.listSubjects(query);

      res.status(200).json({
        success: true,
        data: serializeSubjects(result.data),
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get subject by ID with syllabus and lessons
   * GET /api/v1/admin/subjects/:id
   */
  getSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const subject = await this.subjectService.getSubjectById(id);

      res.status(200).json({
        success: true,
        data: serializeSubject(subject),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create new subject
   * POST /api/v1/admin/subjects
   */
  createSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createSubjectSchema.parse(req.body);
      const subject = await this.subjectService.createSubject(data);

      res.status(201).json({
        success: true,
        data: serializeSubject(subject),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update subject by ID
   * PUT /api/v1/admin/subjects/:id
   */
  updateSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = updateSubjectSchema.parse(req.body);
      const subject = await this.subjectService.updateSubject(id, data);

      res.status(200).json({
        success: true,
        data: serializeSubject(subject),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete subject by ID (soft delete)
   * DELETE /api/v1/admin/subjects/:id
   */
  deleteSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.subjectService.deleteSubject(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Restore soft-deleted subject
   * PATCH /api/v1/admin/subjects/:id/restore
   */
  restoreSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const subject = await this.subjectService.restoreSubject(id);

      res.status(200).json({
        success: true,
        data: serializeSubject(subject),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Permanently delete subject
   * DELETE /api/v1/admin/subjects/:id/permanent
   */
  permanentDeleteSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.subjectService.permanentDeleteSubject(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get deleted subjects
   * GET /api/v1/admin/subjects/deleted
   */
  getDeletedSubjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subjects = await this.subjectService.getDeletedSubjects();

      res.status(200).json({
        success: true,
        data: serializeSubjects(subjects),
      });
    } catch (error) {
      next(error);
    }
  };
}
