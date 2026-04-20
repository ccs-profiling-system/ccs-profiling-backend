/**
 * Faculty Portal - Skills Validation Schemas
 * Zod schemas for validating faculty skills management requests
 * 
 * Unified skill categories across students and faculty:
 * - technical: Programming languages, frameworks, tools
 * - soft: Communication, leadership, teamwork
 * - language: Spoken/written languages
 * - sports: Athletic skills and activities
 * - other: Any other skills
 */

import { z } from 'zod';

/**
 * Skill category enum
 * Unified across students and faculty for consistency
 */
export const skillCategorySchema = z.enum([
  'technical',
  'soft',
  'language',
  'sports',
  'other',
], {
  errorMap: () => ({ message: 'Category must be one of: technical, soft, language, sports, other' }),
});

/**
 * Proficiency level enum
 */
export const proficiencyLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'expert',
], {
  errorMap: () => ({ message: 'Proficiency level must be one of: beginner, intermediate, advanced, expert' }),
});

/**
 * Individual skill schema
 */
export const skillSchema = z.object({
  skillName: z.string()
    .min(2, 'Skill name must be at least 2 characters')
    .max(200, 'Skill name must be at most 200 characters')
    .trim(),
  category: skillCategorySchema,
  proficiencyLevel: proficiencyLevelSchema,
  yearsOfExperience: z.number()
    .int('Years of experience must be an integer')
    .min(0, 'Years of experience cannot be negative')
    .max(50, 'Years of experience must be at most 50')
    .optional(),
});

/**
 * Update skills request schema
 * Replaces all existing skills with the provided list
 */
export const updateSkillsSchema = z.object({
  skills: z.array(skillSchema)
    .min(0, 'Skills array is required')
    .max(50, 'Cannot add more than 50 skills'),
});

// Type exports
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type ProficiencyLevel = z.infer<typeof proficiencyLevelSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type UpdateSkillsRequest = z.infer<typeof updateSkillsSchema>;
