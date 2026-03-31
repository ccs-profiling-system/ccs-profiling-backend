import { uuid, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { generateUUIDv7 } from '../../shared/utils/uuid';

/**
 * Common schema utilities for consistent table patterns
 * 
 * These utilities provide reusable schema patterns across all database tables:
 * - UUID v7 primary keys (time-ordered for better database performance)
 * - Timestamp fields (created_at, updated_at)
 * - Soft delete support (deleted_at)
 * 
 * Requirements: 23.1, 23.3
 */

/**
 * UUID v7 primary key field
 * Generates a time-ordered UUID v7 by default using a custom SQL function
 * 
 * Note: UUID v7 provides better database performance than random UUIDs (v4)
 * due to sequential ordering based on timestamps, which reduces index fragmentation.
 */
export const uuidPrimaryKey = () => 
  uuid('id').primaryKey().$defaultFn(() => generateUUIDv7());

/**
 * Standard timestamp fields for all entities
 * - created_at: Set automatically on record creation
 * - updated_at: Set automatically on record creation and updates
 */
export const timestamps = {
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
};

/**
 * Soft delete timestamp field
 * When set, indicates the record is logically deleted
 * Null value means the record is active
 */
export const softDelete = {
  deleted_at: timestamp('deleted_at'),
};

/**
 * Combined utility: timestamps + soft delete
 * Use this for entities that need both audit timestamps and soft delete
 */
export const timestampsWithSoftDelete = {
  ...timestamps,
  ...softDelete,
};
