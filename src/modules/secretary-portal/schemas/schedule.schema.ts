/**
 * Schedule Validation Schemas for Secretary Portal
 * Zod schemas for validating schedule-related input
 * 
 */

import { z } from 'zod';
import { dayEnum, semesterEnum } from './common.schemas';

/**
 * Schema for creating a new schedule
 * Validates all required fields for schedule creation
 * Includes validation for start_time before end_time
 * 
 */
export const createScheduleSchema = z
  .object({
    subject_id: z
      .string()
      .uuid('Subject ID must be a valid UUID')
      .min(1, 'Subject ID is required'),
    faculty_id: z
      .string()
      .uuid('Faculty ID must be a valid UUID')
      .min(1, 'Faculty ID is required'),
    room: z
      .string()
      .min(1, 'Room is required')
      .max(100, 'Room must be at most 100 characters'),
    day: dayEnum,
    start_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Expected HH:MM (24-hour format)'),
    end_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Expected HH:MM (24-hour format)'),
    semester: semesterEnum,
    academic_year: z
      .string()
      .regex(/^\d{4}-\d{4}$/, 'Invalid academic year format. Expected YYYY-YYYY (e.g., 2023-2024)')
      .min(1, 'Academic year is required'),
  })
  .refine(
    (data) => {
      // Validate start_time is before end_time
      const [startHour, startMinute] = data.start_time.split(':').map(Number);
      const [endHour, endMinute] = data.end_time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      return startMinutes < endMinutes;
    },
    {
      message: 'Start time must be before end time',
      path: ['start_time'],
    }
  );

/**
 * Schema for updating an existing schedule
 * All fields are optional for partial updates
 * Includes validation for start_time before end_time when both are provided
 * 
 */
export const updateScheduleSchema = z
  .object({
    instruction_id: z
      .string()
      .uuid('Instruction ID must be a valid UUID')
      .optional(),
    faculty_id: z
      .string()
      .uuid('Faculty ID must be a valid UUID')
      .optional(),
    room: z
      .string()
      .min(1, 'Room cannot be empty')
      .max(100, 'Room must be at most 100 characters')
      .optional(),
    day: dayEnum.optional(),
    start_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Expected HH:MM (24-hour format)')
      .optional(),
    end_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Expected HH:MM (24-hour format)')
      .optional(),
    semester: semesterEnum.optional(),
    academic_year: z
      .string()
      .regex(/^\d{4}-\d{4}$/, 'Invalid academic year format. Expected YYYY-YYYY (e.g., 2023-2024)')
      .optional(),
  })
  .refine(
    (data) => {
      // Only validate if both start_time and end_time are provided
      if (data.start_time && data.end_time) {
        const [startHour, startMinute] = data.start_time.split(':').map(Number);
        const [endHour, endMinute] = data.end_time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        return startMinutes < endMinutes;
      }
      return true;
    },
    {
      message: 'Start time must be before end time',
      path: ['start_time'],
    }
  );

/**
 * Schema for schedule filtering query parameters
 * Used for filtering schedule lists
 */
export const scheduleFilterSchema = z.object({
  semester: semesterEnum.optional(),
  academic_year: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Invalid academic year format. Expected YYYY-YYYY')
    .optional(),
  faculty_id: z
    .string()
    .uuid('Faculty ID must be a valid UUID')
    .optional(),
  room: z
    .string()
    .max(100, 'Room must be at most 100 characters')
    .optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type ScheduleFilterInput = z.infer<typeof scheduleFilterSchema>;
