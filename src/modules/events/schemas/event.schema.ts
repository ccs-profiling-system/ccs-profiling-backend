/**
 * Event Validation Schemas
 * Zod schemas for validating event input
 * 
 * Requirements: 21.2
 */

import { z } from 'zod';

/**
 * Schema for creating a new event
 * Validates all required fields and formats
 */
export const createEventSchema = z.object({
  event_name: z.string().min(1, 'Event name is required').max(255, 'Event name must be at most 255 characters'),
  event_type: z.enum(['seminar', 'workshop', 'defense', 'competition'], {
    errorMap: () => ({ message: 'Event type must be one of: seminar, workshop, defense, competition' }),
  }),
  description: z.string().optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be in YYYY-MM-DD format'),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Start time must be in HH:MM or HH:MM:SS format').optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'End time must be in HH:MM or HH:MM:SS format').optional(),
  location: z.string().max(255, 'Location must be at most 255 characters').optional(),
  max_participants: z.number().int().positive('Max participants must be a positive integer').optional(),
});

/**
 * Schema for updating an event
 * All fields are optional
 */
export const updateEventSchema = z.object({
  event_name: z.string().min(1, 'Event name cannot be empty').max(255, 'Event name must be at most 255 characters').optional(),
  event_type: z.enum(['seminar', 'workshop', 'defense', 'competition'], {
    errorMap: () => ({ message: 'Event type must be one of: seminar, workshop, defense, competition' }),
  }).optional(),
  description: z.string().optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be in YYYY-MM-DD format').optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Start time must be in HH:MM or HH:MM:SS format').optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'End time must be in HH:MM or HH:MM:SS format').optional(),
  location: z.string().max(255, 'Location must be at most 255 characters').optional(),
  max_participants: z.number().int().positive('Max participants must be a positive integer').optional(),
});

/**
 * Schema for event ID parameter validation
 */
export const eventIdParamSchema = z.object({
  id: z.string().uuid('Invalid event ID format'),
});

/**
 * Schema for participant ID parameter validation
 */
export const participantIdParamSchema = z.object({
  participantId: z.string().uuid('Invalid participant ID format'),
});

/**
 * Schema for event list query parameters
 */
export const eventListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  event_type: z.enum(['seminar', 'workshop', 'defense', 'competition']).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Schema for adding a participant
 */
export const addParticipantSchema = z.object({
  student_id: z.string().uuid('Invalid student ID format').optional(),
  faculty_id: z.string().uuid('Invalid faculty ID format').optional(),
  participation_role: z.string().max(100, 'Participation role must be at most 100 characters').optional(),
  attendance_status: z.enum(['registered', 'attended', 'absent', 'cancelled']).optional(),
}).refine(
  (data) => data.student_id || data.faculty_id,
  {
    message: 'Either student_id or faculty_id must be provided',
  }
).refine(
  (data) => !(data.student_id && data.faculty_id),
  {
    message: 'Cannot provide both student_id and faculty_id',
  }
);
