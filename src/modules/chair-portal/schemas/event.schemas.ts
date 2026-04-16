/**
 * Event Validation Schemas for Chair Portal
 * Zod schemas for validating event-related input
 * 
 * Requirements: 6.5, 6.6, 6.11
 */

import { z } from 'zod';

/**
 * Schema for creating a new event
 * Validates all required fields for event creation
 */
export const createEventSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be at most 2000 characters'),
  event_type: z.string()
    .min(1, 'Event type is required')
    .max(100, 'Event type must be at most 100 characters'),
  event_date: z.string()
    .datetime('Event date must be a valid ISO 8601 datetime')
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be in YYYY-MM-DD format')),
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be at most 200 characters'),
  organizer: z.string()
    .min(1, 'Organizer is required')
    .max(200, 'Organizer must be at most 200 characters'),
  max_participants: z.number()
    .int('Max participants must be an integer')
    .positive('Max participants must be positive')
    .optional(),
  registration_deadline: z.string()
    .datetime('Registration deadline must be a valid ISO 8601 datetime')
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Registration deadline must be in YYYY-MM-DD format'))
    .optional(),
});

/**
 * Schema for updating an existing event
 * All fields are optional for partial updates
 */
export const updateEventSchema = z.object({
  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be at most 200 characters')
    .optional(),
  description: z.string()
    .min(1, 'Description cannot be empty')
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),
  event_type: z.string()
    .min(1, 'Event type cannot be empty')
    .max(100, 'Event type must be at most 100 characters')
    .optional(),
  event_date: z.string()
    .datetime('Event date must be a valid ISO 8601 datetime')
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be in YYYY-MM-DD format'))
    .optional(),
  location: z.string()
    .min(1, 'Location cannot be empty')
    .max(200, 'Location must be at most 200 characters')
    .optional(),
  organizer: z.string()
    .min(1, 'Organizer cannot be empty')
    .max(200, 'Organizer must be at most 200 characters')
    .optional(),
  max_participants: z.number()
    .int('Max participants must be an integer')
    .positive('Max participants must be positive')
    .optional(),
  registration_deadline: z.string()
    .datetime('Registration deadline must be a valid ISO 8601 datetime')
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Registration deadline must be in YYYY-MM-DD format'))
    .optional(),
});

/**
 * Schema for event filtering query parameters
 * Used for filtering event lists
 */
export const eventFilterSchema = z.object({
  type: z.string()
    .max(100, 'Event type must be at most 100 characters')
    .optional(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'cancelled'])
    .optional(),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
});
