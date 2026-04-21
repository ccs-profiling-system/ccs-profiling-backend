/**
 * Student Portal - Profile Schemas
 * Zod validation schemas for student profile operations
 * 
 * Requirements: 1.2, 1.3, 1.4
 */

import { z } from 'zod';
import { optionalEmailSchema, optionalPhoneSchema } from './common.schemas';

/**
 * Update profile schema
 * Validates email and phone formats for profile updates
 * 
 * Requirements: 1.2, 1.3, 1.4
 */
export const updateProfileSchema = z.object({
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
