/**
 * Student Portal - Notification Service
 * Business logic layer for notification management
 * 
 * Handles notification retrieval and read status updates.
 * Ensures students can only access their own notifications.
 * 
 */

import { eq, and, desc } from 'drizzle-orm';
import { Database } from '../../../db';
import { notifications } from '../../../db/schema';
import { NotFoundError } from '../../../shared/errors';
import { NotificationDTO } from '../types';
import { StudentAccessError } from '../utils/studentScope';

export class NotificationService {
  constructor(private db: Database) {}

  /**
   * Get all notifications for a student
   * 
   * Retrieves all notifications sent to the student ordered by creation date descending.
   * 
   * @param studentId - The student UUID (internal ID)
   * @returns Array of notification DTOs
   * 
   */
  async getNotificationsByStudent(studentId: string): Promise<NotificationDTO[]> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.student_id, studentId))
      .orderBy(desc(notifications.created_at));

    return result.map(this.toNotificationDTO);
  }

  /**
   * Mark a notification as read
   * 
   * Updates the read status to true and records the read timestamp.
   * Validates that the notification belongs to the student.
   * 
   * @param notificationId - The notification UUID to mark as read
   * @param studentId - The student UUID (for ownership validation)
   * @returns Updated notification DTO
   * @throws NotFoundError if notification not found
   * @throws StudentAccessError if notification doesn't belong to student (403)
   * 
   */
  async markNotificationAsRead(
    notificationId: string,
    studentId: string
  ): Promise<NotificationDTO> {
    // First, check if notification exists and belongs to student
    const existing = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    const notification = existing[0];

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Validate ownership
    if (notification.student_id !== studentId) {
      throw new StudentAccessError(
        'Access denied: You can only mark your own notifications as read'
      );
    }

    // Update read status
    const result = await this.db
      .update(notifications)
      .set({
        is_read: true,
        read_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(notifications.id, notificationId))
      .returning();

    const updated = result[0];

    if (!updated) {
      throw new NotFoundError('Notification not found');
    }

    return this.toNotificationDTO(updated);
  }

  /**
   * Mark all notifications as read for a student
   * 
   * Bulk updates all unread notifications to read status.
   * 
   * @param studentId - The student UUID
   * @returns Number of notifications marked as read
   * 
   */
  async markAllNotificationsAsRead(studentId: string): Promise<number> {
    const result = await this.db
      .update(notifications)
      .set({
        is_read: true,
        read_at: new Date(),
        updated_at: new Date(),
      })
      .where(
        and(
          eq(notifications.student_id, studentId),
          eq(notifications.is_read, false)
        )
      )
      .returning();

    return result.length;
  }

  /**
   * Transform database entity to NotificationDTO
   * 
   * @param notificationRecord - Raw notification record from database
   * @returns Formatted NotificationDTO
   */
  private toNotificationDTO(notificationRecord: any): NotificationDTO {
    return {
      id: notificationRecord.id,
      title: notificationRecord.title,
      message: notificationRecord.message,
      type: notificationRecord.type,
      is_read: notificationRecord.is_read,
      read_at: notificationRecord.read_at ? notificationRecord.read_at.toISOString() : null,
      created_at: notificationRecord.created_at.toISOString(),
    };
  }
}
