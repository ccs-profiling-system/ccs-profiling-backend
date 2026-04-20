/**
 * Student Portal - Financial Controller
 * HTTP request/response handling for student financial records operations
 * 
 * Handles financial record retrieval with student-scoped validation.
 * Ensures students can only access their own financial records.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { Request, Response, NextFunction } from 'express';
import { FinancialService } from '../services/financial.service';
import { extractStudentId } from '../utils/studentScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

export class FinancialController {
  constructor(private financialService: FinancialService) {}

  /**
   * GET /api/student/financial
   * Get financial record for authenticated student
   * 
   * Extracts student_id from JWT token and returns the financial record
   * including tuition, fees, payments, outstanding balance, and payment history.
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  getFinancialRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      // This will throw StudentAccessError (403) if user is not student
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Retrieve financial record
      const financialRecord = await this.financialService.getFinancialRecord(studentId);

      res.json({
        success: true,
        data: financialRecord,
      });
    } catch (error) {
      next(error);
    }
  };
}
