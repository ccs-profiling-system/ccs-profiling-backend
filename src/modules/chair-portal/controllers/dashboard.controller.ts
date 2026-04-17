/**
 * Dashboard Controller
 * 
 * HTTP request/response handling for department chair dashboard operations.
 * Extracts department ID from authenticated user and returns aggregated statistics.
 * 
 * Requirements: 2.1, 2.2
 */

import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { extractDepartmentFromRequest } from '../utils/departmentScope';

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * GET /api/chair/dashboard
   * 
   * Get aggregated dashboard statistics for the authenticated department chair.
   * 
   * Extracts department ID from the authenticated user's faculty record and
   * returns department-scoped statistics including:
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
   * @throws NotFoundError if user has no department affiliation
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
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Get dashboard statistics for the department
      const stats = await this.dashboardService.getDashboardStats(departmentInfo.departmentId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
