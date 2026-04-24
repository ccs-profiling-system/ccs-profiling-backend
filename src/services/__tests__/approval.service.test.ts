import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { approvalService, InvalidOperationError } from '../approval.service';
import { approvalRepository } from '../../repositories/approval.repository';
import { approvalStateMachine } from '../approval-state-machine.service';
import { departmentAssignmentService } from '../department-assignment.service';
import { entityApplicationService } from '../entity-application.service';
import { notificationService } from '../notification.service';
import { ApprovalStatus, EntityType, Category } from '../../db/schema/approvals';
import { NotificationType } from '../../db/schema/approvalNotifications';
import { db } from '../../db';

// Mock all dependencies
vi.mock('../../repositories/approval.repository');
vi.mock('../approval-state-machine.service');
vi.mock('../department-assignment.service');
vi.mock('../entity-application.service');
vi.mock('../notification.service');
vi.mock('../../db', () => ({
  db: {
    query: {
      students: {
        findFirst: vi.fn(),
      },
      faculty: {
        findFirst: vi.fn(),
      },
      events: {
        findFirst: vi.fn(),
      },
      research: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe('ApprovalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('submitChangeRequest', () => {
    it('should create a new approval with status pending', async () => {
      // Arrange
      const mockStudent = {
        id: 'student-123',
        first_name: 'John',
        last_name: 'Doe',
        program: 'Computer Science',
        updated_at: new Date('2024-01-01'),
      };

      const mockApproval = {
        id: 'approval-123',
        entity_type: EntityType.STUDENT,
        entity_id: 'student-123',
        category: Category.PROFILE,
        change_details: { first_name: 'Jane' },
        original_data: mockStudent,
        status: ApprovalStatus.PENDING,
        submitter_id: 'user-123',
        department_id: 'Computer Science',
        entity_version: new Date('2024-01-01').getTime(),
        submission_timestamp: new Date(),
      };

      vi.mocked(db.query.students.findFirst).mockResolvedValue(mockStudent);
      vi.mocked(departmentAssignmentService.determineDepartmentId).mockResolvedValue('Computer Science');
      vi.mocked(approvalRepository.create).mockResolvedValue(mockApproval as any);

      // Act
      const result = await approvalService.submitChangeRequest(
        {
          entity_type: EntityType.STUDENT,
          entity_id: 'student-123',
          category: Category.PROFILE,
          change_details: { first_name: 'Jane' },
        },
        'user-123'
      );

      // Assert
      expect(result).toEqual(mockApproval);
      expect(db.query.students.findFirst).toHaveBeenCalled();
      expect(departmentAssignmentService.determineDepartmentId).toHaveBeenCalledWith(
        EntityType.STUDENT,
        'student-123'
      );
      expect(approvalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: EntityType.STUDENT,
          entity_id: 'student-123',
          status: ApprovalStatus.PENDING,
          submitter_id: 'user-123',
          department_id: 'Computer Science',
        })
      );
    });

    it('should capture entity version and original data', async () => {
      // Arrange
      const mockStudent = {
        id: 'student-123',
        first_name: 'John',
        last_name: 'Doe',
        program: 'Computer Science',
        updated_at: new Date('2024-01-01'),
      };

      vi.mocked(db.query.students.findFirst).mockResolvedValue(mockStudent);
      vi.mocked(departmentAssignmentService.determineDepartmentId).mockResolvedValue('Computer Science');
      vi.mocked(approvalRepository.create).mockResolvedValue({} as any);

      // Act
      await approvalService.submitChangeRequest(
        {
          entity_type: EntityType.STUDENT,
          entity_id: 'student-123',
          category: Category.PROFILE,
          change_details: { first_name: 'Jane' },
        },
        'user-123'
      );

      // Assert
      expect(approvalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          original_data: mockStudent,
          entity_version: new Date('2024-01-01').getTime(),
        })
      );
    });

    it('should throw error if entity not found', async () => {
      // Arrange
      vi.mocked(db.query.students.findFirst).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        approvalService.submitChangeRequest(
          {
            entity_type: EntityType.STUDENT,
            entity_id: 'nonexistent',
            category: Category.PROFILE,
            change_details: { first_name: 'Jane' },
          },
          'user-123'
        )
      ).rejects.toThrow(InvalidOperationError);
    });

    it('should support idempotency key', async () => {
      // Arrange
      const mockStudent = {
        id: 'student-123',
        updated_at: new Date(),
      };

      vi.mocked(db.query.students.findFirst).mockResolvedValue(mockStudent);
      vi.mocked(departmentAssignmentService.determineDepartmentId).mockResolvedValue('CS');
      vi.mocked(approvalRepository.create).mockResolvedValue({} as any);

      // Act
      await approvalService.submitChangeRequest(
        {
          entity_type: EntityType.STUDENT,
          entity_id: 'student-123',
          category: Category.PROFILE,
          change_details: { first_name: 'Jane' },
          idempotency_key: 'unique-key-123',
        },
        'user-123'
      );

      // Assert
      expect(approvalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotency_key: 'unique-key-123',
        })
      );
    });
  });

  describe('approveChangeRequest', () => {
    it('should approve a pending change request', async () => {
      // Arrange
      const mockApproval = {
        id: 'approval-123',
        status: ApprovalStatus.PENDING,
        submitter_id: 'user-123',
      };

      const mockUpdatedApproval = {
        ...mockApproval,
        status: ApprovalStatus.APPROVED,
        reviewer_id: 'reviewer-123',
        decision_timestamp: new Date(),
      };

      vi.mocked(approvalRepository.findById)
        .mockResolvedValueOnce(mockApproval as any)
        .mockResolvedValueOnce(mockUpdatedApproval as any);
      vi.mocked(approvalStateMachine.assertValidTransition).mockReturnValue(undefined);
      vi.mocked(approvalRepository.update).mockResolvedValue(mockUpdatedApproval as any);
      vi.mocked(entityApplicationService.applyChanges).mockResolvedValue(undefined);
      vi.mocked(notificationService.createApprovalNotification).mockResolvedValue({} as any);

      // Act
      const result = await approvalService.approveChangeRequest(
        'approval-123',
        'reviewer-123',
        'Looks good'
      );

      // Assert
      expect(result.status).toBe(ApprovalStatus.APPROVED);
      expect(approvalStateMachine.assertValidTransition).toHaveBeenCalledWith(
        ApprovalStatus.PENDING,
        ApprovalStatus.APPROVED
      );
      expect(approvalRepository.update).toHaveBeenCalledWith(
        'approval-123',
        expect.objectContaining({
          status: ApprovalStatus.APPROVED,
          reviewer_id: 'reviewer-123',
          comments: 'Looks good',
        })
      );
      expect(entityApplicationService.applyChanges).toHaveBeenCalledWith('approval-123');
      expect(notificationService.createApprovalNotification).toHaveBeenCalledWith(
        mockUpdatedApproval,
        NotificationType.APPROVAL_APPROVED
      );
    });

    it('should allow optional comments', async () => {
      // Arrange
      const mockApproval = {
        id: 'approval-123',
        status: ApprovalStatus.PENDING,
      };

      vi.mocked(approvalRepository.findById)
        .mockResolvedValueOnce(mockApproval as any)
        .mockResolvedValueOnce({ ...mockApproval, status: ApprovalStatus.APPROVED } as any);
      vi.mocked(approvalStateMachine.assertValidTransition).mockReturnValue(undefined);
      vi.mocked(approvalRepository.update).mockResolvedValue({} as any);
      vi.mocked(entityApplicationService.applyChanges).mockResolvedValue(undefined);
      vi.mocked(notificationService.createApprovalNotification).mockResolvedValue({} as any);

      // Act
      await approvalService.approveChangeRequest('approval-123', 'reviewer-123');

      // Assert
      expect(approvalRepository.update).toHaveBeenCalledWith(
        'approval-123',
        expect.objectContaining({
          comments: null,
        })
      );
    });

    it('should throw error if approval not found', async () => {
      // Arrange
      vi.mocked(approvalRepository.findById).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        approvalService.approveChangeRequest('nonexistent', 'reviewer-123')
      ).rejects.toThrow(InvalidOperationError);
    });

    it('should propagate entity application errors', async () => {
      // Arrange
      const mockApproval = {
        id: 'approval-123',
        status: ApprovalStatus.PENDING,
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(mockApproval as any);
      vi.mocked(approvalStateMachine.assertValidTransition).mockReturnValue(undefined);
      vi.mocked(approvalRepository.update).mockResolvedValue(mockApproval as any);
      vi.mocked(entityApplicationService.applyChanges).mockRejectedValue(
        new Error('Conflict detected')
      );

      // Act & Assert
      await expect(
        approvalService.approveChangeRequest('approval-123', 'reviewer-123')
      ).rejects.toThrow('Conflict detected');
    });
  });

  describe('rejectChangeRequest', () => {
    it('should reject a pending change request with comments', async () => {
      // Arrange
      const mockApproval = {
        id: 'approval-123',
        status: ApprovalStatus.PENDING,
        submitter_id: 'user-123',
      };

      const mockUpdatedApproval = {
        ...mockApproval,
        status: ApprovalStatus.REJECTED,
        reviewer_id: 'reviewer-123',
        comments: 'Does not meet requirements',
        decision_timestamp: new Date(),
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(mockApproval as any);
      vi.mocked(approvalStateMachine.assertValidTransition).mockReturnValue(undefined);
      vi.mocked(approvalRepository.update).mockResolvedValue(mockUpdatedApproval as any);
      vi.mocked(notificationService.createApprovalNotification).mockResolvedValue({} as any);

      // Act
      const result = await approvalService.rejectChangeRequest(
        'approval-123',
        'reviewer-123',
        'Does not meet requirements'
      );

      // Assert
      expect(result.status).toBe(ApprovalStatus.REJECTED);
      expect(approvalRepository.update).toHaveBeenCalledWith(
        'approval-123',
        expect.objectContaining({
          status: ApprovalStatus.REJECTED,
          reviewer_id: 'reviewer-123',
          comments: 'Does not meet requirements',
        })
      );
      expect(notificationService.createApprovalNotification).toHaveBeenCalledWith(
        mockUpdatedApproval,
        NotificationType.APPROVAL_REJECTED
      );
    });

    it('should require comments for rejection', async () => {
      // Act & Assert
      await expect(
        approvalService.rejectChangeRequest('approval-123', 'reviewer-123', '')
      ).rejects.toThrow('Comments are required when rejecting');

      await expect(
        approvalService.rejectChangeRequest('approval-123', 'reviewer-123', '   ')
      ).rejects.toThrow('Comments are required when rejecting');
    });

    it('should throw error if approval not found', async () => {
      // Arrange
      vi.mocked(approvalRepository.findById).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        approvalService.rejectChangeRequest('nonexistent', 'reviewer-123', 'Bad request')
      ).rejects.toThrow(InvalidOperationError);
    });
  });

  describe('withdrawChangeRequest', () => {
    it('should withdraw a pending change request by submitter', async () => {
      // Arrange
      const mockApproval = {
        id: 'approval-123',
        status: ApprovalStatus.PENDING,
        submitter_id: 'user-123',
      };

      const mockUpdatedApproval = {
        ...mockApproval,
        status: ApprovalStatus.WITHDRAWN,
        decision_timestamp: new Date(),
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(mockApproval as any);
      vi.mocked(approvalStateMachine.canWithdraw).mockReturnValue(true);
      vi.mocked(approvalRepository.update).mockResolvedValue(mockUpdatedApproval as any);

      // Act
      const result = await approvalService.withdrawChangeRequest('approval-123', 'user-123');

      // Assert
      expect(result.status).toBe(ApprovalStatus.WITHDRAWN);
      expect(approvalRepository.update).toHaveBeenCalledWith(
        'approval-123',
        expect.objectContaining({
          status: ApprovalStatus.WITHDRAWN,
        })
      );
    });

    it('should only allow submitter to withdraw', async () => {
      // Arrange
      const mockApproval = {
        id: 'approval-123',
        status: ApprovalStatus.PENDING,
        submitter_id: 'user-123',
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(mockApproval as any);

      // Act & Assert
      await expect(
        approvalService.withdrawChangeRequest('approval-123', 'other-user')
      ).rejects.toThrow('Only the submitter can withdraw');
    });

    it('should only allow withdrawal of pending requests', async () => {
      // Arrange
      const mockApproval = {
        id: 'approval-123',
        status: ApprovalStatus.APPROVED,
        submitter_id: 'user-123',
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(mockApproval as any);
      vi.mocked(approvalStateMachine.canWithdraw).mockReturnValue(false);

      // Act & Assert
      await expect(
        approvalService.withdrawChangeRequest('approval-123', 'user-123')
      ).rejects.toThrow('Cannot withdraw change request with status');
    });

    it('should throw error if approval not found', async () => {
      // Arrange
      vi.mocked(approvalRepository.findById).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        approvalService.withdrawChangeRequest('nonexistent', 'user-123')
      ).rejects.toThrow(InvalidOperationError);
    });
  });

  describe('getMySubmissions', () => {
    it('should return user submissions with pagination', async () => {
      // Arrange
      const mockResult = {
        data: [
          { id: 'approval-1', submitter_id: 'user-123' },
          { id: 'approval-2', submitter_id: 'user-123' },
        ],
        pagination: {
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      };

      vi.mocked(approvalRepository.findMany).mockResolvedValue(mockResult as any);

      // Act
      const result = await approvalService.getMySubmissions('user-123');

      // Assert
      expect(result).toEqual(mockResult);
      expect(approvalRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          submitter_id: 'user-123',
        }),
        {}
      );
    });

    it('should support filtering by status', async () => {
      // Arrange
      vi.mocked(approvalRepository.findMany).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
      });

      // Act
      await approvalService.getMySubmissions(
        'user-123',
        { status: ApprovalStatus.PENDING }
      );

      // Assert
      expect(approvalRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          submitter_id: 'user-123',
          status: ApprovalStatus.PENDING,
        }),
        {}
      );
    });

    it('should support pagination options', async () => {
      // Arrange
      vi.mocked(approvalRepository.findMany).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 2, pageSize: 10, totalPages: 0 },
      });

      // Act
      await approvalService.getMySubmissions(
        'user-123',
        {},
        { page: 2, pageSize: 10 }
      );

      // Assert
      expect(approvalRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          submitter_id: 'user-123',
        }),
        { page: 2, pageSize: 10 }
      );
    });
  });

  describe('getPendingApprovals', () => {
    it('should return all pending approvals for admin', async () => {
      // Arrange
      const mockResult = {
        data: [
          { id: 'approval-1', status: ApprovalStatus.PENDING },
          { id: 'approval-2', status: ApprovalStatus.PENDING },
        ],
        pagination: {
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      };

      vi.mocked(approvalRepository.findPending).mockResolvedValue(mockResult as any);

      // Act
      const result = await approvalService.getPendingApprovals();

      // Assert
      expect(result).toEqual(mockResult);
      expect(approvalRepository.findPending).toHaveBeenCalledWith({}, {});
    });

    it('should filter by department for chairs', async () => {
      // Arrange
      vi.mocked(approvalRepository.findPending).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
      });

      // Act
      await approvalService.getPendingApprovals({}, {}, 'CS-dept');

      // Assert
      expect(approvalRepository.findPending).toHaveBeenCalledWith(
        expect.objectContaining({
          department_id: 'CS-dept',
        }),
        {}
      );
    });

    it('should support additional filters', async () => {
      // Arrange
      vi.mocked(approvalRepository.findPending).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
      });

      // Act
      await approvalService.getPendingApprovals(
        { entity_type: EntityType.STUDENT },
        {},
        'CS-dept'
      );

      // Assert
      expect(approvalRepository.findPending).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: EntityType.STUDENT,
          department_id: 'CS-dept',
        }),
        {}
      );
    });
  });

  describe('getApprovalHistory', () => {
    it('should return all processed approvals for admin', async () => {
      // Arrange
      const mockResult = {
        data: [
          { id: 'approval-1', status: ApprovalStatus.APPROVED },
          { id: 'approval-2', status: ApprovalStatus.REJECTED },
        ],
        pagination: {
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      };

      vi.mocked(approvalRepository.findHistory).mockResolvedValue(mockResult as any);

      // Act
      const result = await approvalService.getApprovalHistory();

      // Assert
      expect(result).toEqual(mockResult);
      expect(approvalRepository.findHistory).toHaveBeenCalledWith({}, {});
    });

    it('should filter by department for chairs', async () => {
      // Arrange
      vi.mocked(approvalRepository.findHistory).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
      });

      // Act
      await approvalService.getApprovalHistory({}, {}, 'CS-dept');

      // Assert
      expect(approvalRepository.findHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          department_id: 'CS-dept',
        }),
        {}
      );
    });

    it('should support filtering by status', async () => {
      // Arrange
      vi.mocked(approvalRepository.findHistory).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
      });

      // Act
      await approvalService.getApprovalHistory(
        { status: ApprovalStatus.APPROVED }
      );

      // Assert
      expect(approvalRepository.findHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ApprovalStatus.APPROVED,
        }),
        {}
      );
    });
  });

  describe('getApprovalById', () => {
    it('should return approval by ID', async () => {
      // Arrange
      const mockApproval = {
        id: 'approval-123',
        status: ApprovalStatus.PENDING,
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(mockApproval as any);

      // Act
      const result = await approvalService.getApprovalById('approval-123');

      // Assert
      expect(result).toEqual(mockApproval);
      expect(approvalRepository.findById).toHaveBeenCalledWith('approval-123');
    });

    it('should return undefined if not found', async () => {
      // Arrange
      vi.mocked(approvalRepository.findById).mockResolvedValue(undefined);

      // Act
      const result = await approvalService.getApprovalById('nonexistent');

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
