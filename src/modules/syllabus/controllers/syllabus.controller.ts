import { Request, Response, NextFunction } from 'express';
import { SyllabusService } from '../services/syllabus.service';
import { createSyllabusSchema, updateSyllabusSchema } from '../schemas/syllabus.schema';

/**
 * Syllabus Controller
 * Handles HTTP requests for syllabus endpoints
 */
export class SyllabusController {
  constructor(private syllabusService: SyllabusService) {}

  /**
   * Get syllabus by subject ID
   * GET /api/v1/admin/subjects/:subjectId/syllabus
   */
  getSyllabus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subjectId } = req.params;
      const syllabus = await this.syllabusService.getSyllabusBySubjectId(subjectId);

      res.status(200).json({
        success: true,
        data: syllabus,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create syllabus for a subject
   * POST /api/v1/admin/subjects/:subjectId/syllabus
   */
  createSyllabus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subjectId } = req.params;
      const data = createSyllabusSchema.parse(req.body);
      const file = req.file;

      const syllabus = await this.syllabusService.createSyllabus(
        { ...data, subjectId },
        file
      );

      res.status(201).json({
        success: true,
        data: syllabus,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update syllabus for a subject
   * PUT /api/v1/admin/subjects/:subjectId/syllabus
   */
  updateSyllabus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subjectId } = req.params;
      const data = updateSyllabusSchema.parse(req.body);
      const file = req.file;

      const syllabus = await this.syllabusService.updateSyllabus(subjectId, data, file);

      res.status(200).json({
        success: true,
        data: syllabus,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete syllabus for a subject
   * DELETE /api/v1/admin/subjects/:subjectId/syllabus
   */
  deleteSyllabus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subjectId } = req.params;
      const result = await this.syllabusService.deleteSyllabus(subjectId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}
