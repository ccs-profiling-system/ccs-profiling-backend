/**
 * Faculty Portal - Student Participation Validation Schemas
 * Zod schemas for validating student participation tracking requests
 * 
 * Participation Score Scale:
 * - 1: Minimal/No participation
 * - 2: Below average participation
 * - 3: Average participation
 * - 4: Above average participation
 * - 5: Excellent/Outstanding participation
 */

import { z } from 'zod';

/**
 * Query parameters for getting participation records
 */
export const getParticipationSchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

/**
 * Individual participation record schema
 */
export const participationRecordSchema = z.object({
  studentId: z.string()
    .uuid('Student ID must be a valid UUID'),
  participationScore: z.number()
    .int('Participation score must be an integer')
    .min(1, 'Participation score must be at least 1')
    .max(5, 'Participation score must be at most 5'),
  remarks: z.string()
    .max(500, 'Remarks must be at most 500 characters')
    .trim()
    .optional(),
});

/**
 * Submit participation records request schema
 */
export const submitParticipationSchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const participationDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Allow dates up to today (not in the future)
      return participationDate <= today;
    }, 'Participation date cannot be in the future'),
  records: z.array(participationRecordSchema)
    .min(1, 'At least one participation record is required')
    .max(100, 'Cannot submit more than 100 participation records at once')
    .refine((records) => {
      // Ensure no duplicate student IDs in the same submission
      const studentIds = records.map(r => r.studentId);
      const uniqueIds = new Set(studentIds);
      return studentIds.length === uniqueIds.size;
    }, 'Duplicate student IDs are not allowed in the same submission'),
});

// Type exports
export type GetParticipationQuery = z.infer<typeof getParticipationSchema>;
export type ParticipationRecord = z.infer<typeof participationRecordSchema>;
export type SubmitParticipationRequest = z.infer<typeof submitParticipationSchema>;
