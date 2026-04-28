import { syllabus } from '../../../db/schema';

/**
 * Syllabus type from database schema
 */
export type Syllabus = typeof syllabus.$inferSelect;
export type NewSyllabus = typeof syllabus.$inferInsert;

/**
 * Content type enum
 */
export enum ContentType {
  FILE = 'file',
  LINK = 'link',
}
