/**
 * Student Portal - Progress Controller
 * HTTP request/response handling for academic progress operations
 * 
 * Handles academic progress retrieval with student-scoped validation.
 * Ensures students can only access their own progress data.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { Request, Response, NextFunction } from 'express';
import { ProgressService } from '../services/progress.service';
import { extractStudentId } from '../utils/studentScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

export class ProgressController {
  constructor(private progressService: ProgressService) {}

  /**
   * GET /api/student/progress
   * Get academic progress for authenticated student
   * 
   * Extracts student_id from JWT token and returns academic progress data
   * including credits earned, academic standing, and completed courses by semester.
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  getProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      // This will throw StudentAccessError (403) if user is not student
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Retrieve academic progress
      const academicProgress = await this.progressService.getAcademicProgress(studentId);

      res.json({
        success: true,
        data: academicProgress,
      });
    } catch (error) {
      next(error);
    }
  };
}
