/**
 * Student Portal - Notification Schemas
 * Zod validation schemas for notification operations
 * 
 * Requirements: 5.3, 5.4
 */

import { z } from 'zod';

/**
 * Mark notification as read schema
 * Validates notification ID for marking as read
 * 
 * Requirements: 5.3, 5.4
 */
export const markAsReadSchema = z.object({
  id: z.string().uuid('Invalid notification ID format'),
});

export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
