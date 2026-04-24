import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JobQueueWorker, WorkerState } from '../job-queue.worker';
import { jobQueueService } from '../../services/job-queue.service';
import { JobType, JobStatus, type BackgroundJob } from '../../../../db/schema/backgroundJobs';

// Mock the job queue service
vi.mock('../../services/job-queue.service', () => ({
  jobQueueService: {
    registerHandler: vi.fn(),
    getQueuedJobs: vi.fn(),
    processJob: vi.fn(),
  },
}));

// Mock the handlers
vi.mock('../../jobs/bulk-operations.handler', () => ({
  bulkOperationsHandler: {
    getHandler: vi.fn((jobType) => {
      if (jobType === JobType.BULK_APPROVE || jobType === JobType.BULK_REJECT) {
        return vi.fn();
      }
      return undefined;
    }),
  },
}));

vi.mock('../../jobs/notification-delivery.handler', () => ({
  notificationDeliveryHandler: {
    getHandler: vi.fn((jobType) => {
      if (jobType === JobType.NOTIFICATION_DELIVERY) {
        return vi.fn();
      }
      return undefined;
    }),
  },
}));

describe('JobQueueWorker', () => {
  let worker: JobQueueWorker;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    // Ensure worker is stopped after each test
    if (worker && worker.isRunning()) {
      await worker.stop();
    }
    vi.useRealTimers();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default configuration', () => {
      worker = new JobQueueWorker();

      expect(worker.getState()).toBe(WorkerState.STOPPED);
      expect(worker.isRunning()).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 10000,
        batchSize: 20,
        enableLogging: false,
      });

      expect(worker.getState()).toBe(WorkerState.STOPPED);
    });

    it('should register job handlers on initialization', () => {
      worker = new JobQueueWorker();

      // Should register handlers for bulk operations and notifications
      expect(jobQueueService.registerHandler).toHaveBeenCalledTimes(3);
      expect(jobQueueService.registerHandler).toHaveBeenCalledWith(
        JobType.BULK_APPROVE,
        expect.any(Function)
      );
      expect(jobQueueService.registerHandler).toHaveBeenCalledWith(
        JobType.BULK_REJECT,
        expect.any(Function)
      );
      expect(jobQueueService.registerHandler).toHaveBeenCalledWith(
        JobType.NOTIFICATION_DELIVERY,
        expect.any(Function)
      );
    });
  });

  describe('start()', () => {
    it('should start the worker successfully', async () => {
      worker = new JobQueueWorker({ enableLogging: false });

      await worker.start();

      expect(worker.getState()).toBe(WorkerState.RUNNING);
      expect(worker.isRunning()).toBe(true);
    });

    it('should throw error if worker is already running', async () => {
      worker = new JobQueueWorker({ enableLogging: false });
      await worker.start();

      await expect(worker.start()).rejects.toThrow(
        'Cannot start worker: current state is running'
      );
    });

    it('should begin polling for jobs after start', async () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        enableLogging: false,
      });

      vi.mocked(jobQueueService.getQueuedJobs).mockResolvedValue([]);

      await worker.start();

      // Fast-forward time to trigger polling
      await vi.advanceTimersByTimeAsync(1000);

      expect(jobQueueService.getQueuedJobs).toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    it('should stop the worker successfully', async () => {
      worker = new JobQueueWorker({ enableLogging: false });
      await worker.start();

      await worker.stop();

      expect(worker.getState()).toBe(WorkerState.STOPPED);
      expect(worker.isRunning()).toBe(false);
    });

    it('should throw error if worker is not running', async () => {
      worker = new JobQueueWorker({ enableLogging: false });

      await expect(worker.stop()).rejects.toThrow(
        'Cannot stop worker: current state is stopped'
      );
    });

    it('should stop polling for new jobs', async () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        enableLogging: false,
      });

      vi.mocked(jobQueueService.getQueuedJobs).mockResolvedValue([]);

      await worker.start();
      await worker.stop();

      // Clear previous calls
      vi.mocked(jobQueueService.getQueuedJobs).mockClear();

      // Fast-forward time - should not trigger polling
      await vi.advanceTimersByTimeAsync(5000);

      expect(jobQueueService.getQueuedJobs).not.toHaveBeenCalled();
    });

    it('should wait for current job processing to complete', async () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        enableLogging: false,
      });

      const mockJob: BackgroundJob = {
        id: 'job-1',
        job_type: JobType.BULK_APPROVE,
        status: JobStatus.QUEUED,
        payload: {},
        result: null,
        error: null,
        retry_count: 0,
        initiated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        started_at: null,
        completed_at: null,
      };

      // Mock a slow job processing
      vi.mocked(jobQueueService.getQueuedJobs).mockResolvedValue([mockJob]);
      vi.mocked(jobQueueService.processJob).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockJob), 500))
      );

      await worker.start();

      // Trigger polling
      await vi.advanceTimersByTimeAsync(1000);

      // Start stopping (should wait for processing)
      const stopPromise = worker.stop();

      // Fast-forward to complete job processing
      await vi.advanceTimersByTimeAsync(500);

      await stopPromise;

      expect(worker.getState()).toBe(WorkerState.STOPPED);
    });
  });

  describe('Job Processing', () => {
    it('should process queued jobs in FIFO order', async () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        enableLogging: false,
      });

      const mockJobs: BackgroundJob[] = [
        {
          id: 'job-1',
          job_type: JobType.BULK_APPROVE,
          status: JobStatus.QUEUED,
          payload: {},
          result: null,
          error: null,
          retry_count: 0,
          initiated_by: null,
          created_at: new Date('2024-01-01T10:00:00Z'),
          updated_at: new Date('2024-01-01T10:00:00Z'),
          started_at: null,
          completed_at: null,
        },
        {
          id: 'job-2',
          job_type: JobType.BULK_REJECT,
          status: JobStatus.QUEUED,
          payload: {},
          result: null,
          error: null,
          retry_count: 0,
          initiated_by: null,
          created_at: new Date('2024-01-01T10:01:00Z'),
          updated_at: new Date('2024-01-01T10:01:00Z'),
          started_at: null,
          completed_at: null,
        },
      ];

      vi.mocked(jobQueueService.getQueuedJobs).mockResolvedValueOnce(mockJobs);
      vi.mocked(jobQueueService.processJob).mockResolvedValue({
        ...mockJobs[0],
        status: JobStatus.COMPLETED,
      });

      await worker.start();

      // Trigger polling
      await vi.advanceTimersByTimeAsync(1000);

      // Should process both jobs in order
      expect(jobQueueService.processJob).toHaveBeenCalledTimes(2);
      expect(jobQueueService.processJob).toHaveBeenNthCalledWith(1, 'job-1');
      expect(jobQueueService.processJob).toHaveBeenNthCalledWith(2, 'job-2');
    });

    it('should handle empty job queue gracefully', async () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        enableLogging: false,
      });

      vi.mocked(jobQueueService.getQueuedJobs).mockResolvedValue([]);

      await worker.start();

      // Trigger polling
      await vi.advanceTimersByTimeAsync(1000);

      expect(jobQueueService.getQueuedJobs).toHaveBeenCalled();
      expect(jobQueueService.processJob).not.toHaveBeenCalled();
    });

    it('should handle job processing errors gracefully', async () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        enableLogging: false,
      });

      const mockJob: BackgroundJob = {
        id: 'job-1',
        job_type: JobType.BULK_APPROVE,
        status: JobStatus.QUEUED,
        payload: {},
        result: null,
        error: null,
        retry_count: 0,
        initiated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        started_at: null,
        completed_at: null,
      };

      vi.mocked(jobQueueService.getQueuedJobs).mockResolvedValue([mockJob]);
      vi.mocked(jobQueueService.processJob).mockRejectedValue(
        new Error('Job processing failed')
      );

      await worker.start();

      // Trigger polling - should not crash the worker
      await vi.advanceTimersByTimeAsync(1000);

      expect(jobQueueService.processJob).toHaveBeenCalled();
      expect(worker.isRunning()).toBe(true);
    });

    it('should handle polling errors gracefully', async () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        enableLogging: false,
      });

      vi.mocked(jobQueueService.getQueuedJobs).mockRejectedValue(
        new Error('Database connection failed')
      );

      await worker.start();

      // Trigger polling - should not crash the worker
      await vi.advanceTimersByTimeAsync(1000);

      expect(jobQueueService.getQueuedJobs).toHaveBeenCalled();
      expect(worker.isRunning()).toBe(true);
    });

    it('should respect batch size configuration', async () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        batchSize: 5,
        enableLogging: false,
      });

      vi.mocked(jobQueueService.getQueuedJobs).mockResolvedValue([]);

      await worker.start();

      // Trigger polling
      await vi.advanceTimersByTimeAsync(1000);

      expect(jobQueueService.getQueuedJobs).toHaveBeenCalledWith(5);
    });

    it('should not process jobs concurrently', async () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 500,
        enableLogging: false,
      });

      const mockJob: BackgroundJob = {
        id: 'job-1',
        job_type: JobType.BULK_APPROVE,
        status: JobStatus.QUEUED,
        payload: {},
        result: null,
        error: null,
        retry_count: 0,
        initiated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        started_at: null,
        completed_at: null,
      };

      let callCount = 0;
      vi.mocked(jobQueueService.getQueuedJobs).mockImplementation(async () => {
        callCount++;
        return [mockJob];
      });
      
      // Mock slow job processing
      vi.mocked(jobQueueService.processJob).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockJob), 1000))
      );

      await worker.start();

      // Trigger first poll
      await vi.advanceTimersByTimeAsync(500);

      // Trigger second poll (should be skipped because first is still processing)
      await vi.advanceTimersByTimeAsync(500);

      // Complete the job processing
      await vi.advanceTimersByTimeAsync(500);

      // Only one call should have been made (second poll was skipped)
      expect(callCount).toBe(1);
    });
  });

  describe('State Management', () => {
    it('should transition states correctly during start', async () => {
      worker = new JobQueueWorker({ enableLogging: false });

      expect(worker.getState()).toBe(WorkerState.STOPPED);

      await worker.start();

      expect(worker.getState()).toBe(WorkerState.RUNNING);
    });

    it('should transition states correctly during stop', async () => {
      worker = new JobQueueWorker({ enableLogging: false });

      await worker.start();
      expect(worker.getState()).toBe(WorkerState.RUNNING);

      await worker.stop();
      expect(worker.getState()).toBe(WorkerState.STOPPED);
    });

    it('should report correct running status', async () => {
      worker = new JobQueueWorker({ enableLogging: false });

      expect(worker.isRunning()).toBe(false);

      await worker.start();
      expect(worker.isRunning()).toBe(true);

      await worker.stop();
      expect(worker.isRunning()).toBe(false);
    });
  });

  describe('Polling Interval', () => {
    it('should poll at the configured interval', async () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 2000,
        enableLogging: false,
      });

      vi.mocked(jobQueueService.getQueuedJobs).mockResolvedValue([]);

      await worker.start();

      // Should not poll immediately
      expect(jobQueueService.getQueuedJobs).not.toHaveBeenCalled();

      // Fast-forward to first poll
      await vi.advanceTimersByTimeAsync(2000);
      expect(jobQueueService.getQueuedJobs).toHaveBeenCalledTimes(1);

      // Fast-forward to second poll
      await vi.advanceTimersByTimeAsync(2000);
      expect(jobQueueService.getQueuedJobs).toHaveBeenCalledTimes(2);

      // Fast-forward to third poll
      await vi.advanceTimersByTimeAsync(2000);
      expect(jobQueueService.getQueuedJobs).toHaveBeenCalledTimes(3);
    });

    it('should use default poll interval of 5 seconds', async () => {
      worker = new JobQueueWorker({ enableLogging: false });

      vi.mocked(jobQueueService.getQueuedJobs).mockResolvedValue([]);

      await worker.start();

      // Fast-forward to first poll (5 seconds)
      await vi.advanceTimersByTimeAsync(5000);
      expect(jobQueueService.getQueuedJobs).toHaveBeenCalledTimes(1);
    });
  });

  describe('Logging', () => {
    it('should log events when logging is enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        enableLogging: true,
      });

      await worker.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[JobQueueWorker] Starting job queue worker')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[JobQueueWorker] Job queue worker started')
      );

      consoleSpy.mockRestore();
    });

    it('should not log events when logging is disabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        enableLogging: false,
      });

      await worker.start();

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log errors when logging is enabled', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        enableLogging: true,
      });

      vi.mocked(jobQueueService.getQueuedJobs).mockRejectedValue(
        new Error('Database error')
      );

      await worker.start();

      // Trigger polling
      await vi.advanceTimersByTimeAsync(1000);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[JobQueueWorker] Error during job polling: Database error')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Graceful Shutdown', () => {
    it('should complete current job before stopping', async () => {
      worker = new JobQueueWorker({
        pollIntervalMs: 1000,
        enableLogging: false,
      });

      const mockJob: BackgroundJob = {
        id: 'job-1',
        job_type: JobType.BULK_APPROVE,
        status: JobStatus.QUEUED,
        payload: {},
        result: null,
        error: null,
        retry_count: 0,
        initiated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        started_at: null,
        completed_at: null,
      };

      let jobCompleted = false;

      vi.mocked(jobQueueService.getQueuedJobs).mockResolvedValue([mockJob]);
      vi.mocked(jobQueueService.processJob).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => {
              jobCompleted = true;
              resolve(mockJob);
            }, 500)
          )
      );

      await worker.start();

      // Trigger polling
      await vi.advanceTimersByTimeAsync(1000);

      // Start stopping
      const stopPromise = worker.stop();

      // Job should not be completed yet
      expect(jobCompleted).toBe(false);

      // Fast-forward to complete job
      await vi.advanceTimersByTimeAsync(500);

      await stopPromise;

      // Job should be completed before stop completes
      expect(jobCompleted).toBe(true);
      expect(worker.getState()).toBe(WorkerState.STOPPED);
    });
  });
});
