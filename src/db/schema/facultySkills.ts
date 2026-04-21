import { pgTable, varchar, integer, index, uuid } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { faculty } from './faculty';

/**
 * Faculty Skills table schema
 * 
 * Stores faculty skills and competencies separately from the faculty profile.
 * Supports cascade delete to maintain referential integrity.
 * 
 * Note: This is separate from the student skills table to maintain clean separation
 * of concerns and avoid complex queries with mixed student/faculty data.
 * 
 * Skill categories are unified across students and faculty:
 * - technical: Programming languages, frameworks, tools
 * - soft: Communication, leadership, teamwork
 * - language: Spoken/written languages (English, Filipino, etc.)
 * - sports: Athletic skills and activities
 * - other: Any other skills not fitting above categories
 */
export const facultySkills = pgTable('faculty_skills', {
  id: uuidPrimaryKey(),
  faculty_id: uuid('faculty_id')
    .notNull()
    .references(() => faculty.id, { onDelete: 'cascade' }),
  skill_name: varchar('skill_name', { length: 200 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'technical', 'soft', 'language', 'sports', 'other'
  proficiency_level: varchar('proficiency_level', { length: 50 }), // 'beginner', 'intermediate', 'advanced', 'expert'
  years_of_experience: integer('years_of_experience'),
  ...timestamps,
}, (table) => ({
  // Index for query optimization
  facultyIdIdx: index('faculty_skills_faculty_id_idx').on(table.faculty_id),
}));
