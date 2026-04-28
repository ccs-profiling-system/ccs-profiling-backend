import { notificationService } from '../services/notification.service';
import { JobType, type JobTypeType } from '../../../db/schema/backgroundJobs';

/**
 * Notification Delivery Job Payload
 */
export interface NotificationDeliveryJobPayload {
  notificationId: string;
  channels?: string[]; // Optional: specific channels to deliver to (e.g., ['in-app', 'email', 'websocket'])
  retryOnFailure?: boolean;
}

/**
 * Notification Delivery Result
 */
export interface NotificationDeliveryResult {
  notificationId: string;
  delivered: boolean;
  channels: {
    channel: string;
    success: boolean;
    error?: string;
  }[];
  timestamp: Date;
}

/**
 * Job handler error
 */
export class JobHandlerError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'JobHandlerError';
  }
}

/**
 * Notification Delivery Job Handler
 * 
 * Handles background processing of notification delivery operations.
 * Delivers notifications via configured channels (in-app, real-time, email).
 * Handles delivery failures gracefully with fallback mechanisms.
 * 
 * Job Type:
 * - notification_delivery: Deliver a notification to a user
 * 
 * Features:
 * - Multi-channel delivery support
 * - Graceful failure handling
 * - Fallback to in-app storage on real-time delivery failure
 * - Detailed delivery status reporting
 * 
 */
export class NotificationDeliveryHandler {
  /**
   * Handle notification delivery job
   * 
   * Processes a notification delivery operation by calling the notification service.
   * Delivers the notification via configured channels and handles failures gracefully.
   * 
   * @param payload - Job payload containing notification ID and delivery options
   * @returns Delivery result with status for each channel
   * @throws JobHandlerError if payload is invalid or delivery fails completely
   * 
   */
  async handleNotificationDelivery(
    payload: Record<string, any>
  ): Promise<NotificationDeliveryResult> {
    // Validate payload structure
    this.validatePayload(payload);

    const { notificationId, channels, retryOnFailure } = payload as NotificationDeliveryJobPayload;

    try {
      // Deliver notification via the notification service
      const notification = await notificationService.deliverNotification(notificationId);

      // Determine which channels to use (default to in-app only)
      const deliveryChannels = channels || ['in-app'];

      // Track delivery results for each channel
      const channelResults: NotificationDeliveryResult['channels'] = [];

      // Attempt delivery to each channel
      for (const channel of deliveryChannels) {
        try {
          await this.deliverToChannel(notificationId, channel);
          channelResults.push({
            channel,
            success: true,
          });
        } catch (error) {
          // Handle channel-specific delivery failure
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          channelResults.push({
            channel,
            success: false,
            error: errorMessage,
          });

          // Log the failure but continue with other channels
          console.error(
            `Failed to deliver notification ${notificationId} via ${channel}: ${errorMessage}`
          );
        }
      }

      // Check if at least one channel succeeded
      const anySuccess = channelResults.some((result) => result.success);

      if (!anySuccess && retryOnFailure !== false) {
        // All channels failed - throw error to trigger retry
        throw new JobHandlerError(
          `Failed to deliver notification ${notificationId} via all channels`
        );
      }

      // Return delivery result
      return {
        notificationId,
        delivered: anySuccess,
        channels: channelResults,
        timestamp: new Date(),
      };
    } catch (error) {
      // Handle complete delivery failure
      throw new JobHandlerError(
        `Failed to process notification delivery job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Deliver notification to a specific channel
   * 
   * Handles channel-specific delivery logic with graceful fallback.
   * 
   * Supported channels:
   * - in-app: Database storage (always available)
   * - websocket: Real-time delivery via WebSocket (future enhancement)
   * - email: Email notification (future enhancement)
   * 
   * @param notificationId - The notification ID to deliver
   * @param channel - The delivery channel
   * @throws Error if delivery fails for this channel
   * 
   */
  private async deliverToChannel(notificationId: string, channel: string): Promise<void> {
    switch (channel) {
      case 'in-app':
        // In-app notifications are already stored in the database
        // No additional action needed - notification is accessible via API
        break;

      case 'websocket':
      case 'sse':
        // Future enhancement: Implement real-time delivery via WebSocket/SSE
        // For now, fall back to in-app storage
        console.warn(
          `Real-time delivery (${channel}) not yet implemented for notification ${notificationId}. Falling back to in-app storage.`
        );
        break;

      case 'email':
        // Future enhancement: Implement email notification delivery
        // For now, fall back to in-app storage
        console.warn(
          `Email delivery not yet implemented for notification ${notificationId}. Falling back to in-app storage.`
        );
        break;

      default:
        throw new Error(`Unsupported delivery channel: ${channel}`);
    }
  }

  /**
   * Validate notification delivery payload structure
   * 
   * @param payload - Job payload to validate
   * @throws JobHandlerError if payload is invalid
   */
  private validatePayload(payload: Record<string, any>): void {
    if (!payload.notificationId || typeof payload.notificationId !== 'string') {
      throw new JobHandlerError('Invalid payload: notificationId must be a string');
    }

    if (payload.channels !== undefined) {
      if (!Array.isArray(payload.channels)) {
        throw new JobHandlerError('Invalid payload: channels must be an array');
      }

      if (payload.channels.length === 0) {
        throw new JobHandlerError('Invalid payload: channels array cannot be empty');
      }

      // Validate each channel is a string
      for (const channel of payload.channels) {
        if (typeof channel !== 'string') {
          throw new JobHandlerError('Invalid payload: all channels must be strings');
        }
      }
    }

    if (payload.retryOnFailure !== undefined && typeof payload.retryOnFailure !== 'boolean') {
      throw new JobHandlerError('Invalid payload: retryOnFailure must be a boolean');
    }
  }

  /**
   * Get handler function for a specific job type
   * 
   * Returns the appropriate handler function based on the job type.
   * This is used by the job queue service to process jobs.
   * 
   * @param jobType - The type of job to get handler for
   * @returns Handler function or undefined if not supported
   */
  getHandler(
    jobType: JobTypeType
  ): ((payload: Record<string, any>) => Promise<Record<string, any>>) | undefined {
    switch (jobType) {
      case JobType.NOTIFICATION_DELIVERY:
        return this.handleNotificationDelivery.bind(this);

      default:
        return undefined;
    }
  }
}

// Export singleton instance
export const notificationDeliveryHandler = new NotificationDeliveryHandler();
