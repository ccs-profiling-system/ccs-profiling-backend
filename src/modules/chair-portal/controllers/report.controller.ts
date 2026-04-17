/**
 * Report Controller for Department Chair Portal
 * 
 * HTTP request/response handling for report generation and analytics operations.
 * Extracts department ID from authenticated user and returns department-scoped reports.
 * 
 * Requirements: 8.1, 8.5, 8.8, 9.1, 9.2
 */

import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { extractDepartmentFromRequest } from '../utils/departmentScope';
import { ValidationError } from '../../../shared/errors';
import { exportReportSchema } from '../schemas/report.schemas';

export class ReportController {
  constructor(private reportService: ReportService) {}

  /**
   * GET /api/chair/reports/students/stats
   * 
   * Get student statistics for the authenticated department chair's department.
   * 
   * Query Parameters:
   * - year_level: Filter by year level (optional)
   * - status: Filter by student status (optional)
   * 
   * @param req - Express request with query parameters
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with student statistics
   * @throws NotFoundError if user has no department affiliation
   * 
   * Requirements: 8.1, 8.2, 8.3, 8.4
   * 
   * @example
   * Response:
   * ```json
   * {
   *   "success": true,
   *   "data": {
   *     "totalStudents": 150,
   *     "enrollmentTrends": [
   *       { "year_level": 1, "count": 40 },
   *       { "year_level": 2, "count": 35 }
   *     ],
   *     "statusDistribution": [
   *       { "status": "active", "count": 120, "percentage": 80 },
   *       { "status": "inactive", "count": 30, "percentage": 20 }
   *     ],
   *     "yearLevelBreakdown": [
   *       { "year_level": 1, "count": 40, "percentage": 26.67 }
   *     ]
   *   }
   * }
   * ```
   */
  getStudentStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Parse query parameters
      const year_level = req.query.year_level
        ? parseInt(req.query.year_level as string)
        : undefined;
      const status = req.query.status as string | undefined;

      // Validate year_level if provided
      if (year_level !== undefined && (isNaN(year_level) || year_level < 1 || year_level > 5)) {
        throw new ValidationError('Year level must be between 1 and 5');
      }

      // Get student statistics
      const stats = await this.reportService.getStudentStats(departmentInfo.departmentId, {
        year_level,
        status,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/chair/reports/faculty/stats
   * 
   * Get faculty statistics for the authenticated department chair's department.
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with faculty statistics
   * @throws NotFoundError if user has no department affiliation
   * 
   * Requirements: 8.5, 8.6, 8.7
   * 
   * @example
   * Response:
   * ```json
   * {
   *   "success": true,
   *   "data": {
   *     "totalFaculty": 25,
   *     "departmentDistribution": [
   *       { "department": "Computer Science", "count": 25, "percentage": 100 }
   *     ],
   *     "teachingLoadAnalysis": [
   *       { "faculty_id": "uuid", "faculty_name": "John Doe", "total_schedules": 5, "department": "Computer Science" }
   *     ],
   *     "researchSupervisionCounts": [
   *       { "faculty_id": "uuid", "faculty_name": "John Doe", "research_count": 3, "department": "Computer Science" }
   *     ]
   *   }
   * }
   * ```
   */
  getFacultyStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Get faculty statistics
      const stats = await this.reportService.getFacultyStats(departmentInfo.departmentId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/chair/reports/export
   * 
   * Export report in specified format (PDF or Excel).
   * 
   * Query Parameters:
   * - report_type: Type of report (student_stats, faculty_stats, schedule_summary, event_summary, research_summary)
   * - format: Export format (pdf or excel)
   * 
   * @param req - Express request with query parameters
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with report file (PDF or Excel)
   * @returns HTTP 400 if report_type or format is invalid
   * @throws NotFoundError if user has no department affiliation
   * 
   * Requirements: 8.8, 8.9, 8.10, 8.11, 8.12, 8.13, 8.14, 8.15
   * 
   * @example
   * Request: GET /api/chair/reports/export?report_type=student_stats&format=pdf
   * Response: PDF file with Content-Type: application/pdf
   */
  exportReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Validate query parameters
      const validationResult = exportReportSchema.safeParse({
        report_type: req.query.report_type,
        format: req.query.format,
      });

      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const { report_type, format } = validationResult.data;

      // Generate report
      try {
        const result = await this.reportService.exportReport(
          report_type,
          format,
          departmentInfo.departmentId
        );

        // Set appropriate Content-Type header
        res.setHeader('Content-Type', result.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);

        // Send buffer
        res.send(result.buffer);
      } catch (error) {
        // Handle unsupported report type or format errors
        if (error instanceof Error) {
          if (error.message.includes('Unsupported report type')) {
            throw new ValidationError(error.message);
          }
          if (error.message.includes('Unsupported format')) {
            throw new ValidationError(error.message);
          }
          if (error.message.includes('not yet implemented')) {
            throw new ValidationError(error.message);
          }
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };
}
