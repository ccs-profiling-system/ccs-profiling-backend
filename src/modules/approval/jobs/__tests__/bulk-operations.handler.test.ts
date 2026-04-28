import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bulkOperationsHandler, JobHandlerError } from '../bulk-operations.handler';
import { bulkOperationsService } from '../../services/bulk-operations.service';
import { JobType } from '../../../../db/schema/backgroundJobs';

// Mock the bulk operations service
vi.mock('../../services/bulk-operations.service', () => ({
  bulkOperationsService: {
    bulkApprove: vi.fn(),
    bulkReject: vi.fn(),
  },
}));

describe('BulkOperationsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleBulkApprove', () => {
    it('should successfully process bulk approve job', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1', 'approval-2', 'approval-3'],
        reviewerId: 'reviewer-123',
        atomic: false,
      };

      const expectedSummary = {
        successful: [
          { approvalId: 'approval-1', success: true },
          { approvalId: 'approval-2', success: true },
          { approvalId: 'approval-3', success: true },
        ],
        failed: [],
        totalProcessed: 3,
        totalSuccessful: 3,
        totalFailed: 0,
      };

      vi.mocked(bulkOperationsService.bulkApprove).mockResolvedValue(expectedSummary);

      // Act
      const result = await bulkOperationsHandler.handleBulkApprove(payload);

      // Assert
      expect(result).toEqual(expectedSummary);
      expect(bulkOperationsService.bulkApprove).toHaveBeenCalledWith(
        payload.approvalIds,
        payload.reviewerId,
        payload.atomic,
        undefined
      );
    });

    it('should process bulk approve with department scope', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1', 'approval-2'],
        reviewerId: 'chair-123',
        atomic: false,
        departmentId: 'dept-456',
      };

      const expectedSummary = {
        successful: [
          { approvalId: 'approval-1', success: true },
          { approvalId: 'approval-2', success: true },
        ],
        failed: [],
        totalProcessed: 2,
        totalSuccessful: 2,
        totalFailed: 0,
      };

      vi.mocked(bulkOperationsService.bulkApprove).mockResolvedValue(expectedSummary);

      // Act
      const result = await bulkOperationsHandler.handleBulkApprove(payload);

      // Assert
      expect(result).toEqual(expectedSummary);
      expect(bulkOperationsService.bulkApprove).toHaveBeenCalledWith(
        payload.approvalIds,
        payload.reviewerId,
        payload.atomic,
        payload.departmentId
      );
    });

    it('should process bulk approve in atomic mode', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1', 'approval-2'],
        reviewerId: 'admin-123',
        atomic: true,
      };

      const expectedSummary = {
        successful: [
          { approvalId: 'approval-1', success: true },
          { approvalId: 'approval-2', success: true },
        ],
        failed: [],
        totalProcessed: 2,
        totalSuccessful: 2,
        totalFailed: 0,
      };

      vi.mocked(bulkOperationsService.bulkApprove).mockResolvedValue(expectedSummary);

      // Act
      const result = await bulkOperationsHandler.handleBulkApprove(payload);

      // Assert
      expect(result).toEqual(expectedSummary);
      expect(bulkOperationsService.bulkApprove).toHaveBeenCalledWith(
        payload.approvalIds,
        payload.reviewerId,
        payload.atomic,
        undefined
      );
    });

    it('should return summary with partial failures', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1', 'approval-2', 'approval-3'],
        reviewerId: 'reviewer-123',
        atomic: false,
      };

      const expectedSummary = {
        successful: [
          { approvalId: 'approval-1', success: true },
          { approvalId: 'approval-3', success: true },
        ],
        failed: [
          { approvalId: 'approval-2', success: false, error: 'Approval not found' },
        ],
        totalProcessed: 3,
        totalSuccessful: 2,
        totalFailed: 1,
      };

      vi.mocked(bulkOperationsService.bulkApprove).mockResolvedValue(expectedSummary);

      // Act
      const result = await bulkOperationsHandler.handleBulkApprove(payload);

      // Assert
      expect(result).toEqual(expectedSummary);
      expect(result.totalSuccessful).toBe(2);
      expect(result.totalFailed).toBe(1);
    });

    it('should throw JobHandlerError if approvalIds is missing', async () => {
      // Arrange
      const payload = {
        reviewerId: 'reviewer-123',
        atomic: false,
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        'Invalid payload: approvalIds must be an array'
      );
    });

    it('should throw JobHandlerError if approvalIds is not an array', async () => {
      // Arrange
      const payload = {
        approvalIds: 'not-an-array',
        reviewerId: 'reviewer-123',
        atomic: false,
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        'Invalid payload: approvalIds must be an array'
      );
    });

    it('should throw JobHandlerError if approvalIds is empty', async () => {
      // Arrange
      const payload = {
        approvalIds: [],
        reviewerId: 'reviewer-123',
        atomic: false,
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        'Invalid payload: approvalIds array cannot be empty'
      );
    });

    it('should throw JobHandlerError if reviewerId is missing', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1'],
        atomic: false,
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        'Invalid payload: reviewerId must be a string'
      );
    });

    it('should throw JobHandlerError if atomic is not a boolean', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1'],
        reviewerId: 'reviewer-123',
        atomic: 'not-a-boolean',
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        'Invalid payload: atomic must be a boolean'
      );
    });

    it('should throw JobHandlerError if departmentId is not a string', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1'],
        reviewerId: 'reviewer-123',
        atomic: false,
        departmentId: 123,
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        'Invalid payload: departmentId must be a string'
      );
    });

    it('should throw JobHandlerError if service throws error', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1'],
        reviewerId: 'reviewer-123',
        atomic: false,
      };

      vi.mocked(bulkOperationsService.bulkApprove).mockRejectedValue(
        new Error('Service error')
      );

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        'Failed to process bulk approve job: Service error'
      );
    });

    it('should throw JobHandlerError if service returns queued job response', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1'],
        reviewerId: 'reviewer-123',
        atomic: false,
      };

      vi.mocked(bulkOperationsService.bulkApprove).mockResolvedValue({
        jobId: 'job-123',
        status: 'queued',
        message: 'Job queued',
      } as any);

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkApprove(payload)).rejects.toThrow(
        'Unexpected nested job queueing in background handler'
      );
    });
  });

  describe('handleBulkReject', () => {
    it('should successfully process bulk reject job', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1', 'approval-2', 'approval-3'],
        reviewerId: 'reviewer-123',
        comments: 'Rejected due to policy violation',
        atomic: false,
      };

      const expectedSummary = {
        successful: [
          { approvalId: 'approval-1', success: true },
          { approvalId: 'approval-2', success: true },
          { approvalId: 'approval-3', success: true },
        ],
        failed: [],
        totalProcessed: 3,
        totalSuccessful: 3,
        totalFailed: 0,
      };

      vi.mocked(bulkOperationsService.bulkReject).mockResolvedValue(expectedSummary);

      // Act
      const result = await bulkOperationsHandler.handleBulkReject(payload);

      // Assert
      expect(result).toEqual(expectedSummary);
      expect(bulkOperationsService.bulkReject).toHaveBeenCalledWith(
        payload.approvalIds,
        payload.reviewerId,
        payload.comments,
        payload.atomic,
        undefined
      );
    });

    it('should process bulk reject with department scope', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1', 'approval-2'],
        reviewerId: 'chair-123',
        comments: 'Not aligned with department goals',
        atomic: false,
        departmentId: 'dept-456',
      };

      const expectedSummary = {
        successful: [
          { approvalId: 'approval-1', success: true },
          { approvalId: 'approval-2', success: true },
        ],
        failed: [],
        totalProcessed: 2,
        totalSuccessful: 2,
        totalFailed: 0,
      };

      vi.mocked(bulkOperationsService.bulkReject).mockResolvedValue(expectedSummary);

      // Act
      const result = await bulkOperationsHandler.handleBulkReject(payload);

      // Assert
      expect(result).toEqual(expectedSummary);
      expect(bulkOperationsService.bulkReject).toHaveBeenCalledWith(
        payload.approvalIds,
        payload.reviewerId,
        payload.comments,
        payload.atomic,
        payload.departmentId
      );
    });

    it('should process bulk reject in atomic mode', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1', 'approval-2'],
        reviewerId: 'admin-123',
        comments: 'Batch rejection',
        atomic: true,
      };

      const expectedSummary = {
        successful: [
          { approvalId: 'approval-1', success: true },
          { approvalId: 'approval-2', success: true },
        ],
        failed: [],
        totalProcessed: 2,
        totalSuccessful: 2,
        totalFailed: 0,
      };

      vi.mocked(bulkOperationsService.bulkReject).mockResolvedValue(expectedSummary);

      // Act
      const result = await bulkOperationsHandler.handleBulkReject(payload);

      // Assert
      expect(result).toEqual(expectedSummary);
      expect(bulkOperationsService.bulkReject).toHaveBeenCalledWith(
        payload.approvalIds,
        payload.reviewerId,
        payload.comments,
        payload.atomic,
        undefined
      );
    });

    it('should return summary with partial failures', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1', 'approval-2', 'approval-3'],
        reviewerId: 'reviewer-123',
        comments: 'Rejected',
        atomic: false,
      };

      const expectedSummary = {
        successful: [
          { approvalId: 'approval-1', success: true },
          { approvalId: 'approval-3', success: true },
        ],
        failed: [
          { approvalId: 'approval-2', success: false, error: 'Already processed' },
        ],
        totalProcessed: 3,
        totalSuccessful: 2,
        totalFailed: 1,
      };

      vi.mocked(bulkOperationsService.bulkReject).mockResolvedValue(expectedSummary);

      // Act
      const result = await bulkOperationsHandler.handleBulkReject(payload);

      // Assert
      expect(result).toEqual(expectedSummary);
      expect(result.totalSuccessful).toBe(2);
      expect(result.totalFailed).toBe(1);
    });

    it('should throw JobHandlerError if approvalIds is missing', async () => {
      // Arrange
      const payload = {
        reviewerId: 'reviewer-123',
        comments: 'Rejected',
        atomic: false,
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        'Invalid payload: approvalIds must be an array'
      );
    });

    it('should throw JobHandlerError if approvalIds is empty', async () => {
      // Arrange
      const payload = {
        approvalIds: [],
        reviewerId: 'reviewer-123',
        comments: 'Rejected',
        atomic: false,
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        'Invalid payload: approvalIds array cannot be empty'
      );
    });

    it('should throw JobHandlerError if reviewerId is missing', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1'],
        comments: 'Rejected',
        atomic: false,
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        'Invalid payload: reviewerId must be a string'
      );
    });

    it('should throw JobHandlerError if comments is missing', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1'],
        reviewerId: 'reviewer-123',
        atomic: false,
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        'Invalid payload: comments must be a non-empty string'
      );
    });

    it('should throw JobHandlerError if comments is not a string', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1'],
        reviewerId: 'reviewer-123',
        comments: 123,
        atomic: false,
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        'Invalid payload: comments must be a non-empty string'
      );
    });

    it('should throw JobHandlerError if atomic is not a boolean', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1'],
        reviewerId: 'reviewer-123',
        comments: 'Rejected',
        atomic: 'not-a-boolean',
      };

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        'Invalid payload: atomic must be a boolean'
      );
    });

    it('should throw JobHandlerError if service throws error', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1'],
        reviewerId: 'reviewer-123',
        comments: 'Rejected',
        atomic: false,
      };

      vi.mocked(bulkOperationsService.bulkReject).mockRejectedValue(
        new Error('Service error')
      );

      // Act & Assert
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        JobHandlerError
      );
      await expect(bulkOperationsHandler.handleBulkReject(payload)).rejects.toThrow(
        'Failed to process bulk reject job: Service error'
      );
    });
  });

  describe('getHandler', () => {
    it('should return bulk approve handler for BULK_APPROVE job type', () => {
      // Act
      const handler = bulkOperationsHandler.getHandler(JobType.BULK_APPROVE);

      // Assert
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });

    it('should return bulk reject handler for BULK_REJECT job type', () => {
      // Act
      const handler = bulkOperationsHandler.getHandler(JobType.BULK_REJECT);

      // Assert
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });

    it('should return undefined for unsupported job types', () => {
      // Act
      const handler = bulkOperationsHandler.getHandler(JobType.NOTIFICATION_DELIVERY);

      // Assert
      expect(handler).toBeUndefined();
    });

    it('should return undefined for ARCHIVAL job type', () => {
      // Act
      const handler = bulkOperationsHandler.getHandler(JobType.ARCHIVAL);

      // Assert
      expect(handler).toBeUndefined();
    });

    it('should return bound handler that can be called directly', async () => {
      // Arrange
      const payload = {
        approvalIds: ['approval-1'],
        reviewerId: 'reviewer-123',
        atomic: false,
      };

      const expectedSummary = {
        successful: [{ approvalId: 'approval-1', success: true }],
        failed: [],
        totalProcessed: 1,
        totalSuccessful: 1,
        totalFailed: 0,
      };

      vi.mocked(bulkOperationsService.bulkApprove).mockResolvedValue(expectedSummary);

      // Act
      const handler = bulkOperationsHandler.getHandler(JobType.BULK_APPROVE);
      const result = await handler!(payload);

      // Assert
      expect(result).toEqual(expectedSummary);
    });
  });
});
