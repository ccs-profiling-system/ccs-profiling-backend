/**
 * Event Controller
 * 
 * HTTP request/response handling for event management in the department chair portal.
 * Handles full CRUD operations, pagination, filtering, approval/rejection workflows,
 * and college-wide access (no department filtering).
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { NotFoundError, ValidationError } from '../../../shared/errors';
import { 
  createEventSchema, 
  updateEventSchema, 
  eventFilterSchema 
} from '../schemas/event.schemas';
import { approvalSchema, rejectionSchema } from '../schemas/common.schemas';

export class EventController {
  constructor(private eventService: EventService) {}

  /**
   * GET /api/chair/events
   * 
   * List events with pagination and filtering across all programs (college-wide).
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   * - type: Filter by event type (optional)
   * - status: Filter by event status (optional)
   * - start_date: Filter events on or after this date (optional)
   * - end_date: Filter events on or before this date (optional)
   * 
   * @param req - Express request with query parameters
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with paginated event list
   * 
   */
  listEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

      // Validate pagination parameters
      if (page < 1) {
        throw new ValidationError('Page must be at least 1');
      }
      if (limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      // Validate filter parameters
      const filterValidation = eventFilterSchema.safeParse({
        type: req.query.type,
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
      });

      if (!filterValidation.success) {
        throw new ValidationError('Invalid filter parameters', filterValidation.error.errors);
      }

      const filters = filterValidation.data;

      // Get events from service (college-wide scope)
      const result = await this.eventService.listEvents('', {
        page,
        limit,
        ...filters,
      });

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
   * POST /api/chair/events
   * 
   * Create a new event (college-wide access).
   * 
   * Request Body:
   * - title: Event title (required)
   * - description: Event description (required)
   * - event_type: Type of event (required)
   * - event_date: Date of event (required)
   * - location: Event location (required)
   * - organizer: Event organizer (required)
   * - max_participants: Maximum number of participants (optional)
   * - registration_deadline: Registration deadline (optional)
   * 
   * @param req - Express request with event creation data
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with created event details
   * @throws ValidationError if request body is invalid
   * 
   */
  createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = createEventSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const eventData = validationResult.data;

      // Create event (college-wide scope)
      const event = await this.eventService.createEvent(eventData, '');

      res.json({
        success: true,
        data: event,
        message: 'Event created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/chair/events/:id
   * 
   * Get event details by ID (college-wide access).
   * 
   * @param req - Express request with event ID parameter
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with event details including participant count
   * @returns HTTP 404 if event not found
   * 
   */
  getEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get event ID from route parameter
      const eventId = req.params.id;

      // Get event from service (college-wide scope)
      const event = await this.eventService.getEventById(eventId, '');

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/chair/events/:id
   * 
   * Update an event (college-wide access).
   * 
   * Request Body: (all fields optional)
   * - title: Event title
   * - description: Event description
   * - event_type: Type of event
   * - event_date: Date of event
   * - location: Event location
   * - organizer: Event organizer
   * - max_participants: Maximum number of participants
   * - registration_deadline: Registration deadline
   * 
   * @param req - Express request with event ID and update data
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with updated event details
   * @returns HTTP 400 if event is not in valid state for update (must be draft or pending_approval)
   * @returns HTTP 404 if event not found
   * 
   */
  updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get event ID from route parameter
      const eventId = req.params.id;

      // Validate request body
      const validationResult = updateEventSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const updateData = validationResult.data;

      // Update event (college-wide scope)
      try {
        const event = await this.eventService.updateEvent(
          eventId,
          updateData,
          ''
        );

        if (!event) {
          throw new NotFoundError('Event not found');
        }

        res.json({
          success: true,
          data: event,
          message: 'Event updated successfully',
        });
      } catch (error) {
        // Check if error is a workflow validation error
        if (error instanceof Error && error.message.includes('Cannot update')) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/chair/events/:id
   * 
   * Delete an event (college-wide access).
   * 
   * Allows deletion of draft events or cancellation of approved events.
   * Performs soft delete by setting deleted_at timestamp.
   * 
   * @param req - Express request with event ID parameter
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with success message
   * @returns HTTP 400 if event is not in valid state for deletion
   * @returns HTTP 404 if event not found
   * 
   */
  deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get event ID from route parameter
      const eventId = req.params.id;

      // Delete event (college-wide scope)
      try {
        const deleted = await this.eventService.deleteEvent(eventId, '');

        if (!deleted) {
          throw new NotFoundError('Event not found');
        }

        res.json({
          success: true,
          message: 'Event deleted successfully',
        });
      } catch (error) {
        // Check if error is a workflow validation error
        if (error instanceof Error && error.message.includes('Cannot delete')) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/chair/events/:id/approve
   * 
   * Approve an event (college-wide access).
   * 
   * Request Body:
   * - approver_notes: Optional notes from the approver
   * 
   * @param req - Express request with event ID and approval data
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with updated event details
   * @returns HTTP 400 if event is not in valid state for approval (must be pending_approval)
   * @returns HTTP 404 if event not found
   * 
   */
  approveEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get event ID from route parameter
      const eventId = req.params.id;

      // Validate request body
      const validationResult = approvalSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const approvalData = validationResult.data;

      // Get authenticated user ID
      const userId = req.user?.userId;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }

      // Approve event (college-wide scope)
      try {
        const event = await this.eventService.approveEvent(
          eventId,
          '',
          approvalData,
          userId
        );

        if (!event) {
          throw new NotFoundError('Event not found');
        }

        res.json({
          success: true,
          data: event,
          message: 'Event approved successfully',
        });
      } catch (error) {
        // Check if error is a workflow validation error
        if (error instanceof Error && error.message.includes('Cannot approve')) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/chair/events/:id/reject
   * 
   * Reject an event (college-wide access).
   * 
   * Request Body:
   * - rejection_reason: Required reason for rejection (10-1000 characters)
   * 
   * @param req - Express request with event ID and rejection data
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with updated event details
   * @returns HTTP 400 if event is not in valid state for rejection or missing rejection_reason
   * @returns HTTP 404 if event not found
   * 
   */
  rejectEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get event ID from route parameter
      const eventId = req.params.id;

      // Validate request body
      const validationResult = rejectionSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const rejectionData = validationResult.data;

      // Get authenticated user ID
      const userId = req.user?.userId;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }

      // Reject event (college-wide scope)
      try {
        const event = await this.eventService.rejectEvent(
          eventId,
          '',
          rejectionData,
          userId
        );

        if (!event) {
          throw new NotFoundError('Event not found');
        }

        res.json({
          success: true,
          data: event,
          message: 'Event rejected successfully',
        });
      } catch (error) {
        // Check if error is a workflow validation error
        if (error instanceof Error && error.message.includes('Cannot reject')) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/chair/events/:id/participants
   * 
   * Get event participants (college-wide access).
   * 
   * Returns list of participants (students and faculty) for an event.
   * Includes participant details and registration information.
   * 
   * @param req - Express request with event ID parameter
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with list of event participants
   * @returns HTTP 404 if event not found
   * 
   */
  getParticipants = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get event ID from route parameter
      const eventId = req.params.id;

      // Get participants from service (college-wide scope)
      const participants = await this.eventService.getEventParticipants(
        eventId,
        ''
      );

      if (participants === null) {
        throw new NotFoundError('Event not found');
      }

      res.json({
        success: true,
        data: participants,
      });
    } catch (error) {
      next(error);
    }
  };
}
