# RBAC Permission Configuration

This directory contains the permission configuration for the Role-Based Access Control (RBAC) system.

## Files

### `permissions.config.ts`
Defines the comprehensive permission matrix for all five user roles:
- **Admin**: Full system access with `{ allow: ["*.*"], deny: [] }`
- **Department_Chair**: Department-level management with selective denies
- **Faculty**: Teaching and research operations with ownership constraints
- **Secretary**: Encoding and administrative operations without approval rights
- **Student**: Read-only access to own data and public information

### `validator.ts`
Provides validation utilities for the permission configuration:
- Validates permission format (resource.action, resource.*, *.*)
- Ensures all required roles are configured
- Validates Admin has full access
- Checks for duplicate permissions
- Runs on system startup to catch configuration errors early

### `hot-reload.ts`
Implements hot-reloading for development mode:
- Watches `permissions.config.ts` for changes
- Automatically reloads configuration without server restart
- Only enabled in development mode (NODE_ENV=development)
- Validates new configuration before applying
- Provides callbacks for cache invalidation

### `index.ts`
Exports all configuration utilities for easy importing.

## Permission Format

Permissions follow the `resource.action` naming convention:
- Specific permission: `student.read`, `schedule.approve`
- Resource wildcard: `student.*` (all student operations)
- Global wildcard: `*.*` (all operations across all resources)

## Resolution Order

When checking permissions, the system applies this resolution order (highest priority first):

1. **Explicit deny** - Specific permission in deny list
2. **Explicit allow** - Specific permission in allow list
3. **Wildcard allow** - Wildcard pattern in allow list
4. **Default deny** - If no match found, deny access

**Important**: Explicit deny ALWAYS takes precedence over any allow rule.

## Example Configuration

```typescript
{
  allow: ["student.*", "schedule.read"],
  deny: ["student.delete"]
}
```

Result: All student operations except delete, plus schedule read access.

## Usage

### Import Configuration

```typescript
import { permissionConfig, getPermissionsForRole } from '@/rbac/config';

// Get permissions for a specific role
const facultyPerms = getPermissionsForRole(Role.FACULTY);
console.log(facultyPerms.allow); // ['instruction.*', 'research.create', ...]
```

### Validate Configuration

```typescript
import { validatePermissionConfig } from '@/rbac/config';

// Validate on startup
try {
  validatePermissionConfig();
  console.log('✓ Permission configuration is valid');
} catch (error) {
  console.error('✗ Invalid configuration:', error.message);
  process.exit(1);
}
```

### Enable Hot-Reload (Development Only)

```typescript
import { startHotReload, onReload } from '@/rbac/config';

// Start watching for changes
startHotReload();

// Register callback for cache invalidation
onReload(() => {
  console.log('Configuration reloaded, clearing cache...');
  permissionCache.clear();
});
```

## Modules Covered

The permission configuration covers all system modules:
- students, faculty, scheduling, research, events
- instructions, enrollments, academic_history
- affiliations, skills, violations, uploads
- reports, analytics, dashboard, search, audit_logs

## Adding New Permissions

1. Add the permission to the appropriate role's `allow` list in `permissions.config.ts`
2. If needed, add explicit denies to other roles
3. Run validation to ensure format is correct
4. Document the permission in the role's comment block

## Security Notes

- Admin role must always have `*.*` permission
- Explicit denies take precedence over all allows
- Hot-reload is disabled in production for security
- All permissions are validated on startup
- Invalid configurations prevent server startup
