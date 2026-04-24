import { bulkOperationsService, type BulkOperationSummary } from '../services/bulk-operations.service';
import { JobType, type JobTypeType } from '../../../db/schema/backgroundJobs';

/**
 * Bulk Approve Job Payload
 */
export interface BulkApproveJobPayload {
  approvalIds: string[];
  reviewerId: string;
  atomic: boolean;
  departmentId?: string;
}

/**
 * Bulk Reject Job Payload
 */
export interface BulkRejectJobPayload {
  approvalIds: string[];
  reviewerId: string;
  comments: string;
  atomic: boolean;
  departmentId?: string;
}

/**
 * Job handler error
 */
export class JobHandlerError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'JobHandlerError';
  }
}

/**
 * Bulk Operations Job Handlers
 * 
 * Handles background processing of bulk approval and rejection operations.
 * Processes each approval using the approval service and returns a summary
 * with successful and failed operations.
 * 
 * Job Types:
 * - bulk_approve: Approve multiple change requests
 * - bulk_reject: Reject multiple change requests
 * 
 * Requirements: 8.1-8.7, 34.1-34.10
 */
export class BulkOperationsHandler {
  /**
   * Handle bulk approve job
   * 
   * Processes a bulk approval operation by calling the bulk operations service.
   * Returns a summary with successful and failed operations.
   * 
   * @param payload - Job payload containing approval IDs and reviewer info
   * @returns Operation summary with successful and failed results
   * @throws JobHandlerError if payload is invalid or processing fails
   * 
   * Requirements: 8.1-8.7, 34.1-34.10
   */
  async handleBulkApprove(payload: Record<string, any>): Promise<BulkOperationSummary> {
    // Validate payload structure
    this.validateBulkApprovePayload(payload);

    const { approvalIds, reviewerId, atomic, departmentId } = payload as BulkApproveJobPayload;

    try {
      // Process bulk approve using the bulk operations service
      const result = await bulkOperationsService.bulkApprove(
        approvalIds,
        reviewerId,
        atomic,
        departmentId
      );

      // If result is a queued job response, this shouldn't happen in background processing
      // but handle it gracefully
      if ('jobId' in result) {
        throw new JobHandlerError(
          'Unexpected nested job queueing in background handler'
        );
      }

      return result;
    } catch (error) {
      throw new JobHandlerError(
        `Failed to process bulk approve job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Handle bulk reject job
   * 
   * Processes a bulk rejection operation by calling the bulk operations service.
   * Returns a summary with successful and failed operations.
   * 
   * @param payload - Job payload containing approval IDs, reviewer info, and comments
   * @returns Operation summary with successful and failed results
   * @throws JobHandlerError if payload is invalid or processing fails
   * 
   * Requirements: 8.1-8.7, 34.1-34.10
   */
  async handleBulkReject(payload: Record<string, any>): Promise<BulkOperationSummary> {
    // Validate payload structure
    this.validateBulkRejectPayload(payload);

    const { approvalIds, reviewerId, comments, atomic, departmentId } = payload as BulkRejectJobPayload;

    try {
      // Process bulk reject using the bulk operations service
      const result = await bulkOperationsService.bulkReject(
        approvalIds,
        reviewerId,
        comments,
        atomic,
        departmentId
      );

      // If result is a queued job response, this shouldn't happen in background processing
      // but handle it gracefully
      if ('jobId' in result) {
        throw new JobHandlerError(
          'Unexpected nested job queueing in background handler'
        );
      }

      return result;
    } catch (error) {
      throw new JobHandlerError(
        `Failed to process bulk reject job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate bulk approve payload structure
   * 
   * @param payload - Job payload to validate
   * @throws JobHandlerError if payload is invalid
   */
  private validateBulkApprovePayload(payload: Record<string, any>): void {
    if (!payload.approvalIds || !Array.isArray(payload.approvalIds)) {
      throw new JobHandlerError('Invalid payload: approvalIds must be an array');
    }

    if (payload.approvalIds.length === 0) {
      throw new JobHandlerError('Invalid payload: approvalIds array cannot be empty');
    }

    if (!payload.reviewerId || typeof payload.reviewerId !== 'string') {
      throw new JobHandlerError('Invalid payload: reviewerId must be a string');
    }

    if (payload.atomic !== undefined && typeof payload.atomic !== 'boolean') {
      throw new JobHandlerError('Invalid payload: atomic must be a boolean');
    }

    if (payload.departmentId !== undefined && typeof payload.departmentId !== 'string') {
      throw new JobHandlerError('Invalid payload: departmentId must be a string');
    }
  }

  /**
   * Validate bulk reject payload structure
   * 
   * @param payload - Job payload to validate
   * @throws JobHandlerError if payload is invalid
   */
  private validateBulkRejectPayload(payload: Record<string, any>): void {
    if (!payload.approvalIds || !Array.isArray(payload.approvalIds)) {
      throw new JobHandlerError('Invalid payload: approvalIds must be an array');
    }

    if (payload.approvalIds.length === 0) {
      throw new JobHandlerError('Invalid payload: approvalIds array cannot be empty');
    }

    if (!payload.reviewerId || typeof payload.reviewerId !== 'string') {
      throw new JobHandlerError('Invalid payload: reviewerId must be a string');
    }

    if (!payload.comments || typeof payload.comments !== 'string') {
      throw new JobHandlerError('Invalid payload: comments must be a non-empty string');
    }

    if (payload.atomic !== undefined && typeof payload.atomic !== 'boolean') {
      throw new JobHandlerError('Invalid payload: atomic must be a boolean');
    }

    if (payload.departmentId !== undefined && typeof payload.departmentId !== 'string') {
      throw new JobHandlerError('Invalid payload: departmentId must be a string');
    }
  }

  /**
   * Get handler function for a specific job type
   * 
   * Returns the appropriate handler function based on the job type.
   * This is used by the job queue service to process jobs.
   * 
   * @param jobType - The type of job to get handler for
   * @returns Handler function or undefined if not supported
   */
  getHandler(jobType: JobTypeType): ((payload: Record<string, any>) => Promise<Record<string, any>>) | undefined {
    switch (jobType) {
      case JobType.BULK_APPROVE:
        return this.handleBulkApprove.bind(this);
      
      case JobType.BULK_REJECT:
        return this.handleBulkReject.bind(this);
      
      default:
        return undefined;
    }
  }
}

// Export singleton instance
export const bulkOperationsHandler = new BulkOperationsHandler();
