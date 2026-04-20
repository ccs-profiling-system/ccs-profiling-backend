/**
 * Faculty Portal - Affiliations Validation Schemas
 * Zod schemas for validating faculty affiliations management requests
 * 
 * Note: API uses "joinDate" but database uses "start_date" for consistency.
 * Service layer handles the mapping between API and DB field names.
 * 
 * Affiliation types:
 * - professional: Professional organizations (ACM, IEEE, PSITE, etc.)
 * - academic: Academic societies and research groups
 * - community: Community service organizations
 * - other: Any other affiliations
 */

import { z } from 'zod';

/**
 * Affiliation type enum
 */
export const affiliationTypeSchema = z.enum([
  'professional',
  'academic',
  'community',
  'other',
], {
  errorMap: () => ({ message: 'Type must be one of: professional, academic, community, other' }),
});

/**
 * Individual affiliation schema
 */
export const affiliationSchema = z.object({
  organizationName: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name must be at most 200 characters')
    .trim(),
  type: affiliationTypeSchema,
  role: z.string()
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role must be at most 100 characters')
    .trim(),
  joinDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Join date must be in YYYY-MM-DD format')
    .refine((date) => {
      const joinDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return joinDate <= today;
    }, 'Join date cannot be in the future'),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  isActive: z.boolean().optional().default(true),
}).refine((data) => {
  // If endDate is provided, it must be after joinDate
  if (data.endDate) {
    const joinDate = new Date(data.joinDate);
    const endDate = new Date(data.endDate);
    return endDate > joinDate;
  }
  return true;
}, {
  message: 'End date must be after join date',
  path: ['endDate'],
});

/**
 * Update affiliations request schema
 * Replaces all existing affiliations with the provided list
 */
export const updateAffiliationsSchema = z.object({
  affiliations: z.array(affiliationSchema)
    .min(0, 'Affiliations array is required')
    .max(30, 'Cannot add more than 30 affiliations'),
});

// Type exports
export type AffiliationType = z.infer<typeof affiliationTypeSchema>;
export type Affiliation = z.infer<typeof affiliationSchema>;
export type UpdateAffiliationsRequest = z.infer<typeof updateAffiliationsSchema>;
