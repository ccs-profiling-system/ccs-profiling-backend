/**
 * Analytics Controller
 * HTTP request/response handling for analytics insights
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * GET /api/v1/admin/analytics/gpa
   * Get GPA distribution analytics
   * Returns insights within 2000ms
   */
  getGPADistribution = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const distribution = await this.analyticsService.getGPADistribution();

      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/analytics/skills
   * Get skill distribution analytics
   */
  getSkillDistribution = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const distribution = await this.analyticsService.getSkillDistribution();

      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/analytics/violations
   * Get violation trends analytics
   */
  getViolationTrends = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const trends = await this.analyticsService.getViolationTrends();

      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/analytics/research
   * Get research output metrics
   */
  getResearchMetrics = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await this.analyticsService.getResearchMetrics();

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/analytics/enrollments
   * Get enrollment trends analytics
   */
  getEnrollmentTrends = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const trends = await this.analyticsService.getEnrollmentTrends();

      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  };
}
