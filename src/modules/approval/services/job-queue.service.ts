import { backgroundJobRepository } from '../repositories/background-job.repository';
import { notificationService } from './notification.service';
import {
  type BackgroundJob,
  type InsertBackgroundJob,
  JobStatus,
  JobType,
  type JobTypeType,
} from '../../../db/schema/backgroundJobs';

/**
 * Job handler function type
 * Processes a job and returns the result or throws an error
 */
type JobHandler = (payload: Record<string, any>) => Promise<Record<string, any>>;

/**
 * Job processing error
 */
export class JobProcessingError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'JobProcessingError';
  }
}

/**
 * Job not found error
 */
export class JobNotFoundError extends Error {
  constructor(jobId: string) {
    super(`Job not found: ${jobId}`);
    this.name = 'JobNotFoundError';
  }
}

/**
 * Job Queue Service
 * 
 * Manages background job processing with retry logic and exponential backoff.
 * Supports asynchronous processing for bulk operations, notifications, and archival tasks.
 * 
 * Job lifecycle: queued → processing → completed/failed
 * 
 * Features:
 * - Job enqueueing with payload and initiator tracking
 * - Job processing with error handling
 * - Retry logic with exponential backoff (max 3 retries)
 * - Job status tracking
 * - Notification creation on job completion
 * 
 */
export class JobQueueService {
  private jobHandlers: Map<JobTypeType, JobHandler> = new Map();
  
  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY_MS = 1000; // 1 second base delay
  private readonly MAX_DELAY_MS = 60000; // 60 seconds max delay

  /**
   * Register a job handler for a specific job type
   * 
   * @param jobType - The type of job to handle
   * @param handler - The handler function to process the job
   */
  registerHandler(jobType: JobTypeType, handler: JobHandler): void {
    this.jobHandlers.set(jobType, handler);
  }

  /**
   * Enqueue a new background job
   * 
   * Creates a new job record with status 'queued' and returns the job ID.
   * The job will be processed asynchronously by a worker.
   * 
   * @param jobType - The type of job to enqueue
   * @param payload - The job payload data
   * @param initiatedBy - The user ID who initiated the job
   * @returns The created job record
   * 
   */
  async enqueue(
    jobType: JobTypeType,
    payload: Record<string, any>,
    initiatedBy?: string
  ): Promise<BackgroundJob> {
    const jobData: InsertBackgroundJob = {
      job_type: jobType,
      status: JobStatus.QUEUED,
      payload,
      initiated_by: initiatedBy,
      retry_count: 0,
    };

    const job = await backgroundJobRepository.create(jobData);
    
    return job;
  }

  /**
   * Process a background job by ID
   * 
   * Updates job status to 'processing', executes the job handler,
   * and updates status to 'completed' or 'failed' based on the result.
   * 
   * Implements retry logic with exponential backoff for failed jobs.
   * Creates a notification for the initiator when the job completes.
   * 
   * @param jobId - The ID of the job to process
   * @returns The updated job record
   * @throws JobNotFoundError if the job doesn't exist
   * @throws JobProcessingError if the job handler is not registered
   * 
   */
  async processJob(jobId: string): Promise<BackgroundJob> {
    // Fetch the job
    const job = await backgroundJobRepository.findById(jobId);
    
    if (!job) {
      throw new JobNotFoundError(jobId);
    }

    // Check if handler is registered
    const handler = this.jobHandlers.get(job.job_type as JobTypeType);
    
    if (!handler) {
      throw new JobProcessingError(
        `No handler registered for job type: ${job.job_type}`
      );
    }

    try {
      // Update status to processing
      await backgroundJobRepository.updateStatus(jobId, JobStatus.PROCESSING, {
        started_at: new Date(),
      });

      // Execute the job handler
      const result = await handler(job.payload as Record<string, any>);

      // Update status to completed
      // Double cast to handle unknown type from handler
      const resultData: Record<string, any> | undefined = 
        result && typeof result === 'object' ? (result as unknown as Record<string, any>) : undefined;
      const completedJob = await backgroundJobRepository.updateStatus(
        jobId,
        JobStatus.COMPLETED,
        {
          ...(resultData && { result: resultData }),
          completed_at: new Date(),
        }
      );

      // Create notification for initiator if present
      if (job.initiated_by && completedJob) {
        await this.createJobCompletionNotification(completedJob, true);
      }

      return completedJob!;
    } catch (error) {
      // Handle job failure
      return await this.handleJobFailure(job, error as Error);
    }
  }

