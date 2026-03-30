import { uuid, timestamp } from 'drizzle-orm/pg-core';

/**
 * Common schema utilities for consistent table patterns
 * 
 * These utilities provide reusable schema patterns across all database tables:
 * - UUID primary keys
 * - Timestamp fields (created_at, updated_at)
 * - Soft delete support (deleted_at)
 */

/**
 * UUID primary key field
 * Generates a random UUID by default
 */
export const uuidPrimaryKey = () => 
  uuid('id').primaryKey().defaultRandom();

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
