import { z } from 'zod';

/**
 * Validation schemas for Schedule Occurrences Module
 */

export const listOccurrencesQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
});

export const cancelOccurrenceSchema = z.object({
  cancellationReason: z.string().min(1, 'Cancellation reason is required').max(500),
});
