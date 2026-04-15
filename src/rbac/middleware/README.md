# requirePermission Middleware

The `requirePermission` middleware enforces permission checks on API endpoints using the RBAC system. It validates that authenticated users have the required permission(s) to perform requested actions.

## Features

- **Single Responsibility**: Permission checking only (no ownership or workflow validation)
- **Flexible Permission Checks**: Supports single permission or multiple permissions with OR logic
- **Clear HTTP Status Codes**: Returns 401 for authentication failures, 403 for permission denials
- **Selective Audit Logging**: Logs denials and sensitive operations only (not all read operations)
- **High Performance**: Sub-2ms overhead with in-memory caching
- **Type-Safe**: Full TypeScript support with proper error types

## Usage

### Basic Usage - Single Permission

```typescript
import { requirePermission } from '../rbac/middleware';

// Protect endpoint with single permission
router.get('/students', requirePermission('student.read'), getStudents);
router.post('/students', requirePermission('student.create'), createStudent);
router.delete('/students/:id', requirePermission('student.delete'), deleteStudent);
```

### Multiple Permissions (OR Logic)

When multiple permissions are provided, the user needs **at least one** of them to proceed:

```typescript
// User needs either research.create OR research.submit
router.post('/research', 
  requirePermission(['research.create', 'research.submit']), 
  createResearch
);

// User needs either schedule.approve OR schedule.reject
router.put('/schedules/:id/status', 
  requirePermission(['schedule.approve', 'schedule.reject']), 
  updateScheduleStatus
);
```

### Middleware Composition

Combine with other middleware for comprehensive validation:

```typescript
import { requirePermission } from '../rbac/middleware';
import { checkOwnership } from '../rbac/middleware/checkOwnership';
import { checkWorkflow } from '../rbac/middleware/checkWorkflow';

// Permission + Ownership validation
router.put('/instructions/:id', 
  requirePermission('instruction.update'),
  checkOwnership('instruction'),
  updateInstruction
);

// Permission + Workflow validation
router.put('/schedules/:id/approve', 
  requirePermission('schedule.approve'),
  checkWorkflow('schedule'),
  approveSchedule
);

// Full validation chain
router.put('/research/:id', 
  requirePermission('research.update'),
  checkOwnership('research'),
  checkWorkflow('research'),
  updateResearch
);
```

## Execution Flow

1. **Authentication Check**: Verifies `req.user` exists (populated by `authMiddleware`)
2. **Permission Check**: Validates user role has required permission(s)
3. **Audit Logging**: Logs denials and sensitive operations
4. **Error Handling**: Returns appropriate HTTP status code
5. **Next Middleware**: Calls `next()` if permission granted

## HTTP Status Codes

| Status | Error Type | When Returned |
|--------|-----------|---------------|
| 401 | UnauthorizedError | User not authenticated (`req.user` is undefined) |
| 403 | ForbiddenError | User lacks required permission |
| 200/201 | Success | Permission granted, proceeds to next middleware |

## Error Response Format

### Single Permission Denial

```json
{
  "error": {
    "message": "Permission denied: student.delete",
    "code": "FORBIDDEN",
    "statusCode": 403
  }
}
```

### Multiple Permissions Denial

```json
{
  "error": {
    "message": "Permission denied: requires one of [schedule.approve, schedule.reject]",
    "code": "FORBIDDEN",
    "statusCode": 403
  }
}
```

### Authentication Failure

```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED",
    "statusCode": 401
  }
}
```

## Audit Logging

The middleware implements **selective logging** to prevent log explosion:

### What Gets Logged

1. **All Denials** (WARNING level)
   - User ID, role, resource, action, and denial reason
   - Example: `[RBAC] Permission denied: user=123 role=faculty resource=student action=delete reason="Explicit deny: student.delete"`

2. **Sensitive Operations When Permitted** (INFO level)
   - Operations: create, update, delete, approve, reject, manage
   - Example: `[RBAC] Sensitive operation permitted: user=123 role=secretary resource=student action=create`

