/**
 * Student Portal - Advisor Routes
 * Route definitions for advisor communication endpoints
 * 
 * Provides endpoints for students to view advisor information, exchange messages,
 * view available appointment slots, and book appointments.
 * All routes require authentication and RBAC permission checks.
 * 
 * Requirements: 21.3, 22.5, 23.6, 24.5, 25.5, 26.8, 27.1, 27.2, 27.3, 27.4, 27.5
 */

import { Router } from 'express';
import { AdvisorController } from '../controllers/advisor.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create advisor routes
 * 
 * @param advisorController - Advisor controller instance
 * @returns Express router with advisor routes
 */
export function createAdvisorRoutes(advisorController: AdvisorController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/student/advisor
   * Get assigned advisor information
   * 
   * Permission: student.advisor.read
   * 
   * Returns information about the student's assigned advisor including
   * name, email, phone, office location, consultation hours, and specialization.
   * 
   * Response:
   * - 200: Advisor information retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 404: Not Found (no advisor assigned)
   * 
   * Requirements: 21.1, 21.3, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get('/', requirePermission('student.advisor.read'), advisorController.getAdvisorInfo);

  /**
   * GET /api/student/advisor/messages
   * Get message history with advisor
   * 
   * Permission: student.advisor.read
   * 
   * Returns paginated list of messages exchanged between student and advisor.
   * Messages are ordered by sent date descending (most recent first).
   * 
   * Query Parameters:
   * - page: number (default 1)
   * - limit: number (default 20, max 100)
   * 
   * Response:
   * - 200: Messages retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 404: Not Found (no advisor assigned)
   * 
   * Requirements: 22.1, 22.5, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/messages',
    requirePermission('student.advisor.read'),
    advisorController.getMessages
  );

  /**
   * POST /api/student/advisor/messages
   * Send message to advisor
   * 
   * Permission: student.advisor.message
   * 
   * Creates a message from student to their assigned advisor.
   * 
   * Request Body:
   * - message_content: string (required, not empty, max 2000 chars)
   * 
   * Response:
   * - 201: Message sent successfully
   * - 400: Bad Request (validation error or no advisor assigned)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * 
   * Requirements: 23.1, 23.6, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.post(
    '/messages',
    requirePermission('student.advisor.message'),
    advisorController.sendMessage
  );

  /**
   * GET /api/student/advisor/available-slots
   * Get available appointment slots
   * 
   * Permission: student.advisor.read
   * 
   * Returns all open time slots for the assigned advisor within the next 30 days.
   * Slots are ordered by date and start time ascending.
   * 
   * Response:
   * - 200: Available slots retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 404: Not Found (no advisor assigned)
   * 
   * Requirements: 24.1, 24.5, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/available-slots',
    requirePermission('student.advisor.read'),
    advisorController.getAvailableSlots
  );

  /**
   * GET /api/student/advisor/appointments
   * Get booked appointments
   * 
   * Permission: student.advisor.read
   * 
   * Returns all appointments the student has scheduled with their advisor.
   * Includes appointments with status 'scheduled' or 'completed'.
   * Appointments are ordered by date and start time descending (most recent first).
   * 
   * Response:
   * - 200: Appointments retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 404: Not Found (no advisor assigned)
   * 
   * Requirements: 25.1, 25.5, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/appointments',
    requirePermission('student.advisor.read'),
    advisorController.getAppointments
  );

  /**
   * POST /api/student/advisor/appointments
   * Book an appointment
   * 
   * Permission: student.advisor.appointment
   * 
   * Creates an appointment with the assigned advisor.
   * Validates slot availability, marks slot as booked, and logs the action.
   * 
   * Request Body:
   * - slot_id: string (required, UUID)
   * - purpose: string (required, not empty, max 500 chars)
   * 
   * Response:
   * - 201: Appointment booked successfully
   * - 400: Bad Request (validation error or no advisor assigned)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 404: Not Found (slot not found)
   * - 409: Conflict (slot already booked)
   * 
   * Requirements: 26.1, 26.8, 27.1, 27.2, 27.3, 27.4, 27.5, 29.1, 29.2, 29.3, 29.4, 29.5
   */
  router.post(
    '/appointments',
    requirePermission('student.advisor.appointment'),
    advisorController.bookAppointment
  );

  return router;
}
