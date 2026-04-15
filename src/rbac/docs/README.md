# RBAC Documentation

## Overview

This directory contains comprehensive documentation for the Role-Based Access Control (RBAC) system implemented in the CCS Profiling Backend.

## Documentation Files

### [MIDDLEWARE_COMPOSITION.md](./MIDDLEWARE_COMPOSITION.md)
**Complete guide to middleware composition patterns**

Covers:
- Core middleware functions (`requirePermission`, `checkOwnership`, `checkWorkflow`)
- Four composition patterns with examples
- TypeScript type safety
- Error handling and HTTP status codes
- Testing strategies
- Best practices

**When to read**: Start here to understand how to protect routes with RBAC middleware.

## Code Examples

### [route-examples.ts](../examples/route-examples.ts)
**Practical Express route examples**

Demonstrates:
- Pattern 1: Permission-only checks
- Pattern 2: Permission + Ownership
- Pattern 3: Permission + Workflow
- Pattern 4: Full validation
- Advanced patterns and helpers

**When to use**: Reference when implementing new protected routes.

### [middleware-composition.test.ts](../examples/middleware-composition.test.ts)
**Comprehensive test examples**

Includes:
- Unit tests for each pattern
- Integration test examples
- Error handling tests
- Performance tests
- Mock setup utilities

**When to use**: Reference when writing tests for protected routes.

## Utilities

### [middleware-composer.ts](../utils/middleware-composer.ts)
**Type-safe middleware composition utilities**

Provides:
- `composeMiddleware()` - Compose middleware from configuration
- `MiddlewarePresets` - Common composition patterns
- `MiddlewareCompositionBuilder` - Fluent API for building compositions
- `createPermissionConstants()` - Type-safe permission constants
- Type guards and helpers

**When to use**: Use these utilities to simplify middleware composition in routes.

## Quick Start

### 1. Protect a Simple Read Endpoint

```typescript
import { requirePermission } from '../rbac/middleware';

router.get('/students', 
  requirePermission('student.read'),
  getStudents
);
```

### 2. Protect an Update Endpoint with Ownership

```typescript
import { requirePermission, checkOwnership } from '../rbac/middleware';

router.put('/instructions/:id',
  requirePermission('instruction.update'),
  checkOwnership('instruction'),
  updateInstruction
);
```

### 3. Protect an Approval Endpoint with Workflow

```typescript
import { requirePermission } from '../rbac/middleware';

router.post('/schedules/:id/approve',
  requirePermission('schedule.approve'),
  // checkWorkflow('schedule'), // Future implementation
  approveSchedule
);
```

### 4. Full Validation (Permission + Ownership + Workflow)

```typescript
import { requirePermission, checkOwnership } from '../rbac/middleware';

router.post('/research/:id/submit',
  requirePermission('research.submit'),
  checkOwnership('research'),
  // checkWorkflow('research'), // Future implementation
  submitResearch
);
```

### 5. Using Composition Utilities

```typescript
import { composeMiddleware } from '../rbac/utils/middleware-composer';

router.put('/instructions/:id',
  ...composeMiddleware({
    permission: 'instruction.update',
    ownership: { resourceType: 'instruction' }
  }),
  updateInstruction
);
```

### 6. Using Presets

```typescript
import { MiddlewarePresets } from '../rbac/utils/middleware-composer';

// Read-only access
router.get('/students',
  ...MiddlewarePresets.readOnly('student.read'),
  getStudents
);

// Update own resource
router.put('/instructions/:id',
  ...MiddlewarePresets.updateOwn('instruction.update', 'instruction'),
  updateInstruction
);

// Submit own resource for approval
router.post('/research/:id/submit',
  ...MiddlewarePresets.submitOwn('research.submit', 'research'),
  submitResearch
);
```

### 7. Using Builder Pattern

```typescript
import { MiddlewareCompositionBuilder } from '../rbac/utils/middleware-composer';

router.put('/instructions/:id',
  ...new MiddlewareCompositionBuilder()
    .requirePermission('instruction.update')
    .checkOwnership('instruction')
    .build(),
  updateInstruction
);
```

## Middleware Execution Order

All middleware executes in this strict order:

