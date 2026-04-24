# Approval System Job Handlers

This directory contains background job handlers for the approval system. Job handlers process asynchronous operations that are queued by the job queue service.

## Available Handlers

### 1. Bulk Operations Handler (`bulk-operations.handler.ts`)

Handles bulk approval and rejection operations.

**Job Types:**
- `bulk_approve` - Approve multiple change requests
- `bulk_reject` - Reject multiple change requests

**Features:**
- Independent mode: Process each request separately
- Atomic mode: All-or-nothing transaction
- Detailed success/failure reporting
- Automatic retry on failure

### 2. Notification Delivery Handler (`notification-delivery.handler.ts`)

Handles notification delivery via multiple channels.

**Job Types:**
- `notification_delivery` - Deliver notifications to users

**Features:**
- Multi-channel delivery support (in-app, websocket, email)
- Graceful failure handling with fallback mechanisms
- Configurable retry behavior
- Detailed delivery status reporting

**Supported Channels:**
- `in-app` - Database storage (always available)
- `websocket` - Real-time delivery via WebSocket (future enhancement)
- `sse` - Real-time delivery via Server-Sent Events (future enhancement)
- `email` - Email notification delivery (future enhancement)

## Handler Registration

All handlers are registered during application startup via the `initializeJobHandlers()` function in `index.ts`.

```typescript
import { initializeJobHandlers } from './modules/approval/jobs';

// During app initialization
initializeJobHandlers();
```

## Usage

### Enqueueing Jobs

```typescript
import { jobQueueService } from './services/job-queue.service';
import { JobType } from './db/schema/backgroundJobs';

// Enqueue a notification delivery job
const job = await jobQueueService.enqueue(
  JobType.NOTIFICATION_DELIVERY,
  {
    notificationId: 'notification-123',
    channels: ['in-app', 'websocket'],
    retryOnFailure: true,
  },
  userId
);

// Enqueue a bulk approve job
const bulkJob = await jobQueueService.enqueue(
  JobType.BULK_APPROVE,
  {
    approvalIds: ['id1', 'id2', 'id3'],
    reviewerId: 'reviewer-456',
    atomic: false,
  },
  userId
);
```

### Processing Jobs

Jobs are processed by the job queue worker (see `workers/job-queue.worker.ts`):

```typescript
import { jobQueueService } from './services/job-queue.service';

// Process a specific job
const result = await jobQueueService.processJob(jobId);

// Get queued jobs for processing
const queuedJobs = await jobQueueService.getQueuedJobs(10);
```

## Error Handling

All handlers implement graceful error handling:

1. **Validation Errors**: Invalid payloads throw `JobHandlerError` immediately
2. **Processing Errors**: Errors during processing trigger retry logic
3. **Retry Logic**: Exponential backoff with max 3 retries
4. **Failure Notifications**: Users are notified when jobs fail after max retries

## Testing

Each handler has comprehensive unit tests:

- `__tests__/bulk-operations.handler.test.ts` - 28 tests
- `__tests__/notification-delivery.handler.test.ts` - 22 tests
- `__tests__/job-handlers-integration.test.ts` - 6 tests

Run all job tests:
```bash
npm test -- src/modules/approval/jobs
```

## Future Enhancements

### Notification Delivery Handler
- [ ] Implement WebSocket/SSE real-time delivery
- [ ] Implement email notification delivery
- [ ] Add SMS notification support
- [ ] Add push notification support
- [ ] Implement delivery confirmation tracking

### General Improvements
- [ ] Add job priority levels
- [ ] Implement job scheduling (delayed execution)
- [ ] Add job cancellation support
- [ ] Implement job progress tracking
- [ ] Add Redis-based job queue for scalability

## Requirements

- **Notification Delivery Handler**: Requirements 24.1-24.9, 34.1-34.10
- **Bulk Operations Handler**: Requirements 8.1-8.7, 34.1-34.10
