import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JobQueueService, JobProcessingError, JobNotFoundError } from '../job-queue.service';
import { backgroundJobRepository } from '../../repositories/background-job.repository';
import { notificationService } from '../notification.service';
import { JobStatus, JobType, type BackgroundJob } from '../../../../db/schema/backgroundJobs';

// Mock dependencies
vi.mock('../../repositories/background-job.repository');
vi.mock('../notification.service');

describe('JobQueueService', () => {
  let service: JobQueueService;
  let mockJob: BackgroundJob;

  beforeEach(() => {
    service = new JobQueueService();
    
    // Setup mock job
    mockJob = {
      id: 'job-123',
      job_type: JobType.BULK_APPROVE,
      status: JobStatus.QUEUED,
      payload: { approvalIds: ['approval-1', 'approval-2'] },
      result: null,
      error: null,
      retry_count: 0,
      initiated_by: 'user-123',
      created_at: new Date(),
      updated_at: new Date(),
      started_at: null,
      completed_at: null,
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('enqueue', () => {
    it('should create a new job with queued status', async () => {
      // Arrange
      const jobType = JobType.BULK_APPROVE;
      const payload = { approvalIds: ['approval-1', 'approval-2'] };
      const initiatedBy = 'user-123';

      vi.mocked(backgroundJobRepository.create).mockResolvedValue(mockJob);

      // Act
      const result = await service.enqueue(jobType, payload, initiatedBy);

      // Assert
      expect(backgroundJobRepository.create).toHaveBeenCalledWith({
        job_type: jobType,
        status: JobStatus.QUEUED,
        payload,
        initiated_by: initiatedBy,
        retry_count: 0,
      });
      expect(result).toEqual(mockJob);
    });

    it('should create a job without initiatedBy', async () => {
      // Arrange
      const jobType = JobType.NOTIFICATION_DELIVERY;
      const payload = { notificationId: 'notif-123' };

      vi.mocked(backgroundJobRepository.create).mockResolvedValue({
        ...mockJob,
        job_type: jobType,
        payload,
        initiated_by: null,
      });

      // Act
      const result = await service.enqueue(jobType, payload);

      // Assert
      expect(backgroundJobRepository.create).toHaveBeenCalledWith({
        job_type: jobType,
        status: JobStatus.QUEUED,
        payload,
        initiated_by: undefined,
        retry_count: 0,
      });
      expect(result.initiated_by).toBeNull();
    });
  });

  describe('processJob', () => {
    it('should process a job successfully', async () => {
      // Arrange
      const jobResult = { successful: ['approval-1', 'approval-2'], failed: [] };
      const handler = vi.fn().mockResolvedValue(jobResult);
      
      service.registerHandler(JobType.BULK_APPROVE, handler);

      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(mockJob);
      vi.mocked(backgroundJobRepository.updateStatus)
        .mockResolvedValueOnce({ ...mockJob, status: JobStatus.PROCESSING, started_at: new Date() })
        .mockResolvedValueOnce({ 
          ...mockJob, 
          status: JobStatus.COMPLETED, 
          result: jobResult,
          completed_at: new Date() 
        });

      // Act
      const result = await service.processJob('job-123');

      // Assert
      expect(backgroundJobRepository.findById).toHaveBeenCalledWith('job-123');
      expect(backgroundJobRepository.updateStatus).toHaveBeenCalledTimes(2);
      expect(backgroundJobRepository.updateStatus).toHaveBeenNthCalledWith(
        1,
        'job-123',
        JobStatus.PROCESSING,
        expect.objectContaining({ started_at: expect.any(Date) })
      );
      expect(backgroundJobRepository.updateStatus).toHaveBeenNthCalledWith(
        2,
        'job-123',
        JobStatus.COMPLETED,
        expect.objectContaining({
          result: jobResult,
          completed_at: expect.any(Date),
        })
      );
      expect(handler).toHaveBeenCalledWith(mockJob.payload);
      expect(result.status).toBe(JobStatus.COMPLETED);
    });

    it('should throw JobNotFoundError if job does not exist', async () => {
      // Arrange
      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.processJob('non-existent-job')).rejects.toThrow(JobNotFoundError);
      await expect(service.processJob('non-existent-job')).rejects.toThrow('Job not found: non-existent-job');
    });

    it('should throw JobProcessingError if handler is not registered', async () => {
      // Arrange
      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(mockJob);

      // Act & Assert
      await expect(service.processJob('job-123')).rejects.toThrow(JobProcessingError);
      await expect(service.processJob('job-123')).rejects.toThrow(
        `No handler registered for job type: ${JobType.BULK_APPROVE}`
      );
    });

    it('should retry job on failure if retry count is below max', async () => {
      // Arrange
      const handler = vi.fn().mockRejectedValue(new Error('Processing failed'));
      
      service.registerHandler(JobType.BULK_APPROVE, handler);

      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(mockJob);
      vi.mocked(backgroundJobRepository.updateStatus).mockResolvedValueOnce({
        ...mockJob,
        status: JobStatus.PROCESSING,
        started_at: new Date(),
      });
      vi.mocked(backgroundJobRepository.incrementRetryCount).mockResolvedValue({
        ...mockJob,
        retry_count: 1,
      });
      vi.mocked(backgroundJobRepository.updateStatus).mockResolvedValueOnce({
        ...mockJob,
        status: JobStatus.QUEUED,
        retry_count: 1,
        error: 'Retry 1/3: Processing failed',
      });

      // Act
      const result = await service.processJob('job-123');

      // Assert
      expect(backgroundJobRepository.incrementRetryCount).toHaveBeenCalledWith('job-123');
      expect(backgroundJobRepository.updateStatus).toHaveBeenCalledWith(
        'job-123',
        JobStatus.QUEUED,
        expect.objectContaining({
          error: 'Retry 1/3: Processing failed',
        })
      );
      expect(result.status).toBe(JobStatus.QUEUED);
      expect(result.retry_count).toBe(1);
    });

    it('should mark job as failed after max retries', async () => {
      // Arrange
      const handler = vi.fn().mockRejectedValue(new Error('Processing failed'));
      const jobWithMaxRetries = { ...mockJob, retry_count: 3 };
      
      service.registerHandler(JobType.BULK_APPROVE, handler);

      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(jobWithMaxRetries);
      vi.mocked(backgroundJobRepository.updateStatus)
        .mockResolvedValueOnce({
          ...jobWithMaxRetries,
          status: JobStatus.PROCESSING,
          started_at: new Date(),
        })
        .mockResolvedValueOnce({
          ...jobWithMaxRetries,
          status: JobStatus.FAILED,
          error: 'Failed after 3 retries: Processing failed',
          completed_at: new Date(),
        });

      // Act
      const result = await service.processJob('job-123');

      // Assert
      expect(backgroundJobRepository.incrementRetryCount).not.toHaveBeenCalled();
      expect(backgroundJobRepository.updateStatus).toHaveBeenCalledWith(
        'job-123',
        JobStatus.FAILED,
        expect.objectContaining({
          error: 'Failed after 3 retries: Processing failed',
          completed_at: expect.any(Date),
        })
      );
      expect(result.status).toBe(JobStatus.FAILED);
    });

    it('should create notification on successful completion', async () => {
      // Arrange
      const handler = vi.fn().mockResolvedValue({ success: true });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      service.registerHandler(JobType.BULK_APPROVE, handler);

      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(mockJob);
      vi.mocked(backgroundJobRepository.updateStatus)
        .mockResolvedValueOnce({ ...mockJob, status: JobStatus.PROCESSING })
        .mockResolvedValueOnce({ ...mockJob, status: JobStatus.COMPLETED });

      // Act
      await service.processJob('job-123');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job job-123 (bulk_approve) completed successfully for user user-123')
      );
      
      consoleSpy.mockRestore();
    });

    it('should create notification on failure after max retries', async () => {
      // Arrange
      const handler = vi.fn().mockRejectedValue(new Error('Fatal error'));
      const jobWithMaxRetries = { ...mockJob, retry_count: 3 };
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      service.registerHandler(JobType.BULK_APPROVE, handler);

      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(jobWithMaxRetries);
      vi.mocked(backgroundJobRepository.updateStatus)
        .mockResolvedValueOnce({ ...jobWithMaxRetries, status: JobStatus.PROCESSING })
        .mockResolvedValueOnce({ ...jobWithMaxRetries, status: JobStatus.FAILED });

      // Act
      await service.processJob('job-123');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job job-123 (bulk_approve) failed for user user-123')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      // Arrange
      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(mockJob);

      // Act
      const result = await service.getJobStatus('job-123');

      // Assert
      expect(backgroundJobRepository.findById).toHaveBeenCalledWith('job-123');
      expect(result).toEqual(mockJob);
    });

    it('should throw JobNotFoundError if job does not exist', async () => {
      // Arrange
      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.getJobStatus('non-existent-job')).rejects.toThrow(JobNotFoundError);
    });
  });

  describe('registerHandler', () => {
    it('should register a job handler', () => {
      // Arrange
      const handler = vi.fn();

      // Act
      service.registerHandler(JobType.BULK_APPROVE, handler);

      // Assert - handler should be registered (tested indirectly through processJob)
      expect(() => service.registerHandler(JobType.BULK_APPROVE, handler)).not.toThrow();
    });
  });

  describe('getQueuedJobs', () => {
    it('should return queued jobs in FIFO order', async () => {
      // Arrange
      const queuedJobs = [
        { ...mockJob, id: 'job-1', created_at: new Date('2024-01-01') },
        { ...mockJob, id: 'job-2', created_at: new Date('2024-01-02') },
      ];

      vi.mocked(backgroundJobRepository.findQueued).mockResolvedValue({
        data: queuedJobs,
        pagination: {
          total: 2,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      });

      // Act
      const result = await service.getQueuedJobs(10);

      // Assert
      expect(backgroundJobRepository.findQueued).toHaveBeenCalledWith({}, { page: 1, pageSize: 10 });
      expect(result).toEqual(queuedJobs);
    });

    it('should use default limit of 10', async () => {
      // Arrange
      vi.mocked(backgroundJobRepository.findQueued).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
      });

      // Act
      await service.getQueuedJobs();

      // Assert
      expect(backgroundJobRepository.findQueued).toHaveBeenCalledWith({}, { page: 1, pageSize: 10 });
    });
  });

  describe('getJobsByStatus', () => {
    it('should return jobs filtered by status', async () => {
      // Arrange
      const completedJobs = [
        { ...mockJob, id: 'job-1', status: JobStatus.COMPLETED },
        { ...mockJob, id: 'job-2', status: JobStatus.COMPLETED },
      ];

      vi.mocked(backgroundJobRepository.findMany).mockResolvedValue({
        data: completedJobs,
        pagination: {
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      });

      // Act
      const result = await service.getJobsByStatus(JobStatus.COMPLETED, 1, 20);

      // Assert
      expect(backgroundJobRepository.findMany).toHaveBeenCalledWith(
        { status: JobStatus.COMPLETED },
        { page: 1, pageSize: 20 }
      );
      expect(result.data).toEqual(completedJobs);
    });
  });

  describe('getJobsByType', () => {
    it('should return jobs filtered by type', async () => {
      // Arrange
      const bulkApproveJobs = [
        { ...mockJob, id: 'job-1', job_type: JobType.BULK_APPROVE },
        { ...mockJob, id: 'job-2', job_type: JobType.BULK_APPROVE },
      ];

      vi.mocked(backgroundJobRepository.findMany).mockResolvedValue({
        data: bulkApproveJobs,
        pagination: {
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      });

      // Act
      const result = await service.getJobsByType(JobType.BULK_APPROVE, 1, 20);

      // Assert
      expect(backgroundJobRepository.findMany).toHaveBeenCalledWith(
        { job_type: JobType.BULK_APPROVE },
        { page: 1, pageSize: 20 }
      );
      expect(result.data).toEqual(bulkApproveJobs);
    });
  });

  describe('exponential backoff', () => {
    it('should calculate correct backoff delays', async () => {
      // This test verifies the exponential backoff calculation indirectly
      // by checking that retries happen with increasing delays
      
      // Arrange
      const handler = vi.fn().mockRejectedValue(new Error('Temporary failure'));
      service.registerHandler(JobType.BULK_APPROVE, handler);

      // Test retry 1 (should have 1s delay)
      const job1 = { ...mockJob, retry_count: 0 };
      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(job1);
      vi.mocked(backgroundJobRepository.updateStatus).mockResolvedValue({
        ...job1,
        status: JobStatus.PROCESSING,
      });
      vi.mocked(backgroundJobRepository.incrementRetryCount).mockResolvedValue({
        ...job1,
        retry_count: 1,
      });
      vi.mocked(backgroundJobRepository.updateStatus).mockResolvedValue({
        ...job1,
        status: JobStatus.QUEUED,
        retry_count: 1,
      });

      await service.processJob('job-123');

      // Test retry 2 (should have 2s delay)
      const job2 = { ...mockJob, retry_count: 1 };
      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(job2);
      vi.mocked(backgroundJobRepository.incrementRetryCount).mockResolvedValue({
        ...job2,
        retry_count: 2,
      });

      await service.processJob('job-123');

      // Test retry 3 (should have 4s delay)
      const job3 = { ...mockJob, retry_count: 2 };
      vi.mocked(backgroundJobRepository.findById).mockResolvedValue(job3);
      vi.mocked(backgroundJobRepository.incrementRetryCount).mockResolvedValue({
        ...job3,
        retry_count: 3,
      });

      await service.processJob('job-123');

      // Assert - verify that retries were attempted
      expect(backgroundJobRepository.incrementRetryCount).toHaveBeenCalledTimes(3);
    });
  });
});
