/**
 * Student Portal - Course Controller
 * HTTP request/response handling for course operations
 * 
 * Handles enrolled courses retrieval, course details, and weekly schedule.
 * Ensures students can only access courses they are enrolled in.
 * 
 * Requirements: 6.1, 7.1, 8.1
 */

import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/course.service';
import { extractStudentId } from '../utils/studentScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

export class CourseController {
  constructor(private courseService: CourseService) {}

  /**
   * GET /api/student/courses/enrolled
   * Get enrolled courses for current semester
   * 
   * Extracts student_id from JWT token and returns enrolled courses.
   * 
   * Requirements: 6.1
   */
  getEnrolledCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Retrieve enrolled courses
      const courses = await this.courseService.getEnrolledCourses(studentId);

      res.json({
        success: true,
        data: courses,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/student/courses/:courseId
   * Get course details for a specific course
   * 
   * Extracts student_id from JWT token and returns course details.
   * Validates student is enrolled in the course.
   * 
   * Requirements: 7.1
   */
  getCourseDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Get courseId from route parameter
      const { courseId } = req.params;

      // Retrieve course details
      const courseDetails = await this.courseService.getCourseDetails(studentId, courseId);

      res.json({
        success: true,
        data: courseDetails,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/student/courses/schedule
   * Get weekly schedule for student
   * 
   * Extracts student_id from JWT token and returns weekly schedule.
   * 
   * Requirements: 8.1
   */
  getWeeklySchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract student_id from authenticated user (from JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const studentId = extractStudentId(authenticatedReq.user);

      // Retrieve weekly schedule
      const schedule = await this.courseService.getWeeklySchedule(studentId);

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  };
}
