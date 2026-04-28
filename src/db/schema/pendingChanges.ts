import { pgTable, varchar, uuid, jsonb, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { users } from './users';

/**
 * Pending Changes table schema
 * 
 * Stores pending changes that require approval before being applied.
 * Tracks entity changes with old and new values for audit trail.
 * 
 */
export const pendingChanges = pgTable('pending_changes', {
  id: uuidPrimaryKey(),
  entity_type: varchar('entity_type', { length: 50 }).notNull(), // 'student', 'faculty', 'event', 'research', etc.
  entity_id: uuid('entity_id').notNull(), // ID of the entity being changed
  change_type: varchar('change_type', { length: 50 }).notNull(), // 'create', 'update', 'delete'
  old_values: jsonb('old_values'), // State before the change (null for create)
  new_values: jsonb('new_values').notNull(), // State after the change
  status: varchar('status', { length: 50 }).notNull().default('pending_approval'), // 'pending_approval', 'approved', 'rejected', 'withdrawn'
  created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }), // User who created the change
  ...timestamps,
}, (table) => ({
  // Indexes for query optimization
  entityTypeIdx: index('pending_changes_entity_type_idx').on(table.entity_type),
  entityIdIdx: index('pending_changes_entity_id_idx').on(table.entity_id),
  statusIdx: index('pending_changes_status_idx').on(table.status),
  createdByIdx: index('pending_changes_created_by_idx').on(table.created_by),
  createdAtIdx: index('pending_changes_created_at_idx').on(table.created_at),
}));
