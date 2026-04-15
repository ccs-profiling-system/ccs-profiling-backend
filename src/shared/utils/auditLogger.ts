/**
 * Audit Logger Utility
 * Centralized utility for logging audit events
 * 
 */

import { AuditLogRepository } from '../../modules/audit-logs/repositories/auditLog.repository';
import { Database } from '../../db';

export interface AuditContext {
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLogOptions {
  action_type: 'create' | 'update' | 'delete';
  entity_type: string;
  entity_id?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  context: AuditContext;
}

export class AuditLogger {
  constructor(
    private auditLogRepository: AuditLogRepository
  ) {}

  /**
   * Log an audit event
   * Captures before and after states as JSONB
   * Silently fails if user_id doesn't exist (logs warning instead of throwing)
   */
  async log(options: AuditLogOptions, tx?: Database): Promise<void> {
    try {
      // Create audit log - user_id can be undefined
      await this.auditLogRepository.create(
        {
          user_id: options.context.user_id || undefined,
          action_type: options.action_type,
          entity_type: options.entity_type,
          entity_id: options.entity_id,
          before_state: options.before_state,
          after_state: options.after_state,
          ip_address: options.context.ip_address,
          user_agent: options.context.user_agent,
        },
        tx
      );
    } catch (error: any) {
      // Log error but don't throw - audit logging should not break main operations
      console.error('Failed to create audit log:', error);
      
      // If it's a foreign key constraint error on user_id, log a more specific warning
      if (error?.code === '23503' && error?.constraint_name === 'audit_logs_user_id_users_id_fk') {
        console.warn(`Audit log skipped: user_id "${options.context.user_id}" not found in users table`);
      }
    }
  }

  /**
   * Log a create operation
   */
  async logCreate(
    entity_type: string,
    entity_id: string,
    after_state: Record<string, any>,
    context: AuditContext,
    tx?: Database
  ): Promise<void> {
    // If user_id doesn't exist, skip audit logging to avoid FK constraint errors
    // This can happen with dev tokens or deleted users
    if (context.user_id && (
      context.user_id === '00000000-0000-0000-0000-000000000000' || 
      context.user_id === 'dev-user-id'
    )) {
      console.warn('Skipping audit log for dev/invalid user');
      return;
    }

    await this.log(
      {
        action_type: 'create',
        entity_type,
        entity_id,
        after_state,
        context,
      },
      tx
    );
  }

  /**
   * Log an update operation
   */
  async logUpdate(
    entity_type: string,
    entity_id: string,
    before_state: Record<string, any>,
    after_state: Record<string, any>,
    context: AuditContext,
    tx?: Database
  ): Promise<void> {
    await this.log(
      {
        action_type: 'update',
        entity_type,
        entity_id,
        before_state,
        after_state,
        context,
      },
      tx
    );
  }

  /**
   * Log a delete operation
   */
  async logDelete(
    entity_type: string,
    entity_id: string,
    before_state: Record<string, any>,
    context: AuditContext,
    tx?: Database
  ): Promise<void> {
    await this.log(
      {
        action_type: 'delete',
        entity_type,
        entity_id,
        before_state,
        context,
      },
      tx
    );
  }
}
