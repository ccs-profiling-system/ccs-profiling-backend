/**
 * Report Controller
 * HTTP request/response handling for report generation
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import {
  StudentProfileReportRequestDTO,
  FacultyProfileReportRequestDTO,
  EnrollmentReportRequestDTO,
  AnalyticsReportRequestDTO,
} from '../types';

export class ReportController {
  constructor(private reportService: ReportService) {}

  /**
   * Generate student profile report
   * POST /api/v1/admin/reports/student-profile
   */
  generateStudentProfileReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const request: StudentProfileReportRequestDTO = {
        student_id: req.body.student_id,
        format: 'pdf',
      };

      const result = await this.reportService.generateStudentProfileReport(request);

      // Set response headers for file download
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.setHeader('Content-Length', result.buffer.length);

      // Send buffer
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate faculty profile report
   * POST /api/v1/admin/reports/faculty-profile
   */
  generateFacultyProfileReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const request: FacultyProfileReportRequestDTO = {
        faculty_id: req.body.faculty_id,
        format: 'pdf',
      };

      const result = await this.reportService.generateFacultyProfileReport(request);

      // Set response headers for file download
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.setHeader('Content-Length', result.buffer.length);

      // Send buffer
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate enrollment report
   * POST /api/v1/admin/reports/enrollments
   */
  generateEnrollmentReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const request: EnrollmentReportRequestDTO = {
        semester: req.body.semester,
        academic_year: req.body.academic_year,
        program: req.body.program,
        format: 'excel',
      };

      const result = await this.reportService.generateEnrollmentReport(request);

      // Set response headers for file download
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.setHeader('Content-Length', result.buffer.length);

      // Send buffer
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate analytics report
   * POST /api/v1/admin/reports/analytics
   */
  generateAnalyticsReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const request: AnalyticsReportRequestDTO = {
        report_type: req.body.report_type,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        format: 'pdf',
      };

      const result = await this.reportService.generateAnalyticsReport(request);

      // Set response headers for file download
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.setHeader('Content-Length', result.buffer.length);

      // Send buffer
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  };
}
