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
   */
  async log(options: AuditLogOptions, tx?: Database): Promise<void> {
    try {
      await this.auditLogRepository.create(
        {
          user_id: options.context.user_id,
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
    } catch (error) {
      // Log error but don't throw - audit logging should not break main operations
      console.error('Failed to create audit log:', error);
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
