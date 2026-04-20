/**
 * Student Portal - Financial Routes
 * Route definitions for student financial records endpoints
 * 
 * Provides endpoints for students to view their financial records including
 * tuition, fees, payments, outstanding balance, and payment history.
 * All routes require authentication and RBAC permission checks.
 * 
 * Requirements: 4.5, 27.1, 27.2, 27.3, 27.4, 27.5
 */

import { Router } from 'express';
import { FinancialController } from '../controllers/financial.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create financial routes
 * 
 * @param financialController - Financial controller instance
 * @returns Express router with financial routes
 */
export function createFinancialRoutes(financialController: FinancialController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/student/financial
   * Get financial record for authenticated student
   * 
   * Permission: student.financial.read
   * 
   * Extracts student_id from JWT token and returns the financial record
   * including tuition, fees, payments, outstanding balance, and payment history.
   * No studentId parameter needed in URL - determined from authentication.
   * 
   * Response:
   * - 200: Financial record retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 404: Not Found (financial record not found)
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/',
    requirePermission('student.financial.read'),
    financialController.getFinancialRecord
  );

  return router;
}
