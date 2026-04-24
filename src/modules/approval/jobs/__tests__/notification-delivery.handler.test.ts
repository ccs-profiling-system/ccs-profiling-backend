import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  notificationDeliveryHandler,
  NotificationDeliveryHandler,
  type NotificationDeliveryJobPayload,
  type NotificationDeliveryResult,
  JobHandlerError,
} from '../notification-delivery.handler';
import { notificationService } from '../../services/notification.service';
import { JobType } from '../../../../db/schema/backgroundJobs';
import { NotificationType, NotificationPriority } from '../../../../db/schema/approvalNotifications';

// Mock the notification service
vi.mock('../../services/notification.service', () => ({
  notificationService: {
    deliverNotification: vi.fn(),
  },
}));

describe('NotificationDeliveryHandler', () => {
  let handler: NotificationDeliveryHandler;

  beforeEach(() => {
    handler = new NotificationDeliveryHandler();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleNotificationDelivery', () => {
    const mockNotification = {
      id: 'notification-123',
      user_id: 'user-456',
      change_request_id: 'approval-789',
      type: NotificationType.APPROVAL_APPROVED,
      message: 'Your change request has been approved',
      priority: NotificationPriority.MEDIUM,
      read_status: false,
      created_at: new Date(),
    };

    it('should successfully deliver notification via in-app channel (default)', async () => {
      // Arrange
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
      };

      vi.mocked(notificationService.deliverNotification).mockResolvedValue(mockNotification);

      // Act
      const result = await handler.handleNotificationDelivery(payload);

      // Assert
      expect(notificationService.deliverNotification).toHaveBeenCalledWith('notification-123');
      expect(result).toMatchObject({
        notificationId: 'notification-123',
        delivered: true,
        channels: [
          {
            channel: 'in-app',
            success: true,
          },
        ],
      });
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should successfully deliver notification via specified channels', async () => {
      // Arrange
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
        channels: ['in-app', 'websocket'],
      };

      vi.mocked(notificationService.deliverNotification).mockResolvedValue(mockNotification);

      // Act
      const result = await handler.handleNotificationDelivery(payload);

      // Assert
      expect(result).toMatchObject({
        notificationId: 'notification-123',
        delivered: true,
        channels: [
          {
            channel: 'in-app',
            success: true,
          },
          {
            channel: 'websocket',
            success: true,
          },
        ],
      });
    });

    it('should handle delivery failure gracefully when retryOnFailure is false', async () => {
      // Arrange
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
        channels: ['email'],
        retryOnFailure: false,
      };

      vi.mocked(notificationService.deliverNotification).mockResolvedValue(mockNotification);

      // Act
      const result = await handler.handleNotificationDelivery(payload);

      // Assert
      expect(result).toMatchObject({
        notificationId: 'notification-123',
        delivered: true, // Email falls back to in-app, which succeeds
        channels: [
          {
            channel: 'email',
            success: true,
          },
        ],
      });
    });

    it('should throw error when notification service fails', async () => {
      // Arrange
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
      };

      const serviceError = new Error('Notification not found');
      vi.mocked(notificationService.deliverNotification).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(JobHandlerError);
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(
        'Failed to process notification delivery job'
      );
    });

    it('should validate payload and throw error for missing notificationId', async () => {
      // Arrange
      const payload = {} as NotificationDeliveryJobPayload;

      // Act & Assert
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(JobHandlerError);
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(
        'Invalid payload: notificationId must be a string'
      );
    });

    it('should validate payload and throw error for invalid notificationId type', async () => {
      // Arrange
      const payload = {
        notificationId: 123,
      } as any;

      // Act & Assert
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(JobHandlerError);
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(
        'Invalid payload: notificationId must be a string'
      );
    });

    it('should validate payload and throw error for invalid channels type', async () => {
      // Arrange
      const payload = {
        notificationId: 'notification-123',
        channels: 'in-app',
      } as any;

      // Act & Assert
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(JobHandlerError);
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(
        'Invalid payload: channels must be an array'
      );
    });

    it('should validate payload and throw error for empty channels array', async () => {
      // Arrange
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
        channels: [],
      };

      // Act & Assert
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(JobHandlerError);
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(
        'Invalid payload: channels array cannot be empty'
      );
    });

    it('should validate payload and throw error for non-string channel values', async () => {
      // Arrange
      const payload = {
        notificationId: 'notification-123',
        channels: ['in-app', 123],
      } as any;

      // Act & Assert
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(JobHandlerError);
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(
        'Invalid payload: all channels must be strings'
      );
    });

    it('should validate payload and throw error for invalid retryOnFailure type', async () => {
      // Arrange
      const payload = {
        notificationId: 'notification-123',
        retryOnFailure: 'yes',
      } as any;

      // Act & Assert
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(JobHandlerError);
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(
        'Invalid payload: retryOnFailure must be a boolean'
      );
    });

    it('should handle multiple channels with mixed success', async () => {
      // Arrange
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
        channels: ['in-app', 'websocket', 'email'],
      };

      vi.mocked(notificationService.deliverNotification).mockResolvedValue(mockNotification);

      // Act
      const result = await handler.handleNotificationDelivery(payload);

      // Assert
      expect(result.delivered).toBe(true);
      expect(result.channels).toHaveLength(3);
      expect(result.channels.every((c) => c.success)).toBe(true);
    });

    it('should include timestamp in delivery result', async () => {
      // Arrange
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
      };

      vi.mocked(notificationService.deliverNotification).mockResolvedValue(mockNotification);

      const beforeTime = new Date();

      // Act
      const result = await handler.handleNotificationDelivery(payload);

      const afterTime = new Date();

      // Assert
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('getHandler', () => {
    it('should return handler function for notification_delivery job type', () => {
      // Act
      const handlerFn = handler.getHandler(JobType.NOTIFICATION_DELIVERY);

      // Assert
      expect(handlerFn).toBeDefined();
      expect(typeof handlerFn).toBe('function');
    });

    it('should return undefined for unsupported job types', () => {
      // Act
      const handlerFn = handler.getHandler(JobType.BULK_APPROVE);

      // Assert
      expect(handlerFn).toBeUndefined();
    });

    it('should return bound handler function that can be called', async () => {
      // Arrange
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
      };

      const mockNotification = {
        id: 'notification-123',
        user_id: 'user-456',
        change_request_id: 'approval-789',
        type: NotificationType.APPROVAL_APPROVED,
        message: 'Test message',
        priority: NotificationPriority.MEDIUM,
        read_status: false,
        created_at: new Date(),
      };

      vi.mocked(notificationService.deliverNotification).mockResolvedValue(mockNotification);

      // Act
      const handlerFn = handler.getHandler(JobType.NOTIFICATION_DELIVERY);
      const result = await handlerFn!(payload);

      // Assert
      expect(result).toBeDefined();
      expect(result.notificationId).toBe('notification-123');
      expect(result.delivered).toBe(true);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      // Assert
      expect(notificationDeliveryHandler).toBeInstanceOf(NotificationDeliveryHandler);
    });

    it('should have getHandler method on singleton', () => {
      // Assert
      expect(notificationDeliveryHandler.getHandler).toBeDefined();
      expect(typeof notificationDeliveryHandler.getHandler).toBe('function');
    });

    it('should have handleNotificationDelivery method on singleton', () => {
      // Assert
      expect(notificationDeliveryHandler.handleNotificationDelivery).toBeDefined();
      expect(typeof notificationDeliveryHandler.handleNotificationDelivery).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should wrap errors in JobHandlerError with cause', async () => {
      // Arrange
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
      };

      const originalError = new Error('Database connection failed');
      vi.mocked(notificationService.deliverNotification).mockRejectedValue(originalError);

      // Act & Assert
      try {
        await handler.handleNotificationDelivery(payload);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(JobHandlerError);
        expect((error as JobHandlerError).cause).toBe(originalError);
        expect((error as JobHandlerError).message).toContain('Failed to process notification delivery job');
      }
    });

    it('should handle non-Error objects gracefully', async () => {
      // Arrange
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
      };

      vi.mocked(notificationService.deliverNotification).mockRejectedValue('String error');

      // Act & Assert
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow(JobHandlerError);
      await expect(handler.handleNotificationDelivery(payload)).rejects.toThrow('Unknown error');
    });
  });

  describe('channel delivery', () => {
    it('should log warning for unsupported websocket channel', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
        channels: ['websocket'],
      };

      const mockNotification = {
        id: 'notification-123',
        user_id: 'user-456',
        change_request_id: 'approval-789',
        type: NotificationType.APPROVAL_APPROVED,
        message: 'Test message',
        priority: NotificationPriority.MEDIUM,
        read_status: false,
        created_at: new Date(),
      };

      vi.mocked(notificationService.deliverNotification).mockResolvedValue(mockNotification);

      // Act
      await handler.handleNotificationDelivery(payload);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Real-time delivery (websocket) not yet implemented')
      );

      consoleSpy.mockRestore();
    });

    it('should log warning for unsupported email channel', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const payload: NotificationDeliveryJobPayload = {
        notificationId: 'notification-123',
        channels: ['email'],
      };

      const mockNotification = {
        id: 'notification-123',
        user_id: 'user-456',
        change_request_id: 'approval-789',
        type: NotificationType.APPROVAL_APPROVED,
        message: 'Test message',
        priority: NotificationPriority.MEDIUM,
        read_status: false,
        created_at: new Date(),
      };

      vi.mocked(notificationService.deliverNotification).mockResolvedValue(mockNotification);

      // Act
      await handler.handleNotificationDelivery(payload);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Email delivery not yet implemented')
      );

      consoleSpy.mockRestore();
    });
  });
});
