import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bulkOperationsService, type BulkOperationSummary, type QueuedJobResponse } from '../bulk-operations.service';
import { approvalRepository } from '../../repositories/approval.repository';
import { backgroundJobRepository } from '../../repositories/background-job.repository';
import { approvalService, InvalidOperationError } from '../approval.service';
import { ApprovalStatus } from '../../../../db/schema/approvals';
import { JobType, JobStatus } from '../../../../db/schema/backgroundJobs';

// Mock dependencies
vi.mock('../../repositories/approval.repository', () => ({
  approvalRepository: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../repositories/background-job.repository', () => ({
  backgroundJobRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('../approval.service', () => ({
  approvalService: {
    approveChangeRequest: vi.fn(),
    rejectChangeRequest: vi.fn(),
  },
  InvalidOperationError: class InvalidOperationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'InvalidOperationError';
    }
  },
}));

vi.mock('../../../../db', () => ({
  db: {
    transaction: vi.fn((callback) => callback({})),
    query: {
      students: { findFirst: vi.fn() },
      faculty: { findFirst: vi.fn() },
      events: { findFirst: vi.fn() },
      research: { findFirst: vi.fn() },
    },
  },
}));

describe('BulkOperationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('bulkApprove', () => {
    describe('Independent Mode (default)', () => {
      it('should successfully approve all items in independent mode', async () => {
        const approvalIds = ['id1', 'id2', 'id3'];
        const reviewerId = 'reviewer-123';

        // Mock successful approvals
        vi.mocked(approvalService.approveChangeRequest).mockResolvedValue({} as any);

        const result = await bulkOperationsService.bulkApprove(
          approvalIds,
          reviewerId,
          false
        );

        expect(result).toMatchObject({
          totalProcessed: 3,
          totalSuccessful: 3,
          totalFailed: 0,
        });
        expect((result as BulkOperationSummary).successful).toHaveLength(3);
        expect((result as BulkOperationSummary).failed).toHaveLength(0);
        expect(approvalService.approveChangeRequest).toHaveBeenCalledTimes(3);
      });

      it('should handle partial failures in independent mode', async () => {
        const approvalIds = ['id1', 'id2', 'id3'];
        const reviewerId = 'reviewer-123';

        // Mock: first succeeds, second fails, third succeeds
        vi.mocked(approvalService.approveChangeRequest)
          .mockResolvedValueOnce({} as any)
          .mockRejectedValueOnce(new InvalidOperationError('Invalid state'))
          .mockResolvedValueOnce({} as any);

        const result = await bulkOperationsService.bulkApprove(
          approvalIds,
          reviewerId,
          false
        );

        expect(result).toMatchObject({
          totalProcessed: 3,
          totalSuccessful: 2,
          totalFailed: 1,
        });
        expect((result as BulkOperationSummary).successful).toHaveLength(2);
        expect((result as BulkOperationSummary).failed).toHaveLength(1);
        expect((result as BulkOperationSummary).failed[0]).toMatchObject({
          approvalId: 'id2',
          success: false,
          error: 'Invalid state',
        });
      });

      it('should enforce max 100 items limit in independent mode', async () => {
        const approvalIds = Array.from({ length: 101 }, (_, i) => `id${i}`);
        const reviewerId = 'reviewer-123';

        await expect(
          bulkOperationsService.bulkApprove(approvalIds, reviewerId, false)
        ).rejects.toThrow('Independent mode supports a maximum of 100 items');
      });

      it('should validate department scope for chair operations', async () => {
        const approvalIds = ['id1', 'id2'];
        const reviewerId = 'chair-123';
        const departmentId = 'dept-456';

        // Mock: first approval belongs to department, second does not
        vi.mocked(approvalRepository.findById)
          .mockResolvedValueOnce({
            id: 'id1',
            department_id: 'dept-456',
            status: ApprovalStatus.PENDING,
          } as any)
          .mockResolvedValueOnce({
            id: 'id2',
            department_id: 'dept-999',
            status: ApprovalStatus.PENDING,
          } as any);

        vi.mocked(approvalService.approveChangeRequest).mockResolvedValue({} as any);

        const result = await bulkOperationsService.bulkApprove(
          approvalIds,
          reviewerId,
          false,
          departmentId
        );

        expect(result).toMatchObject({
          totalProcessed: 2,
          totalSuccessful: 1,
          totalFailed: 1,
        });
        expect((result as BulkOperationSummary).failed[0]).toMatchObject({
          approvalId: 'id2',
          success: false,
        });
        expect((result as BulkOperationSummary).failed[0].error).toContain('Authorization denied');
      });
    });

    describe('Atomic Mode', () => {
      it('should successfully approve all items in atomic mode', async () => {
        const approvalIds = ['id1', 'id2', 'id3'];
        const reviewerId = 'reviewer-123';

        // Mock successful approvals
        vi.mocked(approvalRepository.findById).mockResolvedValue({
          id: 'id1',
          status: ApprovalStatus.PENDING,
        } as any);
        vi.mocked(approvalService.approveChangeRequest).mockResolvedValue({} as any);

        const result = await bulkOperationsService.bulkApprove(
          approvalIds,
          reviewerId,
          true
        );

        expect(result).toMatchObject({
          totalProcessed: 3,
          totalSuccessful: 3,
          totalFailed: 0,
        });
        expect((result as BulkOperationSummary).successful).toHaveLength(3);
        expect((result as BulkOperationSummary).failed).toHaveLength(0);
      });

      it('should rollback all changes if any item fails in atomic mode', async () => {
        const approvalIds = ['id1', 'id2', 'id3'];
        const reviewerId = 'reviewer-123';

        // Mock: transaction fails
        vi.mocked(approvalRepository.findById).mockResolvedValue({
          id: 'id1',
          status: ApprovalStatus.PENDING,
        } as any);
        vi.mocked(approvalService.approveChangeRequest)
          .mockResolvedValueOnce({} as any)
          .mockRejectedValueOnce(new InvalidOperationError('Invalid state'));

        const result = await bulkOperationsService.bulkApprove(
          approvalIds,
          reviewerId,
          true
        );

        expect(result).toMatchObject({
          totalProcessed: 3,
          totalSuccessful: 0,
          totalFailed: 3,
        });
        expect((result as BulkOperationSummary).successful).toHaveLength(0);
        expect((result as BulkOperationSummary).failed).toHaveLength(3);
      });

      it('should enforce max 50 items limit in atomic mode', async () => {
        const approvalIds = Array.from({ length: 51 }, (_, i) => `id${i}`);
        const reviewerId = 'reviewer-123';

        await expect(
          bulkOperationsService.bulkApprove(approvalIds, reviewerId, true)
        ).rejects.toThrow('Atomic mode supports a maximum of 50 items');
      });
    });

    describe('Background Job Queueing', () => {
      it('should queue background job for >20 items', async () => {
        const approvalIds = Array.from({ length: 25 }, (_, i) => `id${i}`);
        const reviewerId = 'reviewer-123';

        vi.mocked(backgroundJobRepository.create).mockResolvedValue({
          id: 'job-123',
          job_type: JobType.BULK_APPROVE,
          status: JobStatus.QUEUED,
        } as any);

        const result = await bulkOperationsService.bulkApprove(
          approvalIds,
          reviewerId,
          false
        );

        expect(result).toMatchObject({
          jobId: 'job-123',
          status: 'queued',
        });
        expect((result as QueuedJobResponse).message).toContain('25 items');
        expect(backgroundJobRepository.create).toHaveBeenCalledWith({
          job_type: JobType.BULK_APPROVE,
          status: JobStatus.QUEUED,
          payload: {
            approvalIds,
            reviewerId,
            atomic: false,
            departmentId: undefined,
          },
          initiated_by: reviewerId,
        });
      });

      it('should include department ID in queued job payload', async () => {
        const approvalIds = Array.from({ length: 25 }, (_, i) => `id${i}`);
        const reviewerId = 'chair-123';
        const departmentId = 'dept-456';

        vi.mocked(backgroundJobRepository.create).mockResolvedValue({
          id: 'job-123',
          job_type: JobType.BULK_APPROVE,
          status: JobStatus.QUEUED,
        } as any);

        await bulkOperationsService.bulkApprove(
          approvalIds,
          reviewerId,
          false,
          departmentId
        );

        expect(backgroundJobRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              departmentId: 'dept-456',
            }),
          })
        );
      });
    });

    describe('Edge Cases', () => {
      it('should reject empty approval IDs array', async () => {
        const approvalIds: string[] = [];
        const reviewerId = 'reviewer-123';

        await expect(
          bulkOperationsService.bulkApprove(approvalIds, reviewerId, false)
        ).rejects.toThrow('At least one approval ID is required');
      });

      it('should handle exactly 20 items without queueing', async () => {
        const approvalIds = Array.from({ length: 20 }, (_, i) => `id${i}`);
        const reviewerId = 'reviewer-123';

        vi.mocked(approvalService.approveChangeRequest).mockResolvedValue({} as any);

        const result = await bulkOperationsService.bulkApprove(
          approvalIds,
          reviewerId,
          false
        );

        expect(result).toHaveProperty('totalProcessed', 20);
        expect(backgroundJobRepository.create).not.toHaveBeenCalled();
      });

      it('should handle exactly 21 items with queueing', async () => {
        const approvalIds = Array.from({ length: 21 }, (_, i) => `id${i}`);
        const reviewerId = 'reviewer-123';

        vi.mocked(backgroundJobRepository.create).mockResolvedValue({
          id: 'job-123',
          job_type: JobType.BULK_APPROVE,
          status: JobStatus.QUEUED,
        } as any);

        const result = await bulkOperationsService.bulkApprove(
          approvalIds,
          reviewerId,
          false
        );

        expect(result).toHaveProperty('jobId', 'job-123');
        expect(backgroundJobRepository.create).toHaveBeenCalled();
      });
    });
  });

  describe('bulkReject', () => {
    describe('Independent Mode (default)', () => {
      it('should successfully reject all items in independent mode', async () => {
        const approvalIds = ['id1', 'id2', 'id3'];
        const reviewerId = 'reviewer-123';
        const comments = 'Bulk rejection reason';

        vi.mocked(approvalService.rejectChangeRequest).mockResolvedValue({} as any);

        const result = await bulkOperationsService.bulkReject(
          approvalIds,
          reviewerId,
          comments,
          false
        );

        expect(result).toMatchObject({
          totalProcessed: 3,
          totalSuccessful: 3,
          totalFailed: 0,
        });
        expect((result as BulkOperationSummary).successful).toHaveLength(3);
        expect((result as BulkOperationSummary).failed).toHaveLength(0);
        expect(approvalService.rejectChangeRequest).toHaveBeenCalledTimes(3);
        expect(approvalService.rejectChangeRequest).toHaveBeenCalledWith(
          'id1',
          reviewerId,
          comments
        );
      });

      it('should handle partial failures in independent mode', async () => {
        const approvalIds = ['id1', 'id2', 'id3'];
        const reviewerId = 'reviewer-123';
        const comments = 'Bulk rejection reason';

        vi.mocked(approvalService.rejectChangeRequest)
          .mockResolvedValueOnce({} as any)
          .mockRejectedValueOnce(new InvalidOperationError('Invalid state'))
          .mockResolvedValueOnce({} as any);

        const result = await bulkOperationsService.bulkReject(
          approvalIds,
          reviewerId,
          comments,
          false
        );

        expect(result).toMatchObject({
          totalProcessed: 3,
          totalSuccessful: 2,
          totalFailed: 1,
        });
        expect((result as BulkOperationSummary).failed[0]).toMatchObject({
          approvalId: 'id2',
          success: false,
          error: 'Invalid state',
        });
      });

      it('should require comments for rejection', async () => {
        const approvalIds = ['id1', 'id2'];
        const reviewerId = 'reviewer-123';

        await expect(
          bulkOperationsService.bulkReject(approvalIds, reviewerId, '', false)
        ).rejects.toThrow('Comments are required when rejecting change requests');

        await expect(
          bulkOperationsService.bulkReject(approvalIds, reviewerId, '   ', false)
        ).rejects.toThrow('Comments are required when rejecting change requests');
      });
    });

    describe('Atomic Mode', () => {
      it('should successfully reject all items in atomic mode', async () => {
        const approvalIds = ['id1', 'id2', 'id3'];
        const reviewerId = 'reviewer-123';
        const comments = 'Bulk rejection reason';

        vi.mocked(approvalRepository.findById).mockResolvedValue({
          id: 'id1',
          status: ApprovalStatus.PENDING,
        } as any);
        vi.mocked(approvalService.rejectChangeRequest).mockResolvedValue({} as any);

        const result = await bulkOperationsService.bulkReject(
          approvalIds,
          reviewerId,
          comments,
          true
        );

        expect(result).toMatchObject({
          totalProcessed: 3,
          totalSuccessful: 3,
          totalFailed: 0,
        });
      });

      it('should rollback all changes if any item fails in atomic mode', async () => {
        const approvalIds = ['id1', 'id2', 'id3'];
        const reviewerId = 'reviewer-123';
        const comments = 'Bulk rejection reason';

        vi.mocked(approvalRepository.findById).mockResolvedValue({
          id: 'id1',
          status: ApprovalStatus.PENDING,
        } as any);
        vi.mocked(approvalService.rejectChangeRequest)
          .mockResolvedValueOnce({} as any)
          .mockRejectedValueOnce(new InvalidOperationError('Invalid state'));

        const result = await bulkOperationsService.bulkReject(
          approvalIds,
          reviewerId,
          comments,
          true
        );

        expect(result).toMatchObject({
          totalProcessed: 3,
          totalSuccessful: 0,
          totalFailed: 3,
        });
      });
    });

    describe('Background Job Queueing', () => {
      it('should queue background job for >20 items', async () => {
        const approvalIds = Array.from({ length: 25 }, (_, i) => `id${i}`);
        const reviewerId = 'reviewer-123';
        const comments = 'Bulk rejection reason';

        vi.mocked(backgroundJobRepository.create).mockResolvedValue({
          id: 'job-456',
          job_type: JobType.BULK_REJECT,
          status: JobStatus.QUEUED,
        } as any);

        const result = await bulkOperationsService.bulkReject(
          approvalIds,
          reviewerId,
          comments,
          false
        );

        expect(result).toMatchObject({
          jobId: 'job-456',
          status: 'queued',
        });
        expect(backgroundJobRepository.create).toHaveBeenCalledWith({
          job_type: JobType.BULK_REJECT,
          status: JobStatus.QUEUED,
          payload: {
            approvalIds,
            reviewerId,
            comments,
            atomic: false,
            departmentId: undefined,
          },
          initiated_by: reviewerId,
        });
      });
    });

    describe('Department Scope Validation', () => {
      it('should validate department scope for chair operations', async () => {
        const approvalIds = ['id1', 'id2'];
        const reviewerId = 'chair-123';
        const departmentId = 'dept-456';
        const comments = 'Bulk rejection reason';

        vi.mocked(approvalRepository.findById)
          .mockResolvedValueOnce({
            id: 'id1',
            department_id: 'dept-456',
            status: ApprovalStatus.PENDING,
          } as any)
          .mockResolvedValueOnce({
            id: 'id2',
            department_id: 'dept-999',
            status: ApprovalStatus.PENDING,
          } as any);

        vi.mocked(approvalService.rejectChangeRequest).mockResolvedValue({} as any);

        const result = await bulkOperationsService.bulkReject(
          approvalIds,
          reviewerId,
          comments,
          false,
          departmentId
        );

        expect(result).toMatchObject({
          totalProcessed: 2,
          totalSuccessful: 1,
          totalFailed: 1,
        });
        expect((result as BulkOperationSummary).failed[0]).toMatchObject({
          approvalId: 'id2',
          success: false,
        });
      });
    });
  });

  describe('Validation', () => {
    it('should reject operations with 0 items', async () => {
      await expect(
        bulkOperationsService.bulkApprove([], 'reviewer-123', false)
      ).rejects.toThrow('At least one approval ID is required');

      await expect(
        bulkOperationsService.bulkReject([], 'reviewer-123', 'comments', false)
      ).rejects.toThrow('At least one approval ID is required');
    });

    it('should enforce independent mode max limit (100 items)', async () => {
      const approvalIds = Array.from({ length: 101 }, (_, i) => `id${i}`);

      await expect(
        bulkOperationsService.bulkApprove(approvalIds, 'reviewer-123', false)
      ).rejects.toThrow('Independent mode supports a maximum of 100 items');

      await expect(
        bulkOperationsService.bulkReject(approvalIds, 'reviewer-123', 'comments', false)
      ).rejects.toThrow('Independent mode supports a maximum of 100 items');
    });

    it('should enforce atomic mode max limit (50 items)', async () => {
      const approvalIds = Array.from({ length: 51 }, (_, i) => `id${i}`);

      await expect(
        bulkOperationsService.bulkApprove(approvalIds, 'reviewer-123', true)
      ).rejects.toThrow('Atomic mode supports a maximum of 50 items');

      await expect(
        bulkOperationsService.bulkReject(approvalIds, 'reviewer-123', 'comments', true)
      ).rejects.toThrow('Atomic mode supports a maximum of 50 items');
    });
  });
});
