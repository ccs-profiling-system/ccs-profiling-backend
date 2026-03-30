# API Response Utilities

## Overview

The API response utilities provide consistent response formatting for all API endpoints in the CCS Backend System. These utilities ensure that all responses follow the standardized format defined in Requirement 24.

## Requirements Mapping

This module implements the following requirements:

- **24.1**: Success responses have `success: true` field
- **24.2**: Success responses include `data` field with response payload
- **24.3**: Error responses have `success: false` field
- **24.4**: Error responses include `error` object with `message`, `code`, and `timestamp`
- **24.5**: `VALIDATION_ERROR` code for input validation failures
- **24.6**: `NOT_FOUND` code for resource not found errors
- **24.7**: `UNAUTHORIZED` code for authentication failures
- **24.8**: `FORBIDDEN` code for authorization failures
- **24.9**: `INTERNAL_ERROR` code for server errors
- **24.10**: `CONFLICT` code for resource conflict errors
- **24.11**: Paginated responses include `meta` object with `page`, `limit`, `total`, and `totalPages`
- **24.12**: Timestamps formatted in ISO 8601 format

## Response Formats

### Success Response

```typescript
{
  "success": true,
  "data": {}, // Response payload
  "meta": {   // Optional, for paginated responses
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Error Response

```typescript
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "details": {} // Optional additional error information
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Authentication failed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `INTERNAL_ERROR` | 500 | Server error |
| `CONFLICT` | 409 | Resource conflict |

## API Reference

### `formatSuccessResponse<T>(data: T, meta?: PaginationMeta): SuccessResponse<T>`

Formats a successful API response.

**Parameters:**
- `data`: The response payload (any type)
- `meta`: Optional pagination metadata

**Returns:** Formatted success response

**Example:**
```typescript
import { formatSuccessResponse } from '@/shared/utils';

// Simple success response
const response = formatSuccessResponse({ id: '123', name: 'John Doe' });
// Returns: { success: true, data: { id: '123', name: 'John Doe' } }

// Success response with pagination
const paginatedResponse = formatSuccessResponse(
  [{ id: '1' }, { id: '2' }],
  { page: 1, limit: 10, total: 50, totalPages: 5 }
);
```

### `formatErrorResponse(message: string, code: ErrorCode, details?: any): ErrorResponse`

Formats an error API response.

**Parameters:**
- `message`: Error message
- `code`: Error code (one of the defined error codes)
- `details`: Optional additional error details

**Returns:** Formatted error response

**Example:**
```typescript
import { formatErrorResponse } from '@/shared/utils';

// Simple error response
const response = formatErrorResponse('Student not found', 'NOT_FOUND');

// Error response with details
const validationError = formatErrorResponse(
  'Validation failed',
  'VALIDATION_ERROR',
  {
    errors: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'password', message: 'Password too short' }
    ]
  }
);
```

### `formatPaginatedResponse<T>(data: T[], page: number, limit: number, total: number): SuccessResponse<T[]>`

Formats a paginated list response with automatic metadata calculation.

**Parameters:**
- `data`: Array of items
- `page`: Current page number
- `limit`: Items per page
- `total`: Total number of items

**Returns:** Formatted success response with pagination metadata

**Example:**
```typescript
import { formatPaginatedResponse } from '@/shared/utils';

const students = [
  { id: '1', name: 'John' },
  { id: '2', name: 'Jane' }
];

const response = formatPaginatedResponse(students, 1, 10, 50);
// Returns: {
//   success: true,
//   data: [...],
//   meta: { page: 1, limit: 10, total: 50, totalPages: 5 }
// }
```

### `createPaginationMeta(page: number, limit: number, total: number): PaginationMeta`

Creates a pagination metadata object.

**Parameters:**
- `page`: Current page number
- `limit`: Items per page
- `total`: Total number of items

**Returns:** Pagination metadata object

