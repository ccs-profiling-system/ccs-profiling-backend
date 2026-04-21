/**
 * Student Portal - Research Schemas
 * Zod validation schemas for research opportunity endpoints
 * 
 * Requirements: 15.3, 15.4
 */

import { z } from 'zod';

/**
 * Schema for applying to a research opportunity
 * 
 * Validates statement of interest field.
 * 
 * Requirements: 15.3, 15.4
 */
export const applyToOpportunitySchema = z.object({
  statement_of_interest: z
    .string()
    .min(1, 'Statement of interest is required')
    .max(5000, 'Statement of interest must not exceed 5000 characters')
    .trim(),
});

export type ApplyToOpportunityInput = z.infer<typeof applyToOpportunitySchema>;
