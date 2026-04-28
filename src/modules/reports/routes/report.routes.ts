/**
 * Report Routes
 * Route definitions for report generation endpoints
 * 
 */

import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { validate } from '../../../shared/middleware/validator';
import {
  studentProfileReportSchema,
  facultyProfileReportSchema,
  enrollmentReportSchema,
  analyticsReportSchema,
} from '../schemas/report.schema';

export function createReportRoutes(reportController: ReportController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/reports
   * Get all reports with filters
   * 
   * Permission: report.read
   * Accessible by: Admin, Department Chair, Faculty
   */
  router.get('/', requirePermission('report.read'), reportController.getReports);

  /**
   * GET /api/v1/admin/reports/statistics
   * Get report statistics
   * 
   * Permission: report.read
   * Accessible by: Admin, Department Chair, Faculty
   */
  router.get('/statistics', requirePermission('report.read'), reportController.getReportStatistics);

  /**
   * GET /api/v1/admin/reports/:id
   * Get report by ID
   * 
   * Permission: report.read
   * Accessible by: Admin, Department Chair, Faculty
   */
  router.get('/:id', requirePermission('report.read'), reportController.getReportById);

  /**
   * GET /api/v1/admin/reports/:id/download
   * Download report file
   * 
   * Permission: report.read
   * Accessible by: Admin, Department Chair, Faculty
   */
  router.get('/:id/download', requirePermission('report.read'), reportController.downloadReport);

  /**
   * DELETE /api/v1/admin/reports/:id
   * Delete report
   * 
   * Permission: report.generate (only generators can delete)
   * Accessible by: Admin, Department Chair
   */
  router.delete('/:id', requirePermission('report.generate'), reportController.deleteReport);

  /**
   * POST /api/v1/admin/reports/student-profile
   * Generate student profile report (PDF)
   * 
   * Permission: report.generate
   * Accessible by: Admin, Department Chair
   */
  router.post(
    '/student-profile',
    requirePermission('report.generate'),
    validate(studentProfileReportSchema),
    reportController.generateStudentProfileReport
  );

  /**
   * POST /api/v1/admin/reports/faculty-profile
   * Generate faculty profile report (PDF)
   * 
   * Permission: report.generate
   * Accessible by: Admin, Department Chair
   */
  router.post(
    '/faculty-profile',
    requirePermission('report.generate'),
    validate(facultyProfileReportSchema),
    reportController.generateFacultyProfileReport
  );

  /**
   * POST /api/v1/admin/reports/enrollments
   * Generate enrollment report (Excel)
   * 
   * Permission: report.generate
   * Accessible by: Admin, Department Chair
   */
  router.post(
    '/enrollments',
    requirePermission('report.generate'),
    validate(enrollmentReportSchema),
    reportController.generateEnrollmentReport
  );

  /**
   * POST /api/v1/admin/reports/analytics
   * Generate analytics report (PDF)
   * 
   * Permission: report.generate
   * Accessible by: Admin, Department Chair
   */
  router.post(
    '/analytics',
    requirePermission('report.generate'),
    validate(analyticsReportSchema),
    reportController.generateAnalyticsReport
  );

  return router;
}
