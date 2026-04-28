import { jobQueueService } from '../services/job-queue.service';
import { bulkOperationsHandler } from '../jobs/bulk-operations.handler';
import { notificationDeliveryHandler } from '../jobs/notification-delivery.handler';
import { JobType, type JobTypeType } from '../../../db/schema/backgroundJobs';

/**
 * Worker configuration
 */
export interface WorkerConfig {
  pollIntervalMs?: number; // Polling interval in milliseconds (default: 5000)
  batchSize?: number; // Number of jobs to fetch per poll (default: 10)
  enableLogging?: boolean; // Enable detailed logging (default: true)
}

/**
 * Worker state
 */
export enum WorkerState {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
}

/**
 * Job Queue Worker
 * 
 * Background worker that polls for queued jobs and processes them using registered handlers.
 * Supports graceful start/stop, error handling, and configurable polling intervals.
 * 
 * Features:
 * - Polls for queued jobs every 5 seconds (configurable)
 * - Processes jobs in FIFO order (oldest first)
 * - Handles job failures and retries via job queue service
 * - Logs job processing events
 * - Graceful start/stop with state management
 * - Automatic handler registration for bulk operations and notifications
 * 
 * Usage:
 * ```typescript
 * const worker = new JobQueueWorker();
 * await worker.start();
 * // ... worker runs in background
 * await worker.stop();
 * ```
 * 
 */
export class JobQueueWorker {
  private state: WorkerState = WorkerState.STOPPED;
  private pollIntervalId: NodeJS.Timeout | null = null;
  private config: Required<WorkerConfig>;
  private isProcessing: boolean = false;

  constructor(config: WorkerConfig = {}) {
    this.config = {
      pollIntervalMs: config.pollIntervalMs ?? 5000,
      batchSize: config.batchSize ?? 10,
      enableLogging: config.enableLogging ?? true,
    };

    // Register job handlers on initialization
    this.registerHandlers();
  }

  /**
   * Register all job handlers with the job queue service
   * 
   * Registers handlers for:
   * - bulk_approve: Bulk approval operations
   * - bulk_reject: Bulk rejection operations
   * - notification_delivery: Notification delivery
   */
  private registerHandlers(): void {
    // Register bulk operations handlers
    const bulkApproveHandler = bulkOperationsHandler.getHandler(JobType.BULK_APPROVE);
    const bulkRejectHandler = bulkOperationsHandler.getHandler(JobType.BULK_REJECT);

    if (bulkApproveHandler) {
      jobQueueService.registerHandler(JobType.BULK_APPROVE, bulkApproveHandler);
    }

    if (bulkRejectHandler) {
      jobQueueService.registerHandler(JobType.BULK_REJECT, bulkRejectHandler);
    }

    // Register notification delivery handler
    const notificationHandler = notificationDeliveryHandler.getHandler(
      JobType.NOTIFICATION_DELIVERY
    );

    if (notificationHandler) {
      jobQueueService.registerHandler(JobType.NOTIFICATION_DELIVERY, notificationHandler);
    }

    this.log('Job handlers registered successfully');
  }

  /**
   * Start the worker
   * 
   * Begins polling for queued jobs at the configured interval.
   * Transitions state: STOPPED → STARTING → RUNNING
   * 
   * @throws Error if worker is already running or starting
   */
  async start(): Promise<void> {
    if (this.state !== WorkerState.STOPPED) {
      throw new Error(`Cannot start worker: current state is ${this.state}`);
    }

    this.state = WorkerState.STARTING;
    this.log('Starting job queue worker...');

    // Start polling for jobs
    this.pollIntervalId = setInterval(
      () => this.pollAndProcessJobs(),
      this.config.pollIntervalMs
    );

    this.state = WorkerState.RUNNING;
    this.log(
      `Job queue worker started (polling every ${this.config.pollIntervalMs}ms, batch size: ${this.config.batchSize})`
    );
  }

  /**
   * Stop the worker
   * 
   * Stops polling for new jobs and waits for current job processing to complete.
   * Transitions state: RUNNING → STOPPING → STOPPED
   * 
   * @throws Error if worker is not running
   */
  async stop(): Promise<void> {
    if (this.state !== WorkerState.RUNNING) {
      throw new Error(`Cannot stop worker: current state is ${this.state}`);
    }

    this.state = WorkerState.STOPPING;
    this.log('Stopping job queue worker...');

    // Stop polling for new jobs
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }

    // Wait for current job processing to complete
    await this.waitForProcessingToComplete();

    this.state = WorkerState.STOPPED;
    this.log('Job queue worker stopped');
  }

  /**
   * Get the current worker state
   * 
   * @returns Current worker state
   */
  getState(): WorkerState {
    return this.state;
  }

  /**
   * Check if the worker is running
   * 
   * @returns True if worker is in RUNNING state
   */
  isRunning(): boolean {
    return this.state === WorkerState.RUNNING;
  }

  /**
   * Poll for queued jobs and process them
   * 
   * Fetches queued jobs in FIFO order and processes each one sequentially.
   * Handles errors gracefully and logs processing events.
   * 
   * This method is called on each poll interval.
   */
  private async pollAndProcessJobs(): Promise<void> {
    // Skip if already processing or not in running state
    if (this.isProcessing || this.state !== WorkerState.RUNNING) {
      return;
    }

    this.isProcessing = true;

    try {
      // Fetch queued jobs (FIFO order - oldest first)
      const queuedJobs = await jobQueueService.getQueuedJobs(this.config.batchSize);

      if (queuedJobs.length === 0) {
        // No jobs to process
        return;
      }

      this.log(`Found ${queuedJobs.length} queued job(s) to process`);

      // Process each job sequentially
      for (const job of queuedJobs) {
        await this.processJob(job.id, job.job_type as JobTypeType);
      }
    } catch (error) {
      // Log polling error but don't crash the worker
      this.logError('Error during job polling', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single job
   * 
   * Delegates job processing to the job queue service, which handles:
   * - Status updates (queued → processing → completed/failed)
   * - Handler execution
   * - Retry logic with exponential backoff
   * - Notification creation
   * 
   * @param jobId - The ID of the job to process
   * @param jobType - The type of job (for logging)
   */
  private async processJob(jobId: string, jobType: JobTypeType): Promise<void> {
    this.log(`Processing job ${jobId} (${jobType})...`);

    try {
      // Process the job using the job queue service
      const result = await jobQueueService.processJob(jobId);

      // Log success
      this.log(
        `Job ${jobId} (${jobType}) completed successfully with status: ${result.status}`
      );
    } catch (error) {
      // Log failure (job queue service handles retry logic)
      this.logError(`Job ${jobId} (${jobType}) processing failed`, error);
    }
  }

  /**
   * Wait for current job processing to complete
   * 
   * Polls the isProcessing flag until it becomes false.
   * Used during graceful shutdown to ensure no jobs are interrupted.
   * 
   * @param timeoutMs - Maximum time to wait in milliseconds (default: 30000)
   * @throws Error if timeout is reached
   */
  private async waitForProcessingToComplete(timeoutMs: number = 30000): Promise<void> {
    const startTime = Date.now();

    while (this.isProcessing) {
      // Check for timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('Timeout waiting for job processing to complete');
      }

      // Wait 100ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Log a message (if logging is enabled)
   * 
   * @param message - The message to log
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[JobQueueWorker] ${message}`);
    }
  }

  /**
   * Log an error (if logging is enabled)
   * 
   * @param message - The error message
   * @param error - The error object
   */
  private logError(message: string, error: unknown): void {
    if (this.config.enableLogging) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[JobQueueWorker] ${message}: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }
  }
}
