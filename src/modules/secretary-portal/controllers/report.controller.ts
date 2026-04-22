/**
 * Report Controller
 * 
 * HTTP request/response handling for secretary portal report generation.
 * Provides report generation for students, faculty, and events in multiple formats.
 * 
 * Requirements: 10.1-10.3, 10.10-10.11, 10.13-10.14, 15.1
 */

import { Request, Response, NextFunction } from 'express';
import {
  generateStudentReport,
  generateFacultyReport,
  generateEventReport,
} from '../services/report.service';
import {
  generateStudentReportSchema,
  generateFacultyReportSchema,
  generateEventReportSchema,
} from '../schemas/report.schema';

/**
 * POST /api/secretary/reports/students
 * 
 * Generate a student report in the specified format.
 * 
 * Request Body:
 * - format: Report format (pdf, excel, csv) - required
 * - start_date: Filter by start date (YYYY-MM-DD) - optional
 * - end_date: Filter by end date (YYYY-MM-DD) - optional
 * - year_level: Filter by year level - optional
 * - program: Filter by program - optional
 * - status: Filter by status - optional
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with file content on success
 * @returns HTTP 400 for validation errors
 * @throws Error if report generation fails
 * 
 * Requirements: 10.1, 10.10-10.11, 10.13-10.14, 15.1
 */
export async function generateStudentReportController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const bodyResult = generateStudentReportSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: bodyResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { format, start_date, end_date, year_level, program, status } = bodyResult.data;

    // Extract user context for audit logging
    const userId = req.user?.userId;

    // Generate report via service
    const result = await generateStudentReport(
      format,
      {
        startDate: start_date,
        endDate: end_date,
        yearLevel: year_level,
        program,
        status,
      },
      userId,
      req
    );

    // Set appropriate Content-Type header
    res.setHeader('Content-Type', result.contentType);

    // Set Content-Disposition header with filename
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    // Return HTTP 200 with file content
    res.status(200).send(result.buffer);
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * POST /api/secretary/reports/faculty
 * 
 * Generate a faculty report in the specified format.
 * 
 * Request Body:
 * - format: Report format (pdf, excel, csv) - required
 * - start_date: Filter by start date (YYYY-MM-DD) - optional
 * - end_date: Filter by end date (YYYY-MM-DD) - optional
 * - department: Filter by department - optional
 * - position: Filter by position - optional
 * - status: Filter by status - optional
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with file content on success
 * @returns HTTP 400 for validation errors
 * @throws Error if report generation fails
 * 
 * Requirements: 10.2, 10.10-10.11, 10.13-10.14, 15.1
 */
export async function generateFacultyReportController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const bodyResult = generateFacultyReportSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: bodyResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { format, start_date, end_date, department, position, status } = bodyResult.data;

    // Extract user context for audit logging
    const userId = req.user?.userId;

    // Generate report via service
    const result = await generateFacultyReport(
      format,
      {
        startDate: start_date,
        endDate: end_date,
        department,
        position,
        status,
      },
      userId,
      req
    );

    // Set appropriate Content-Type header
    res.setHeader('Content-Type', result.contentType);

    // Set Content-Disposition header with filename
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    // Return HTTP 200 with file content
    res.status(200).send(result.buffer);
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * POST /api/secretary/reports/events
 * 
 * Generate an event report in the specified format.
 * 
 * Request Body:
 * - format: Report format (pdf, excel, csv) - required
 * - start_date: Filter by start date (YYYY-MM-DD) - optional
 * - end_date: Filter by end date (YYYY-MM-DD) - optional
 * - event_type: Filter by event type - optional
 * - status: Filter by approval status - optional
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with file content on success
 * @returns HTTP 400 for validation errors
 * @throws Error if report generation fails
 * 
 * Requirements: 10.3, 10.10-10.11, 10.13-10.14, 15.1
 */
export async function generateEventReportController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const bodyResult = generateEventReportSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: bodyResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { format, start_date, end_date, event_type, status } = bodyResult.data;

    // Extract user context for audit logging
    const userId = req.user?.userId;

    // Generate report via service
    const result = await generateEventReport(
      format,
      {
        startDate: start_date,
        endDate: end_date,
        eventType: event_type,
        status,
      },
      userId,
      req
    );

    // Set appropriate Content-Type header
    res.setHeader('Content-Type', result.contentType);

    // Set Content-Disposition header with filename
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    // Return HTTP 200 with file content
    res.status(200).send(result.buffer);
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}
