/**
 * Report Routes
 * Route definitions for report generation endpoints
 * 
 * Requirements: 17.7, 30.2
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
