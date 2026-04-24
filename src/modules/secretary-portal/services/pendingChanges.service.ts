/**
 * Pending Changes Service
 * Business logic for pending changes management operations
 * 
 * Requirements: 9.1-9.13, 17.8
 */

import { PendingChangeDTO, PaginationParams, PaginatedResponse, ApprovalStatus } from '../types';
import { buildPaginationMeta } from '../utils/pagination';
import { logWithdraw } from '../utils/auditLogger';
import { ValidationError } from '../../../shared/errors';
import { db } from '../../../db';
import { pendingChanges } from '../../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Filter options for pending changes queries
 */
export interface PendingChangesFilters {
  entity_type?: string;
  status?: ApprovalStatus;
}

/**
 * Get all pending changes with pagination and filtering
 * 
 * @param pagination - Pagination parameters (page, limit)
 * @param filters - Filter options (entity_type, status)
 * @returns Paginated list of pending changes
 * 
 * Requirements: 9.1, 9.5-9.7, 9.11
 */
export async function getAllPendingChanges(
  pagination: PaginationParams,
  filters?: PendingChangesFilters
): Promise<PaginatedResponse<PendingChangeDTO>> {
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;
  
  // Build where conditions
  const conditions = [];
  
  if (filters?.entity_type) {
    conditions.push(eq(pendingChanges.entity_type, filters.entity_type));
  }
  
  if (filters?.status) {
    conditions.push(eq(pendingChanges.status, filters.status));
  }
  
  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pendingChanges)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  const total = countResult?.count || 0;
  
  // Get paginated data
  const data = await db
    .select()
    .from(pendingChanges)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(pendingChanges.created_at))
    .limit(limit)
    .offset(offset);
  
  // Build pagination metadata
  const meta = buildPaginationMeta(total, page, limit);
  
  return {
    data: data as PendingChangeDTO[],
    meta,
  };
}

/**
 * Withdraw a pending change
 * 
 * Changes status from 'pending_approval' to 'withdrawn'
 * Prevents withdrawal of changes with status 'approved' or 'rejected'
 * 
 * @param id - Pending change UUID
 * @param userId - ID of user withdrawing the change
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * @returns Updated pending change record
 * 
 * Requirements: 9.2, 9.8-9.10, 9.12-9.13, 17.8
 */
export async function withdrawPendingChange(
  id: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<PendingChangeDTO> {
  const result = await db.transaction(async (tx) => {
    // Validate the pending change exists
    const existing = await tx
      .select()
      .from(pendingChanges)
      .where(eq(pendingChanges.id, id))
      .limit(1);
    
    if (existing.length === 0) {
      throw new ValidationError('Pending change not found');
    }
    
    const oldValues = existing[0];
    
    // Validate state transition: only 'pending_approval' can be withdrawn
    if (oldValues.status === 'approved' || oldValues.status === 'rejected') {
      throw new ValidationError(
        `Cannot withdraw pending change with status '${oldValues.status}'`
      );
    }
    
    if (oldValues.status !== 'pending_approval') {
      throw new ValidationError(
        `Cannot withdraw pending change with status '${oldValues.status}'. Only pending_approval changes can be withdrawn.`
      );
    }
    
    // Update status to 'withdrawn'
    const [updated] = await tx
      .update(pendingChanges)
      .set({
        status: 'withdrawn',
        updated_at: new Date(),
      })
      .where(eq(pendingChanges.id, id))
      .returning();
    
    return updated;
  });
  
  // Log the withdrawal action
  await logWithdraw(userId, 'pending_change', id, ipAddress, userAgent);
  
  return result as PendingChangeDTO;
}