```
Authentication (401) → Permission (403) → Ownership (403) → Workflow (400) → Business Logic
```

Each middleware can short-circuit the chain by returning an error response.

## HTTP Status Codes

| Middleware | Success | Failure | Status Code | Meaning |
|------------|---------|---------|-------------|---------|
| Authentication | ✓ | ✗ | 401 | Not authenticated |
| requirePermission | ✓ | ✗ | 403 | Permission denied |
| checkOwnership | ✓ | ✗ | 403 | Not owner / 404 Not found |
| checkWorkflow | ✓ | ✗ | 400 | Invalid workflow state |

## Common Patterns

### Read Operations
- **Public read**: Permission only
- **Read own data**: Permission + Ownership

### Write Operations
- **Create**: Permission only (no existing resource)
- **Update own**: Permission + Ownership
- **Update with workflow**: Permission + Ownership + Workflow

### Approval Operations
- **Approve (no ownership)**: Permission + Workflow
- **Approve with ownership**: Permission + Ownership + Workflow

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requirePermission } from '../middleware';
import { Role } from '../types';

describe('Permission Check', () => {
  it('should allow access when permission granted', () => {
    const req = {
      user: { userId: 'user-123', role: Role.FACULTY, email: 'faculty@example.com' }
    };
    const res = {};
    const next = vi.fn();

    const middleware = requirePermission('student.read');
    middleware(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(); // No error
  });
});
```

### Integration Tests

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
});
```

## Best Practices

### 1. Always Use Permission Check First
```typescript
// ✓ GOOD
[requirePermission(), checkOwnership()]

// ✗ BAD
[checkOwnership(), requirePermission()]
```

### 2. Use Specific Permissions
```typescript
// ✓ GOOD
requirePermission('schedule.approve')

// ✗ BAD
requirePermission('schedule.*')
```

### 3. Use Type-Safe Constants
```typescript
// ✓ GOOD
const PERMISSIONS = {
  STUDENT_READ: 'student.read' as Permission,
};
requirePermission(PERMISSIONS.STUDENT_READ)

// ✗ BAD
requirePermission('student.read')
```

### 4. Document Middleware Composition
```typescript
/**
 * Update instruction endpoint
 * 
 * Middleware:
 * 1. requirePermission('instruction.update') - Faculty can update
 * 2. checkOwnership('instruction') - Faculty can only update their own
 * 
 * Bypasses: Admin and Department_Chair bypass ownership
 */
router.put('/instructions/:id', ...)
```

### 5. Use Composition Utilities
```typescript
// ✓ GOOD - Reusable and type-safe
...composeMiddleware({
  permission: 'instruction.update',
  ownership: { resourceType: 'instruction' }
})

// ✗ BAD - Manual composition prone to errors
requirePermission('instruction.update'),
checkOwnership('instruction')
```

## Additional Resources

### Core Documentation
- [Permission Configuration](../config/README.md) - How to configure role permissions
- [Middleware Reference](../middleware/README.md) - Detailed middleware documentation
- [Types Reference](../types/index.ts) - TypeScript type definitions

### Implementation Guides
- [Requirements Document](../../../../.kiro/specs/backend-rbac-system/requirements.md) - System requirements
- [Design Document](../../../../.kiro/specs/backend-rbac-system/design.md) - Technical design
- [Tasks Document](../../../../.kiro/specs/backend-rbac-system/tasks.md) - Implementation tasks

## Support

For questions or issues:
1. Check the [MIDDLEWARE_COMPOSITION.md](./MIDDLEWARE_COMPOSITION.md) guide
2. Review [route-examples.ts](../examples/route-examples.ts) for similar use cases
3. Check [middleware-composition.test.ts](../examples/middleware-composition.test.ts) for testing patterns
4. Consult the requirements and design documents

## Contributing

When adding new middleware or patterns:
1. Update [MIDDLEWARE_COMPOSITION.md](./MIDDLEWARE_COMPOSITION.md) with new patterns
2. Add examples to [route-examples.ts](../examples/route-examples.ts)
3. Add tests to [middleware-composition.test.ts](../examples/middleware-composition.test.ts)
4. Update this README if adding new documentation files
