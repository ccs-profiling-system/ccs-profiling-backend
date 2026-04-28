import { Request, Response, NextFunction } from 'express';
import { PdfExportService } from '../services/pdf-export.service';
import { ExcelExportService } from '../services/excel-export.service';
import { db } from '../../../db';
import { curriculum, subjects, schedules } from '../../../db/schema';
import { isNull, eq, and } from 'drizzle-orm';

/**
 * Export Controller
 * Handles HTTP requests for export endpoints
 */
export class ExportController {
  constructor(
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService
  ) {}

  /**
   * Export instructions to PDF
   * GET /api/v1/admin/instructions/export/pdf
   */
  exportInstructionsPdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Fetch curriculum and subjects data
      const curriculumData = await db
        .select()
        .from(curriculum)
        .where(isNull(curriculum.deleted_at));

      const subjectsData = await db
        .select()
        .from(subjects)
        .where(isNull(subjects.deleted_at));

      // Combine data
      const data = [
        ...curriculumData.map((c) => ({
          code: c.code,
          name: c.name,
          program: c.program,
          units: null,
          semester: null,
        })),
        ...subjectsData.map((s) => ({
          code: s.code,
          name: s.name,
          program: null,
          units: s.units,
          semester: s.semester,
        })),
      ];

      // Generate PDF
      const pdfStream = this.pdfExportService.generateInstructionsPdf(data);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=instructions-report.pdf');

      // Pipe PDF stream to response
      pdfStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export instructions to Excel
   * GET /api/v1/admin/instructions/export/excel
   */
  exportInstructionsExcel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Fetch curriculum and subjects data
      const curriculumData = await db
        .select()
        .from(curriculum)
        .where(isNull(curriculum.deleted_at));

      const subjectsData = await db
        .select()
        .from(subjects)
        .where(isNull(subjects.deleted_at));

      // Combine data
      const data = [
        ...curriculumData.map((c) => ({
          code: c.code,
          name: c.name,
          program: c.program,
          units: null,
          semester: null,
          year_level: null,
          type: 'curriculum',
          status: c.status,
        })),
        ...subjectsData.map((s) => ({
          code: s.code,
          name: s.name,
          program: null,
          units: s.units,
          semester: s.semester,
          year_level: s.year_level,
          type: s.type,
          status: 'active',
        })),
      ];

      // Generate Excel
      const excelStream = await this.excelExportService.generateInstructionsExcel(data);

      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=instructions-report.xlsx');

      // Pipe Excel stream to response
      excelStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export schedules to PDF
   * GET /api/v1/admin/schedules/export/pdf
   */
  exportSchedulesPdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { semester, academic_year } = req.query;

      const conditions = [isNull(schedules.deleted_at)];

      if (semester) {
        conditions.push(eq(schedules.semester, semester as string));
      }

      if (academic_year) {
        conditions.push(eq(schedules.academic_year, academic_year as string));
      }

      // Fetch schedules data
      const schedulesData = await db
        .select()
        .from(schedules)
        .where(and(...conditions));

      // Generate PDF
      const pdfStream = this.pdfExportService.generateSchedulesPdf(schedulesData);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=schedules-report.pdf');

      // Pipe PDF stream to response
      pdfStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export schedules to Excel
   * GET /api/v1/admin/schedules/export/excel
   */
  exportSchedulesExcel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { semester, academic_year } = req.query;

      const conditions = [isNull(schedules.deleted_at)];

      if (semester) {
        conditions.push(eq(schedules.semester, semester as string));
      }

      if (academic_year) {
        conditions.push(eq(schedules.academic_year, academic_year as string));
      }

      // Fetch schedules data
      const schedulesData = await db
        .select()
        .from(schedules)
        .where(and(...conditions));

      // Generate Excel
      const excelStream = await this.excelExportService.generateSchedulesExcel(schedulesData);

      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=schedules-report.xlsx');

      // Pipe Excel stream to response
      excelStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };
}
