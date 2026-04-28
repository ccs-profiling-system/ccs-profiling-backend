import { z } from 'zod';

/**
 * Validation schemas for Rooms Module
 */

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  building: z.string().max(100).optional(),
  capacity: z.number().int().min(1).optional(),
  type: z.string().max(50).optional(),
  facilities: z.array(z.string()).optional().default([]),
  status: z.enum(['available', 'maintenance', 'reserved']).optional().default('available'),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  building: z.string().max(100).optional(),
  capacity: z.number().int().min(1).optional(),
  type: z.string().max(50).optional(),
  facilities: z.array(z.string()).optional(),
  status: z.enum(['available', 'maintenance', 'reserved']).optional(),
});

export const listRoomsQuerySchema = z.object({
  search: z.string().optional(),
  building: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(['available', 'maintenance', 'reserved']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
