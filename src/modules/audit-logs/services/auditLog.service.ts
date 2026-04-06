/**
 * Audit Log Service
 * Business logic layer for audit log operations
 * 
 * Requirements: 19.5, 30.2
 */

import { AuditLogRepository } from '../repositories/auditLog.repository';
import { NotFoundError } from '../../../shared/errors';
import {
  AuditLogResponseDTO,
  AuditLogListResponseDTO,
  AuditLogFilters,
} from '../types';

export class AuditLogService {
  constructor(private auditLogRepository: AuditLogRepository) {}

  /**
   * Get audit log by ID
   * Requirement: 19.5
   */
  async getAuditLog(id: string): Promise<AuditLogResponseDTO> {
    const auditLog = await this.auditLogRepository.findById(id);
    if (!auditLog) {
      throw new NotFoundError('Audit log not found');
    }
    return this.toResponseDTO(auditLog);
  }

  /**
   * List audit logs by user ID
   * Requirement: 19.5
   */
  async listAuditLogsByUser(
    userId: string,
    filters?: AuditLogFilters
  ): Promise<AuditLogListResponseDTO> {
    const result = await this.auditLogRepository.findByUserId(userId, filters);
    return {
      data: result.data.map((log) => this.toResponseDTO(log)),
      meta: result.meta,
    };
  }

  /**
   * List audit logs by entity
   * Requirement: 19.5
   */
  async listAuditLogsByEntity(
    entityType: string,
    entityId: string,
    filters?: AuditLogFilters
  ): Promise<AuditLogListResponseDTO> {
    const result = await this.auditLogRepository.findByEntity(
      entityType,
      entityId,
      filters
    );
    return {
      data: result.data.map((log) => this.toResponseDTO(log)),
      meta: result.meta,
    };
  }

  /**
   * List audit logs with date range and filters
   * Requirement: 19.5
   */
  async listAuditLogs(filters: AuditLogFilters): Promise<AuditLogListResponseDTO> {
    const result = await this.auditLogRepository.findByDateRange(filters);
    return {
      data: result.data.map((log) => this.toResponseDTO(log)),
      meta: result.meta,
    };
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(auditLog: any): AuditLogResponseDTO {
    return {
      id: auditLog.id,
      user_id: auditLog.user_id || undefined,
      action_type: auditLog.action_type,
      entity_type: auditLog.entity_type,
      entity_id: auditLog.entity_id || undefined,
      before_state: auditLog.before_state || undefined,
      after_state: auditLog.after_state || undefined,
      ip_address: auditLog.ip_address || undefined,
      user_agent: auditLog.user_agent || undefined,
      created_at: auditLog.created_at.toISOString(),
    };
  }
}
