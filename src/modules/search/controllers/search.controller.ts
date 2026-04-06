/**
 * Search Controller
 * HTTP request/response handling for search operations
 * 
 * Requirements: 18.6, 30.2
 */

import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service';
import { ValidationError } from '../../../shared/errors';
import { globalSearchQuerySchema, entitySearchQuerySchema } from '../schemas/search.schema';

export class SearchController {
  constructor(private searchService: SearchService) {}

  /**
   * GET /api/v1/admin/search?q=query&type=students
   * Global search across all entities or specific entity type
   * Returns results within 500ms
   * Requirements: 18.6, 30.2
   */
  globalSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = globalSearchQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const { q, type } = validationResult.data;

      const result = await this.searchService.globalSearch(q, type);

      res.json({
        success: true,
        data: result,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/search/students?q=query
   * Search students by name or student_id
   * Returns results within 500ms
   * Requirements: 18.6, 30.2
   */
  searchStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = entitySearchQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const { q } = validationResult.data;

      const result = await this.searchService.searchStudents(q);

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
   * GET /api/v1/admin/search/faculty?q=query
   * Search faculty by name or faculty_id
   * Returns results within 500ms
   * Requirements: 18.6, 30.2
   */
  searchFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = entitySearchQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const { q } = validationResult.data;

      const result = await this.searchService.searchFaculty(q);

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
   * GET /api/v1/admin/search/events?q=query
   * Search events by name or type
   * Returns results within 500ms
   * Requirements: 18.6, 30.2
   */
  searchEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = entitySearchQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const { q } = validationResult.data;

      const result = await this.searchService.searchEvents(q);

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
   * GET /api/v1/admin/search/research?q=query
   * Search research by title or author
   * Returns results within 500ms
   * Requirements: 18.6, 30.2
   */
  searchResearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = entitySearchQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const { q } = validationResult.data;

      const result = await this.searchService.searchResearch(q);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };
}
