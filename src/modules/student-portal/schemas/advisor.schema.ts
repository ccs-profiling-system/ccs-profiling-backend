/**
 * Student Portal - Advisor Schemas
 * Zod validation schemas for advisor communication endpoints
 * 
 * Requirements: 23.1, 23.2, 26.2
 */

import { z } from 'zod';

/**
 * Schema for sending a message to advisor
 * 
 * Validates message content is not empty and does not exceed 2000 characters.
 * 
 * Requirements: 23.1, 23.2
 */
export const sendMessageSchema = z.object({
  message_content: z
    .string()
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(2000, 'Message content must not exceed 2000 characters'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/**
 * Schema for booking an advisor appointment
 * 
 * Validates appointment purpose is provided and does not exceed 500 characters.
 * 
 * Requirements: 26.2
 */
export const bookAppointmentSchema = z.object({
  slot_id: z.string().uuid('Invalid slot ID format'),
  purpose: z
    .string()
    .trim()
    .min(1, 'Appointment purpose is required')
    .max(500, 'Appointment purpose must not exceed 500 characters'),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
