import { z } from 'zod';

/**
 * Get participation schema
 * Optional: date (YYYY-MM-DD format)
 */
export const getParticipationSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

/**
 * Individual participation record schema
 * Required: studentId, participationScore
 * Optional: remarks
 */
export const participationRecordSchema = z.object({
  studentId: z.string().uuid('Student ID must be a valid UUID'),
  participationScore: z
    .number()
    .int('Participation score must be an integer')
    .min(1, 'Participation score must be at least 1')
    .max(5, 'Participation score must not exceed 5'),
  remarks: z
    .string()
    .max(500, 'Remarks must not exceed 500 characters')
    .trim()
    .optional(),
});

/**
 * Submit participation schema
 * Required: date, records array
 */
export const submitParticipationSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  records: z.array(participationRecordSchema).min(1, 'At least one participation record is required'),
});

export type GetParticipationQuery = z.infer<typeof getParticipationSchema>;
export type ParticipationRecord = z.infer<typeof participationRecordSchema>;
export type SubmitParticipationRequest = z.infer<typeof submitParticipationSchema>;
