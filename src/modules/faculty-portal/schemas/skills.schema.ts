import { z } from 'zod';

/**
 * Skill category enum validation
 * Valid values: technical, soft, language, sports, other
 * ✅ DECISION: Unified categories across students and faculty
 */
export const skillCategorySchema = z.enum(['technical', 'soft', 'language', 'sports', 'other']);

/**
 * Proficiency level enum validation
 * Valid values: beginner, intermediate, advanced, expert
 */
export const proficiencyLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);

/**
 * Individual skill schema
 * Required: skillName, category, proficiencyLevel
 * Optional: yearsOfExperience
 */
export const skillSchema = z.object({
  skillName: z
    .string()
    .min(2, 'Skill name must be at least 2 characters')
    .max(200, 'Skill name must not exceed 200 characters')
    .trim(),
  category: skillCategorySchema,
  proficiencyLevel: proficiencyLevelSchema,
  yearsOfExperience: z
    .number()
    .int('Years of experience must be an integer')
    .min(0, 'Years of experience cannot be negative')
    .max(50, 'Years of experience cannot exceed 50')
    .optional(),
});

/**
 * Update skills schema
 * Required: skills array
 */
export const updateSkillsSchema = z.object({
  skills: z.array(skillSchema),
});

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type ProficiencyLevel = z.infer<typeof proficiencyLevelSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type UpdateSkillsRequest = z.infer<typeof updateSkillsSchema>;
