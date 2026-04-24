/**
 * Report Routes
 * 
 * Defines routes for secretary portal report generation operations.
 * All routes require authentication and appropriate permissions.
 * 
 * Requirements: 10.1-10.4
 */

import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import {
  generateStudentReportController,
  generateFacultyReportController,
  generateEventReportController,
} from '../controllers/report.controller';

/**
 * Create report router
 * 
 * Endpoints:
 * - POST /api/secretary/reports/students - Generate student report
 * - POST /api/secretary/reports/faculty - Generate faculty report
 * - POST /api/secretary/reports/events - Generate event report
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - secretary.report.generate permission
 */
export function createReportRoutes(): Router {
  const router = Router();

  /**
   * POST /api/secretary/reports/students
   * 
   * Generate a student report in the specified format (pdf, excel, csv).
   * 
   * Requirements: 10.1, 10.4
   */
  router.post(
    '/students',
    requirePermission('secretary.report.generate'),
    generateStudentReportController
  );

  /**
   * POST /api/secretary/reports/faculty
   * 
   * Generate a faculty report in the specified format (pdf, excel, csv).
   * 
   * Requirements: 10.2, 10.4
   */
  router.post(
    '/faculty',
    requirePermission('secretary.report.generate'),
    generateFacultyReportController
  );

  /**
   * POST /api/secretary/reports/events
   * 
   * Generate an event report in the specified format (pdf, excel, csv).
   * 
   * Requirements: 10.3, 10.4
   */
  router.post(
    '/events',
    requirePermission('secretary.report.generate'),
    generateEventReportController
  );

  return router;
}

// Default export for backward compatibility
export default createReportRoutes();
