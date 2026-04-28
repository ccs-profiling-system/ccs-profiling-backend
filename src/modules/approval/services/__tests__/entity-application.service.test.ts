import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EntityApplicationService,
  EntityNotFoundError,
} from '../entity-application.service';
import { ConflictError, ValidationError } from '../../../../shared/errors';
import { approvalRepository } from '../../repositories/approval.repository';
import { notificationRepository } from '../../repositories/notification.repository';
import { db } from '../../../../db';
import { ApprovalStatus, EntityType } from '../../../../db/schema/approvals';
import { NotificationType, NotificationPriority } from '../../../../db/schema/approvalNotifications';

// Mock dependencies
vi.mock('../../repositories/approval.repository');
vi.mock('../../repositories/notification.repository');
vi.mock('../../db', () => ({
  db: {
    query: {
      students: { findFirst: vi.fn() },
      faculty: { findFirst: vi.fn() },
      events: { findFirst: vi.fn() },
      research: { findFirst: vi.fn() },
    },
    transaction: vi.fn(),
  },
}));

describe('EntityApplicationService', () => {
  let service: EntityApplicationService;

  beforeEach(() => {
    service = new EntityApplicationService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('applyChanges - Success Scenarios', () => {
    it('should successfully apply changes to a student entity', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.STUDENT,
        entity_id: 'student-456',
        change_details: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
        },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      const existingStudent = {
        id: 'student-456',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        updated_at: new Date('2024-01-01T09:00:00Z'), // Before submission
      };

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
        };
        await callback(mockTx);
      });

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.students.findFirst).mockResolvedValue(existingStudent as any);
      vi.mocked(db.transaction).mockImplementation(mockTransaction as any);

      // Act
      await service.applyChanges(approvalId);

      // Assert
      expect(approvalRepository.findById).toHaveBeenCalledWith(approvalId);
      expect(db.query.students.findFirst).toHaveBeenCalled();
      expect(db.transaction).toHaveBeenCalled();
    });

    it('should successfully apply changes to a faculty entity', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.FACULTY,
        entity_id: 'faculty-456',
        change_details: {
          department: 'Computer Science',
          position: 'Professor',
        },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      const existingFaculty = {
        id: 'faculty-456',
        department: 'Mathematics',
        position: 'Associate Professor',
        updated_at: new Date('2024-01-01T09:00:00Z'),
      };

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
        };
        await callback(mockTx);
      });

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.faculty.findFirst).mockResolvedValue(existingFaculty as any);
      vi.mocked(db.transaction).mockImplementation(mockTransaction as any);

      // Act
      await service.applyChanges(approvalId);

      // Assert
      expect(approvalRepository.findById).toHaveBeenCalledWith(approvalId);
      expect(db.query.faculty.findFirst).toHaveBeenCalled();
      expect(db.transaction).toHaveBeenCalled();
    });

    it('should successfully apply changes to an event entity', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.EVENT,
        entity_id: 'event-456',
        change_details: {
          event_name: 'Tech Conference 2024',
          location: 'Main Hall',
        },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      const existingEvent = {
        id: 'event-456',
        event_name: 'Tech Conference',
        location: 'Room 101',
        updated_at: new Date('2024-01-01T09:00:00Z'),
      };

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
        };
        await callback(mockTx);
      });

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.events.findFirst).mockResolvedValue(existingEvent as any);
      vi.mocked(db.transaction).mockImplementation(mockTransaction as any);

      // Act
      await service.applyChanges(approvalId);

      // Assert
      expect(approvalRepository.findById).toHaveBeenCalledWith(approvalId);
      expect(db.query.events.findFirst).toHaveBeenCalled();
      expect(db.transaction).toHaveBeenCalled();
    });

    it('should successfully apply changes to a research entity', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.RESEARCH,
        entity_id: 'research-456',
        change_details: {
          title: 'AI Research Project',
          status: 'completed',
        },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      const existingResearch = {
        id: 'research-456',
        title: 'AI Research',
        status: 'ongoing',
        updated_at: new Date('2024-01-01T09:00:00Z'),
      };

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
        };
        await callback(mockTx);
      });

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.research.findFirst).mockResolvedValue(existingResearch as any);
      vi.mocked(db.transaction).mockImplementation(mockTransaction as any);

      // Act
      await service.applyChanges(approvalId);

      // Assert
      expect(approvalRepository.findById).toHaveBeenCalledWith(approvalId);
      expect(db.query.research.findFirst).toHaveBeenCalled();
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe('applyChanges - Conflict Detection', () => {
    it('should detect conflict when entity was updated after submission', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.STUDENT,
        entity_id: 'student-456',
        change_details: { first_name: 'John' },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      const existingStudent = {
        id: 'student-456',
        first_name: 'Jane',
        updated_at: new Date('2024-01-01T11:00:00Z'), // After submission - CONFLICT!
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.students.findFirst).mockResolvedValue(existingStudent as any);
      vi.mocked(approvalRepository.update).mockResolvedValue(undefined as any);
      vi.mocked(notificationRepository.create).mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(service.applyChanges(approvalId)).rejects.toThrow(ConflictError);
      
      // Verify approval was marked as conflicted
      expect(approvalRepository.update).toHaveBeenCalledWith(
        approvalId,
        expect.objectContaining({
          status: ApprovalStatus.CONFLICTED,
          failure_reason: expect.stringContaining('Entity has been modified'),
        })
      );

      // Verify notifications were created
      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-2', // Reviewer
          type: NotificationType.CONFLICT_DETECTED,
          priority: NotificationPriority.HIGH,
        })
      );

      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1', // Submitter
          type: NotificationType.CONFLICT_DETECTED,
          priority: NotificationPriority.HIGH,
        })
      );
    });

    it('should not detect conflict when entity was not updated after submission', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.STUDENT,
        entity_id: 'student-456',
        change_details: { first_name: 'John' },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      const existingStudent = {
        id: 'student-456',
        first_name: 'Jane',
        updated_at: new Date('2024-01-01T09:00:00Z'), // Before submission - NO CONFLICT
      };

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
        };
        await callback(mockTx);
      });

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.students.findFirst).mockResolvedValue(existingStudent as any);
      vi.mocked(db.transaction).mockImplementation(mockTransaction as any);

      // Act
      await service.applyChanges(approvalId);

      // Assert - should not throw
      expect(approvalRepository.update).not.toHaveBeenCalledWith(
        approvalId,
        expect.objectContaining({ status: ApprovalStatus.CONFLICTED })
      );
    });
  });

  describe('applyChanges - Entity Not Found', () => {
    it('should throw EntityNotFoundError when student does not exist', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.STUDENT,
        entity_id: 'student-456',
        change_details: { first_name: 'John' },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.students.findFirst).mockResolvedValue(undefined); // Entity not found
      vi.mocked(approvalRepository.update).mockResolvedValue(undefined as any);
      vi.mocked(notificationRepository.create).mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(service.applyChanges(approvalId)).rejects.toThrow(EntityNotFoundError);
      
      // Verify approval was marked as failed
      expect(approvalRepository.update).toHaveBeenCalledWith(
        approvalId,
        expect.objectContaining({
          status: ApprovalStatus.FAILED,
          failure_reason: expect.stringContaining('not found'),
        })
      );

      // Verify notification was created
      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.APPLICATION_FAILED,
          priority: NotificationPriority.MEDIUM,
        })
      );
    });

    it('should throw EntityNotFoundError when faculty does not exist', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.FACULTY,
        entity_id: 'faculty-456',
        change_details: { department: 'CS' },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.faculty.findFirst).mockResolvedValue(undefined);
      vi.mocked(approvalRepository.update).mockResolvedValue(undefined as any);
      vi.mocked(notificationRepository.create).mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(service.applyChanges(approvalId)).rejects.toThrow(EntityNotFoundError);
      
      expect(approvalRepository.update).toHaveBeenCalledWith(
        approvalId,
        expect.objectContaining({ status: ApprovalStatus.FAILED })
      );
    });
  });

  describe('applyChanges - Validation Failures', () => {
    it('should throw ValidationError when student change_details are invalid', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.STUDENT,
        entity_id: 'student-456',
        change_details: {
          first_name: 'John',
          email: 'invalid-email', // Invalid email format
        },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      const existingStudent = {
        id: 'student-456',
        first_name: 'Jane',
        updated_at: new Date('2024-01-01T09:00:00Z'),
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.students.findFirst).mockResolvedValue(existingStudent as any);
      vi.mocked(approvalRepository.update).mockResolvedValue(undefined as any);
      vi.mocked(notificationRepository.create).mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(service.applyChanges(approvalId)).rejects.toThrow(ValidationError);
      
      // Verify approval was marked as failed
      expect(approvalRepository.update).toHaveBeenCalledWith(
        approvalId,
        expect.objectContaining({
          status: ApprovalStatus.FAILED,
          failure_reason: expect.stringContaining('validation failed'),
        })
      );
    });

    it('should throw ValidationError when faculty change_details contain unknown fields', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.FACULTY,
        entity_id: 'faculty-456',
        change_details: {
          department: 'CS',
          unknown_field: 'value', // Unknown field
        },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      const existingFaculty = {
        id: 'faculty-456',
        department: 'Math',
        updated_at: new Date('2024-01-01T09:00:00Z'),
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.faculty.findFirst).mockResolvedValue(existingFaculty as any);
      vi.mocked(approvalRepository.update).mockResolvedValue(undefined as any);
      vi.mocked(notificationRepository.create).mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(service.applyChanges(approvalId)).rejects.toThrow(ValidationError);
      
      expect(approvalRepository.update).toHaveBeenCalledWith(
        approvalId,
        expect.objectContaining({ status: ApprovalStatus.FAILED })
      );
    });

    it('should throw ValidationError when event status is invalid', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.EVENT,
        entity_id: 'event-456',
        change_details: {
          event_name: 'Conference',
          status: 'invalid_status', // Invalid status
        },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      const existingEvent = {
        id: 'event-456',
        event_name: 'Conference',
        updated_at: new Date('2024-01-01T09:00:00Z'),
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.events.findFirst).mockResolvedValue(existingEvent as any);
      vi.mocked(approvalRepository.update).mockResolvedValue(undefined as any);
      vi.mocked(notificationRepository.create).mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(service.applyChanges(approvalId)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when research type is invalid', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.RESEARCH,
        entity_id: 'research-456',
        change_details: {
          title: 'Research Project',
          research_type: 'invalid_type', // Invalid type
        },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      const existingResearch = {
        id: 'research-456',
        title: 'Research',
        updated_at: new Date('2024-01-01T09:00:00Z'),
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.research.findFirst).mockResolvedValue(existingResearch as any);
      vi.mocked(approvalRepository.update).mockResolvedValue(undefined as any);
      vi.mocked(notificationRepository.create).mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(service.applyChanges(approvalId)).rejects.toThrow(ValidationError);
    });
  });

  describe('applyChanges - Error Handling', () => {
    it('should throw error when approval does not exist', async () => {
      // Arrange
      const approvalId = 'non-existent-approval';
      vi.mocked(approvalRepository.findById).mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.applyChanges(approvalId)).rejects.toThrow(
        `Approval with ID ${approvalId} not found`
      );
    });

    it('should mark approval as failed on unexpected errors', async () => {
      // Arrange
      const approvalId = 'approval-123';
      const approval = {
        id: approvalId,
        entity_type: EntityType.STUDENT,
        entity_id: 'student-456',
        change_details: { first_name: 'John' },
        entity_version: 1,
        submission_timestamp: new Date('2024-01-01T10:00:00Z'),
        submitter_id: 'user-1',
        reviewer_id: 'user-2',
      };

      const existingStudent = {
        id: 'student-456',
        first_name: 'Jane',
        updated_at: new Date('2024-01-01T09:00:00Z'),
      };

      vi.mocked(approvalRepository.findById).mockResolvedValue(approval as any);
      vi.mocked(db.query.students.findFirst).mockResolvedValue(existingStudent as any);
      vi.mocked(db.transaction).mockRejectedValue(new Error('Database error'));
      vi.mocked(approvalRepository.update).mockResolvedValue(undefined as any);
      vi.mocked(notificationRepository.create).mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(service.applyChanges(approvalId)).rejects.toThrow('Database error');
      
      // Verify approval was marked as failed
      expect(approvalRepository.update).toHaveBeenCalledWith(
        approvalId,
        expect.objectContaining({
          status: ApprovalStatus.FAILED,
          failure_reason: 'Database error',
        })
      );
    });
  });
});
