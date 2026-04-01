/**
 * Schedule Validation Schemas
 * Zod schemas for validating schedule input
 * 
 * Requirements: 21.2, 21.5
 */

import { z } from 'zod';

/**
 * Time format validation regex (HH:MM:SS or HH:MM)
 */
const timeFormatRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

/**
 * Schema for creating a new schedule
 * Validates all required fields and formats
 */
export const createScheduleSchema = z.object({
  schedule_type: z.enum(['class', 'exam', 'consultation'], {
    errorMap: () => ({ message: 'Schedule type must be class, exam, or consultation' }),
  }),
  instruction_id: z.string().uuid('Invalid instruction ID format').optional(),
  faculty_id: z.string().uuid('Invalid faculty ID format').optional(),
  room: z.string().min(1, 'Room is required').max(100, 'Room must be at most 100 characters'),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], {
    errorMap: () => ({ message: 'Invalid day of week' }),
  }),
  start_time: z.string().regex(timeFormatRegex, 'Start time must be in HH:MM or HH:MM:SS format'),
  end_time: z.string().regex(timeFormatRegex, 'End time must be in HH:MM or HH:MM:SS format'),
  semester: z.enum(['1st', '2nd', 'summer'], {
    errorMap: () => ({ message: 'Semester must be 1st, 2nd, or summer' }),
  }),
  academic_year: z.string().min(1, 'Academic year is required').max(20, 'Academic year must be at most 20 characters'),
});

/**
 * Schema for updating a schedule
 * All fields are optional
 */
export const updateScheduleSchema = z.object({
  schedule_type: z.enum(['class', 'exam', 'consultation'], {
    errorMap: () => ({ message: 'Schedule type must be class, exam, or consultation' }),
  }).optional(),
  instruction_id: z.string().uuid('Invalid instruction ID format').optional(),
  faculty_id: z.string().uuid('Invalid faculty ID format').optional(),
  room: z.string().min(1, 'Room is required').max(100, 'Room must be at most 100 characters').optional(),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], {
    errorMap: () => ({ message: 'Invalid day of week' }),
  }).optional(),
  start_time: z.string().regex(timeFormatRegex, 'Start time must be in HH:MM or HH:MM:SS format').optional(),
  end_time: z.string().regex(timeFormatRegex, 'End time must be in HH:MM or HH:MM:SS format').optional(),
  semester: z.enum(['1st', '2nd', 'summer'], {
    errorMap: () => ({ message: 'Semester must be 1st, 2nd, or summer' }),
  }).optional(),
  academic_year: z.string().min(1, 'Academic year is required').max(20, 'Academic year must be at most 20 characters').optional(),
});

/**
 * Schema for schedule ID parameter validation
 */
export const scheduleIdParamSchema = z.object({
  id: z.string().uuid('Invalid schedule ID format'),
});

/**
 * Schema for room parameter validation
 */
export const roomParamSchema = z.object({
  room: z.string().min(1, 'Room is required'),
});

/**
 * Schema for faculty ID parameter validation
 */
export const facultyIdParamSchema = z.object({
  facultyId: z.string().uuid('Invalid faculty ID format'),
});

/**
 * Schema for conflict check request
 */
export const conflictCheckSchema = z.object({
  room: z.string().min(1, 'Room is required'),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], {
    errorMap: () => ({ message: 'Invalid day of week' }),
  }),
  start_time: z.string().regex(timeFormatRegex, 'Start time must be in HH:MM or HH:MM:SS format'),
  end_time: z.string().regex(timeFormatRegex, 'End time must be in HH:MM or HH:MM:SS format'),
  semester: z.enum(['1st', '2nd', 'summer'], {
    errorMap: () => ({ message: 'Semester must be 1st, 2nd, or summer' }),
  }),
  academic_year: z.string().min(1, 'Academic year is required'),
  excludeId: z.string().uuid('Invalid schedule ID format').optional(),
});

/**
 * Schema for schedule list query parameters
 */
export const scheduleListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  room: z.string().optional(),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
  schedule_type: z.enum(['class', 'exam', 'consultation']).optional(),
  faculty_id: z.string().uuid('Invalid faculty ID format').optional(),
  instruction_id: z.string().uuid('Invalid instruction ID format').optional(),
  semester: z.enum(['1st', '2nd', 'summer']).optional(),
  academic_year: z.string().optional(),
});
