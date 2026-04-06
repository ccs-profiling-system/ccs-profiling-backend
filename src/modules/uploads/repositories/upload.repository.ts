/**
 * Upload Repository
 * Database access layer for upload operations
 * 
 * Requirements: 20.1, 20.6
 */

import { eq, and } from 'drizzle-orm';
import { Database } from '../../../db';
import { uploads } from '../../../db/schema';

export interface CreateUploadData {
  id?: string; // Optional UUID v7, generated if not provided
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  entity_type: string;
  entity_id: string;
  uploaded_by?: string;
}

export class UploadRepository {
  constructor(private db: Database) {}

  /**
   * Find upload by UUID
   * Requirement: 20.1
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(uploads)
      .where(eq(uploads.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find all uploads for a specific entity
   * Requirement: 20.1
   */
  async findByEntityId(entityType: string, entityId: string) {
    const result = await this.db
      .select()
      .from(uploads)
      .where(
        and(
          eq(uploads.entity_type, entityType),
          eq(uploads.entity_id, entityId)
        )
      )
      .orderBy(uploads.created_at);

    return result;
  }

  /**
   * Create a new upload record
   * Requirement: 20.1
   */
  async create(data: CreateUploadData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(uploads).values(data).returning();

    return result[0];
  }

  /**
   * Delete upload by ID
   * Requirement: 20.6
   */
  async delete(id: string) {
    await this.db
      .delete(uploads)
      .where(eq(uploads.id, id));
  }
}
