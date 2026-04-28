/**
 * Schedule Validation Schemas for Chair Portal
 * Zod schemas for validating schedule-related input
 * 
 */

import { z } from 'zod';

/**
 * Schema for creating a new schedule
 * Validates all required fields for schedule creation
 */
export const createScheduleSchema = z.object({
  subject_code: z.string()
    .min(1, 'Subject code is required')
    .max(50, 'Subject code must be at most 50 characters'),
  faculty_id: z.string()
    .uuid('Invalid faculty ID format'),
  semester: z.enum(['1st', '2nd', 'summer'], {
    errorMap: () => ({ message: 'Semester must be one of: 1st, 2nd, summer' }),
  }),
  year: z.number()
    .int('Year must be an integer')
    .min(2000, 'Year must be 2000 or later')
    .max(2100, 'Year must be 2100 or earlier'),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], {
    errorMap: () => ({ message: 'Day must be a valid weekday' }),
  }),
  time_start: z.string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Start time must be in HH:MM or HH:MM:SS format'),
  time_end: z.string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'End time must be in HH:MM or HH:MM:SS format'),
  room: z.string()
    .min(1, 'Room is required')
    .max(100, 'Room must be at most 100 characters'),
}).refine(
  (data) => {
    // Validate that time_end is after time_start
    const start = data.time_start.split(':').map(Number);
    const end = data.time_end.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    return endMinutes > startMinutes;
  },
  {
    message: 'End time must be after start time',
    path: ['time_end'],
  }
);

/**
 * Schema for schedule filtering query parameters
 * Used for filtering schedule lists
 */
export const scheduleFilterSchema = z.object({
  semester: z.enum(['1st', '2nd', 'summer']).optional(),
  year: z.string()
    .regex(/^\d{4}$/)
    .transform(Number)
    .optional(),
  faculty_id: z.string()
    .uuid('Invalid faculty ID format')
    .optional(),
  subject_code: z.string()
    .max(50, 'Subject code must be at most 50 characters')
    .optional(),
});

/**
 * Schema for conflict checking
 * Validates parameters for checking schedule conflicts
 */
export const conflictCheckSchema = z.object({
  faculty_id: z.string()
    .uuid('Invalid faculty ID format'),
  room: z.string()
    .min(1, 'Room is required')
    .max(100, 'Room must be at most 100 characters'),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], {
    errorMap: () => ({ message: 'Day must be a valid weekday' }),
  }),
  time_start: z.string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Start time must be in HH:MM or HH:MM:SS format'),
  time_end: z.string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'End time must be in HH:MM or HH:MM:SS format'),
}).refine(
  (data) => {
    // Validate that time_end is after time_start
    const start = data.time_start.split(':').map(Number);
    const end = data.time_end.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    return endMinutes > startMinutes;
  },
  {
    message: 'End time must be after start time',
    path: ['time_end'],
  }
);
