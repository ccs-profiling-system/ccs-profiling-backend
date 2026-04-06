/**
 * Audit Log Validation Schemas
 * Zod schemas for audit log request validation
 * 
 * Requirements: 19.5, 21.2
 */

import { z } from 'zod';

/**
 * Schema for audit log ID parameter
 */
export const auditLogIdParamSchema = z.object({
  id: z.string().uuid('Invalid audit log ID format'),
});

/**
 * Schema for user ID parameter
 */
export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

/**
 * Schema for entity parameters
 */
export const entityParamSchema = z.object({
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().uuid('Invalid entity ID format'),
});

/**
 * Schema for audit log list query parameters
 */
export const auditLogListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  user_id: z.string().uuid().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  action_type: z.enum(['create', 'update', 'delete']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});
