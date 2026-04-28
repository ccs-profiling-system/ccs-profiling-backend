import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../shared/middleware/rbac.middleware';

/**
 * Create export routes
 * 
 * @param controller - Export controller instance
 * @returns Express router with export routes
 */
export function createExportRoutes(controller: ExportController): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/instructions/export/pdf
   * Export instructions data to PDF
   * 
   * Permissions: instruction.read or report.generate
   */
  router.get(
    '/instructions/export/pdf',
    requirePermission('report.generate'),
    controller.exportInstructionsPdf
  );

  /**
   * GET /api/v1/admin/instructions/export/excel
   * Export instructions data to Excel
   * 
   * Permissions: instruction.read or report.generate
   */
  router.get(
    '/instructions/export/excel',
    requirePermission('report.generate'),
    controller.exportInstructionsExcel
  );

  /**
   * GET /api/v1/admin/schedules/export/pdf
   * Export schedules data to PDF
   * 
   * Query Parameters:
   * - semester: Filter by semester
   * - academic_year: Filter by academic year
   * 
   * Permissions: schedule.read or report.generate
   */
  router.get(
    '/schedules/export/pdf',
    requirePermission('report.generate'),
    controller.exportSchedulesPdf
  );

  /**
   * GET /api/v1/admin/schedules/export/excel
   * Export schedules data to Excel
   * 
   * Query Parameters:
   * - semester: Filter by semester
   * - academic_year: Filter by academic year
   * 
   * Permissions: schedule.read or report.generate
   */
  router.get(
    '/schedules/export/excel',
    requirePermission('report.generate'),
    controller.exportSchedulesExcel
  );

  return router;
}
