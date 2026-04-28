/**
 * Dashboard Controller
 * 
 * HTTP request/response handling for department chair dashboard operations.
 * Extracts department ID from authenticated user and returns aggregated statistics.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * GET /api/chair/dashboard
   * 
   * Get aggregated dashboard statistics for the authenticated department chair.
   * 
   * Returns college-wide statistics across all programs (BSCS, BSIT, BSIS) including:
   * - Total counts for students, faculty, schedules, events, research
   * - Pending approvals for students and research
   * - Upcoming events (next 30 days)
   * - Active research projects
   * 
   * @param req - Express request with authenticated user
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with dashboard statistics
   * 
   * @example
   * Response:
   * ```json
   * {
   *   "success": true,
   *   "data": {
   *     "totalStudents": 150,
   *     "totalFaculty": 25,
   *     "totalSchedules": 80,
   *     "totalEvents": 12,
   *     "totalResearch": 30,
   *     "pendingStudentApprovals": 5,
   *     "pendingResearchApprovals": 3,
   *     "upcomingEvents": 4,
   *     "activeResearchProjects": 18
   *   }
   * }
   * ```
   */
  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get dashboard statistics for all programs (college-wide scope)
      // Pass empty string to indicate no department filtering
      const stats = await this.dashboardService.getDashboardStats('');

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
