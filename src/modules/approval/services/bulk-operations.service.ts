import { approvalRepository } from '../repositories/approval.repository';
import { backgroundJobRepository } from '../repositories/background-job.repository';
import { approvalService, InvalidOperationError } from './approval.service';
import { approvalStateMachine } from './approval-state-machine.service';
import { db } from '../../../db';
import { approvals, ApprovalStatus, type ApprovalStatusType } from '../../../db/schema/approvals';
import { JobType, JobStatus } from '../../../db/schema/backgroundJobs';
import { eq, and, isNull, inArray } from 'drizzle-orm';

/**
 * Result of a single approval operation in a bulk request
 */
export interface BulkOperationResult {
  approvalId: string;
  success: boolean;
  error?: string;
}

/**
 * Summary of a bulk operation
 */
export interface BulkOperationSummary {
  successful: BulkOperationResult[];
  failed: BulkOperationResult[];
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
}

/**
 * Response for queued background job
 */
export interface QueuedJobResponse {
  jobId: string;
  status: 'queued';
  message: string;
}

/**
 * Bulk operation mode
 */
export type BulkOperationMode = 'independent' | 'atomic';

/**
 * Bulk Operations Service
 * 
 * Handles bulk approval and rejection operations with support for:
 * - Independent mode: Process each request separately (default)
 * - Atomic mode: All-or-nothing transaction (max 50 items)
 * - Background job queueing for large operations (>20 items)
 * 
 * Requirements: 8.1-8.7, 12.1-12.4, 33.1-33.8
 */
export class BulkOperationsService {
  private readonly MAX_INDEPENDENT_ITEMS = 100;
  private readonly MAX_ATOMIC_ITEMS = 50;
  private readonly BACKGROUND_JOB_THRESHOLD = 20;

  /**
   * Bulk approve change requests
   * 
   * @param approvalIds - Array of approval IDs to approve
   * @param reviewerId - ID of the reviewing user (admin/chair)
   * @param atomic - Whether to use atomic mode (all-or-nothing)
   * @param departmentId - Optional department ID for chair scope
   * @returns Operation summary or queued job response
   * 
   * Requirements: 8.1-8.7, 12.1-12.4
   */
  async bulkApprove(
    approvalIds: string[],
    reviewerId: string,
    atomic: boolean = false,
    departmentId?: string
  ): Promise<BulkOperationSummary | QueuedJobResponse> {
    // Validate item count limits
    this.validateItemCount(approvalIds.length, atomic);

    // If >20 items, queue background job
    if (approvalIds.length > this.BACKGROUND_JOB_THRESHOLD) {
      return this.queueBulkApproveJob(approvalIds, reviewerId, atomic, departmentId);
    }

    // Process immediately
    if (atomic) {
      return this.bulkApproveAtomic(approvalIds, reviewerId, departmentId);
    } else {
      return this.bulkApproveIndependent(approvalIds, reviewerId, departmentId);
    }
  }

  /**
   * Bulk reject change requests
   * 
   * @param approvalIds - Array of approval IDs to reject
   * @param reviewerId - ID of the reviewing user (admin/chair)
   * @param comments - Required rejection comments
   * @param atomic - Whether to use atomic mode (all-or-nothing)
   * @param departmentId - Optional department ID for chair scope
   * @returns Operation summary or queued job response
   * 
   * Requirements: 8.1-8.7, 12.1-12.4
   */
  async bulkReject(
    approvalIds: string[],
    reviewerId: string,
    comments: string,
    atomic: boolean = false,
    departmentId?: string
  ): Promise<BulkOperationSummary | QueuedJobResponse> {
    // Validate comments are provided
    if (!comments || comments.trim().length === 0) {
      throw new InvalidOperationError('Comments are required when rejecting change requests');
    }

    // Validate item count limits
    this.validateItemCount(approvalIds.length, atomic);

    // If >20 items, queue background job
    if (approvalIds.length > this.BACKGROUND_JOB_THRESHOLD) {
      return this.queueBulkRejectJob(approvalIds, reviewerId, comments, atomic, departmentId);
    }

    // Process immediately
    if (atomic) {
      return this.bulkRejectAtomic(approvalIds, reviewerId, comments, departmentId);
    } else {
      return this.bulkRejectIndependent(approvalIds, reviewerId, comments, departmentId);
    }
  }

