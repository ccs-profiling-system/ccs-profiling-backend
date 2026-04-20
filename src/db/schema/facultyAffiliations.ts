import { pgTable, varchar, date, boolean, index, uuid } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { faculty } from './faculty';

/**
 * Faculty Affiliations table schema
 * 
 * Stores faculty organization and professional memberships separately from the faculty profile.
 * Supports cascade delete to maintain referential integrity.
 * 
 * Note: This is separate from the student affiliations table to maintain clean separation
 * of concerns and avoid complex queries with mixed student/faculty data.
 * 
 * Affiliation types:
 * - professional: Professional organizations (e.g., ACM, IEEE, PSITE)
 * - academic: Academic societies and research groups
 * - community: Community service organizations
 * - other: Any other affiliations not fitting above categories
 * 
 * API Mapping Note:
 * - API uses "joinDate" but DB uses "start_date" for consistency with student affiliations
 * - Service layer handles the mapping between API and DB field names
 */
export const facultyAffiliations = pgTable('faculty_affiliations', {
  id: uuidPrimaryKey(),
  faculty_id: uuid('faculty_id')
    .notNull()
    .references(() => faculty.id, { onDelete: 'cascade' }),
  organization_name: varchar('organization_name', { length: 200 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'professional', 'academic', 'community', 'other'
  role: varchar('role', { length: 100 }),
  start_date: date('start_date').notNull(), // Maps to "joinDate" in API
  end_date: date('end_date'),
  is_active: boolean('is_active').default(true).notNull(),
  ...timestamps,
}, (table) => ({
  // Index for query optimization
  facultyIdIdx: index('faculty_affiliations_faculty_id_idx').on(table.faculty_id),
}));
