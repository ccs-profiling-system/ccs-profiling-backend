/**
 * Report Routes
 * Route definitions for report generation endpoints
 * 
 */

import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';
import { validate } from '../../../shared/middleware/validator';
import {
  studentProfileReportSchema,
  facultyProfileReportSchema,
  enrollmentReportSchema,
  analyticsReportSchema,
} from '../schemas/report.schema';

export function createReportRoutes(reportController: ReportController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/reports
   * Get all reports with filters
   */
  router.get('/', reportController.getReports);

  /**
   * GET /api/v1/admin/reports/statistics
   * Get report statistics
   */
  router.get('/statistics', reportController.getReportStatistics);

  /**
   * GET /api/v1/admin/reports/:id
   * Get report by ID
   */
  router.get('/:id', reportController.getReportById);

  /**
   * GET /api/v1/admin/reports/:id/download
   * Download report file
   */
  router.get('/:id/download', reportController.downloadReport);

  /**
   * DELETE /api/v1/admin/reports/:id
   * Delete report
   */
  router.delete('/:id', reportController.deleteReport);

  /**
   * POST /api/v1/admin/reports/student-profile
   * Generate student profile report (PDF)
   */
  router.post(
    '/student-profile',
    validate(studentProfileReportSchema),
    reportController.generateStudentProfileReport
  );

  /**
   * POST /api/v1/admin/reports/faculty-profile
   * Generate faculty profile report (PDF)
   */
  router.post(
    '/faculty-profile',
    validate(facultyProfileReportSchema),
    reportController.generateFacultyProfileReport
  );

  /**
   * POST /api/v1/admin/reports/enrollments
   * Generate enrollment report (Excel)
   */
  router.post(
    '/enrollments',
    validate(enrollmentReportSchema),
    reportController.generateEnrollmentReport
  );

  /**
   * POST /api/v1/admin/reports/analytics
   * Generate analytics report (PDF)
   */
  router.post(
    '/analytics',
    validate(analyticsReportSchema),
    reportController.generateAnalyticsReport
  );

  return router;
}
