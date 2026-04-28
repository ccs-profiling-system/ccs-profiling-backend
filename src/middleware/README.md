# Approval System Middleware

This directory contains middleware components for the Approval System API.

## Approval Audit Logging Middleware

**File:** `approval-audit.middleware.ts`

### Purpose

Provides comprehensive audit logging for all approval workflow actions. Logs are created asynchronously to avoid blocking the request-response cycle.

### Features

- **Asynchronous Logging**: Uses `setImmediate()` to log after response is sent
- **Non-blocking**: Errors in audit logging do not affect API responses
- **Comprehensive Coverage**: Logs both successful and failed operations
- **State Transition Tracking**: Includes previous status for state changes
- **IP and User Agent Tracking**: Captures client information
- **Bulk Operation Support**: Logs summaries for bulk approve/reject operations

### Usage

Apply the middleware to approval routes:

```typescript
import { approvalAuditMiddleware } from './middleware/approval-audit.middleware';

// Apply to all approval routes
app.use('/api/v1/approvals', approvalAuditMiddleware);

// Or apply to specific routes
router.post('/approvals', approvalAuditMiddleware, submitChangeRequest);
router.patch('/approvals/:id/approve', approvalAuditMiddleware, approveRequest);
```

### Manual State Transition Logging

For service-level state transitions, use the exported function:

```typescript
import { logApprovalStateTransition } from './middleware/approval-audit.middleware';

// In your service
await logApprovalStateTransition(
  userId,
  changeRequestId,
  entityType,
  entityId,
  'approval_approved',
  'pending',
  'approved',
  { reviewer_comments: 'Looks good' }
);
```

### Logged Actions

| Action Type | Trigger | Details Captured |
|-------------|---------|------------------|
| `approval_submitted` | POST /approvals | Entity type, entity ID, category |
| `approval_approved` | PATCH /approvals/:id/approve | Comments, new status |
| `approval_rejected` | PATCH /approvals/:id/reject | Comments (required), new status |
| `approval_withdrawn` | PATCH /approvals/:id/withdraw | New status |
| `approval_retried` | PATCH /approvals/:id/retry | Retry attempt |
| `approval_bulk_approved` | POST /approvals/bulk-approve | Summary (total, successful, failed) |
| `approval_bulk_rejected` | POST /approvals/bulk-reject | Summary (total, successful, failed) |

### Audit Log Structure

```typescript
{
  user_id: string;           // User who performed the action
  action_type: string;       // Type of action (see table above)
  entity_type: string;       // Type of entity (approval, student, faculty, etc.)
  entity_id: string;         // ID of the change request or entity
  before_state: object;      // State before action (for transitions)
  after_state: object;       // State after action with details
  ip_address: string;        // Client IP address
  user_agent: string;        // Client user agent
  created_at: timestamp;     // When the log was created
}
```

### Error Handling

- Audit logging failures are logged to console but do not throw errors
- Failed audit logs do not affect API responses
- Errors are caught and logged with `console.error()`

### Testing

Comprehensive unit tests are available in `__tests__/approval-audit.middleware.test.ts`:

```bash
npm test -- approval-audit.middleware.test.ts
```

Tests cover:
- All action types (submission, approval, rejection, withdrawal, bulk operations)
- Successful and failed operations
- IP address and user agent extraction
- Asynchronous logging behavior
- Error handling
- State transition logging

### Requirements Satisfied

- **16.1**: Logs approval submission actions
- **16.2**: Logs approval approved actions
- **16.3**: Logs approval rejected actions
- **16.4**: Logs approval withdrawn actions
- **16.5**: Logs bulk operation actions
- **16.6**: Includes user ID, timestamp, IP address, change request ID, and action details
- **16.7**: Records both successful and failed operations

### Performance Considerations

- Logging is asynchronous and non-blocking
- Uses `setImmediate()` to defer logging until after response is sent
- No impact on API response times
- Lazy loading of audit log repository to avoid circular dependencies

### Security Considerations

- Sensitive data (passwords, tokens) are never logged
- Only relevant request/response data is captured
- IP addresses are extracted from `X-Forwarded-For` header when available
- User agent strings are captured for forensic analysis
