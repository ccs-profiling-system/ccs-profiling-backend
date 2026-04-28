/**
 * Report Routes for Department Chair Portal
 * 
 * Defines HTTP routes for report generation and analytics operations with RBAC protection.
 * All routes require JWT authentication and specific chair.report.* permissions.
 * 
 * Routes:
 * - GET /api/chair/reports/students/stats - Get student statistics
 * - GET /api/chair/reports/faculty/stats - Get faculty statistics
 * - GET /api/chair/reports/export - Export report in PDF or Excel format
 * 
 */

import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create report routes with dependency injection
 * 
 * @param reportController - Report controller instance
 * @returns Express router with configured routes
 */
export function createReportRoutes(reportController: ReportController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * GET /api/chair/reports/students/stats
   * 
   * Get student statistics for the authenticated department chair's department
   * 
   * Query Parameters:
   * - year_level: Filter by year level (optional, 1-5)
   * - status: Filter by student status (optional)
   * 
   * Permissions: chair.report.generate
   * 
   * Responses:
   * - 200: Success with student statistics
   * - 400: Bad Request (invalid query parameters)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.report.generate permission)
   * - 404: Not Found (user has no department affiliation)
   * - 500: Internal Server Error
   */
  router.get('/students/stats', requirePermission('chair.report.generate'), reportController.getStudentStats);

  /**
   * GET /api/chair/reports/faculty/stats
   * 
   * Get faculty statistics for the authenticated department chair's department
   * 
   * Permissions: chair.report.generate
   * 
   * Responses:
   * - 200: Success with faculty statistics
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.report.generate permission)
   * - 404: Not Found (user has no department affiliation)
   * - 500: Internal Server Error
   */
  router.get('/faculty/stats', requirePermission('chair.report.generate'), reportController.getFacultyStats);

  /**
   * GET /api/chair/reports/export
   * 
   * Export report in specified format (PDF or Excel)
   * 
   * Query Parameters:
   * - report_type: Type of report (required)
   *   - student_stats: Student statistics report
   *   - faculty_stats: Faculty statistics report
   *   - schedule_summary: Schedule summary report
   *   - event_summary: Event summary report
   *   - research_summary: Research summary report
   * - format: Export format (required)
   *   - pdf: PDF document
   *   - excel: Excel spreadsheet
   * 
   * Permissions: chair.report.export
   * 
   * Responses:
   * - 200: Success with report file
   *   - Content-Type: application/pdf (for PDF format)
   *   - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (for Excel format)
   * - 400: Bad Request (invalid or missing query parameters, unsupported report type or format)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.report.export permission)
   * - 404: Not Found (user has no department affiliation)
   * - 500: Internal Server Error
   */
  router.get('/export', requirePermission('chair.report.export'), reportController.exportReport);

  return router;
}
