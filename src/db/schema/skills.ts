import { pgTable, varchar, integer, index, uuid } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { students } from './students';

/**
 * Skills table schema
 * 
 * Stores student skills and competencies separately from the student profile.
 * Supports cascade delete to maintain referential integrity.
 * 
 */
export const skills = pgTable('skills', {
  id: uuidPrimaryKey(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  skill_name: varchar('skill_name', { length: 200 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'technical', 'soft', 'sports', 'other'
  proficiency_level: varchar('proficiency_level', { length: 50 }), // 'beginner', 'intermediate', 'advanced', 'expert'
  years_of_experience: integer('years_of_experience'),
  ...timestamps,
}, (table) => ({
  // Index for query optimization
  studentIdIdx: index('skills_student_id_idx').on(table.student_id),
}));
