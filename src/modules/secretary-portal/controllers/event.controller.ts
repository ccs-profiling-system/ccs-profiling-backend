/**
 * Event Controller
 * 
 * HTTP request/response handling for secretary portal event operations.
 * Provides CRUD operations for events with approval workflow support.
 * 
 * Requirements: 7.1-7.7, 7.26-7.29, 15.1, 15.4, 15.6
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  submitEvent,
  getEventParticipants,
} from '../services/event.service';
import {
  createEventSchema,
  updateEventSchema,
  eventFilterSchema,
} from '../schemas/event.schema';
import { paginationSchema, idParamSchema } from '../schemas/common.schemas';

/**
 * GET /api/secretary/events
 * 
 * Retrieve all events with pagination and filtering.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - event_type: Filter by event type
 * - status: Filter by approval status
 * - start_date: Filter by start date (YYYY-MM-DD)
 * - end_date: Filter by end date (YYYY-MM-DD)
 * - search: Search by event_name
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with paginated event list on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @throws Error if event retrieval fails
 * 
 * Requirements: 7.1, 7.20-7.22, 7.26, 15.1
 */
export async function getAllEventsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate pagination parameters
    const paginationResult = paginationSchema.safeParse(req.query);
    if (!paginationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paginationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    // Validate filter parameters
    const filterResult = eventFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: filterResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { page, limit } = paginationResult.data;
    const { event_type, status, start_date, end_date, search } = filterResult.data;

    // Get events from service
    const result = await getAllEvents(
      { page, limit },
      { event_type, status, start_date, end_date },
      search
    );

    // Return HTTP 200 with paginated data
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * GET /api/secretary/events/:id
 * 
 * Retrieve an event by ID.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with event data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when event not found
 * @throws Error if event retrieval fails
 * 
 * Requirements: 7.2, 7.26, 15.4
 */
export async function getEventByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Get event from service
    const event = await getEventById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Event not found',
        },
      });
      return;
    }

    // Return HTTP 200 with event data
    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * POST /api/secretary/events
 * 
 * Create a new event.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 201 for successful creation
 * @returns HTTP 400 for validation errors or invalid state transitions
 * @throws Error if event creation fails
 * 
 * Requirements: 7.3, 7.12-7.17, 7.27, 15.1
 */
export async function createEventController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const bodyResult = createEventSchema.safeParse(req.body);
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

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Create event via service
    const event = await createEvent(
      bodyResult.data,
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 201 with created event
    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    // Handle validation errors from service
    if (error instanceof Error && 
        (error.message.includes('Event date cannot be in the past') ||
         error.message.includes('Registration deadline must be before event date') ||
         error.message.includes('Max participants must be a positive integer'))) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message,
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * PUT /api/secretary/events/:id
 * 
 * Update an existing event.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with updated event data on success
 * @returns HTTP 400 for validation errors or invalid state transitions
 * @returns HTTP 404 when event not found
 * @returns HTTP 422 for business logic errors (e.g., cannot update approved event)
 * @throws Error if event update fails
 * 
 * Requirements: 7.4, 7.12-7.16, 7.19, 7.27-7.28, 15.4, 15.6
 */
export async function updateEventController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    // Validate request body
    const bodyResult = updateEventSchema.safeParse(req.body);
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

    const { id } = paramResult.data;

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Update event via service
    const event = await updateEvent(
      id,
      bodyResult.data,
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 200 with updated event
    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Event not found') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Event not found',
          },
        });
        return;
      }

      // Business logic errors (cannot update approved/rejected events)
      if (error.message.includes('Cannot update event with status')) {
        res.status(422).json({
          success: false,
          error: {
            message: error.message,
          },
        });
        return;
      }

      // Validation errors
      if (error.message.includes('Registration deadline must be before event date') ||
          error.message.includes('Max participants must be a positive integer')) {
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
          },
        });
        return;
      }
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * DELETE /api/secretary/events/:id
 * 
 * Delete an event (soft delete).
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with deleted event data on success
 * @returns HTTP 400 for validation errors
 * @returns HTTP 404 when event not found
 * @returns HTTP 422 for business logic errors (e.g., cannot delete approved event)
 * @throws Error if event deletion fails
 * 
 * Requirements: 7.5, 7.23-7.24, 7.27-7.28, 15.4, 15.6
 */
export async function deleteEventController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Delete event via service
    const event = await deleteEvent(id, userId, ipAddress, userAgent);

    // Return HTTP 200 with deleted event
    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Event not found') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Event not found',
          },
        });
        return;
      }

      // Business logic errors (cannot delete approved/pending events)
      if (error.message.includes('Cannot delete event with status')) {
        res.status(422).json({
          success: false,
          error: {
            message: error.message,
          },
        });
        return;
      }
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * POST /api/secretary/events/:id/submit
 * 
 * Submit an event for approval.
 * Changes status from 'draft' to 'pending_approval'.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with updated event data on success
 * @returns HTTP 400 for validation errors or invalid state transitions
 * @returns HTTP 404 when event not found
 * @throws Error if event submission fails
 * 
 * Requirements: 7.6, 7.18, 7.27-7.28, 15.4
 */
export async function submitEventController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Submit event via service
    const event = await submitEvent(id, userId, ipAddress, userAgent);

    // Return HTTP 200 with updated event
    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message === 'Event not found') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Event not found',
          },
        });
        return;
      }

      // Invalid state transition errors
      if (error.message.includes('Cannot submit event with status')) {
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
          },
        });
        return;
      }
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * GET /api/secretary/events/:id/participants
 * 
 * Retrieve participants for an event.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with participant list on success
 * @returns HTTP 400 for validation errors
 * @returns HTTP 404 when event not found
 * @throws Error if participant retrieval fails
 * 
 * Requirements: 7.7, 7.26, 15.4
 */
export async function getEventParticipantsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Get event participants from service
    const participants = await getEventParticipants(id);

    // Return HTTP 200 with participants
    res.status(200).json({
      success: true,
      data: participants,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Event not found') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Event not found',
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}
