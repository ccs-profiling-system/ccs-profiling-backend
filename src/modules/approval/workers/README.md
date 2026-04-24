# Job Queue Worker

Background worker for processing queued jobs in the approval system.

## Overview

The Job Queue Worker polls the database for queued jobs and processes them using registered handlers. It supports graceful start/stop, error handling, retry logic, and configurable polling intervals.

## Features

- **Automatic Polling**: Polls for queued jobs every 5 seconds (configurable)
- **FIFO Processing**: Processes jobs in order (oldest first)
- **Error Handling**: Gracefully handles job failures with retry logic
- **Graceful Shutdown**: Waits for current job to complete before stopping
- **Configurable**: Customizable poll interval, batch size, and logging
- **Handler Registration**: Automatically registers handlers for bulk operations and notifications

## Usage

### Basic Usage

```typescript
import { JobQueueWorker } from './workers/job-queue.worker';

// Create and start the worker
const worker = new JobQueueWorker();
await worker.start();

// Worker runs in background, processing jobs...

// Stop the worker gracefully
await worker.stop();
```

### Custom Configuration

```typescript
import { JobQueueWorker } from './workers/job-queue.worker';

const worker = new JobQueueWorker({
  pollIntervalMs: 10000,  // Poll every 10 seconds
  batchSize: 20,          // Fetch up to 20 jobs per poll
  enableLogging: true,    // Enable detailed logging
});

await worker.start();
```

### Integration with Express App

```typescript
import express from 'express';
import { JobQueueWorker } from './modules/approval/workers/job-queue.worker';

const app = express();
const worker = new JobQueueWorker();

// Start worker when server starts
app.listen(3000, async () => {
  console.log('Server started on port 3000');
  await worker.start();
  console.log('Job queue worker started');
});

// Stop worker gracefully on shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await worker.stop();
  console.log('Job queue worker stopped');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await worker.stop();
  console.log('Job queue worker stopped');
  process.exit(0);
});
```

### Checking Worker State

```typescript
import { JobQueueWorker, WorkerState } from './workers/job-queue.worker';

const worker = new JobQueueWorker();

// Check if worker is running
if (worker.isRunning()) {
  console.log('Worker is running');
}

// Get current state
const state = worker.getState();
console.log(`Worker state: ${state}`); // 'stopped', 'starting', 'running', or 'stopping'
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pollIntervalMs` | number | 5000 | Polling interval in milliseconds |
| `batchSize` | number | 10 | Number of jobs to fetch per poll |
| `enableLogging` | boolean | true | Enable detailed logging |

## Worker States

The worker transitions through the following states:

```
STOPPED → STARTING → RUNNING → STOPPING → STOPPED
```

- **STOPPED**: Worker is not running
- **STARTING**: Worker is initializing
- **RUNNING**: Worker is actively polling and processing jobs
- **STOPPING**: Worker is shutting down gracefully

## Job Processing Flow

1. Worker polls for queued jobs at configured interval
2. Fetches jobs in FIFO order (oldest first)
3. Processes each job sequentially using registered handlers
4. Job queue service handles:
   - Status updates (queued → processing → completed/failed)
   - Handler execution
   - Retry logic with exponential backoff (max 3 retries)
   - Notification creation on completion
5. Worker logs processing events and errors

## Registered Handlers

The worker automatically registers handlers for:

- **bulk_approve**: Bulk approval operations
- **bulk_reject**: Bulk rejection operations
- **notification_delivery**: Notification delivery

## Error Handling

The worker handles errors gracefully:

- **Polling errors**: Logged but don't crash the worker
- **Job processing errors**: Handled by job queue service with retry logic
- **Handler errors**: Caught and logged, job marked as failed after max retries

## Graceful Shutdown

When stopping the worker:

1. Stops polling for new jobs
2. Waits for current job processing to complete (max 30 seconds)
3. Transitions to STOPPED state
4. Throws error if timeout is reached

## Logging

When logging is enabled, the worker logs:

- Worker start/stop events
- Job processing events (start, success, failure)
- Polling errors
- Handler registration

Example log output:

```
[JobQueueWorker] Job handlers registered successfully
[JobQueueWorker] Starting job queue worker...
[JobQueueWorker] Job queue worker started (polling every 5000ms, batch size: 10)
[JobQueueWorker] Found 3 queued job(s) to process
[JobQueueWorker] Processing job abc-123 (bulk_approve)...
[JobQueueWorker] Job abc-123 (bulk_approve) completed successfully with status: completed
[JobQueueWorker] Stopping job queue worker...
[JobQueueWorker] Job queue worker stopped
```

## Performance Considerations

- **Poll Interval**: Lower intervals increase responsiveness but add database load
- **Batch Size**: Larger batches process more jobs per poll but may delay individual jobs
- **Sequential Processing**: Jobs are processed one at a time to prevent race conditions
- **Concurrent Polls**: Worker skips polling if previous poll is still processing

## Testing

The worker includes comprehensive unit tests covering:

- Initialization and configuration
- Start/stop lifecycle
- Job processing (FIFO order, error handling)
- State management
- Polling intervals
- Logging
- Graceful shutdown

Run tests:

```bash
npm test -- job-queue.worker.test.ts
```

## Requirements

Implements requirements 34.1-34.10:

- 34.1: Job enqueueing with payload and initiator tracking
- 34.2: Job processing with error handling
- 34.3: Retry logic with exponential backoff
- 34.4: Job status tracking
- 34.5: Job status retrieval
- 34.6: Background job processing
- 34.7: Notification creation on job completion
- 34.8: Retry logic with max 3 attempts
- 34.9: FIFO job processing
- 34.10: Graceful start/stop
