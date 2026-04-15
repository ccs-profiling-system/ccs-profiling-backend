# RBAC Services

This directory contains the core services for the Role-Based Access Control (RBAC) system.

## PermissionChecker Service

The `PermissionChecker` service is the core component that implements permission resolution logic for the RBAC system.

### Features

- **Permission Format**: `resource.action` (e.g., `student.read`, `schedule.approve`)
- **Wildcard Support**: 
  - `resource.*` - All actions on a specific resource
  - `*.*` - All permissions across all resources
- **Resolution Order** (highest priority first):
  1. Explicit deny (specific permission in deny list)
  2. Explicit allow (specific permission in allow list)
  3. Wildcard allow (wildcard pattern in allow list)
  4. Default deny (if no match found, deny access)
- **Performance**: Sub-5ms permission checks with in-memory caching
- **Development Logging**: Performance metrics and slow query warnings in development mode

### Usage

#### Basic Permission Check

```typescript
import { permissionChecker } from './services';
import { Role } from './types';

// Check if a faculty member can read student data
const result = permissionChecker.hasPermission(Role.FACULTY, 'student.read');

if (result.granted) {
  console.log('Access granted:', result.reason);
  // Proceed with operation
} else {
  console.log('Access denied:', result.reason);
  // Return 403 Forbidden
}
```

#### Using in Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { permissionChecker } from './services';

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role; // Assuming user is attached by auth middleware
    
    if (!userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const result = permissionChecker.hasPermission(userRole, permission);
    
    if (!result.granted) {
      return res.status(403).json({ 
        error: 'Forbidden',
        reason: result.reason 
      });
    }
    
    next();
  };
}

// Use in routes
app.get('/api/students', requirePermission('student.read'), getStudents);
app.post('/api/schedules', requirePermission('schedule.create'), createSchedule);
```

#### Performance Monitoring

```typescript
import { permissionChecker } from './services';

// Get performance metrics
const metrics = permissionChecker.getMetrics();
console.log('Total checks:', metrics.totalChecks);
console.log('Cache hits:', metrics.cacheHits);
console.log('Cache misses:', metrics.cacheMisses);
console.log('Average check time:', metrics.averageCheckTime, 'ms');

// Get cache statistics
const stats = permissionChecker.getCacheStats();
console.log('Cache size:', stats.size);
console.log('Cache hit rate:', stats.hitRate, '%');
```

#### Cache Management

```typescript
import { permissionChecker } from './services';

// Clear cache (useful for testing or when permissions change)
permissionChecker.clearCache();

// Cache is automatically pre-warmed with common permissions
```

### Permission Resolution Examples

#### Example 1: Explicit Deny Precedence

```typescript
// Department Chair has schedule.* (wildcard allow)
// But schedule.delete is explicitly denied

const result = permissionChecker.hasPermission(
  Role.DEPARTMENT_CHAIR, 
  'schedule.delete'
);

console.log(result.granted); // false
console.log(result.reason);  // "Explicit deny: schedule.delete"
```

#### Example 2: Wildcard Allow

```typescript
// Faculty has instruction.* (wildcard allow)

const result = permissionChecker.hasPermission(
  Role.FACULTY, 
  'instruction.create'
);

console.log(result.granted); // true
console.log(result.reason);  // "Wildcard allow: instruction.*"
```

#### Example 3: Global Wildcard

```typescript
// Admin has *.* (global wildcard)

const result = permissionChecker.hasPermission(
  Role.ADMIN, 
  'any.permission'
);

console.log(result.granted); // true
console.log(result.reason);  // "Wildcard allow: *.*"
```

#### Example 4: Default Deny

```typescript
// Faculty does not have schedule.approve permission

const result = permissionChecker.hasPermission(
  Role.FACULTY, 
  'schedule.approve'
);

console.log(result.granted); // false
console.log(result.reason);  // "Default deny: no matching permission"
```

### Performance Characteristics

- **Cache Hit**: < 1ms (typically 0.01-0.1ms)
- **Cache Miss**: < 5ms (typically 0.5-2ms)
- **Pre-warmed Cache**: Common permissions are cached at startup
- **Cache Size**: Grows dynamically based on usage patterns
- **Memory Usage**: Minimal (each cache entry is ~100 bytes)

### Testing

The service includes comprehensive tests covering:
- Singleton pattern
- Permission resolution algorithm
- Explicit deny precedence
- Wildcard matching (resource.*, *.*)
- Caching performance
- Performance requirements (sub-5ms)
- Edge cases
- Real-world permission scenarios

Run tests:
```bash
npm test -- src/rbac/services/permissionChecker.service.test.ts --run
```

### Architecture

The `PermissionChecker` service follows these design principles:

1. **Singleton Pattern**: Single instance shared across the application
2. **Immutable Configuration**: Permission config loaded at startup
3. **In-Memory Caching**: Fast permission lookups with Map-based cache
4. **Fail-Safe**: Default deny when no permission match found
5. **Observable**: Metrics and logging for monitoring and debugging

### Integration with RBAC System

The `PermissionChecker` service is used by:
- `requirePermission()` middleware for endpoint protection
- Audit logging service for recording authorization decisions
- Workflow validation for state-based permission checks
- Custom authorization logic in business layer

### Configuration

Permissions are defined in `src/rbac/config/permissions.config.ts`:

```typescript
export const permissionConfig: PermissionConfig = {
  [Role.ADMIN]: {
    allow: ['*.*'],
    deny: [],
  },
  [Role.DEPARTMENT_CHAIR]: {
    allow: ['schedule.*', 'research.*', ...],
    deny: ['schedule.delete', 'research.delete'],
  },
  // ... other roles
};
```

See `permissions.config.ts` for the complete permission matrix.
