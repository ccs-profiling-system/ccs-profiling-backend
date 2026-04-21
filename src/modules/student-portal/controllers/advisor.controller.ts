/**
 * Student Portal - Advisor Controller
 * HTTP request handling layer for advisor communication endpoints
 * 
 * Handles advisor information retrieval, messaging, and appointment scheduling.
 * Extracts student_id from JWT token for data scoping.
 * 
 * Requirements: 21.1, 22.1, 23.1, 24.1, 25.1, 26.1
 */

import { Request, Response, NextFunction } from 'express';
import { AdvisorService } from '../services/advisor.service';
import { sendMessageSchema, bookAppointmentSchema } from '../schemas/advisor.schema';
import { paginationSchema } from '../schemas/common.schemas';
import { extractStudentId } from '../utils/studentScope';

export class AdvisorController {
  constructor(private advisorService: AdvisorService) {}

  /**
   * Get assigned advisor information
   * 
   * GET /api/student/advisor
   * 
   * Requirements: 21.1
   */
  getAdvisorInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = extractStudentId(req.user as any);

      const advisor = await this.advisorService.getAssignedAdvisor(studentId);

      res.status(200).json(advisor);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get message history with advisor
   * 
   * GET /api/student/advisor/messages
   * 
   * Query params:
   * - page: number (default 1)
   * - limit: number (default 20, max 100)
   * 
   * Requirements: 22.1
   */
  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = extractStudentId(req.user as any);

      // Validate pagination parameters
      const paginationParams = paginationSchema.parse({
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      });

      // Enforce max limit of 100
      if (paginationParams.limit > 100) {
        paginationParams.limit = 100;
      }

      const result = await this.advisorService.getMessageHistory(studentId, paginationParams);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send message to advisor
   * 
   * POST /api/student/advisor/messages
   * 
   * Body:
   * - message_content: string (required, max 2000 chars)
   * 
   * Requirements: 23.1
   */
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = extractStudentId(req.user as any);
      const userId = (req.user as any)?.userId;

      // Validate request body
      const validatedData = sendMessageSchema.parse(req.body);

      const message = await this.advisorService.sendMessage(
        studentId,
        userId,
        validatedData.message_content
      );

      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get available appointment slots
   * 
   * GET /api/student/advisor/available-slots
   * 
   * Requirements: 24.1
   */
  getAvailableSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = extractStudentId(req.user as any);

      const slots = await this.advisorService.getAvailableSlots(studentId);

      res.status(200).json(slots);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get booked appointments
   * 
   * GET /api/student/advisor/appointments
   * 
   * Requirements: 25.1
   */
  getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = extractStudentId(req.user as any);

      const appointments = await this.advisorService.getBookedAppointments(studentId);

      res.status(200).json(appointments);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Book an appointment
   * 
   * POST /api/student/advisor/appointments
   * 
   * Body:
   * - slot_id: string (required, UUID)
   * - purpose: string (required, max 500 chars)
   * 
   * Requirements: 26.1
   */
  bookAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = extractStudentId(req.user as any);
      const userId = (req.user as any)?.userId;

      // Validate request body
      const validatedData = bookAppointmentSchema.parse(req.body);

      // Get IP address for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress;

      const appointment = await this.advisorService.bookAppointment(
        studentId,
        userId,
        validatedData.slot_id,
        validatedData.purpose,
        ipAddress
      );

      res.status(201).json(appointment);
    } catch (error) {
      next(error);
    }
  };
}
