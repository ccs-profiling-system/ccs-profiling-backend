/**
 * Filter Controller
 * 
 * HTTP request/response handling for filter options in secretary portal.
 * Provides dynamic filter options for dropdown menus.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import {
  getPrograms as getProgramsService,
  getDepartments as getDepartmentsService,
  getEventTypes as getEventTypesService,
} from '../services/filter.service';

/**
 * GET /api/secretary/filters/programs
 * 
 * Retrieve distinct program names from students table.
 * Results are ordered alphabetically and exclude soft-deleted records.
 * Results are cached for 5 minutes for performance.
 * 
 * @param _req - Express request (unused)
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with array of program names on success
 * @throws Error if program retrieval fails
 * 
 */
export async function getPrograms(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get distinct programs from service
    const programs = await getProgramsService();

    // Return HTTP 200 with filter options array
    res.status(200).json({
      success: true,
      data: programs,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * GET /api/secretary/filters/departments
 * 
 * Retrieve distinct department names from faculty table.
 * Results are ordered alphabetically and exclude soft-deleted records.
 * Results are cached for 5 minutes for performance.
 * 
 * @param _req - Express request (unused)
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with array of department names on success
 * @throws Error if department retrieval fails
 * 
 */
export async function getDepartments(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get distinct departments from service
    const departments = await getDepartmentsService();

    // Return HTTP 200 with filter options array
    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * GET /api/secretary/filters/event-types
 * 
 * Retrieve distinct event type names from events table.
 * Results are ordered alphabetically and exclude soft-deleted records.
 * Results are cached for 5 minutes for performance.
 * 
 * @param _req - Express request (unused)
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with array of event type names on success
 * @throws Error if event type retrieval fails
 * 
 */
export async function getEventTypes(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get distinct event types from service
    const eventTypes = await getEventTypesService();

    // Return HTTP 200 with filter options array
    res.status(200).json({
      success: true,
      data: eventTypes,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}
