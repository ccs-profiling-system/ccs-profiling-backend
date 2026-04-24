import { notificationRepository } from '../repositories/notification.repository';
import {
  type ApprovalNotification,
  type InsertApprovalNotification,
  NotificationType,
  NotificationPriority,
  type NotificationTypeType,
  type NotificationPriorityType,
} from '../db/schema/approvalNotifications';
import { type Approval } from '../db/schema/approvals';

/**
 * Notification template definition
 */
interface NotificationTemplate {
  priority: NotificationPriorityType;
  message: (approval: Approval) => string;
}

/**
 * Notification templates for different approval workflow events
 * 
 * Requirements: 13.1-13.7, 24.1-24.9
 */
const NOTIFICATION_TEMPLATES: Record<NotificationTypeType, NotificationTemplate> = {
  [NotificationType.APPROVAL_APPROVED]: {
    priority: NotificationPriority.MEDIUM,
    message: (approval: Approval) =>
      `Your change request #${approval.id} for ${approval.entity_type} has been approved.`,
  },
  [NotificationType.APPROVAL_REJECTED]: {
    priority: NotificationPriority.HIGH,
    message: (approval: Approval) =>
      `Your change request #${approval.id} for ${approval.entity_type} has been rejected. Reason: ${approval.comments || 'No reason provided'}`,
  },
  [NotificationType.CONFLICT_DETECTED]: {
    priority: NotificationPriority.HIGH,
    message: (approval: Approval) =>
      `Conflict detected for change request #${approval.id}. The target ${approval.entity_type} entity has been modified since submission.`,
  },
  [NotificationType.APPLICATION_FAILED]: {
    priority: NotificationPriority.MEDIUM,
    message: (approval: Approval) =>
      `Failed to apply changes for request #${approval.id}. Reason: ${approval.failure_reason || 'Unknown error'}`,
  },
};

/**
 * Notification Service
 * 
 * Handles creation and delivery of approval workflow notifications.
 * Supports multiple notification types with appropriate priority levels.
 * 
 * Requirements: 13.1-13.7, 24.1-24.9
 */
export class NotificationService {
  /**
   * Create an approval notification for a user
   * 
   * @param approval - The approval record that triggered the notification
   * @param type - The type of notification to create
   * @returns Created notification record
   * 
   * Requirements: 13.1, 13.2, 24.5, 24.6
   */
  async createApprovalNotification(
    approval: Approval,
    type: NotificationTypeType
  ): Promise<ApprovalNotification> {
    // Get the template for this notification type
    const template = NOTIFICATION_TEMPLATES[type];
    
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    // Generate the notification message from the template
    const message = template.message(approval);
    
    // Prepare notification data
    const notificationData: InsertApprovalNotification = {
      user_id: approval.submitter_id,
      change_request_id: approval.id,
      type,
      message,
      priority: template.priority,
      read_status: false,
    };

    // Create the notification in the database
    const notification = await notificationRepository.create(notificationData);

    return notification;
  }

  /**
   * Deliver a notification to the user
   * 
   * This method handles the delivery of notifications through configured channels.
   * Currently supports in-app notifications (database storage).
   * Future enhancements: WebSocket/SSE for real-time delivery, email notifications.
   * 
   * @param notificationId - The ID of the notification to deliver
   * @returns The notification record
   * 
   * Requirements: 24.1-24.9
   */
  async deliverNotification(notificationId: string): Promise<ApprovalNotification> {
    // Fetch the notification
    const notification = await notificationRepository.findById(notificationId);

    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    // Currently, notifications are delivered via in-app storage (database)
    // The notification is already persisted when created
    
    // Future enhancement: Implement real-time delivery via WebSocket/SSE
    // Future enhancement: Send email notifications for high-priority items
    // Future enhancement: Handle delivery failures and retry logic

    return notification;
  }

  /**
   * Get notification template for a given type
   * 
   * @param type - The notification type
   * @returns The notification template
   */
  getTemplate(type: NotificationTypeType): NotificationTemplate {
    const template = NOTIFICATION_TEMPLATES[type];
    
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return template;
  }

  /**
   * Get all available notification types
   * 
   * @returns Array of notification types
   */
  getAvailableTypes(): NotificationTypeType[] {
    return Object.values(NotificationType);
  }

  /**
   * Get priority for a notification type
   * 
   * @param type - The notification type
   * @returns The priority level
   */
  getPriority(type: NotificationTypeType): NotificationPriorityType {
    return this.getTemplate(type).priority;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
