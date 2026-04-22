# Secretary Portal Routes

This directory contains all route definitions for the Secretary Portal API.

## Authentication

All secretary portal routes are protected by JWT authentication. The authentication flow is as follows:

### Authentication Flow

1. **Client Request**: Client sends request with JWT token in Authorization header
   ```
   Authorization: Bearer <jwt-token>
   ```

2. **JWT Validation**: The `authMiddleware` validates the JWT token:
   - Checks if Authorization header is present
   - Extracts token from "Bearer <token>" format
   - Verifies token signature using JWT secret
   - Checks token expiration
   - Returns HTTP 401 Unauthorized if validation fails

3. **User Context Extraction**: On successful validation:
   - Extracts user information from token payload
   - Attaches user context to `req.user`:
     ```typescript
     req.user = {
       userId: string;
       email: string;
       role: string;
     }
     ```

4. **Request Processing**: Request proceeds to next middleware/handler

### Authentication Errors

The authentication middleware returns HTTP 401 Unauthorized in the following cases:

- **No token provided**: Authorization header is missing or doesn't start with "Bearer "
  ```json
  {
    "success": false,
    "error": {
      "message": "No token provided",
      "code": "UNAUTHORIZED"
    }
  }
  ```

- **Invalid token**: Token signature is invalid or token is malformed
  ```json
  {
    "success": false,
    "error": {
      "message": "Invalid token",
      "code": "UNAUTHORIZED"
    }
  }
  ```

- **Expired token**: Token has expired
  ```json
  {
    "success": false,
    "error": {
      "message": "Token expired",
      "code": "UNAUTHORIZED"
    }
  }
  ```

### Development Bypass

In development mode (`NODE_ENV=development`), you can use a special bypass token:

```
Authorization: Bearer dev-bypass-token
```

This bypasses JWT validation and uses a default dev user. **This only works in development mode and is disabled in production.**

## Route Structure

All secretary portal routes are prefixed with `/api/secretary`:

```
/api/secretary/dashboard          - Dashboard statistics
/api/secretary/students           - Student management
/api/secretary/faculty            - Faculty management
/api/secretary/schedules          - Schedule management
/api/secretary/documents          - Document management
/api/secretary/events             - Event management
/api/secretary/research           - Research management
/api/secretary/pending-changes    - Pending changes management
/api/secretary/reports            - Report generation
/api/secretary/filters            - Filter options
```

## Adding New Routes

When adding new routes to the secretary portal:

1. Create a new route file in this directory (e.g., `dashboard.routes.ts`)
2. Import the route in `index.ts`
3. Register the route with the `secretaryPortalRouter`

Example:

```typescript
// dashboard.routes.ts
import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createDashboardRoutes(controller: DashboardController): Router {
  const router = Router();

  // Authentication is already applied by parent router
  // Just add permission checks
  router.get(
    '/',
    requirePermission('secretary.dashboard.read'),
    controller.getDashboard
  );

  return router;
}

// index.ts
import { createDashboardRoutes } from './dashboard.routes';

const dashboardRoutes = createDashboardRoutes(dashboardController);
secretaryPortalRouter.use('/dashboard', dashboardRoutes);
```

## Testing

Authentication tests are located in `auth.test.ts`. These tests verify:

- Valid JWT tokens are accepted
- Invalid JWT tokens are rejected with HTTP 401
- Expired JWT tokens are rejected with HTTP 401
- Missing JWT tokens are rejected with HTTP 401
- User context is properly extracted from valid tokens

Run tests:

```bash
npm test -- src/modules/secretary-portal/routes/auth.test.ts
```

## Requirements

This authentication integration satisfies the following requirements:

- **Requirement 1.1**: THE Authentication_Service SHALL validate JWT tokens for all API requests
- **Requirement 1.4**: IF authentication fails, THEN THE Secretary_Portal_API SHALL return HTTP 401 Unauthorized
- **Requirement 18.2**: THE Secretary_Portal_API SHALL validate JWT signature and expiration
- **Requirement 19.2**: THE Secretary_Portal_API SHALL use the existing Authentication_Service
