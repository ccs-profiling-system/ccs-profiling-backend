import { pgTable, varchar, uuid, text, jsonb, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { users } from './users';

/**
 * Audit Logs table schema
 * 
 * Stores comprehensive audit trail for all system activities.
 * Tracks who did what, when, and captures before/after state for data changes.
 * 
 * Requirements: 19.4, 23.2, 29.4, 29.9
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuidPrimaryKey(),
  
  // User who performed the action
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  
  // Action details
  action_type: varchar('action_type', { length: 50 }).notNull(), // 'create', 'update', 'delete', 'login', 'logout'
  entity_type: varchar('entity_type', { length: 100 }).notNull(), // 'student', 'faculty', 'event', 'research', etc.
  entity_id: uuid('entity_id'), // ID of the affected entity
  
  // State tracking (JSONB for flexible structure)
  before_state: jsonb('before_state'), // State before the action (null for create)
  after_state: jsonb('after_state'), // State after the action (null for delete)
  
  // Request metadata
  ip_address: varchar('ip_address', { length: 45 }), // IPv4 or IPv6
  user_agent: text('user_agent'), // Browser/client information
  
  ...timestamps,
}, (table) => ({
  // Indexes for query optimization (Requirements 29.4, 29.9)
  userIdIdx: index('audit_logs_user_id_idx').on(table.user_id),
  entityTypeEntityIdIdx: index('audit_logs_entity_type_entity_id_idx').on(table.entity_type, table.entity_id),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.created_at),
  actionTypeIdx: index('audit_logs_action_type_idx').on(table.action_type),
}));
