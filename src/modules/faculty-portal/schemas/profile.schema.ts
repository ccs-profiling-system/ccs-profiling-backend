import { z } from 'zod';

/**
 * Update profile schema with optional fields
 * Validates email format and phone format
 */
export const updateProfileSchema = z.object({
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .optional(),
  email: z.string().email('Invalid email format').optional(),
  office_location: z.string().optional(),
  consultation_hours: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
