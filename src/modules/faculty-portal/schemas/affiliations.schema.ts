import { z } from 'zod';

/**
 * Affiliation type enum validation
 * Valid values: professional, academic, community, other
 */
export const affiliationTypeSchema = z.enum(['professional', 'academic', 'community', 'other']);

/**
 * Individual affiliation schema
 * Required: organizationName, type, role, joinDate
 * Optional: endDate, isActive
 * ✅ DECISION: DB uses start_date, API uses joinDate - map in service layer
 */
export const affiliationSchema = z
  .object({
    organizationName: z
      .string()
      .min(2, 'Organization name must be at least 2 characters')
      .max(200, 'Organization name must not exceed 200 characters')
      .trim(),
    type: affiliationTypeSchema,
    role: z
      .string()
      .min(2, 'Role must be at least 2 characters')
      .max(100, 'Role must not exceed 100 characters')
      .trim(),
    joinDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Join date must be in YYYY-MM-DD format')
      .refine(
        (date) => {
          const joinDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return joinDate <= today;
        },
        { message: 'Join date cannot be in the future' }
      ),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .optional(),
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.endDate) {
        const joinDate = new Date(data.joinDate);
        const endDate = new Date(data.endDate);
        return endDate > joinDate;
      }
      return true;
    },
    {
      message: 'End date must be after join date',
      path: ['endDate'],
    }
  );

/**
 * Update affiliations schema
 * Required: affiliations array
 */
export const updateAffiliationsSchema = z.object({
  affiliations: z.array(affiliationSchema),
});

export type AffiliationType = z.infer<typeof affiliationTypeSchema>;
export type Affiliation = z.infer<typeof affiliationSchema>;
export type UpdateAffiliationsRequest = z.infer<typeof updateAffiliationsSchema>;
