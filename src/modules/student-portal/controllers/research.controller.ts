/**
 * Student Portal - Research Controller
 * HTTP request handling layer for research opportunity endpoints
 * 
 * Handles research opportunity browsing, application submission, and status tracking.
 * Extracts student_id from JWT token for data scoping.
 * 
 * Requirements: 13.1, 14.1, 15.1, 16.1
 */

import { Request, Response, NextFunction } from 'express';
import { ResearchService } from '../services/research.service';
import { paginationSchema } from '../schemas/common.schemas';
import { extractStudentId } from '../utils/studentScope';

export class ResearchController {
  constructor(private researchService: ResearchService) {}

  /**
   * List available research opportunities
   * 
   * GET /api/student/research/opportunities
   * 
   * Query params:
   * - page: number (default 1)
   * - limit: number (default 10, max 50)
   * 
   * Requirements: 13.1
   */
  listOpportunities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate pagination parameters
      const paginationParams = paginationSchema.parse({
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      });

      // Enforce max limit of 50
      if (paginationParams.limit > 50) {
        paginationParams.limit = 50;
      }

      const result = await this.researchService.listOpportunities(paginationParams);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get detailed information about a research opportunity
   * 
   * GET /api/student/research/opportunities/:id
   * 
   * Requirements: 14.1
   */
  getOpportunityDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const opportunity = await this.researchService.getOpportunityById(id);

      res.status(200).json(opportunity);
    } catch (error) {
      next(error);
    }
  };

  /**
   * REMOVED: applyToOpportunity
   * 
   * Reason: Students are viewers in the profiling system.
   * Research applications are managed through Faculty → Secretary → Chair → Admin workflow.
   */

  /**
   * Get application status
   * 
   * GET /api/student/research/applications/:applicationId
   * 
   * Requirements: 16.1
   */
  getApplicationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const studentId = extractStudentId(req.user as any);

      const application = await this.researchService.getApplicationStatus(
        applicationId,
        studentId
      );

      res.status(200).json(application);
    } catch (error) {
      next(error);
    }
  };
}
