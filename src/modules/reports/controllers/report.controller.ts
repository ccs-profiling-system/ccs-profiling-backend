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
   * Get all reports with filters
   * GET /api/v1/admin/reports
   */
  getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      
      const filters = {
        report_type: req.query.report_type as string,
        generated_by: req.query.generated_by as string,
        status: req.query.status as string,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
      };

      const result = await this.reportService.getReports(filters, page, pageSize);

      res.json({
        success: true,
        data: result.data,
        total: result.total,
        page,
        pageSize,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get report statistics
   * GET /api/v1/admin/reports/statistics
   */
  getReportStatistics = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.reportService.getReportStatistics();

      res.json({
        success: true,
        data: {
          totalReports: stats.total_reports,
          reportsThisMonth: stats.reports_this_month,
          mostGenerated: stats.most_generated_type,
          monthlyGrowth: stats.monthly_growth,
          totalSize: `${(stats.total_size_bytes / (1024 * 1024)).toFixed(2)} MB`,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get report by ID
   * GET /api/v1/admin/reports/:id
   */
  getReportById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.reportService.getReportById(req.params.id);

      if (!report) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Report not found',
            code: 'REPORT_NOT_FOUND',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Download report by ID
   * GET /api/v1/admin/reports/:id/download
   */
  downloadReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.reportService.getReportById(req.params.id);

      if (!report) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Report not found',
            code: 'REPORT_NOT_FOUND',
          },
        });
        return;
      }

      const buffer = await this.reportService.downloadReport(req.params.id);

      if (!buffer) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Report file not found',
            code: 'REPORT_FILE_NOT_FOUND',
          },
        });
        return;
      }

      const mimeType = report.format === 'pdf' 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.file_name}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete report by ID
   * DELETE /api/v1/admin/reports/:id
   */
  deleteReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this.reportService.deleteReport(req.params.id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Report not found',
            code: 'REPORT_NOT_FOUND',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

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

      const userId = (req as any).user?.id;
      const result = await this.reportService.generateStudentProfileReport(request, userId);

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

      const userId = (req as any).user?.id;
      const result = await this.reportService.generateFacultyProfileReport(request, userId);

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

      const userId = (req as any).user?.id;
      const result = await this.reportService.generateEnrollmentReport(request, userId);

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

      const userId = (req as any).user?.id;
      const result = await this.reportService.generateAnalyticsReport(request, userId);

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
