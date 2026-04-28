/**
 * Student Portal - Dashboard Controller
 * HTTP request/response handling for student dashboard operations
 * 
 * Handles dashboard summary retrieval with student-scoped validation.
 * Ensures students can only access their own dashboard data.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { extractStudentId } from '../utils/studentScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * GET /api/student/dashboard
   * Get dashboard summary for authenticated student
   * 
   * Extracts student_id from JWT token and returns aggregated dashboard data
   * including current courses, GPA, unread notifications, and upcoming events.
   * 
   */
  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      // This will throw StudentAccessError (403) if user is not student
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Retrieve dashboard summary
      const dashboardSummary = await this.dashboardService.getDashboardSummary(studentId);

      res.json({
        success: true,
        data: dashboardSummary,
      });
    } catch (error) {
      next(error);
    }
  };
}
