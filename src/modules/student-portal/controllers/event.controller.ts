/**
 * Student Portal - Event Controller
 * HTTP request handling layer for event management endpoints
 * 
 * Handles event browsing, registration, and unregistration.
 * Extracts student_id from JWT token for data scoping.
 * 
 * Requirements: 17.1, 18.1, 19.1, 20.1
 */

import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { paginationSchema } from '../schemas/common.schemas';
import { extractStudentId } from '../utils/studentScope';

export class EventController {
  constructor(private eventService: EventService) {}

  /**
   * List upcoming events
   * 
   * GET /api/student/events/upcoming
   * 
   * Query params:
   * - page: number (default 1)
   * - limit: number (default 10, max 50)
   * 
   * Requirements: 17.1
   */
  listUpcomingEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate pagination parameters
      const paginationParams = paginationSchema.parse({
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      });

      // Enforce max limit of 50
      if (paginationParams.limit > 50) {
        paginationParams.limit = 50;
      }

      const result = await this.eventService.listUpcomingEvents(paginationParams);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * List events student has registered for
   * 
   * GET /api/student/events/registered
   * 
   * Requirements: 18.1
   */
  listRegisteredEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = extractStudentId(req.user as any);

      const events = await this.eventService.listRegisteredEvents(studentId);

      res.status(200).json(events);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Register for an event
   * 
   * POST /api/student/events/:eventId/register
   * 
   * Requirements: 19.1
   */
  registerForEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { eventId } = req.params;
      const studentId = extractStudentId(req.user as any);

      await this.eventService.registerForEvent(eventId, studentId);

      res.status(201).json({ message: 'Successfully registered for event' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Unregister from an event
   * 
   * POST /api/student/events/:eventId/unregister
   * 
   * Requirements: 20.1
   */
  unregisterFromEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { eventId } = req.params;
      const studentId = extractStudentId(req.user as any);

      await this.eventService.unregisterFromEvent(eventId, studentId);

      res.status(200).json({ message: 'Successfully unregistered from event' });
    } catch (error) {
      next(error);
    }
  };
}
