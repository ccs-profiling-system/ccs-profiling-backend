# API Response Utilities - Requirements Mapping

This document maps the implementation of API response utilities to the specific requirements from Requirement 24.

## Requirement 24: API Response Format

**User Story:** As a frontend developer, I want consistent API responses, so that I can reliably parse data.

### Standard Success Response Shape
```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

### Standard Error Response Shape
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "timestamp": ""
  }
}
```

## Requirements Implementation

### ✅ Requirement 24.1
**Requirement:** WHEN a request succeeds, THE System SHALL return a JSON response with success field set to true

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Function: `formatSuccessResponse()`
- Lines: 67-78

```typescript
export function formatSuccessResponse<T>(
  data: T,
  meta?: PaginationMeta
): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    success: true,  // ✓ Always set to true
    data,
  };
  // ...
}
```

**Test Coverage:**
- Test: "should format a simple success response with data"
- Test: "should format success response with array data"
- File: `src/shared/utils/apiResponse.test.ts`

---

### ✅ Requirement 24.2
**Requirement:** WHEN a request succeeds, THE System SHALL include a data field containing the response payload

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Function: `formatSuccessResponse()`
- Lines: 67-78

```typescript
export function formatSuccessResponse<T>(
  data: T,
  meta?: PaginationMeta
): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    success: true,
    data,  // ✓ Always includes data field
  };
  // ...
}
```

**Test Coverage:**
- Test: "should include data field in success response"
- Test: "should format success response with null data"
- Test: "should format success response with empty object"
- File: `src/shared/utils/apiResponse.test.ts`

---

### ✅ Requirement 24.3
**Requirement:** WHEN a request fails, THE System SHALL return a JSON response with success field set to false

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Function: `formatErrorResponse()`
- Lines: 103-118

```typescript
export function formatErrorResponse(
  message: string,
  code: ErrorCode,
  details?: any
): ErrorResponse {
  return {
    success: false,  // ✓ Always set to false for errors
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    },
  };
}
```

**Test Coverage:**
- Test: "should format error response with success false"
- File: `src/shared/utils/apiResponse.test.ts`

---

### ✅ Requirement 24.4
**Requirement:** WHEN a request fails, THE System SHALL include an error object with message, code, and timestamp fields

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Function: `formatErrorResponse()`
- Lines: 103-118

```typescript
export function formatErrorResponse(
  message: string,
  code: ErrorCode,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: {
      message,    // ✓ Error message
      code,       // ✓ Error code
      timestamp: new Date().toISOString(),  // ✓ Timestamp
      ...(details && { details }),
    },
  };
}
```

**Test Coverage:**
- Test: "should include error object with message, code, and timestamp"
- File: `src/shared/utils/apiResponse.test.ts`

---

### ✅ Requirement 24.5
**Requirement:** THE System SHALL use error code VALIDATION_ERROR for input validation failures

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Type: `ErrorCode`
- Lines: 38-45

```typescript
export type ErrorCode =
  | 'VALIDATION_ERROR'    // ✓ For input validation failures
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'CONFLICT';
```

**Usage Example:**
```typescript
formatErrorResponse('Validation failed', 'VALIDATION_ERROR', {
  field: 'email',
  message: 'Invalid email format'
});
```

**Test Coverage:**
- Test: "should format validation error response"
- File: `src/shared/utils/apiResponse.test.ts`

---

### ✅ Requirement 24.6
**Requirement:** THE System SHALL use error code NOT_FOUND for resource not found errors

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Type: `ErrorCode`
- Lines: 38-45

```typescript
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'           // ✓ For resource not found errors
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'CONFLICT';
```

**Usage Example:**
```typescript
formatErrorResponse('Student not found', 'NOT_FOUND');
```

**Test Coverage:**
- Test: "should format not found error response"
- File: `src/shared/utils/apiResponse.test.ts`

---

### ✅ Requirement 24.7
**Requirement:** THE System SHALL use error code UNAUTHORIZED for authentication failures

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Type: `ErrorCode`
- Lines: 38-45

```typescript
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'        // ✓ For authentication failures
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'CONFLICT';
```

**Usage Example:**
```typescript
formatErrorResponse('Invalid credentials', 'UNAUTHORIZED');
```

**Test Coverage:**
- Test: "should format unauthorized error response"
- File: `src/shared/utils/apiResponse.test.ts`

---

### ✅ Requirement 24.8
**Requirement:** THE System SHALL use error code FORBIDDEN for authorization failures

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Type: `ErrorCode`
- Lines: 38-45

```typescript
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'           // ✓ For authorization failures
  | 'INTERNAL_ERROR'
  | 'CONFLICT';
```

**Usage Example:**
```typescript
formatErrorResponse('Insufficient permissions', 'FORBIDDEN');
```