### What Doesn't Get Logged

- Successful non-sensitive operations (read, list, search)
- This prevents log explosion while maintaining security audit trail

## Performance

- **Target**: Sub-2ms overhead per request
- **Caching**: Permission checks are cached in-memory by PermissionChecker
- **Monitoring**: Development mode warns if checks exceed 2ms

## Permission Format

Permissions follow the `resource.action` format:

- `student.read` - Read student data
- `student.create` - Create student records
- `schedule.approve` - Approve schedules
- `research.*` - All research operations (wildcard)
- `*.*` - All operations (admin only)

## Role-Based Permissions

Each role has explicitly defined permissions:

| Role | Example Permissions |
|------|-------------------|
| Admin | `*.*` (all permissions) |
| Department Chair | `schedule.*`, `research.*`, `enrollment.approve` |
| Faculty | `instruction.*`, `research.create`, `student.read` |
| Secretary | `student.create`, `student.update`, `enrollment.create` |
| Student | `student.read_own`, `schedule.read`, `event.read` |

See `src/rbac/config/permissions.config.ts` for complete permission matrix.

## Testing

Comprehensive test suite covers:

- Authentication checks (401 errors)
- Permission validation (403 errors)
- Multiple permissions with OR logic
- Audit logging for denials and sensitive operations
- Error response format
- Performance requirements
- Edge cases

Run tests:

```bash
npm test -- requirePermission.middleware.test.ts
```

## Integration with Existing Middleware

The `requirePermission` middleware integrates seamlessly with the existing `authMiddleware`:

```typescript
import { authMiddleware } from '../shared/middleware/auth.middleware';
import { requirePermission } from '../rbac/middleware';

// authMiddleware must come first to populate req.user
router.get('/students', 
  authMiddleware,           // Step 1: Authenticate and populate req.user
  requirePermission('student.read'),  // Step 2: Check permissions
  getStudents               // Step 3: Business logic
);
```

## Best Practices

1. **Always use authMiddleware first**: `requirePermission` depends on `req.user`
2. **Use specific permissions**: Prefer `student.read` over `student.*` when possible
3. **Compose middleware**: Combine permission, ownership, and workflow checks as needed
4. **Handle errors globally**: Use Express error handler to format error responses
5. **Test permission logic**: Write tests for each protected endpoint
6. **Monitor performance**: Check logs for permission checks exceeding 2ms

## Common Patterns

### Read-Only Endpoints

```typescript
router.get('/students', requirePermission('student.read'), getStudents);
router.get('/schedules', requirePermission('schedule.read'), getSchedules);
```

### Write Endpoints with Ownership

```typescript
router.put('/instructions/:id', 
  requirePermission('instruction.update'),
  checkOwnership('instruction'),
  updateInstruction
);
```

### Approval Endpoints with Workflow

```typescript
router.put('/schedules/:id/approve', 
  requirePermission('schedule.approve'),
  checkWorkflow('schedule'),
  approveSchedule
);
```

### Admin-Only Endpoints

```typescript
router.delete('/users/:id', 
  requirePermission('user.delete'),  // Only admin has this
  deleteUser
);
```

## Troubleshooting

### "Authentication required" error

- Ensure `authMiddleware` is applied before `requirePermission`
- Check that JWT token is valid and included in Authorization header

### "Permission denied" error

- Verify user role has the required permission in `permissions.config.ts`
- Check for explicit deny rules that might override allow rules
- Review permission resolution order: explicit deny → explicit allow → wildcard allow → default deny

### Performance warnings

- Check if permission checks are exceeding 2ms in development logs
- Verify PermissionChecker cache is working properly
- Consider pre-warming cache with frequently used permissions

## Related Documentation

- [RBAC System Design](../../.kiro/specs/backend-rbac-system/design.md)
- [Permission Configuration](../config/permissions.config.ts)
- [Permission Checker Service](../services/permissionChecker.service.ts)
- [RBAC Types](../types/index.ts)
