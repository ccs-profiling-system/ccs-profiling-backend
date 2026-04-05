/**
 * Event Controller
 * HTTP request/response handling for event operations
 * 
 * Requirements: 11.1, 11.6, 30.2
 */

import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { ValidationError } from '../../../shared/errors';
import {
  createEventSchema,
  updateEventSchema,
  eventIdParamSchema,
  participantIdParamSchema,
  eventListQuerySchema,
  addParticipantSchema,
} from '../schemas/event.schema';

export class EventController {
  constructor(private eventService: EventService) {}

  /**
   * GET /api/v1/admin/events
   * List events with pagination and filters
   * Requirements: 11.1, 30.2
   */
  listEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = eventListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.eventService.listEvents(filters);

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
   * GET /api/v1/admin/events/:id
   * Get event by ID
   * Requirements: 11.1, 30.2
   */
  getEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = eventIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid event ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const event = await this.eventService.getEvent(id);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/events
   * Create a new event
   * Requirements: 11.1, 30.2
   */
  createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = createEventSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const data = validationResult.data;

      const event = await this.eventService.createEvent(data);

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/events/:id
   * Update event by ID
   * Requirements: 11.1, 30.2
   */
  updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = eventIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid event ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateEventSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const event = await this.eventService.updateEvent(id, data);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/events/:id
   * Delete event by ID (soft delete)
   * Requirements: 11.1, 30.2
   */
  deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = eventIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid event ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.eventService.deleteEvent(id);

      res.json({
        success: true,
        data: {
          message: 'Event deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/events/:id/participants
   * Get all participants for an event
   * Requirements: 11.6, 30.2
   */
  getParticipants = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = eventIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid event ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const participants = await this.eventService.getParticipants(id);

      res.json({
        success: true,
        data: participants,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/events/:id/participants
   * Add participant to event
   * Requirements: 11.6, 30.2
   */
  addParticipant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = eventIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid event ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = addParticipantSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const participant = await this.eventService.addParticipant(id, data);

      res.status(201).json({
        success: true,
        data: participant,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/events/:id/participants/:participantId
   * Remove participant from event
   * Requirements: 11.6, 30.2
   */
  removeParticipant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate event ID parameter
      const eventIdValidation = eventIdParamSchema.safeParse({ id: req.params.id });
      if (!eventIdValidation.success) {
        throw new ValidationError('Invalid event ID', eventIdValidation.error.errors);
      }

      // Validate participant ID parameter
      const participantIdValidation = participantIdParamSchema.safeParse(req.params);
      if (!participantIdValidation.success) {
        throw new ValidationError('Invalid participant ID', participantIdValidation.error.errors);
      }

      const { id } = eventIdValidation.data;
      const { participantId } = participantIdValidation.data;

      await this.eventService.removeParticipant(id, participantId);

      res.json({
        success: true,
        data: {
          message: 'Participant removed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
