/**
 * TypeScript types and interfaces for the Chair Portal module
 * 
 * This module defines core types used across the chair portal API including:
 * - Department scoping interfaces
 * - Pagination types
 * - Workflow state types
 * - Approval/rejection action types
 */

/**
 * Department scope interface for filtering data by department
 * Used to ensure multi-tenant data isolation
 */
export interface DepartmentScope {
  departmentId: string;
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata returned with paginated responses
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Generic paginated response wrapper
 * @template T - The type of items in the data array
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Approval action interface for approval workflows
 */
export interface ApprovalAction {
  approver_notes?: string;
}

/**
 * Rejection action interface for rejection workflows
 */
export interface RejectionAction {
  rejection_reason: string;
}

/**
 * Workflow state type for resources that require approval
 * - draft: Initial state, editable
 * - pending_approval: Submitted for approval, awaiting review
 * - approved: Approved by department chair
 * - rejected: Rejected by department chair
 */
export type WorkflowState = 'draft' | 'pending_approval' | 'approved' | 'rejected';
