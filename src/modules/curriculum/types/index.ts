import { curriculum } from '../../../db/schema';

/**
 * Curriculum type from database schema
 */
export type Curriculum = typeof curriculum.$inferSelect;
export type NewCurriculum = typeof curriculum.$inferInsert;

/**
 * Curriculum status enum
 */
export enum CurriculumStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
