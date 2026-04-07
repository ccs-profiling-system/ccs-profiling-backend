import { pgTable, varchar, integer, uuid, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { users } from './users';

/**
 * Uploads table schema
 * 
 * Stores file upload metadata for documents attached to various entities.
 * Tracks file information, storage location, and entity associations.
 * 
 */
export const uploads = pgTable('uploads', {
  id: uuidPrimaryKey(),
  file_name: varchar('file_name', { length: 255 }).notNull(), // Stored filename (with timestamp and UUID)
  original_name: varchar('original_name', { length: 255 }).notNull(), // Original uploaded filename
  file_type: varchar('file_type', { length: 100 }).notNull(), // MIME type (e.g., 'application/pdf', 'image/jpeg')
  file_size: integer('file_size').notNull(), // File size in bytes
  storage_path: varchar('storage_path', { length: 500 }).notNull(), // Full path to file in storage
  entity_type: varchar('entity_type', { length: 50 }).notNull(), // 'student', 'faculty', 'research', 'event'
  entity_id: uuid('entity_id').notNull(), // UUID of the associated entity
  uploaded_by: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }), // User who uploaded the file
  ...timestamps,
}, (table) => ({
  // Indexes for query optimization
  entityTypeIdx: index('uploads_entity_type_idx').on(table.entity_type),
  entityIdIdx: index('uploads_entity_id_idx').on(table.entity_id),
  // Composite index for efficient entity-specific queries
  entityCompositeIdx: index('uploads_entity_composite_idx').on(table.entity_type, table.entity_id),
  uploadedByIdx: index('uploads_uploaded_by_idx').on(table.uploaded_by),
}));
