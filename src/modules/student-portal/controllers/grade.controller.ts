/**
 * Student Portal - Grade Controller
 * HTTP request/response handling for grade operations
 * 
 * Handles grade retrieval, GPA calculation, and grade history.
 * Ensures students can only access their own grades.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { GradeService } from '../services/grade.service';
import { extractStudentId } from '../utils/studentScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

export class GradeController {
  constructor(private gradeService: GradeService) {}

  /**
   * GET /api/student/grades/current
   * Get current semester grades
   * 
   * Extracts student_id from JWT token and returns current semester grades with GPA.
   * 
   */
  getCurrentGrades = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Retrieve current semester grades
      const result = await this.gradeService.getCurrentSemesterGrades(studentId);

      res.json({
        success: true,
        data: {
          grades: result.grades,
          semester_gpa: result.semester_gpa,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/student/grades/:gradeId
   * Get specific grade details
   * 
   * Extracts student_id from JWT token and returns grade details.
   * Validates grade belongs to student.
   * 
   */
  getGradeDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Get gradeId from route parameter
      const { gradeId } = req.params;

      // Retrieve grade details
      const grade = await this.gradeService.getGradeById(studentId, gradeId);

      res.json({
        success: true,
        data: grade,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/student/grades/history
   * Get complete grade history
   * 
   * Extracts student_id from JWT token and returns grade history grouped by semester.
   * 
   */
  getGradeHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Retrieve grade history
      const history = await this.gradeService.getGradeHistory(studentId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/student/grades/gpa
   * Get GPA calculation
   * 
   * Extracts student_id from JWT token and returns cumulative and current semester GPA.
   * 
   */
  getGPA = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Calculate GPA
      const gpa = await this.gradeService.calculateGPA(studentId);

      res.json({
        success: true,
        data: gpa,
      });
    } catch (error) {
      next(error);
    }
  };
}
