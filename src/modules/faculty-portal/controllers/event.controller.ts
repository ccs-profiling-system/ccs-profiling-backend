/**
 * Faculty Portal - Event Controller
 * HTTP request/response handling for event management and participation operations
 * 
 * Handles event viewing, participation tracking, and event registration for faculty members.
 * All operations validate event access by department and enforce registration rules.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { EventService, AlreadyRegisteredError, RegistrationDeadlinePassedError, EventFullError, EventNotFoundError, EventAccessDeniedError } from '../services/event.service';
import { extractFacultyId } from '../utils/facultyScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';
import { FacultyUserContext } from '../utils/facultyScope';
import { ValidationError } from '../../../shared/errors';
import { z } from 'zod';

/**
 * Validation schema for event ID route parameter
 */
const eventIdParamSchema = z.object({
  eventId: z.string().uuid('Invalid event ID format'),
});

/**
 * Validation schema for pagination and filter query parameters
 */
const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  type: z.string().optional(),
  upcoming: z.coerce.boolean().optional(),
});

export class EventController {
  constructor(private eventService: EventService) {}

  /**
   * GET /api/faculty/events
   * List events by faculty's department with pagination and filtering
   * 
   * Retrieves events filtered by the authenticated faculty member's department.
   * Supports pagination and filtering by event type and upcoming events.
   * 
   * Query Parameters:
   * - page (optional): Page number (default: 1)
   * - limit (optional): Items per page (default: 10, max: 100)
   * - type (optional): Filter by event type
   * - upcoming (optional): Filter events with event_date >= current date (boolean)
   * 
   * Returns:
   * - 200: Paginated list of events with metadata
   * - 400: If invalid query parameters provided
   * 
   */
  listEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const queryValidation = listEventsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters', queryValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);

      const { page, limit, type, upcoming } = queryValidation.data;

      // Build filters
      const filters = {
        ...(type && { type }),
        ...(upcoming !== undefined && { upcoming }),
      };

      // Retrieve events
      const result = await this.eventService.listEventsByDepartment(
        facultyId,
        { page, limit },
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/faculty/events/my-participation
   * Get faculty's event participation
   * 
   * Retrieves all events the authenticated faculty member is registered for
   * with participation details including registration date and attendance status.
   * 
   * Returns:
   * - 200: List of event participation records
   * 
   */
  getMyParticipation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);

      // Retrieve participation records
      const participations = await this.eventService.getParticipationByFaculty(facultyId);

      res.json({
        success: true,
        data: participations,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/faculty/events/:eventId/register
   * Register faculty for an event
   * 
   * Creates a participation record for the authenticated faculty member.
   * Validates event exists, belongs to faculty's department, registration deadline,
   * capacity limits, and prevents duplicate registrations.
   * 
   * Route Parameters:
   * - eventId (required): UUID of the event
   * 
   * Returns:
   * - 200: Created participation record with event details
   * - 400: If already registered or registration deadline has passed
   * - 403: If event is not in faculty's department
   * - 404: If event doesn't exist
   * - 422: If event is full (reached max_participants)
   * 
   */
  registerForEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate event ID parameter
      const paramValidation = eventIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid event ID', paramValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);

      const { eventId } = paramValidation.data;

      // Register for event
      // Service will validate event exists, belongs to department, deadline, capacity, and duplicate registration
      // Throws EventNotFoundError (404) if event doesn't exist
      // Throws EventAccessDeniedError (403) if event not in faculty's department
      // Throws AlreadyRegisteredError (400) if already registered
      // Throws RegistrationDeadlinePassedError (400) if deadline passed
      // Throws EventFullError (422) if event is full
      const participation = await this.eventService.registerForEvent(eventId, facultyId);

      res.json({
        success: true,
        data: participation,
        message: 'Successfully registered for event',
      });
      return;
    } catch (error) {
      // Handle service-specific errors with appropriate HTTP status codes
      if (error instanceof AlreadyRegisteredError) {
        return res.status(400).json({
          success: false,
          error: {
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error instanceof RegistrationDeadlinePassedError) {
        return res.status(400).json({
          success: false,
          error: {
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error instanceof EventFullError) {
        return res.status(422).json({
          success: false,
          error: {
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error instanceof EventNotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error instanceof EventAccessDeniedError) {
        return res.status(403).json({
          success: false,
          error: {
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
          },
        });
      }

      next(error);
      return;
    }
  };
}
