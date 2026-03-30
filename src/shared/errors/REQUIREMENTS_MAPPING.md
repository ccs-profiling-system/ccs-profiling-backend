# Requirements Mapping - Error Handling System

This document maps the error handling implementation to the requirements specified in the design document.

## Task 3.1: Create Error Handling System

**Requirements Covered:** 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 24.3, 24.4

---

## Requirement 22: Error Handling

### 22.1: Structured Error Response
**Requirement:** WHEN an error occurs, THE System SHALL return a structured error response with status code and message

**Implementation:**
- ✅ `errorHandler` middleware in `src/shared/middleware/errorHandler.ts`
- ✅ Returns structured JSON response with `success`, `error.message`, `error.code`, and `error.timestamp`
- ✅ Automatically sets appropriate HTTP status codes

**Example:**
```json
{
  "success": false,
  "error": {
    "message": "Student not found",
    "code": "NOT_FOUND",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 22.2: 404 Not Found
**Requirement:** WHEN a resource is not found, THE System SHALL return a 404 status code

**Implementation:**
- ✅ `NotFoundError` class in `src/shared/errors/index.ts`
- ✅ Automatically returns 404 status code
- ✅ Uses error code `NOT_FOUND`

**Usage:**
```typescript
throw new NotFoundError('Student not found');
```

### 22.3: 400 Validation Error
**Requirement:** WHEN validation fails, THE System SHALL return a 400 status code

**Implementation:**
- ✅ `ValidationError` class in `src/shared/errors/index.ts`
- ✅ Automatically returns 400 status code
- ✅ Uses error code `VALIDATION_ERROR`
- ✅ Supports optional `details` field for field-specific validation errors

**Usage:**
```typescript
throw new ValidationError('Validation failed', {
  email: 'Invalid email format',
  age: 'Must be positive'
});
```

### 22.4: 401 Authentication Error
**Requirement:** WHEN authentication fails, THE System SHALL return a 401 status code

**Implementation:**
- ✅ `UnauthorizedError` class in `src/shared/errors/index.ts`
- ✅ Automatically returns 401 status code
- ✅ Uses error code `UNAUTHORIZED`

**Usage:**
```typescript
throw new UnauthorizedError('Invalid token');
```

### 22.5: 403 Authorization Error
**Requirement:** WHEN authorization fails, THE System SHALL return a 403 status code

**Implementation:**
- ✅ `ForbiddenError` class in `src/shared/errors/index.ts`
- ✅ Automatically returns 403 status code
- ✅ Uses error code `FORBIDDEN`

**Usage:**
```typescript
throw new ForbiddenError('Insufficient permissions');
```

### 22.6: 500 Server Error
**Requirement:** WHEN a server error occurs, THE System SHALL return a 500 status code and log the error

**Implementation:**
- ✅ `errorHandler` middleware handles unexpected errors
- ✅ Returns 500 status code for non-AppError exceptions
- ✅ Uses error code `INTERNAL_ERROR`
- ✅ Logs error details with `console.error` including stack trace, URL, and method
- ✅ Prevents sensitive information leakage by returning generic message

**Behavior:**
```typescript
// Any unexpected error
throw new Error('Database connection failed');

// Results in:
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
// Status: 500
// Logged: Full error details with stack trace
```

---

## Requirement 24: API Response Format

### 24.3: Error Response with success: false
**Requirement:** WHEN a request fails, THE System SHALL return a JSON response with success field set to false

**Implementation:**
- ✅ `errorHandler` middleware always sets `success: false` for errors
- ✅ Consistent across all error types

**Example:**
```json
{
  "success": false,
  "error": { ... }
}
```

### 24.4: Error Object Structure
**Requirement:** WHEN a request fails, THE System SHALL include an error object with message, code, and timestamp fields

**Implementation:**
- ✅ All error responses include:
  - `error.message`: Human-readable error message
  - `error.code`: Machine-readable error code
  - `error.timestamp`: ISO 8601 formatted timestamp
  - `error.details` (optional): Additional error details

**Example:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Invalid email format"
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Additional Error Codes Implemented

### CONFLICT (409)
**Implementation:**
- ✅ `ConflictError` class in `src/shared/errors/index.ts`
- ✅ Used for resource conflicts (duplicate records, scheduling conflicts)
- ✅ Returns 409 status code

**Usage:**
```typescript
throw new ConflictError('Student ID already exists');
throw new ConflictError('Schedule conflict detected');
```

---

## Error Code Reference

| Error Code | Status | Class | Use Case |
|------------|--------|-------|----------|
| `NOT_FOUND` | 404 | `NotFoundError` | Resource not found |
| `VALIDATION_ERROR` | 400 | `ValidationError` | Input validation failed |
| `UNAUTHORIZED` | 401 | `UnauthorizedError` | Authentication failed |
| `FORBIDDEN` | 403 | `ForbiddenError` | Insufficient permissions |
| `CONFLICT` | 409 | `ConflictError` | Resource conflict |
| `INTERNAL_ERROR` | 500 | (Generic Error) | Server error |

---

## Implementation Files

1. **Error Classes**: `src/shared/errors/index.ts`
   - `AppError` (base class)
   - `NotFoundError`
   - `ValidationError`
   - `UnauthorizedError`
   - `ForbiddenError`
   - `ConflictError`

2. **Error Handler Middleware**: `src/shared/middleware/errorHandler.ts`
   - Global error handler
   - Formats all errors consistently
   - Logs unexpected errors
   - Prevents sensitive data leakage

3. **Integration**: `src/app.ts`
   - Error handler registered as last middleware
   - Catches all errors from routes and middleware

---

## Test Coverage

### Unit Tests
- ✅ `src/shared/errors/index.test.ts` (14 tests)
  - Tests all error classes
  - Verifies inheritance chain
  - Validates error properties

- ✅ `src/shared/middleware/errorHandler.test.ts` (16 tests)
  - Tests error handler for all error types
  - Validates response format
  - Tests edge cases
  - Verifies logging behavior

### Integration Tests
- ✅ `src/shared/middleware/errorHandler.integration.test.ts` (8 tests)
  - End-to-end error handling in Express app
  - Validates HTTP responses
  - Tests all error types in real scenarios

**Total: 38 tests, all passing**

---

## Design Compliance

The implementation follows the design document specifications:

1. ✅ **AppError Base Class**: Provides consistent error structure with message, code, statusCode, and optional details
2. ✅ **Specific Error Classes**: Pre-defined classes for common scenarios
3. ✅ **Global Error Handler**: Middleware that formats errors according to API response format
4. ✅ **Error Logging**: Unexpected errors are logged with full context
5. ✅ **Security**: Sensitive information is never exposed in error responses
6. ✅ **Consistency**: All errors follow the same response format
7. ✅ **Extensibility**: Easy to add new error types by extending AppError

---

## Usage Guidelines

1. **Always use specific error classes** instead of generic Error
2. **Provide meaningful error messages** that help users understand what went wrong
3. **Include validation details** when throwing ValidationError
4. **Never expose sensitive information** in error messages
5. **Use next(error)** in async route handlers to pass errors to the global handler
6. **Log errors appropriately** for debugging and monitoring

---

## Conclusion

The error handling system fully satisfies all specified requirements (22.1-22.6, 24.3-24.4) and provides a robust, consistent, and secure error handling mechanism for the CCS Backend API.