  /**
   * Bulk approve in independent mode (process each separately)
   * 
   * @param approvalIds - Array of approval IDs
   * @param reviewerId - Reviewer user ID
   * @param departmentId - Optional department ID for chair scope
   * @returns Operation summary
   */
  private async bulkApproveIndependent(
    approvalIds: string[],
    reviewerId: string,
    departmentId?: string
  ): Promise<BulkOperationSummary> {
    const successful: BulkOperationResult[] = [];
    const failed: BulkOperationResult[] = [];

    for (const approvalId of approvalIds) {
      try {
        // Validate department scope if provided
        if (departmentId) {
          await this.validateDepartmentScope(approvalId, departmentId);
        }

        // Approve the change request
        await approvalService.approveChangeRequest(approvalId, reviewerId);

        successful.push({
          approvalId,
          success: true,
        });
      } catch (error) {
        failed.push({
          approvalId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      successful,
      failed,
      totalProcessed: approvalIds.length,
      totalSuccessful: successful.length,
      totalFailed: failed.length,
    };
  }

  /**
   * Bulk reject in independent mode (process each separately)
   * 
   * @param approvalIds - Array of approval IDs
   * @param reviewerId - Reviewer user ID
   * @param comments - Rejection comments
   * @param departmentId - Optional department ID for chair scope
   * @returns Operation summary
   */
  private async bulkRejectIndependent(
    approvalIds: string[],
    reviewerId: string,
    comments: string,
    departmentId?: string
  ): Promise<BulkOperationSummary> {
    const successful: BulkOperationResult[] = [];
    const failed: BulkOperationResult[] = [];

    for (const approvalId of approvalIds) {
      try {
        // Validate department scope if provided
        if (departmentId) {
          await this.validateDepartmentScope(approvalId, departmentId);
        }

        // Reject the change request
        await approvalService.rejectChangeRequest(approvalId, reviewerId, comments);

        successful.push({
          approvalId,
          success: true,
        });
      } catch (error) {
        failed.push({
          approvalId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      successful,
      failed,
      totalProcessed: approvalIds.length,
      totalSuccessful: successful.length,
      totalFailed: failed.length,
    };
  }

  /**
   * Bulk approve in atomic mode (all-or-nothing transaction)
   * 
   * @param approvalIds - Array of approval IDs
   * @param reviewerId - Reviewer user ID
   * @param departmentId - Optional department ID for chair scope
   * @returns Operation summary
   */
  private async bulkApproveAtomic(
    approvalIds: string[],
    reviewerId: string,
    departmentId?: string
  ): Promise<BulkOperationSummary> {
    try {
      // Execute all operations in a transaction
      await db.transaction(async (tx) => {
        for (const approvalId of approvalIds) {
          // Validate department scope if provided
          if (departmentId) {
            await this.validateDepartmentScope(approvalId, departmentId);
          }

          // Fetch the approval
          const approval = await approvalRepository.findById(approvalId);
          
          if (!approval) {
            throw new InvalidOperationError(`Approval with ID ${approvalId} not found`);
          }

          // Validate state transition
          approvalStateMachine.assertValidTransition(
            approval.status as ApprovalStatusType,
            ApprovalStatus.APPROVED
          );

          // Approve using the approval service
          await approvalService.approveChangeRequest(approvalId, reviewerId);
        }
      });

      // All succeeded
      const successful = approvalIds.map(approvalId => ({
        approvalId,
        success: true,
      }));

      return {
        successful,
        failed: [],
        totalProcessed: approvalIds.length,
        totalSuccessful: approvalIds.length,
        totalFailed: 0,
      };
    } catch (error) {
      // All failed (transaction rolled back)
      const failed = approvalIds.map(approvalId => ({
        approvalId,
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      }));

      return {
        successful: [],
        failed,
        totalProcessed: approvalIds.length,
        totalSuccessful: 0,
        totalFailed: approvalIds.length,
      };
    }
  }

  /**
   * Bulk reject in atomic mode (all-or-nothing transaction)
   * 
   * @param approvalIds - Array of approval IDs
   * @param reviewerId - Reviewer user ID
   * @param comments - Rejection comments
   * @param departmentId - Optional department ID for chair scope
   * @returns Operation summary
   */
  private async bulkRejectAtomic(
    approvalIds: string[],
    reviewerId: string,
    comments: string,
    departmentId?: string
  ): Promise<BulkOperationSummary> {
    try {
      // Execute all operations in a transaction
      await db.transaction(async (tx) => {
        for (const approvalId of approvalIds) {
          // Validate department scope if provided
          if (departmentId) {
            await this.validateDepartmentScope(approvalId, departmentId);
          }

          // Fetch the approval
          const approval = await approvalRepository.findById(approvalId);
          
          if (!approval) {
            throw new InvalidOperationError(`Approval with ID ${approvalId} not found`);
          }

          // Validate state transition
          approvalStateMachine.assertValidTransition(
            approval.status as ApprovalStatusType,
            ApprovalStatus.REJECTED
          );

          // Reject using the approval service
          await approvalService.rejectChangeRequest(approvalId, reviewerId, comments);
        }
      });

      // All succeeded
      const successful = approvalIds.map(approvalId => ({
        approvalId,
        success: true,
      }));

      return {
        successful,
        failed: [],
        totalProcessed: approvalIds.length,
        totalSuccessful: approvalIds.length,
        totalFailed: 0,
      };
    } catch (error) {
      // All failed (transaction rolled back)
      const failed = approvalIds.map(approvalId => ({
        approvalId,
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      }));

      return {
        successful: [],
        failed,
        totalProcessed: approvalIds.length,
        totalSuccessful: 0,
        totalFailed: approvalIds.length,
      };
    }
  }

  /**
   * Queue a bulk approve job for background processing
   * 
   * @param approvalIds - Array of approval IDs
   * @param reviewerId - Reviewer user ID
   * @param atomic - Atomic mode flag
   * @param departmentId - Optional department ID
   * @returns Queued job response
   */
  private async queueBulkApproveJob(
    approvalIds: string[],
    reviewerId: string,
    atomic: boolean,
    departmentId?: string
  ): Promise<QueuedJobResponse> {
    const job = await backgroundJobRepository.create({
      job_type: JobType.BULK_APPROVE,
      status: JobStatus.QUEUED,
      payload: {
        approvalIds,
        reviewerId,
        atomic,
        departmentId,
      },
      initiated_by: reviewerId,
    });

    return {
      jobId: job.id,
      status: 'queued',
      message: `Bulk approve job queued for ${approvalIds.length} items. Job ID: ${job.id}`,
    };
  }

  /**
   * Queue a bulk reject job for background processing
   * 
   * @param approvalIds - Array of approval IDs
   * @param reviewerId - Reviewer user ID
   * @param comments - Rejection comments
   * @param atomic - Atomic mode flag
   * @param departmentId - Optional department ID
   * @returns Queued job response
   */
  private async queueBulkRejectJob(
    approvalIds: string[],
    reviewerId: string,
    comments: string,
    atomic: boolean,
    departmentId?: string
  ): Promise<QueuedJobResponse> {
    const job = await backgroundJobRepository.create({
      job_type: JobType.BULK_REJECT,
      status: JobStatus.QUEUED,
      payload: {
        approvalIds,
        reviewerId,
        comments,
        atomic,
        departmentId,
      },
      initiated_by: reviewerId,
    });

    return {
      jobId: job.id,
      status: 'queued',
      message: `Bulk reject job queued for ${approvalIds.length} items. Job ID: ${job.id}`,
    };
  }

  /**
   * Validate item count against limits
   * 
   * @param count - Number of items
   * @param atomic - Whether atomic mode is enabled
   * @throws InvalidOperationError if limits exceeded
   */
  private validateItemCount(count: number, atomic: boolean): void {
    if (atomic && count > this.MAX_ATOMIC_ITEMS) {
      throw new InvalidOperationError(
        `Atomic mode supports a maximum of ${this.MAX_ATOMIC_ITEMS} items. Received ${count} items.`
      );
    }

    if (!atomic && count > this.MAX_INDEPENDENT_ITEMS) {
      throw new InvalidOperationError(
        `Independent mode supports a maximum of ${this.MAX_INDEPENDENT_ITEMS} items. Received ${count} items.`
      );
    }

    if (count === 0) {
      throw new InvalidOperationError('At least one approval ID is required');
    }
  }

  /**
   * Validate that an approval belongs to the specified department
   * 
   * @param approvalId - Approval ID
   * @param departmentId - Expected department ID
   * @throws InvalidOperationError if department mismatch
   */
  private async validateDepartmentScope(
    approvalId: string,
    departmentId: string
  ): Promise<void> {
    const approval = await approvalRepository.findById(approvalId);

    if (!approval) {
      throw new InvalidOperationError(`Approval with ID ${approvalId} not found`);
    }

    if (approval.department_id !== departmentId) {
      throw new InvalidOperationError(
        `Approval ${approvalId} does not belong to department ${departmentId}. Authorization denied.`
      );
    }
  }
}

// Export singleton instance
export const bulkOperationsService = new BulkOperationsService();
