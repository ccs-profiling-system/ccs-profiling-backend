/**
 * Search Validation Schemas
 * Zod schemas for search request validation
 * 
 */

import { z } from 'zod';

/**
 * Global search query schema
 */
export const globalSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['students', 'faculty', 'events', 'research']).optional(),
});

/**
 * Entity-specific search query schema
 */
export const entitySearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
});
