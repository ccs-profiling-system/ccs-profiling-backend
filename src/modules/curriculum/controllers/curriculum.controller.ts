import { Request, Response, NextFunction } from 'express';
import { CurriculumService } from '../services/curriculum.service';
import { 
  createCurriculumSchema, 
  updateCurriculumSchema, 
  listCurriculumQuerySchema 
} from '../schemas/curriculum.schema';
import { AppError } from '../../../shared/utils/appError';

/**
 * Curriculum Controller
 * Handles HTTP requests for curriculum endpoints
 */
export class CurriculumController {
  constructor(private curriculumService: CurriculumService) {}

  /**
   * List all curriculum with pagination and filters
   * GET /api/v1/admin/curriculum
   */
  listCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = listCurriculumQuerySchema.parse(req.query);
      const result = await this.curriculumService.listCurriculum(query);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get curriculum by ID
   * GET /api/v1/admin/curriculum/:id
   */
  getCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const curriculum = await this.curriculumService.getCurriculumById(id);

      res.status(200).json({
        success: true,
        data: curriculum,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create new curriculum
   * POST /api/v1/admin/curriculum
   */
  createCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createCurriculumSchema.parse(req.body);
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
   * Update curriculum by ID
   * PUT /api/v1/admin/curriculum/:id
   */
  updateCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = updateCurriculumSchema.parse(req.body);
      const curriculum = await this.curriculumService.updateCurriculum(id, data);

      res.status(200).json({
        success: true,
        data: curriculum,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete curriculum by ID (soft delete)
   * DELETE /api/v1/admin/curriculum/:id
   */
  deleteCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.curriculumService.deleteCurriculum(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Restore soft-deleted curriculum
   * PATCH /api/v1/admin/curriculum/:id/restore
   */
  restoreCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const curriculum = await this.curriculumService.restoreCurriculum(id);

      res.status(200).json({
        success: true,
        data: curriculum,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Permanently delete curriculum
   * DELETE /api/v1/admin/curriculum/:id/permanent
   */
  permanentDeleteCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.curriculumService.permanentDeleteCurriculum(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get deleted curriculum
   * GET /api/v1/admin/curriculum/deleted
   */
  getDeletedCurriculum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const curriculum = await this.curriculumService.getDeletedCurriculum();

      res.status(200).json({
        success: true,
        data: curriculum,
      });
    } catch (error) {
      next(error);
    }
  };
}
