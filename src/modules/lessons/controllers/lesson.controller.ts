import { Request, Response, NextFunction } from 'express';
import { LessonService } from '../services/lesson.service';
import { createLessonSchema, updateLessonSchema } from '../schemas/lesson.schema';

/**
 * Lesson Controller
 * Handles HTTP requests for lesson endpoints
 */
export class LessonController {
  constructor(private lessonService: LessonService) {}

  /**
   * Get all lessons for a subject
   * GET /api/v1/admin/subjects/:subjectId/lessons
   */
  getLessons = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subjectId } = req.params;
      const lessons = await this.lessonService.getLessonsBySubjectId(subjectId);

      res.status(200).json({
        success: true,
        data: lessons,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get lesson by ID
   * GET /api/v1/admin/lessons/:id
   */
  getLesson = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const lesson = await this.lessonService.getLessonById(id);

      res.status(200).json({
        success: true,
        data: lesson,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create lesson for a subject
   * POST /api/v1/admin/subjects/:subjectId/lessons
   */
  createLesson = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subjectId } = req.params;
      const data = createLessonSchema.parse(req.body);
      const file = req.file;

      const lesson = await this.lessonService.createLesson(
        { ...data, subjectId },
        file
      );

      res.status(201).json({
        success: true,
        data: lesson,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update lesson
   * PUT /api/v1/admin/lessons/:id
   */
  updateLesson = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = updateLessonSchema.parse(req.body);
      const file = req.file;

      const lesson = await this.lessonService.updateLesson(id, data, file);

      res.status(200).json({
        success: true,
        data: lesson,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete lesson
   * DELETE /api/v1/admin/lessons/:id
   */
  deleteLesson = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.lessonService.deleteLesson(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}
