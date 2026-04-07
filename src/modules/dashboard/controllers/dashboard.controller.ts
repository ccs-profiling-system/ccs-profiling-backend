/**
 * Dashboard Controller
 * HTTP request/response handling for dashboard metrics
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * GET /api/v1/admin/dashboard
   * Get complete dashboard metrics
   * Returns metrics within 1000ms
   */
  getDashboardMetrics = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await this.dashboardService.getDashboardMetrics();

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/dashboard/students
   * Get student statistics
   */
  getStudentStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getStudentStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/dashboard/faculty
   * Get faculty statistics
   */
  getFacultyStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getFacultyStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/dashboard/enrollments
   * Get enrollment statistics
   */
  getEnrollmentStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getEnrollmentStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/dashboard/events
   * Get event statistics
   */
  getEventStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getEventStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
