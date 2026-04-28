import { approvalRepository, type ApprovalFilters, type PaginationOptions } from '../repositories/approval.repository';
import { approvalStateMachine } from './approval-state-machine.service';
import { departmentAssignmentService } from './department-assignment.service';
import { entityApplicationService } from './entity-application.service';
import { notificationService } from './notification.service';
import {
  type Approval,
  type InsertApproval,
  ApprovalStatus,
  type ApprovalStatusType,
  EntityType,
  type EntityTypeType,
  type CategoryType,
} from '../../../db/schema/approvals';
import { NotificationType } from '../../../db/schema/approvalNotifications';
import { db } from '../../../db';
import { students } from '../../../db/schema/students';
import { faculty } from '../../../db/schema/faculty';
import { events } from '../../../db/schema/events';
import { research } from '../../../db/schema/research';
import { eq } from 'drizzle-orm';
import { getDepartmentScopeAliases } from '../utils/departmentScope';

/**
 * Data for submitting a change request
 */
export interface SubmitChangeRequestData {
  entity_type: EntityTypeType;
  entity_id: string;
  category: CategoryType;
  change_details: Record<string, any>;
  idempotency_key?: string;
}

/**
 * Custom error for invalid operations
 */
export class InvalidOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOperationError';
  }
}

/**
 * Core Approval Service
 * 
 * Handles the main business logic for the approval workflow system.
 * Integrates with state machine, department assignment, entity application, and notification services.
 * 
 */
export class ApprovalService {
  /**
   * Submit a new change request
   * 
   * Creates a new approval with status 'pending', captures entity version,
   * stores original data snapshot, and determines department ID.
   * 
   * @param data - Change request data
   * @param userId - ID of the submitting user (secretary)
   * @returns Created approval record
   * 
   */
  async submitChangeRequest(
    data: SubmitChangeRequestData,
    userId: string
  ): Promise<Approval> {
    // Fetch target entity to capture version and original data
    const entity = await this.fetchEntity(data.entity_type, data.entity_id);
    
    if (!entity) {
      throw new InvalidOperationError(
        `${data.entity_type} with ID ${data.entity_id} not found`
      );
    }

    // Capture entity version (using updated_at as proxy for version)
    const entityVersion = entity.updated_at 
      ? new Date(entity.updated_at).getTime() 
      : Date.now();

    // Store original data snapshot
    const originalData = { ...entity };

    // Determine department ID from target entity
    const departmentId = await departmentAssignmentService.determineDepartmentId(
      data.entity_type,
      data.entity_id
    );

    // Create approval record with status 'pending'
    const approvalData: InsertApproval = {
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      category: data.category,
      change_details: data.change_details,
      original_data: originalData,
      status: ApprovalStatus.PENDING,
      submitter_id: userId,
      department_id: departmentId,
      entity_version: entityVersion,
      submission_timestamp: new Date(),
      idempotency_key: data.idempotency_key,
    };

    const approval = await approvalRepository.create(approvalData);

    return approval;
  }

  /**
   * Approve a change request
   * 
   * Validates state transition, updates status to 'approved',
   * applies changes to target entity, and creates notification.
   * 
   * @param approvalId - ID of the approval to approve
   * @param reviewerId - ID of the reviewing user (admin/chair)
   * @param comments - Optional approval comments
   * @param force - Force approval despite conflicts (skips conflict detection)
   * @returns Updated approval record
   * 
   */
  async approveChangeRequest(
    approvalId: string,
    reviewerId: string,
    comments?: string,
    force: boolean = false
  ): Promise<Approval> {
    // Fetch the approval
    const approval = await approvalRepository.findById(approvalId);
    
    if (!approval) {
      throw new InvalidOperationError(`Approval with ID ${approvalId} not found`);
    }

    // Validate state transition (must be pending or conflicted)
    approvalStateMachine.assertValidTransition(
      approval.status as ApprovalStatusType,
      ApprovalStatus.APPROVED
    );

    // Update status to 'approved'
    const updatedApproval = await approvalRepository.update(approvalId, {
      status: ApprovalStatus.APPROVED,
      reviewer_id: reviewerId,
      decision_timestamp: new Date(),
      comments: comments || null,
    });

    if (!updatedApproval) {
      throw new InvalidOperationError(`Failed to update approval ${approvalId}`);
    }

    // Apply changes to target entity
    try {
      await entityApplicationService.applyChanges(approvalId, force);
    } catch (error) {
      // Entity application service handles marking as failed/conflicted
      // Re-throw the error to inform the caller
      throw error;
    }

    // Create notification for submitter
    await notificationService.createApprovalNotification(
      updatedApproval,
      NotificationType.APPROVAL_APPROVED
    );

    // Fetch and return the final approval state
    const finalApproval = await approvalRepository.findById(approvalId);
    return finalApproval!;
  }

  /**
   * Reject a change request
   * 
   * Validates state transition, requires comments,
   * updates status to 'rejected', and creates notification.
   * 
   * @param approvalId - ID of the approval to reject
   * @param reviewerId - ID of the reviewing user (admin/chair)
   * @param comments - Required rejection comments
   * @returns Updated approval record
   * 
   */
  async rejectChangeRequest(
    approvalId: string,
    reviewerId: string,
    comments: string
  ): Promise<Approval> {
    // Validate comments are provided (required for rejection)
    if (!comments || comments.trim().length === 0) {
      throw new InvalidOperationError('Comments are required when rejecting a change request');
    }

    // Fetch the approval
    const approval = await approvalRepository.findById(approvalId);
    
    if (!approval) {
      throw new InvalidOperationError(`Approval with ID ${approvalId} not found`);
    }

    // Validate state transition (must be pending)
    approvalStateMachine.assertValidTransition(
      approval.status as ApprovalStatusType,
      ApprovalStatus.REJECTED
    );

    // Update status to 'rejected'
    const updatedApproval = await approvalRepository.update(approvalId, {
      status: ApprovalStatus.REJECTED,
      reviewer_id: reviewerId,
      decision_timestamp: new Date(),
      comments,
    });

    if (!updatedApproval) {
      throw new InvalidOperationError(`Failed to update approval ${approvalId}`);
    }

    // Create notification for submitter
    await notificationService.createApprovalNotification(
      updatedApproval,
      NotificationType.APPROVAL_REJECTED
    );

    return updatedApproval;
  }

