import { lessons } from '../../../db/schema';

/**
 * Lesson type from database schema
 */
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;

/**
 * Lesson type enum
 */
export enum LessonType {
  LECTURE = 'lecture',
  LABORATORY = 'laboratory',
  DISCUSSION = 'discussion',
  EXAMINATION = 'examination',
  PROJECT = 'project',
}

/**
 * Content type enum
 */
export enum ContentType {
  FILE = 'file',
  LINK = 'link',
}
