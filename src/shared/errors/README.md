# Error Handling System

This directory contains the error handling system for the CCS Backend API.

## Overview

The error handling system provides:
- **AppError base class**: Foundation for all application errors
- **Specific error classes**: Pre-defined error types for common scenarios
- **Global error handler**: Middleware that formats all errors consistently

## Error Classes

### AppError (Base Class)

The base class for all application errors.

```typescript
import { AppError } from '@/shared/errors';

throw new AppError('Custom error message', 'CUSTOM_ERROR_CODE', 500, { details: 'optional' });
```

**Parameters:**
- `message` (string): Human-readable error message
- `code` (string): Machine-readable error code
- `statusCode` (number): HTTP status code
- `details` (any, optional): Additional error details

### NotFoundError (404)

Used when a requested resource does not exist.

```typescript
import { NotFoundError } from '@/shared/errors';

// With default message
throw new NotFoundError();

// With custom message
throw new NotFoundError('Student not found');
```

### ValidationError (400)

Used when input validation fails.

```typescript
import { ValidationError } from '@/shared/errors';

// Without details
throw new ValidationError('Validation failed');

// With field-specific details
throw new ValidationError('Validation failed', {
  email: 'Invalid email format',
  age: 'Must be a positive number'
});
```

### UnauthorizedError (401)

Used when authentication fails or token is invalid.

```typescript
import { UnauthorizedError } from '@/shared/errors';

// With default message
throw new UnauthorizedError();

// With custom message
throw new UnauthorizedError('Invalid token');
```

### ForbiddenError (403)

Used when user lacks required permissions.

```typescript
import { ForbiddenError } from '@/shared/errors';

// With default message
throw new ForbiddenError();

// With custom message
throw new ForbiddenError('Insufficient permissions');
```

### ConflictError (409)

Used when operation conflicts with existing state (e.g., duplicate records, scheduling conflicts).

```typescript
import { ConflictError } from '@/shared/errors';

throw new ConflictError('Student ID already exists');
throw new ConflictError('Schedule conflict detected for room A101');
```

## Usage in Controllers

```typescript
import { NotFoundError, ValidationError } from '@/shared/errors';

export class StudentController {
  async getStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const student = await this.studentService.getStudent(id);
      
      if (!student) {
        throw new NotFoundError('Student not found');
      }
      
      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      next(error); // Pass error to global error handler
    }
  }
}
```

## Usage in Services

```typescript
import { ConflictError, NotFoundError } from '@/shared/errors';

export class StudentService {
  async createStudent(data: CreateStudentDTO) {
    // Check for duplicate student_id
    const existing = await this.studentRepository.findByStudentId(data.student_id);
    
    if (existing) {
      throw new ConflictError('Student ID already exists');
    }
    
    return await this.studentRepository.create(data);
  }
  
  async updateStudent(id: string, data: UpdateStudentDTO) {
    const student = await this.studentRepository.findById(id);
    
    if (!student) {
      throw new NotFoundError('Student not found');
    }
    
    return await this.studentRepository.update(id, data);
  }
}
```

## Error Response Format

All errors are automatically formatted by the global error handler:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response (without details)
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

### Error Response (with details)
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Invalid email format",
      "age": "Must be a positive number"
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication failed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_ERROR` | 500 | Server error |

## Global Error Handler

The global error handler is automatically applied in `app.ts`:

```typescript
import { errorHandler } from '@/shared/middleware/errorHandler';

// ... other middleware

// Global error handler (must be last)
app.use(errorHandler);
```

**Features:**
- Catches all errors thrown in the application
- Formats errors according to the standard API response format
- Logs unexpected errors for debugging
- Prevents sensitive information leakage in production

## Best Practices

1. **Always use specific error classes** instead of generic Error
2. **Provide meaningful error messages** that help users understand what went wrong
3. **Include validation details** when throwing ValidationError
4. **Never expose sensitive information** in error messages (passwords, tokens, etc.)
5. **Use next(error)** in async route handlers to pass errors to the global handler
6. **Log errors appropriately** for debugging and monitoring

## Testing

Error classes and the error handler are fully tested. See:
- `src/shared/errors/index.test.ts` - Unit tests for error classes
- `src/shared/middleware/errorHandler.test.ts` - Unit tests for error handler
- `src/shared/middleware/errorHandler.integration.test.ts` - Integration tests

Run tests:
```bash
npm test -- src/shared/errors/ src/shared/middleware/errorHandler
```
