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

  /**
   * GET /api/v1/admin/dashboard/recent-activity
   * Get recent activity
   */
  getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await this.dashboardService.getRecentActivity(limit);

      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/dashboard/priority-alerts
   * Get priority alerts
   */
  getPriorityAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const alerts = await this.dashboardService.getPriorityAlerts(limit);

      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/dashboard/upcoming-events
   * Get upcoming events
   */
  getUpcomingEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const events = await this.dashboardService.getUpcomingEvents(limit);

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  };
}
