/**
 * Audit Log Module DTOs
 * Data Transfer Objects for audit logging
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

/**
 * AuditLogResponseDTO - Output returned to clients
 */
export interface AuditLogResponseDTO {
  id: string;
  user_id?: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * AuditLogListResponseDTO - Paginated list output
 */
export interface AuditLogListResponseDTO {
  data: AuditLogResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * AuditLogFilters - Query filters for listing audit logs
 */
export interface AuditLogFilters {
  user_id?: string;
  entity_type?: string;
  entity_id?: string;
  action_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}