**Test Coverage:**
- Test: "should format forbidden error response"
- File: `src/shared/utils/apiResponse.test.ts`

---

### ✅ Requirement 24.9
**Requirement:** THE System SHALL use error code INTERNAL_ERROR for server errors

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Type: `ErrorCode`
- Lines: 38-45

```typescript
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'      // ✓ For server errors
  | 'CONFLICT';
```

**Usage Example:**
```typescript
formatErrorResponse('Internal server error', 'INTERNAL_ERROR');
```

**Test Coverage:**
- Test: "should format internal error response"
- File: `src/shared/utils/apiResponse.test.ts`

---

### ✅ Requirement 24.10
**Requirement:** THE System SHALL use error code CONFLICT for resource conflict errors

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Type: `ErrorCode`
- Lines: 38-45

```typescript
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'CONFLICT';           // ✓ For resource conflict errors
```

**Usage Example:**
```typescript
formatErrorResponse('Resource already exists', 'CONFLICT');
```

**Test Coverage:**
- Test: "should format conflict error response"
- File: `src/shared/utils/apiResponse.test.ts`

---

### ✅ Requirement 24.11
**Requirement:** WHEN a list endpoint returns paginated results, THE System SHALL include a meta object with page, limit, and total fields

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Function: `formatPaginatedResponse()`
- Lines: 135-154

```typescript
export function formatPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): SuccessResponse<T[]> {
  const totalPages = Math.ceil(total / limit);

  return formatSuccessResponse(data, {
    page,       // ✓ Current page number
    limit,      // ✓ Items per page
    total,      // ✓ Total number of items
    totalPages, // ✓ Total number of pages
  });
}
```

**Test Coverage:**
- Test: "should format paginated response with data and meta"
- Test: "should include correct pagination metadata"
- Test: "should calculate totalPages correctly"
- File: `src/shared/utils/apiResponse.test.ts`

---

### ✅ Requirement 24.12
**Requirement:** THE System SHALL format timestamps in ISO 8601 format in error responses

**Implementation:**
- File: `src/shared/utils/apiResponse.ts`
- Function: `formatErrorResponse()`
- Lines: 103-118

```typescript
export function formatErrorResponse(
  message: string,
  code: ErrorCode,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),  // ✓ ISO 8601 format
      ...(details && { details }),
    },
  };
}
```

**ISO 8601 Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`
**Example:** `2024-01-01T00:00:00.000Z`

**Test Coverage:**
- Test: "should format timestamp in ISO 8601 format"
- File: `src/shared/utils/apiResponse.test.ts`

---

## Test Coverage Summary

### Total Tests: 39
- ✅ formatSuccessResponse: 8 tests
- ✅ formatErrorResponse: 12 tests
- ✅ formatPaginatedResponse: 7 tests
- ✅ createPaginationMeta: 3 tests
- ✅ Type Safety: 3 tests
- ✅ Integration Scenarios: 6 tests

### Coverage by Requirement:
- ✅ 24.1: 3 tests
- ✅ 24.2: 4 tests
- ✅ 24.3: 1 test
- ✅ 24.4: 1 test
- ✅ 24.5: 1 test
- ✅ 24.6: 1 test
- ✅ 24.7: 1 test
- ✅ 24.8: 1 test
- ✅ 24.9: 1 test
- ✅ 24.10: 1 test
- ✅ 24.11: 4 tests
- ✅ 24.12: 1 test

## Files Created

1. **Implementation:**
   - `src/shared/utils/apiResponse.ts` - Core utilities

2. **Tests:**
   - `src/shared/utils/apiResponse.test.ts` - Comprehensive unit tests

3. **Documentation:**
   - `src/shared/utils/API_RESPONSE_UTILS.md` - Usage guide
   - `src/shared/utils/REQUIREMENTS_MAPPING.md` - This file

4. **Exports:**
   - `src/shared/utils/index.ts` - Updated to export utilities

## Integration Points

The API response utilities integrate with:

1. **Error Classes** (`src/shared/errors/index.ts`)
   - AppError, NotFoundError, ValidationError, etc.
   - Error codes match between utilities and error classes

2. **Error Handler Middleware** (`src/shared/middleware/errorHandler.ts`)
   - Uses formatErrorResponse() to format error responses
   - Ensures consistent error format across all endpoints

3. **Controllers** (all module controllers)
   - Use formatSuccessResponse() for successful operations
   - Use formatPaginatedResponse() for list endpoints
   - Use formatErrorResponse() for error cases

## Verification

All requirements have been implemented and tested:

```bash
npm test -- apiResponse.test.ts
```

**Result:** ✅ All 39 tests passing

## Next Steps

These utilities are now ready to be used in:
1. Controller implementations (Task 3.4+)
2. Error handler middleware updates
3. All API endpoint implementations

The utilities provide a solid foundation for consistent API responses throughout the CCS Backend System.
