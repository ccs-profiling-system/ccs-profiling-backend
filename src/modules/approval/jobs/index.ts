import { jobQueueService } from '../services/job-queue.service';
import { bulkOperationsHandler } from './bulk-operations.handler';
import { notificationDeliveryHandler } from './notification-delivery.handler';
import { JobType } from '../../../db/schema/backgroundJobs';

/**
 * Initialize and register all job handlers
 * 
 * This function should be called during application startup to register
 * all job handlers with the job queue service.
 * 
 * Registered handlers:
 * - bulk_approve: Process bulk approval operations
 * - bulk_reject: Process bulk rejection operations
 * - notification_delivery: Deliver notifications via configured channels
 */
export function initializeJobHandlers(): void {
  // Register bulk approve handler
  const bulkApproveHandler = bulkOperationsHandler.getHandler(JobType.BULK_APPROVE);
  if (bulkApproveHandler) {
    jobQueueService.registerHandler(JobType.BULK_APPROVE, bulkApproveHandler);
  }

  // Register bulk reject handler
  const bulkRejectHandler = bulkOperationsHandler.getHandler(JobType.BULK_REJECT);
  if (bulkRejectHandler) {
    jobQueueService.registerHandler(JobType.BULK_REJECT, bulkRejectHandler);
  }

  // Register notification delivery handler
  const notificationDeliveryHandlerFn = notificationDeliveryHandler.getHandler(JobType.NOTIFICATION_DELIVERY);
  if (notificationDeliveryHandlerFn) {
    jobQueueService.registerHandler(JobType.NOTIFICATION_DELIVERY, notificationDeliveryHandlerFn);
  }

  console.log('Job handlers initialized successfully');
}

// Export handlers for direct use if needed
export { bulkOperationsHandler } from './bulk-operations.handler';
export { notificationDeliveryHandler } from './notification-delivery.handler';