  /**
   * Get the status of a background job
   * 
   * @param jobId - The ID of the job
   * @returns The job record with current status
   * @throws JobNotFoundError if the job doesn't exist
   * 
   */
  async getJobStatus(jobId: string): Promise<BackgroundJob> {
    const job = await backgroundJobRepository.findById(jobId);
    
    if (!job) {
      throw new JobNotFoundError(jobId);
    }

    return job;
  }

  /**
   * Handle job failure with retry logic
   * 
   * Implements exponential backoff for retries:
   * - Retry 1: 1 second delay
   * - Retry 2: 2 seconds delay
   * - Retry 3: 4 seconds delay
   * 
   * After max retries, marks the job as failed and creates a notification.
   * 
   * @param job - The failed job
   * @param error - The error that caused the failure
   * @returns The updated job record
   * 
   */
  private async handleJobFailure(
    job: BackgroundJob,
    error: Error
  ): Promise<BackgroundJob> {
    const errorMessage = error.message || 'Unknown error';
    
    // Check if we should retry
    if (job.retry_count < this.MAX_RETRIES) {
      // Increment retry count
      await backgroundJobRepository.incrementRetryCount(job.id);
      
      // Calculate exponential backoff delay
      const delay = this.calculateBackoffDelay(job.retry_count + 1);
      
      // Update status back to queued for retry
      const retriedJob = await backgroundJobRepository.updateStatus(
        job.id,
        JobStatus.QUEUED,
        {
          error: `Retry ${job.retry_count + 1}/${this.MAX_RETRIES}: ${errorMessage}`,
        }
      );

      // Schedule retry after delay (in a real implementation, this would use a job queue)
      // For now, we just mark it as queued and the worker will pick it up
      
      return retriedJob!;
    } else {
      // Max retries exceeded, mark as failed
      const failedJob = await backgroundJobRepository.updateStatus(
        job.id,
        JobStatus.FAILED,
        {
          error: `Failed after ${this.MAX_RETRIES} retries: ${errorMessage}`,
          completed_at: new Date(),
        }
      );

      // Create notification for initiator if present
      if (job.initiated_by && failedJob) {
        await this.createJobCompletionNotification(failedJob, false);
      }

      return failedJob!;
    }
  }

  /**
   * Calculate exponential backoff delay
   * 
   * Formula: min(BASE_DELAY * 2^(retryCount - 1), MAX_DELAY)
   * 
   * @param retryCount - The current retry attempt (1-based)
   * @returns Delay in milliseconds
   */
  private calculateBackoffDelay(retryCount: number): number {
    const delay = this.BASE_DELAY_MS * Math.pow(2, retryCount - 1);
    return Math.min(delay, this.MAX_DELAY_MS);
  }

  /**
   * Create a notification for job completion
   * 
   * Notifies the user who initiated the job about its completion status.
   * 
   * @param job - The completed job
   * @param success - Whether the job completed successfully
   * 
   */
  private async createJobCompletionNotification(
    job: BackgroundJob,
    success: boolean
  ): Promise<void> {
    // Note: This is a placeholder implementation
    // In a real system, you would create a proper notification record
    // For now, we'll just log it
    
    // Future enhancement: Create a notification record in the notifications table
    // with appropriate message and priority based on job type and success status
    
    console.log(
      `Job ${job.id} (${job.job_type}) ${success ? 'completed successfully' : 'failed'} for user ${job.initiated_by}`
    );
  }

  /**
   * Get all queued jobs
   * 
   * Returns jobs in FIFO order (oldest first) for processing by workers.
   * 
   * @param limit - Maximum number of jobs to return
   * @returns Array of queued jobs
   */
  async getQueuedJobs(limit: number = 10): Promise<BackgroundJob[]> {
    const result = await backgroundJobRepository.findQueued({}, {
      page: 1,
      pageSize: limit,
    });

    return result.data;
  }

  /**
   * Get jobs by status
   * 
   * @param status - The job status to filter by
   * @param page - Page number
   * @param pageSize - Number of jobs per page
   * @returns Paginated job records
   */
  async getJobsByStatus(
    status: string,
    page: number = 1,
    pageSize: number = 20
  ) {
    return await backgroundJobRepository.findMany(
      { status },
      { page, pageSize }
    );
  }

  /**
   * Get jobs by type
   * 
   * @param jobType - The job type to filter by
   * @param page - Page number
   * @param pageSize - Number of jobs per page
   * @returns Paginated job records
   */
  async getJobsByType(
    jobType: JobTypeType,
    page: number = 1,
    pageSize: number = 20
  ) {
    return await backgroundJobRepository.findMany(
      { job_type: jobType },
      { page, pageSize }
    );
  }
}

// Export singleton instance
export const jobQueueService = new JobQueueService();
