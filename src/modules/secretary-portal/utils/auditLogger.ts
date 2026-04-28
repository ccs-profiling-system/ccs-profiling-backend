/**
 * Audit Logger Utility
 * Provides audit logging functionality for secretary portal actions
 * 
 */

import { auditLogRepository } from '../../audit-logs';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'submit'
  | 'withdraw'
  | 'upload'
  | 'download'
  | 'generate';

export type AuditEntityType =
  | 'student'
  | 'faculty'
  | 'schedule'
  | 'document'
  | 'event'
  | 'research'
  | 'pending_change'
  | 'report';

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an action to the audit log
 * 
 * Records all required fields:
 * - user_id: User who performed the action
 * - action: Type of action (create, update, delete, submit, withdraw, upload, download, generate)
 * - entity_type: Type of entity affected (student, faculty, schedule, document, event, research, pending_change)
 * - entity_id: ID of the affected record
 * - timestamp: Automatically recorded by database
 * - ip_address: IP address of the request
 * - old_values: State before the action (for update/delete)
 * - new_values: State after the action (for create/update)
 * 
 * Persists to Database asynchronously (non-blocking)
 * Handles logging failures gracefully without throwing errors
 * 
 * @param data - Audit log data
 * @returns Promise that resolves when log is created (or fails silently)
 * 
 */
export async function logAction(data: AuditLogData): Promise<void> {
  try {
    // Persist to Database asynchronously (non-blocking)
    await auditLogRepository.create({
      user_id: data.userId,
      action_type: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId,
      before_state: data.oldValues,
      after_state: data.newValues,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
    });
  } catch (error) {
    // Handle logging failures gracefully
    // Log to console but don't throw error to avoid blocking API responses
    console.error('Audit logging failed:', error);
  }
}

/**
 * Log a create action
 * 
 * @param userId - User who created the entity
 * @param entityType - Type of entity created
 * @param entityId - ID of the created entity
 * @param newValues - New entity values
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * 
 */
export async function logCreate(
  userId: string | undefined,
  entityType: AuditEntityType,
  entityId: string,
  newValues: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAction({
    userId,
    action: 'create',
    entityType,
    entityId,
    newValues,
    ipAddress,
    userAgent,
  });
}

/**
 * Log an update action
 * 
 * @param userId - User who updated the entity
 * @param entityType - Type of entity updated
 * @param entityId - ID of the updated entity
 * @param oldValues - Old entity values
 * @param newValues - New entity values
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * 
 */
export async function logUpdate(
  userId: string | undefined,
  entityType: AuditEntityType,
  entityId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAction({
    userId,
    action: 'update',
    entityType,
    entityId,
    oldValues,
    newValues,
    ipAddress,
    userAgent,
  });
}

/**
 * Log a delete action
 * 
 * @param userId - User who deleted the entity
 * @param entityType - Type of entity deleted
 * @param entityId - ID of the deleted entity
 * @param oldValues - Old entity values
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * 
 */
export async function logDelete(
  userId: string | undefined,
  entityType: AuditEntityType,
  entityId: string,
  oldValues: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAction({
    userId,
    action: 'delete',
    entityType,
    entityId,
    oldValues,
    ipAddress,
    userAgent,
  });
}

/**
 * Log a submit action (for approval workflows)
 * 
 * @param userId - User who submitted the entity
 * @param entityType - Type of entity submitted
 * @param entityId - ID of the submitted entity
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * 
 */
export async function logSubmit(
  userId: string | undefined,
  entityType: AuditEntityType,
  entityId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAction({
    userId,
    action: 'submit',
    entityType,
    entityId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log a withdraw action (for approval workflows)
 * 
 * @param userId - User who withdrew the entity
 * @param entityType - Type of entity withdrawn
 * @param entityId - ID of the withdrawn entity
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * 
 */
export async function logWithdraw(
  userId: string | undefined,
  entityType: AuditEntityType,
  entityId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAction({
    userId,
    action: 'withdraw',
    entityType,
    entityId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log a file upload action
 * 
 * @param userId - User who uploaded the file
 * @param entityType - Type of entity the file belongs to
 * @param entityId - ID of the entity the file belongs to
 * @param fileMetadata - File metadata
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * 
 */
export async function logUpload(
  userId: string | undefined,
  entityType: AuditEntityType,
  entityId: string,
  fileMetadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAction({
    userId,
    action: 'upload',
    entityType,
    entityId,
    newValues: fileMetadata,
    ipAddress,
    userAgent,
  });
}

/**
 * Log a file download action
 * 
 * @param userId - User who downloaded the file
 * @param entityType - Type of entity the file belongs to
 * @param entityId - ID of the entity the file belongs to
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * 
 */
export async function logDownload(
  userId: string | undefined,
  entityType: AuditEntityType,
  entityId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAction({
    userId,
    action: 'download',
    entityType,
    entityId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log a report generation action
 * 
 * @param userId - User who generated the report
 * @param reportType - Type of report generated
 * @param filters - Report filters
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent of the request
 * 
 */
export async function logReportGeneration(
  userId: string | undefined,
  reportType: string,
  filters: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAction({
    userId,
    action: 'generate',
    entityType: 'report',
    newValues: { reportType, filters },
    ipAddress,
    userAgent,
  });
}

/**
 * Extract IP address from Express request
 * 
 * @param req - Express request object
 * @returns IP address
 */
export function extractIpAddress(req: any): string | undefined {
  return (
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress
  );
}

/**
 * Extract user agent from Express request
 * 
 * @param req - Express request object
 * @returns User agent string
 */
export function extractUserAgent(req: any): string | undefined {
  return req.headers['user-agent'];
}
