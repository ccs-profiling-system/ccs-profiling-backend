# RBAC System - Role-Based Access Control

Comprehensive authorization system for the CCS Profiling Backend with fine-grained permission controls, modular middleware, and selective audit logging.

## Quick Start

### 1. Protect a Route with Permission Check

```typescript
import { requirePermission } from './rbac/middleware';

// Simple read endpoint
router.get('/students', 
  requirePermission('student.read'),
  getStudents
);

// Create endpoint
router.post('/students', 
  requirePermission('student.create'),
  createStudent
);
```

### 2. Protect a Route with Ownership Validation

```typescript
import { requirePermission, checkOwnership } from './rbac/middleware';

// Faculty can only update their own instructions
router.put('/instructions/:id',
  requirePermission('instruction.update'),
  checkOwnership('instruction'),
  updateInstruction
);
```

### 3. Multiple Permissions (OR Logic)

```typescript
// User needs at least one of these permissions
router.post('/research',
  requirePermission(['research.create', 'research.submit']),
  createResearch
);
```

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Permission Configuration](#permission-configuration)
- [Middleware Usage](#middleware-usage)
- [Code Examples](#code-examples)
- [Adding Permissions to Routes](#adding-permissions-to-routes)
- [Testing](#testing)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

## Overview

The RBAC system provides:

- **5 User Roles**: admin, department_chair, faculty, secretary, student
- **Explicit Permissions**: No automatic inheritance between roles
- **Wildcard Support**: `resource.*` and `*.*` patterns with explicit deny capability
- **Clear Resolution Order**: explicit deny → explicit allow → wildcard allow → default deny
- **Modular Middleware**: Composable permission, ownership, and workflow checks
- **Selective Audit Logging**: Logs denials and sensitive operations only
- **High Performance**: Sub-2ms permission checks with in-memory caching

### Key Features

✅ Type-safe TypeScript implementation  
✅ Comprehensive permission matrix covering 20+ modules  
✅ Middleware composition for flexible authorization  
✅ Ownership validation for user-owned resources  
✅ Integration with existing JWT authentication  
✅ Detailed error messages with proper HTTP status codes  
✅ Development-friendly with hot-reload support  

## Architecture

### System Components

```
src/rbac/
├── config/              # Permission configuration
│   ├── permissions.config.ts   # Role-to-permissions mapping
│   └── README.md               # Configuration documentation
├── middleware/          # Authorization middleware
│   ├── requirePermission.middleware.ts
│   ├── checkOwnership.middleware.ts
│   ├── index.ts
│   └── README.md
├── services/            # Core permission logic
│   └── permissionChecker.service.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Helper utilities
│   └── middleware-composer.ts
├── examples/            # Code examples
│   └── route-examples.ts
├── docs/                # Detailed documentation
│   └── README.md
└── index.ts             # Main exports
```

### Execution Flow

```
Request → Authentication (401) → Permission Check (403) → Ownership Check (403) → Business Logic
```

Each middleware can short-circuit the chain by returning an error response.

## Setup Instructions

### 1. Import RBAC Middleware

```typescript
import { requirePermission, checkOwnership } from './rbac/middleware';
```

### 2. Apply to Routes

```typescript
// Permission only
router.get('/students', requirePermission('student.read'), handler);

// Permission + Ownership
router.put('/instructions/:id',
  requirePermission('instruction.update'),
  checkOwnership('instruction'),
  handler
);
```

### 3. Ensure Authentication Middleware is Applied

The RBAC middleware requires `req.user` to be populated by authentication middleware:

```typescript
import { authMiddleware } from './shared/middleware/auth.middleware';

// Apply auth middleware globally or per-route
app.use('/api', authMiddleware);

// Or per-route
router.get('/students',
  authMiddleware,
  requirePermission('student.read'),
  getStudents
);
```

### 4. Configure Error Handling

RBAC middleware throws typed errors that should be caught by your error handler:

```typescript
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: err.message });
  }
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({ error: err.message });
  }
  // Handle other errors...
});
```

## Permission Configuration

### Permission Format

Permissions follow the `resource.action` naming convention:

```typescript
'student.read'        // Read student data
'student.create'      // Create student records
'schedule.approve'    // Approve schedules
'student.*'           // All student operations (wildcard)
'*.*'                 // All operations (admin only)
```

### Role Permissions

Each role has explicitly defined permissions in `config/permissions.config.ts`:

| Role | Description | Example Permissions |
|------|-------------|-------------------|
| **admin** | Full system access | `*.*` (all permissions) |
| **department_chair** | Department management | `schedule.*`, `research.*`, `enrollment.approve` |
| **faculty** | Teaching & research | `instruction.*`, `research.create`, `student.read` |
| **secretary** | Encoding & admin tasks | `student.create`, `student.update`, `enrollment.create` |
| **student** | Read-only access | `student.read_own`, `schedule.read`, `event.read` |

### Permission Structure

```typescript
{
  allow: ["student.*", "schedule.read"],  // Granted permissions
  deny: ["student.delete"]                // Explicitly denied (overrides allow)
}
```

### Resolution Order

When checking permissions, the system applies this order (highest priority first):

1. **Explicit deny** - Specific permission in deny list
2. **Explicit allow** - Specific permission in allow list  
3. **Wildcard allow** - Wildcard pattern in allow list
4. **Default deny** - If no match found, deny access

**Important**: Explicit deny ALWAYS takes precedence over any allow rule.

### Example

```typescript
// Department Chair configuration
{
  allow: ["schedule.*", "research.*"],
  deny: ["schedule.delete", "research.delete"]
}

// Result:
// ✅ schedule.create - Allowed (wildcard allow)
// ✅ schedule.approve - Allowed (wildcard allow)
// ❌ schedule.delete - Denied (explicit deny wins)
```

### Modifying Permissions

To add or modify permissions:

1. Edit `src/rbac/config/permissions.config.ts`
2. Add permission to role's `allow` or `deny` list
3. Restart server (or use hot-reload in development)
4. Test the permission change

See [config/README.md](./config/README.md) for detailed configuration documentation.

## Middleware Usage

### requirePermission

Validates that the authenticated user has the required permission(s).

```typescript
requirePermission(permission: Permission | Permission[])
```

**Single Permission:**
```typescript
router.get('/students', requirePermission('student.read'), handler);
```

**Multiple Permissions (OR logic):**
```typescript
router.post('/research',
  requirePermission(['research.create', 'research.submit']),
  handler
);
```

**Returns:**
- HTTP 401 if not authenticated
- HTTP 403 if permission denied
- Calls `next()` if permission granted

### checkOwnership

Validates that the user owns the requested resource.

```typescript
checkOwnership(resourceType: string, options?: OwnershipOptions)
```

**Basic Usage:**
```typescript
router.put('/instructions/:id',
  requirePermission('instruction.update'),
  checkOwnership('instruction'),
  handler
);
```

**Custom Parameter Name:**
```typescript
router.put('/students/:studentId/profile',
  requirePermission('student.update'),
  checkOwnership('student', { paramName: 'studentId' }),
  handler
);
```

**Custom Ownership Field:**
```typescript
router.put('/enrollments/:id',
  requirePermission('enrollment.update'),
  checkOwnership('enrollment', { ownerField: 'student_id' }),
  handler
);
```

**Bypasses:**
- Admin role always bypasses ownership checks
- Department_Chair role bypasses ownership checks

**Returns:**
- HTTP 403 if ownership validation fails
- HTTP 404 if resource not found
- Calls `next()` if ownership validated

### Middleware Composition

Combine middleware for comprehensive validation:

```typescript
// Permission only
[requirePermission('resource.action')]

// Permission + Ownership
[requirePermission('resource.action'), checkOwnership('resource')]

// Permission + Ownership (full validation)
[
  requirePermission('resource.action'),
  checkOwnership('resource')
]
```

See [docs/README.md](./docs/README.md) for detailed middleware documentation.

## Code Examples

### Example 1: Read-Only Endpoint

```typescript
import { requirePermission } from './rbac/middleware';

// Faculty can read all students
router.get('/students',
  requirePermission('student.read'),
  async (req, res, next) => {
    try {
      const students = await studentService.findAll();
      res.json(students);
    } catch (error) {
      next(error);
    }
  }
);
```

### Example 2: Update Own Resource

```typescript
import { requirePermission, checkOwnership } from './rbac/middleware';

// Faculty can update only their own instructions
router.put('/instructions/:id',
  requirePermission('instruction.update'),
  checkOwnership('instruction'),
  async (req, res, next) => {
    try {
      const instruction = await instructionService.update(
        req.params.id,
        req.body
      );
      res.json(instruction);
    } catch (error) {
      next(error);
    }
  }
);
```

### Example 3: Approval Endpoint

```typescript
import { requirePermission } from './rbac/middleware';

// Department Chair can approve schedules
router.post('/schedules/:id/approve',
  requirePermission('schedule.approve'),
  async (req, res, next) => {
    try {
      const schedule = await scheduleService.approve(req.params.id);
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  }
);
```

See [examples/route-examples.ts](./examples/route-examples.ts) for 20+ practical examples.

## Adding Permissions to Routes

### Step-by-Step Guide

#### Step 1: Identify the Required Permission

Determine what permission is needed based on the operation:

- **Read operations**: `resource.read` (e.g., `student.read`)
- **Create operations**: `resource.create` (e.g., `student.create`)
- **Update operations**: `resource.update` (e.g., `instruction.update`)
- **Delete operations**: `resource.delete` (e.g., `research.delete`)
- **Approval operations**: `resource.approve` (e.g., `schedule.approve`)

Check `config/permissions.config.ts` to see which roles have the permission.

#### Step 2: Import Middleware

```typescript
import { requirePermission, checkOwnership } from './rbac/middleware';
```

#### Step 3: Apply Middleware to Route

Add middleware before your route handler:

```typescript
router.METHOD('/path',
  requirePermission('resource.action'),  // Add this
  handler
);
```

#### Step 4: Add Ownership Check (if needed)

If the operation should only work on user-owned resources:

```typescript
router.METHOD('/path/:id',
  requirePermission('resource.action'),
  checkOwnership('resource'),  // Add this
  handler
);
```

#### Step 5: Test the Protection

Test with different roles to ensure:
- ✅ Authorized roles can access the endpoint
- ❌ Unauthorized roles receive HTTP 403
- ❌ Unauthenticated requests receive HTTP 401
- ❌ Ownership violations receive HTTP 403

### Complete Example

```typescript
// Before: Unprotected route
router.put('/instructions/:id', updateInstruction);

// After: Protected route
router.put('/instructions/:id',
  requirePermission('instruction.update'),  // Step 3: Permission check
  checkOwnership('instruction'),            // Step 4: Ownership check
  updateInstruction
);
```

### Common Patterns

**Pattern 1: Public Read**
```typescript
router.get('/schedules',
  requirePermission('schedule.read'),
  getSchedules
);
```

**Pattern 2: Create (No Ownership)**
```typescript
router.post('/students',
  requirePermission('student.create'),
  createStudent
);
```

**Pattern 3: Update Own Resource**
```typescript
router.put('/instructions/:id',
  requirePermission('instruction.update'),
  checkOwnership('instruction'),
  updateInstruction
);
```

**Pattern 4: Admin-Only Operation**
```typescript
router.delete('/users/:id',
  requirePermission('user.delete'),  // Only admin has this
  deleteUser
);
```

**Pattern 5: Multiple Permissions**
```typescript
router.post('/research',
  requirePermission(['research.create', 'research.submit']),
  createResearch
);
```

## Testing

### Unit Tests

Test permission checks in isolation:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { requirePermission } from './middleware';
import { Role } from './types';

describe('requirePermission', () => {
  it('should allow access when permission granted', () => {
    const req = {
      user: { userId: '123', role: Role.FACULTY, email: 'faculty@test.com' }
    };
    const res = {};
    const next = vi.fn();

    const middleware = requirePermission('student.read');
    middleware(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(); // No error
  });

  it('should deny access when permission not granted', () => {
    const req = {
      user: { userId: '123', role: Role.STUDENT, email: 'student@test.com' }
    };
    const res = {};
    const next = vi.fn();

    const middleware = requirePermission('student.delete');
    middleware(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      name: 'ForbiddenError',
      statusCode: 403
    }));
  });
});
```

### Integration Tests

Test protected routes end-to-end:

```typescript
import request from 'supertest';
import app from '../app';

describe('Protected Routes', () => {
  it('should allow faculty to read students', async () => {
    const response = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${facultyToken}`);
    
    expect(response.status).toBe(200);
  });

  it('should deny student from creating students', async () => {
    const response = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Test Student' });
    
    expect(response.status).toBe(403);
  });
});
```

Run tests:

```bash
npm test -- rbac
```

## Performance

### Performance Targets

- **Permission checks**: Sub-2ms overhead per request
- **Ownership checks**: Sub-5ms overhead per request
- **Cache hit rate**: >95% for common permissions

### Optimization Features

- **In-memory caching**: Permission check results cached by role and permission
- **Pre-warming**: Common permissions cached at startup
- **Fast string matching**: Optimized wildcard pattern matching
- **Singleton pattern**: Single PermissionChecker instance

### Monitoring

Development mode logs performance warnings:

```
[RBAC] Permission check exceeded 2ms target: 3.45ms (user=123 permissions=student.read)
```

Get performance metrics:

```typescript
import { permissionChecker } from './rbac/services/permissionChecker.service';

const metrics = permissionChecker.getMetrics();
console.log('Total checks:', metrics.totalChecks);
console.log('Cache hit rate:', metrics.cacheHits / metrics.totalChecks);
console.log('Average time:', metrics.averageCheckTime, 'ms');
```

## Troubleshooting

### "Authentication required" Error (HTTP 401)

**Cause**: `req.user` is not populated

**Solution**:
1. Ensure `authMiddleware` is applied before RBAC middleware
2. Check that JWT token is valid and included in Authorization header
3. Verify token contains required user fields (userId, role, email)

```typescript
// ✅ Correct order
router.get('/students',
  authMiddleware,
  requirePermission('student.read'),
  handler
);

// ❌ Wrong order
router.get('/students',
  requirePermission('student.read'),
  authMiddleware,  // Too late!
  handler
);
```

### "Permission denied" Error (HTTP 403)

**Cause**: User role lacks the required permission

**Solution**:
1. Check `config/permissions.config.ts` to see which roles have the permission
2. Verify the user has the correct role assigned
3. Check for explicit deny rules that might override allow rules
4. Review permission resolution order

```typescript
// Check what permissions a role has
import { getPermissionsForRole } from './rbac/config';

const facultyPerms = getPermissionsForRole(Role.FACULTY);
console.log('Allow:', facultyPerms.allow);
console.log('Deny:', facultyPerms.deny);
```

### Ownership Check Fails (HTTP 403)

**Cause**: User doesn't own the resource

**Solution**:
1. Verify the resource exists (check for HTTP 404 first)
2. Check that the resource has the correct owner field
3. Verify the user ID matches the resource owner ID
4. Consider if Admin/Department_Chair should bypass the check

```typescript
// Debug ownership check
console.log('User ID:', req.user.userId);
console.log('Resource owner:', resource.created_by);
console.log('Match:', req.user.userId === resource.created_by);
```

### Performance Issues

**Cause**: Permission checks taking too long

**Solution**:
1. Check cache hit rate: `permissionChecker.getCacheStats()`
2. Clear and pre-warm cache: `permissionChecker.clearCache()`
3. Review permission configuration for overly complex patterns
4. Check for database queries in middleware (should be fast lookups only)

## Additional Documentation

- **[config/README.md](./config/README.md)** - Permission configuration guide
- **[middleware/README.md](./middleware/README.md)** - Detailed middleware reference
- **[docs/README.md](./docs/README.md)** - Comprehensive documentation index
- **[examples/route-examples.ts](./examples/route-examples.ts)** - 20+ code examples
- **[.kiro/specs/backend-rbac-system/](../../.kiro/specs/backend-rbac-system/)** - Requirements and design docs

## Support

For questions or issues:

1. Check this README for common patterns
2. Review [examples/route-examples.ts](./examples/route-examples.ts) for similar use cases
3. Consult [middleware/README.md](./middleware/README.md) for detailed middleware docs
4. Check the troubleshooting section above
5. Review the requirements and design documents in `.kiro/specs/backend-rbac-system/`

## Contributing

When modifying the RBAC system:

1. Update permission configuration in `config/permissions.config.ts`
2. Add tests for new middleware or patterns
3. Update relevant documentation files
4. Run the full test suite: `npm test -- rbac`
5. Check performance impact in development mode

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained By**: CCS Profiling Backend Team
