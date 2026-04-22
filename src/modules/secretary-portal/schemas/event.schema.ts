/**
 * Event Validation Schemas for Secretary Portal
 * Zod schemas for validating event-related input
 * 
 * Requirements: 7.12-7.16
 */

import { z } from 'zod';
import { eventTypeEnum, approvalStatusEnum } from './common.schemas';

/**
 * Schema for creating a new event
 * Validates all required fields for event creation
 * Includes validation for event_date not in past and registration_deadline before event_date
 * 
 * Requirements: 7.12, 7.13, 7.14, 7.15, 7.16
 */
export const createEventSchema = z
  .object({
    event_name: z
      .string()
      .min(1, 'Event name is required')
      .max(200, 'Event name must be at most 200 characters'),
    event_type: eventTypeEnum,
    event_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD'),
    location: z
      .string()
      .min(1, 'Location is required')
      .max(200, 'Location must be at most 200 characters'),
    description: z
      .string()
      .max(2000, 'Description must be at most 2000 characters')
      .optional(),
    organizer: z
      .string()
      .max(200, 'Organizer must be at most 200 characters')
      .optional(),
    registration_deadline: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
      .optional(),
    max_participants: z
      .number()
      .int('Max participants must be an integer')
      .positive('Max participants must be a positive number')
      .optional(),
    contact_email: z
      .string()
      .email('Invalid email format')
      .optional(),
    contact_phone: z
      .string()
      .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
      .optional(),
  })
  .refine(
    (data) => {
      // Validate event_date is not in the past
      const eventDate = new Date(data.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      return eventDate >= today;
    },
    {
      message: 'Event date cannot be in the past',
      path: ['event_date'],
    }
  )
  .refine(
    (data) => {
      // Validate registration_deadline is before event_date if provided
      if (data.registration_deadline) {
        const registrationDate = new Date(data.registration_deadline);
        const eventDate = new Date(data.event_date);
        return registrationDate < eventDate;
      }
      return true;
    },
    {
      message: 'Registration deadline must be before event date',
      path: ['registration_deadline'],
    }
  );

/**
 * Schema for updating an existing event
 * All fields are optional for partial updates
 * Includes same validations as create schema when fields are provided
 * 
 * Requirements: 7.12, 7.13, 7.14, 7.15, 7.16
 */
export const updateEventSchema = z
  .object({
    event_name: z
      .string()
      .min(1, 'Event name cannot be empty')
      .max(200, 'Event name must be at most 200 characters')
      .optional(),
    event_type: eventTypeEnum.optional(),
    event_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
      .optional(),
    location: z
      .string()
      .min(1, 'Location cannot be empty')
      .max(200, 'Location must be at most 200 characters')
      .optional(),
    description: z
      .string()
      .max(2000, 'Description must be at most 2000 characters')
      .optional(),
    organizer: z
      .string()
      .max(200, 'Organizer must be at most 200 characters')
      .optional(),
    registration_deadline: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
      .optional(),
    max_participants: z
      .number()
      .int('Max participants must be an integer')
      .positive('Max participants must be a positive number')
      .optional(),
    contact_email: z
      .string()
      .email('Invalid email format')
      .optional(),
    contact_phone: z
      .string()
      .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
      .optional(),
  })
  .refine(
    (data) => {
      // Only validate if both registration_deadline and event_date are provided
      if (data.registration_deadline && data.event_date) {
        const registrationDate = new Date(data.registration_deadline);
        const eventDate = new Date(data.event_date);
        return registrationDate < eventDate;
      }
      return true;
    },
    {
      message: 'Registration deadline must be before event date',
      path: ['registration_deadline'],
    }
  );

/**
 * Schema for event filtering query parameters
 * Used for filtering event lists
 */
export const eventFilterSchema = z.object({
  event_type: eventTypeEnum.optional(),
  status: approvalStatusEnum.optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  search: z
    .string()
    .max(200, 'Search query must be at most 200 characters')
    .optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventFilterInput = z.infer<typeof eventFilterSchema>;
