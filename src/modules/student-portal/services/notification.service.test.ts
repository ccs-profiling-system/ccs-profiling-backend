/**
 * Student Portal - Notification Service Tests
 * Unit tests for notification management service
 * 
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from './notification.service';
import { NotFoundError } from '../../../shared/errors';
import { StudentAccessError } from '../utils/studentScope';

// Mock database
const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
} as any;

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService(mockDb);
  });

  describe('getNotificationsByStudent', () => {
    it('should return all notifications for a student ordered by created_at descending', async () => {
      const studentId = 'student-123';
      const mockNotifications = [
        {
          id: 'notif-1',
          student_id: studentId,
          title: 'Grade Posted',
          message: 'Your grade for CS101 has been posted',
          type: 'academic',
          is_read: false,
          read_at: null,
          created_at: new Date('2024-01-02'),
        },
        {
          id: 'notif-2',
          student_id: studentId,
          title: 'Payment Due',
          message: 'Your tuition payment is due soon',
          type: 'financial',
          is_read: true,
          read_at: new Date('2024-01-01T10:00:00Z'),
          created_at: new Date('2024-01-01'),
        },
      ];

      // Mock notifications query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockNotifications),
          }),
        }),
      });

      const result = await service.getNotificationsByStudent(studentId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'notif-1',
        title: 'Grade Posted',
        message: 'Your grade for CS101 has been posted',
        type: 'academic',
        is_read: false,
        read_at: null,
      });
      expect(result[1]).toMatchObject({
        id: 'notif-2',
        title: 'Payment Due',
        type: 'financial',
        is_read: true,
      });
    });

    it('should return empty array if student has no notifications', async () => {
      const studentId = 'student-123';

      // Mock empty notifications
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getNotificationsByStudent(studentId);

      expect(result).toEqual([]);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read for valid notification owned by student', async () => {
      const notificationId = 'notif-1';
      const studentId = 'student-123';
      const mockNotification = {
        id: notificationId,
        student_id: studentId,
        title: 'Grade Posted',
        message: 'Your grade for CS101 has been posted',
        type: 'academic',
        is_read: false,
        read_at: null,
        created_at: new Date('2024-01-01'),
      };

      const mockUpdated = {
        ...mockNotification,
        is_read: true,
        read_at: new Date('2024-01-02T10:00:00Z'),
        updated_at: new Date('2024-01-02T10:00:00Z'),
      };

      // Mock notification existence check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockNotification]),
          }),
        }),
      });

      // Mock update
      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      const result = await service.markNotificationAsRead(notificationId, studentId);

      expect(result.is_read).toBe(true);
      expect(result.read_at).not.toBeNull();
    });

    it('should throw NotFoundError if notification does not exist', async () => {
      const notificationId = 'non-existent';
      const studentId = 'student-123';

      // Mock notification not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.markNotificationAsRead(notificationId, studentId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw StudentAccessError if notification belongs to different student', async () => {
      const notificationId = 'notif-1';
      const studentId = 'student-123';
      const otherStudentId = 'student-456';
      const mockNotification = {
        id: notificationId,
        student_id: otherStudentId, // Different student
        title: 'Grade Posted',
        message: 'Your grade for CS101 has been posted',
        type: 'academic',
        is_read: false,
        read_at: null,
        created_at: new Date('2024-01-01'),
      };

      // Mock notification existence check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockNotification]),
          }),
        }),
      });

      await expect(
        service.markNotificationAsRead(notificationId, studentId)
      ).rejects.toThrow(StudentAccessError);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all unread notifications as read for a student', async () => {
      const studentId = 'student-123';
      const mockUpdatedNotifications = [
        {
          id: 'notif-1',
          student_id: studentId,
          is_read: true,
          read_at: new Date('2024-01-02T10:00:00Z'),
        },
        {
          id: 'notif-2',
          student_id: studentId,
          is_read: true,
          read_at: new Date('2024-01-02T10:00:00Z'),
        },
      ];

      // Mock bulk update
      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue(mockUpdatedNotifications),
          }),
        }),
      });

      const count = await service.markAllNotificationsAsRead(studentId);

      expect(count).toBe(2);
    });

    it('should return 0 if student has no unread notifications', async () => {
      const studentId = 'student-123';

      // Mock bulk update with no results
      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const count = await service.markAllNotificationsAsRead(studentId);

      expect(count).toBe(0);
    });
  });
});