  /**
   * Withdraw a pending change request
   * 
   * Validates status is 'pending' and updates status to 'withdrawn'.
   * Only the submitter can withdraw their own submission.
   * 
   * @param approvalId - ID of the approval to withdraw
   * @param userId - ID of the user attempting to withdraw (must be submitter)
   * @returns Updated approval record
   * 
   */
  async withdrawChangeRequest(approvalId: string, userId: string): Promise<Approval> {
    // Fetch the approval
    const approval = await approvalRepository.findById(approvalId);
    
    if (!approval) {
      throw new InvalidOperationError(`Approval with ID ${approvalId} not found`);
    }

    // Verify the user is the submitter
    if (approval.submitter_id !== userId) {
      throw new InvalidOperationError('Only the submitter can withdraw their own change request');
    }

    // Validate state transition (must be pending)
    if (!approvalStateMachine.canWithdraw(approval.status as ApprovalStatusType)) {
      throw new InvalidOperationError(
        `Cannot withdraw change request with status '${approval.status}'. Only pending requests can be withdrawn.`
      );
    }

    // Update status to 'withdrawn'
    const updatedApproval = await approvalRepository.update(approvalId, {
      status: ApprovalStatus.WITHDRAWN,
      decision_timestamp: new Date(),
    });

    if (!updatedApproval) {
      throw new InvalidOperationError(`Failed to update approval ${approvalId}`);
    }

    return updatedApproval;
  }

  /**
   * Get submissions for a specific user (secretary)
   * 
   * Returns only change requests created by the specified user,
   * with support for filtering and pagination.
   * 
   * @param userId - ID of the user (submitter)
   * @param filters - Optional filter criteria
   * @param pagination - Optional pagination options
   * @returns Paginated list of user's submissions
   * 
   */
  async getMySubmissions(
    userId: string,
    filters: Omit<ApprovalFilters, 'submitter_id'> = {},
    pagination: PaginationOptions = {}
  ) {
    // Add submitter_id filter to ensure only user's submissions are returned
    const submissionFilters: ApprovalFilters = {
      ...filters,
      submitter_id: userId,
    };

    return approvalRepository.findMany(submissionFilters, pagination);
  }

  /**
   * Get pending approvals for review
   * 
   * Returns all pending change requests, optionally scoped to a department (for chairs).
   * Supports filtering and pagination.
   * 
   * @param filters - Optional filter criteria
   * @param pagination - Optional pagination options
   * @param departmentId - Optional department ID for chair scope
   * @returns Paginated list of pending approvals
   * 
   */
  async getPendingApprovals(
    filters: Omit<ApprovalFilters, 'status'> = {},
    pagination: PaginationOptions = {},
    departmentId?: string
  ) {
    // Add department filter if provided (for chair scope)
    const pendingFilters: Omit<ApprovalFilters, 'status'> = departmentId
      ? { ...filters, department_id: getDepartmentScopeAliases(departmentId) }
      : filters;

    return approvalRepository.findPending(pendingFilters, pagination);
  }

  /**
   * Get approval history (processed approvals)
   * 
   * Returns all processed change requests (approved, rejected, withdrawn, failed, conflicted),
   * optionally scoped to a department (for chairs).
   * Supports filtering and pagination.
   * 
   * @param filters - Optional filter criteria
   * @param pagination - Optional pagination options
   * @param departmentId - Optional department ID for chair scope
   * @returns Paginated list of processed approvals
   * 
   */
  async getApprovalHistory(
    filters: ApprovalFilters = {},
    pagination: PaginationOptions = {},
    departmentId?: string
  ) {
    // Add department filter if provided (for chair scope)
    const historyFilters: ApprovalFilters = departmentId
      ? { ...filters, department_id: getDepartmentScopeAliases(departmentId) }
      : filters;

    return approvalRepository.findHistory(historyFilters, pagination);
  }

  /**
   * Get a single approval by ID
   * 
   * @param approvalId - ID of the approval
   * @returns Approval record or undefined if not found
   */
  async getApprovalById(approvalId: string): Promise<Approval | undefined> {
    return approvalRepository.findById(approvalId);
  }

  /**
   * Fetch entity by type and ID
   * 
   * @param entityType - Type of entity (student, faculty, event, research)
   * @param entityId - Entity ID
   * @returns Entity record or undefined if not found
   */
  private async fetchEntity(entityType: string, entityId: string): Promise<any> {
    switch (entityType) {
      case EntityType.STUDENT:
        return await db.query.students.findFirst({
          where: eq(students.id, entityId),
        });
      
      case EntityType.FACULTY:
        return await db.query.faculty.findFirst({
          where: eq(faculty.id, entityId),
        });
      
      case EntityType.EVENT:
        return await db.query.events.findFirst({
          where: eq(events.id, entityId),
        });
      
      case EntityType.RESEARCH:
        return await db.query.research.findFirst({
          where: eq(research.id, entityId),
        });
      
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
}

// Export singleton instance
export const approvalService = new ApprovalService();