**Example:**
```typescript
import { createPaginationMeta } from '@/shared/utils';

const meta = createPaginationMeta(2, 10, 50);
// Returns: { page: 2, limit: 10, total: 50, totalPages: 5 }
```

## Usage in Controllers

### Example: Student Controller

```typescript
import { Request, Response } from 'express';
import { formatSuccessResponse, formatErrorResponse, formatPaginatedResponse } from '@/shared/utils';
import { StudentService } from '../services/student.service';

export class StudentController {
  constructor(private studentService: StudentService) {}

  // GET /api/v1/admin/students/:id
  async getStudent(req: Request, res: Response) {
    try {
      const student = await this.studentService.getStudent(req.params.id);
      
      // Format success response
      return res.json(formatSuccessResponse(student));
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json(
          formatErrorResponse(error.message, 'NOT_FOUND')
        );
      }
      
      return res.status(500).json(
        formatErrorResponse('Internal server error', 'INTERNAL_ERROR')
      );
    }
  }

  // GET /api/v1/admin/students?page=1&limit=10
  async listStudents(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { students, total } = await this.studentService.listStudents(page, limit);
      
      // Format paginated response
      return res.json(formatPaginatedResponse(students, page, limit, total));
    } catch (error) {
      return res.status(500).json(
        formatErrorResponse('Internal server error', 'INTERNAL_ERROR')
      );
    }
  }

  // POST /api/v1/admin/students
  async createStudent(req: Request, res: Response) {
    try {
      const student = await this.studentService.createStudent(req.body);
      
      // Format success response with 201 status
      return res.status(201).json(formatSuccessResponse(student));
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json(
          formatErrorResponse(error.message, 'VALIDATION_ERROR', error.details)
        );
      }
      
      if (error instanceof ConflictError) {
        return res.status(409).json(
          formatErrorResponse(error.message, 'CONFLICT')
        );
      }
      
      return res.status(500).json(
        formatErrorResponse('Internal server error', 'INTERNAL_ERROR')
      );
    }
  }
}
```

## Usage with Error Handler Middleware

The API response utilities work seamlessly with the global error handler middleware:

```typescript
import { Request, Response, NextFunction } from 'express';
import { formatErrorResponse } from '@/shared/utils';
import { AppError } from '@/shared/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      formatErrorResponse(err.message, err.code as ErrorCode, err.details)
    );
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  return res.status(500).json(
    formatErrorResponse('Internal server error', 'INTERNAL_ERROR')
  );
};
```

## Type Safety

The utilities are fully typed with TypeScript generics to ensure type safety:

```typescript
interface Student {
  id: string;
  name: string;
}

// TypeScript knows response.data is of type Student
const response: SuccessResponse<Student> = formatSuccessResponse({
  id: '123',
  name: 'John Doe'
});

// TypeScript enforces valid error codes
formatErrorResponse('Error', 'NOT_FOUND'); // ✓ Valid
formatErrorResponse('Error', 'INVALID_CODE'); // ✗ Compile error
```

## Best Practices

1. **Always use these utilities for API responses** - Never manually construct response objects
2. **Use appropriate error codes** - Match the error code to the HTTP status code
3. **Include helpful error details** - Provide additional context in the `details` field for validation errors
4. **Use formatPaginatedResponse for lists** - Automatically calculates pagination metadata
5. **Maintain consistency** - All endpoints should use the same response format

## Testing

The utilities include comprehensive unit tests covering:
- Success response formatting
- Error response formatting with all error codes
- Pagination metadata calculation
- Type safety
- Edge cases (empty arrays, null data, etc.)
- Integration scenarios

Run tests with:
```bash
npm test -- apiResponse.test.ts
```

## Related Files

- `src/shared/utils/apiResponse.ts` - Implementation
- `src/shared/utils/apiResponse.test.ts` - Unit tests
- `src/shared/errors/index.ts` - Error classes
- `src/shared/middleware/errorHandler.ts` - Global error handler
