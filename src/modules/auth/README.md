# Authentication Module

This module implements JWT-based authentication for the CCS Backend System.

## Features Implemented

### 6.1 User Repository ✅
- `findByEmail(email)` - Find user by email (excludes soft-deleted)
- `findById(id)` - Find user by ID (excludes soft-deleted)
- `create(data, tx?)` - Create new user (supports transactions)
- `update(id, data)` - Update user information
- `softDelete(id)` - Soft delete user

All queries automatically exclude soft-deleted records (deleted_at IS NULL).

### 6.2 Authentication Service ✅
- `login(email, password)` - Login with password verification
- `generateTokens(payload)` - Generate JWT access and refresh tokens
- `verifyToken(token)` - Verify JWT token
- `hashPassword(password)` - Hash password with bcrypt (10 rounds)
- `changePassword(userId, oldPassword, newPassword)` - Change user password

### 6.3 Authentication Middleware ✅
- `authMiddleware` - JWT verification middleware
- Extracts token from Authorization header (Bearer token)
- Verifies token and attaches user to request object
- Returns 401 for missing/invalid/expired tokens

### 6.4 Role-Based Access Middleware ✅
- `roleMiddleware(roles)` - Verify user has required role
- `adminOnly` - Shorthand for admin-only routes
- Returns 403 for insufficient permissions

### 6.5 Authentication Controller and Routes ✅

#### Endpoints:
- `POST /api/v1/auth/login` - Login with email and password
- `POST /api/v1/auth/logout` - Logout (client-side token removal)
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info (protected)
- `POST /api/v1/auth/change-password` - Change password (protected)

## Usage Examples

### Login
```typescript
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### Get Current User
```typescript
GET /api/v1/auth/me
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin",
    "is_active": true,
    "last_login": "2024-01-01T00:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Change Password
```typescript
POST /api/v1/auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "oldPassword": "oldpass123",
  "newPassword": "newpass456"
}

Response:
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

## Security Features

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with configurable expiration
- Access tokens: 7 days (configurable via JWT_EXPIRES_IN)
- Refresh tokens: 30 days
- Automatic soft delete filtering in all queries
- Inactive user account detection
- Token verification on protected routes

## Testing

Unit tests: `src/modules/auth/services/auth.service.test.ts`
- Login with valid/invalid credentials
- Token generation and verification
- Password hashing
- Password change functionality

Integration tests: `src/modules/auth/controllers/auth.controller.test.ts`
- All endpoint functionality
- Authentication flow
- Error handling

Run tests:
```bash
npm test -- src/modules/auth
```

## Requirements Mapping

- ✅ Requirement 4.1: JWT token generation on valid credentials
- ✅ Requirement 4.2: Authentication error on invalid credentials
- ✅ Requirement 4.3: Password hashing with bcrypt
- ✅ Requirement 4.4: JWT verification on requests
- ✅ Requirement 4.5: Request rejection on invalid token
- ✅ Requirement 4.6: Role storage in user accounts
- ✅ Requirement 4.7: Admin role verification
- ✅ Requirement 4.8: Admin route prefix /api/v1/admin/
- ✅ Requirement 28.4: Soft delete filters in repository
- ✅ Requirement 30.1: API v1 prefix
- ✅ Requirement 30.2: Admin route prefix

## Next Steps

Task 7: Implement security middleware (rate limiting, CORS, Helmet)
