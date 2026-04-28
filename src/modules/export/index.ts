/**
 * Export Module
 * Exports PDF and Excel generation routes and dependencies
 */

import { PdfExportService } from './services/pdf-export.service';
import { ExcelExportService } from './services/excel-export.service';
import { ExportController } from './controllers/export.controller';
import { createExportRoutes } from './routes/export.routes';

// Initialize dependencies
const pdfExportService = new PdfExportService();
const excelExportService = new ExcelExportService();
const exportController = new ExportController(pdfExportService, excelExportService);

// Export routes
export const exportRoutes = createExportRoutes(exportController);

// Export services for testing
export { PdfExportService, ExcelExportService, ExportController };
