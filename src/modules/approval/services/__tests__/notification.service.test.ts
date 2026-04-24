import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationService } from '../notification.service';
import { notificationRepository } from '../../repositories/notification.repository';
import {
  NotificationType,
  NotificationPriority,
  type Approval,
  type ApprovalNotification,
} from '../../../../db/schema/approvalNotifications';
import { ApprovalStatus, EntityType, Category } from '../../../../db/schema/approvals';

// Mock the notification repository
vi.mock('../../repositories/notification.repository', () => ({
  notificationRepository: {
    create: vi.fn(),
    findById: vi.fn(),
  },
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;

  // Sample approval data for testing
  const mockApproval: Approval = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    entity_type: EntityType.STUDENT,
    entity_id: '123e4567-e89b-12d3-a456-426614174001',
    category: Category.PROFILE,
    change_details: { name: 'John Doe' },
    original_data: { name: 'Jane Doe' },
    status: ApprovalStatus.APPROVED,
    submitter_id: '123e4567-e89b-12d3-a456-426614174002',
    reviewer_id: '123e4567-e89b-12d3-a456-426614174003',
    submission_timestamp: new Date('2024-01-15T10:00:00Z'),
    decision_timestamp: new Date('2024-01-15T11:00:00Z'),
    application_timestamp: null,
    comments: 'Approved after review',
    department_id: '123e4567-e89b-12d3-a456-426614174004',
    entity_version: 1,
    retry_count: 0,
    failure_reason: null,
    idempotency_key: null,
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T11:00:00Z'),
    deleted_at: null,
  };

  const mockNotification: ApprovalNotification = {
    id: '123e4567-e89b-12d3-a456-426614174005',
    user_id: mockApproval.submitter_id,
    change_request_id: mockApproval.id,
    type: NotificationType.APPROVAL_APPROVED,
    message: `Your change request #${mockApproval.id} for ${mockApproval.entity_type} has been approved.`,
    priority: NotificationPriority.MEDIUM,
    read_status: false,
    created_at: new Date('2024-01-15T11:00:00Z'),
  };

  beforeEach(() => {
    notificationService = new NotificationService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createApprovalNotification', () => {
    it('should create an approval_approved notification with medium priority', async () => {
      // Arrange
      vi.mocked(notificationRepository.create).mockResolvedValue(mockNotification);

      // Act
      const result = await notificationService.createApprovalNotification(
        mockApproval,
        NotificationType.APPROVAL_APPROVED
      );

      // Assert
      expect(notificationRepository.create).toHaveBeenCalledWith({
        user_id: mockApproval.submitter_id,
        change_request_id: mockApproval.id,
        type: NotificationType.APPROVAL_APPROVED,
        message: `Your change request #${mockApproval.id} for ${mockApproval.entity_type} has been approved.`,
        priority: NotificationPriority.MEDIUM,
        read_status: false,
      });
      expect(result).toEqual(mockNotification);
    });

    it('should create an approval_rejected notification with high priority', async () => {
      // Arrange
      const rejectedApproval: Approval = {
        ...mockApproval,
        status: ApprovalStatus.REJECTED,
        comments: 'Does not meet requirements',
      };

      const rejectedNotification: ApprovalNotification = {
        ...mockNotification,
        type: NotificationType.APPROVAL_REJECTED,
        message: `Your change request #${rejectedApproval.id} for ${rejectedApproval.entity_type} has been rejected. Reason: ${rejectedApproval.comments}`,
        priority: NotificationPriority.HIGH,
      };

      vi.mocked(notificationRepository.create).mockResolvedValue(rejectedNotification);

      // Act
      const result = await notificationService.createApprovalNotification(
        rejectedApproval,
        NotificationType.APPROVAL_REJECTED
      );

      // Assert
      expect(notificationRepository.create).toHaveBeenCalledWith({
        user_id: rejectedApproval.submitter_id,
        change_request_id: rejectedApproval.id,
        type: NotificationType.APPROVAL_REJECTED,
        message: `Your change request #${rejectedApproval.id} for ${rejectedApproval.entity_type} has been rejected. Reason: ${rejectedApproval.comments}`,
        priority: NotificationPriority.HIGH,
        read_status: false,
      });
      expect(result).toEqual(rejectedNotification);
    });

    it('should create an approval_rejected notification with default reason when comments are null', async () => {
      // Arrange
      const rejectedApproval: Approval = {
        ...mockApproval,
        status: ApprovalStatus.REJECTED,
        comments: null,
      };

      const rejectedNotification: ApprovalNotification = {
        ...mockNotification,
        type: NotificationType.APPROVAL_REJECTED,
        message: `Your change request #${rejectedApproval.id} for ${rejectedApproval.entity_type} has been rejected. Reason: No reason provided`,
        priority: NotificationPriority.HIGH,
      };

      vi.mocked(notificationRepository.create).mockResolvedValue(rejectedNotification);

      // Act
      const result = await notificationService.createApprovalNotification(
        rejectedApproval,
        NotificationType.APPROVAL_REJECTED
      );

      // Assert
      expect(notificationRepository.create).toHaveBeenCalledWith({
        user_id: rejectedApproval.submitter_id,
        change_request_id: rejectedApproval.id,
        type: NotificationType.APPROVAL_REJECTED,
        message: `Your change request #${rejectedApproval.id} for ${rejectedApproval.entity_type} has been rejected. Reason: No reason provided`,
        priority: NotificationPriority.HIGH,
        read_status: false,
      });
      expect(result).toEqual(rejectedNotification);
    });

    it('should create a conflict_detected notification with high priority', async () => {
      // Arrange
      const conflictedApproval: Approval = {
        ...mockApproval,
        status: ApprovalStatus.CONFLICTED,
      };

      const conflictNotification: ApprovalNotification = {
        ...mockNotification,
        type: NotificationType.CONFLICT_DETECTED,
        message: `Conflict detected for change request #${conflictedApproval.id}. The target ${conflictedApproval.entity_type} entity has been modified since submission.`,
        priority: NotificationPriority.HIGH,
      };

      vi.mocked(notificationRepository.create).mockResolvedValue(conflictNotification);

      // Act
      const result = await notificationService.createApprovalNotification(
        conflictedApproval,
        NotificationType.CONFLICT_DETECTED
      );

      // Assert
      expect(notificationRepository.create).toHaveBeenCalledWith({
        user_id: conflictedApproval.submitter_id,
        change_request_id: conflictedApproval.id,
        type: NotificationType.CONFLICT_DETECTED,
        message: `Conflict detected for change request #${conflictedApproval.id}. The target ${conflictedApproval.entity_type} entity has been modified since submission.`,
        priority: NotificationPriority.HIGH,
        read_status: false,
      });
      expect(result).toEqual(conflictNotification);
    });

    it('should create an application_failed notification with medium priority', async () => {
      // Arrange
      const failedApproval: Approval = {
        ...mockApproval,
        status: ApprovalStatus.FAILED,
        failure_reason: 'Database connection timeout',
      };

      const failedNotification: ApprovalNotification = {
        ...mockNotification,
        type: NotificationType.APPLICATION_FAILED,
        message: `Failed to apply changes for request #${failedApproval.id}. Reason: ${failedApproval.failure_reason}`,
        priority: NotificationPriority.MEDIUM,
      };

      vi.mocked(notificationRepository.create).mockResolvedValue(failedNotification);

      // Act
      const result = await notificationService.createApprovalNotification(
        failedApproval,
        NotificationType.APPLICATION_FAILED
      );

      // Assert
      expect(notificationRepository.create).toHaveBeenCalledWith({
        user_id: failedApproval.submitter_id,
        change_request_id: failedApproval.id,
        type: NotificationType.APPLICATION_FAILED,
        message: `Failed to apply changes for request #${failedApproval.id}. Reason: ${failedApproval.failure_reason}`,
        priority: NotificationPriority.MEDIUM,
        read_status: false,
      });
      expect(result).toEqual(failedNotification);
    });

    it('should create an application_failed notification with default reason when failure_reason is null', async () => {
      // Arrange
      const failedApproval: Approval = {
        ...mockApproval,
        status: ApprovalStatus.FAILED,
        failure_reason: null,
      };

      const failedNotification: ApprovalNotification = {
        ...mockNotification,
        type: NotificationType.APPLICATION_FAILED,
        message: `Failed to apply changes for request #${failedApproval.id}. Reason: Unknown error`,
        priority: NotificationPriority.MEDIUM,
      };

      vi.mocked(notificationRepository.create).mockResolvedValue(failedNotification);

      // Act
      const result = await notificationService.createApprovalNotification(
        failedApproval,
        NotificationType.APPLICATION_FAILED
      );

      // Assert
      expect(notificationRepository.create).toHaveBeenCalledWith({
        user_id: failedApproval.submitter_id,
        change_request_id: failedApproval.id,
        type: NotificationType.APPLICATION_FAILED,
        message: `Failed to apply changes for request #${failedApproval.id}. Reason: Unknown error`,
        priority: NotificationPriority.MEDIUM,
        read_status: false,
      });
      expect(result).toEqual(failedNotification);
    });

    it('should throw an error for unknown notification type', async () => {
      // Arrange
      const invalidType = 'invalid_type' as any;

      // Act & Assert
      await expect(
        notificationService.createApprovalNotification(mockApproval, invalidType)
      ).rejects.toThrow('Unknown notification type: invalid_type');
    });

    it('should handle different entity types correctly', async () => {
      // Arrange
      const facultyApproval: Approval = {
        ...mockApproval,
        entity_type: EntityType.FACULTY,
      };

      const facultyNotification: ApprovalNotification = {
        ...mockNotification,
        message: `Your change request #${facultyApproval.id} for ${facultyApproval.entity_type} has been approved.`,
      };

      vi.mocked(notificationRepository.create).mockResolvedValue(facultyNotification);

      // Act
      const result = await notificationService.createApprovalNotification(
        facultyApproval,
        NotificationType.APPROVAL_APPROVED
      );

      // Assert
      expect(result.message).toContain('faculty');
    });
  });

  describe('deliverNotification', () => {
    it('should deliver a notification successfully', async () => {
      // Arrange
      vi.mocked(notificationRepository.findById).mockResolvedValue(mockNotification);

      // Act
      const result = await notificationService.deliverNotification(mockNotification.id);

      // Assert
      expect(notificationRepository.findById).toHaveBeenCalledWith(mockNotification.id);
      expect(result).toEqual(mockNotification);
    });

    it('should throw an error if notification is not found', async () => {
      // Arrange
      vi.mocked(notificationRepository.findById).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        notificationService.deliverNotification('non-existent-id')
      ).rejects.toThrow('Notification not found: non-existent-id');
    });
  });

  describe('getTemplate', () => {
    it('should return the correct template for approval_approved', () => {
      // Act
      const template = notificationService.getTemplate(NotificationType.APPROVAL_APPROVED);

      // Assert
      expect(template.priority).toBe(NotificationPriority.MEDIUM);
      expect(template.message(mockApproval)).toContain('has been approved');
    });

    it('should return the correct template for approval_rejected', () => {
      // Act
      const template = notificationService.getTemplate(NotificationType.APPROVAL_REJECTED);

      // Assert
      expect(template.priority).toBe(NotificationPriority.HIGH);
      expect(template.message(mockApproval)).toContain('has been rejected');
    });

    it('should return the correct template for conflict_detected', () => {
      // Act
      const template = notificationService.getTemplate(NotificationType.CONFLICT_DETECTED);

      // Assert
      expect(template.priority).toBe(NotificationPriority.HIGH);
      expect(template.message(mockApproval)).toContain('Conflict detected');
    });

    it('should return the correct template for application_failed', () => {
      // Act
      const template = notificationService.getTemplate(NotificationType.APPLICATION_FAILED);

      // Assert
      expect(template.priority).toBe(NotificationPriority.MEDIUM);
      expect(template.message(mockApproval)).toContain('Failed to apply changes');
    });

    it('should throw an error for unknown notification type', () => {
      // Arrange
      const invalidType = 'invalid_type' as any;

      // Act & Assert
      expect(() => notificationService.getTemplate(invalidType)).toThrow(
        'Unknown notification type: invalid_type'
      );
    });
  });

  describe('getAvailableTypes', () => {
    it('should return all available notification types', () => {
      // Act
      const types = notificationService.getAvailableTypes();

      // Assert
      expect(types).toEqual([
        NotificationType.APPROVAL_APPROVED,
        NotificationType.APPROVAL_REJECTED,
        NotificationType.CONFLICT_DETECTED,
        NotificationType.APPLICATION_FAILED,
      ]);
    });
  });

  describe('getPriority', () => {
    it('should return medium priority for approval_approved', () => {
      // Act
      const priority = notificationService.getPriority(NotificationType.APPROVAL_APPROVED);

      // Assert
      expect(priority).toBe(NotificationPriority.MEDIUM);
    });

    it('should return high priority for approval_rejected', () => {
      // Act
      const priority = notificationService.getPriority(NotificationType.APPROVAL_REJECTED);

      // Assert
      expect(priority).toBe(NotificationPriority.HIGH);
    });

    it('should return high priority for conflict_detected', () => {
      // Act
      const priority = notificationService.getPriority(NotificationType.CONFLICT_DETECTED);

      // Assert
      expect(priority).toBe(NotificationPriority.HIGH);
    });

    it('should return medium priority for application_failed', () => {
      // Act
      const priority = notificationService.getPriority(NotificationType.APPLICATION_FAILED);

      // Assert
      expect(priority).toBe(NotificationPriority.MEDIUM);
    });
  });

  describe('Notification Templates', () => {
    it('should generate correct message for approval_approved', () => {
      // Arrange
      const template = notificationService.getTemplate(NotificationType.APPROVAL_APPROVED);

      // Act
      const message = template.message(mockApproval);

      // Assert
      expect(message).toBe(
        `Your change request #${mockApproval.id} for ${mockApproval.entity_type} has been approved.`
      );
    });

    it('should generate correct message for approval_rejected with comments', () => {
      // Arrange
      const template = notificationService.getTemplate(NotificationType.APPROVAL_REJECTED);
      const approvalWithComments = { ...mockApproval, comments: 'Invalid data' };

      // Act
      const message = template.message(approvalWithComments);

      // Assert
      expect(message).toBe(
        `Your change request #${approvalWithComments.id} for ${approvalWithComments.entity_type} has been rejected. Reason: Invalid data`
      );
    });

    it('should generate correct message for conflict_detected', () => {
      // Arrange
      const template = notificationService.getTemplate(NotificationType.CONFLICT_DETECTED);

      // Act
      const message = template.message(mockApproval);

      // Assert
      expect(message).toBe(
        `Conflict detected for change request #${mockApproval.id}. The target ${mockApproval.entity_type} entity has been modified since submission.`
      );
    });

    it('should generate correct message for application_failed with failure reason', () => {
      // Arrange
      const template = notificationService.getTemplate(NotificationType.APPLICATION_FAILED);
      const approvalWithFailure = { ...mockApproval, failure_reason: 'Network error' };

      // Act
      const message = template.message(approvalWithFailure);

      // Assert
      expect(message).toBe(
        `Failed to apply changes for request #${approvalWithFailure.id}. Reason: Network error`
      );
    });
  });
});
