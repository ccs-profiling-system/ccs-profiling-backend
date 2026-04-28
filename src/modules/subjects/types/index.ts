import { subjects } from '../../../db/schema';

/**
 * Subject type from database schema
 */
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

/**
 * Subject type enum
 */
export enum SubjectType {
  CORE = 'core',
  ELECTIVE = 'elective',
  MAJOR = 'major',
  MINOR = 'minor',
  GENERAL_EDUCATION = 'general_education',
}

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
