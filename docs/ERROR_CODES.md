# API Error Codes Reference

This document provides a comprehensive reference for all error codes used in the CCS Backend System API.

## Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE",
    "details": {
      // Optional: Additional error context
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Codes

### VALIDATION_ERROR (400 Bad Request)

**Description:** Input validation failed. The request body, query parameters, or path parameters contain invalid data.

**Common Causes:**
- Missing required fields
- Invalid data types
- Values outside allowed ranges
- Invalid format (e.g., email, date, UUID)
- Failed business rule validation

**Example Response:**

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Invalid email format",
      "year_level": "Must be between 1 and 5",
      "first_name": "Required field"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**How to Fix:**
1. Check the `details` field for specific validation errors
2. Ensure all required fields are provided
3. Verify data types match the API specification
4. Validate data format (email, dates, UUIDs)
5. Check value ranges and constraints

**Example Scenarios:**
- Creating a student without required `first_name`
- Providing an invalid email format
- Setting `year_level` to 10 (outside 1-5 range)
- Sending a string where a number is expected

---

### UNAUTHORIZED (401 Unauthorized)

**Description:** Authentication failed or the provided JWT token is invalid/expired.

**Common Causes:**
- No Authorization header provided
- Invalid JWT token format
- Expired JWT token
- Token signature verification failed
- Invalid credentials (login endpoint)

**Example Response:**

```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired token",
    "code": "UNAUTHORIZED",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**How to Fix:**
1. Ensure the Authorization header is included: `Authorization: Bearer <token>`
2. Verify the token is valid and not expired
3. Re-authenticate using `/api/v1/auth/login` to get a new token
4. Check that the token format is correct (Bearer scheme)

**Example Scenarios:**
- Accessing an endpoint without logging in
- Using an expired token
- Malformed Authorization header
- Token from a different environment

---

### FORBIDDEN (403 Forbidden)

**Description:** The authenticated user does not have sufficient permissions to access the resource.

**Common Causes:**
- User role lacks required permissions
- Attempting to access admin-only endpoints without admin role
- Attempting to modify resources owned by other users

**Example Response:**

```json
{
  "success": false,
  "error": {
    "message": "Insufficient permissions",
    "code": "FORBIDDEN",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**How to Fix:**
1. Verify your user account has the required role (admin, faculty, student)
2. Contact an administrator to request appropriate permissions
3. Ensure you're accessing resources you're authorized to view/modify

**Example Scenarios:**
- Student user trying to access admin endpoints
- Faculty trying to modify another faculty's data
- Accessing resources outside your permission scope

---

### NOT_FOUND (404 Not Found)

**Description:** The requested resource does not exist or has been deleted.

**Common Causes:**
- Invalid resource ID (UUID)
- Resource was deleted (soft delete)
- Typo in the endpoint URL
- Resource never existed

**Example Response:**

```json
{
  "success": false,
  "error": {
    "message": "Student not found",
    "code": "NOT_FOUND",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**How to Fix:**
1. Verify the resource ID is correct
2. Check if the resource was deleted
3. Ensure the endpoint URL is correct
4. Use search/list endpoints to find the correct resource ID

**Example Scenarios:**
- Requesting a student with non-existent UUID
- Accessing a soft-deleted record
- Typo in the endpoint path
- Using an ID from a different environment

---

### CONFLICT (409 Conflict)

**Description:** The request conflicts with the current state of the server or existing resources.

**Common Causes:**
- Duplicate unique values (email, student_id, faculty_id)
- Schedule conflicts (same room, time, day)
- Duplicate enrollment (student already enrolled in course)
- Constraint violations

**Example Response:**

```json
{
  "success": false,
  "error": {
    "message": "Schedule conflict detected for room 301 on monday between 08:00:00 and 10:00:00. Conflicts with: CS101 (08:00:00-09:30:00)",
    "code": "CONFLICT",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**How to Fix:**
1. Check for existing records with the same unique values
2. Use conflict check endpoints before creating resources
3. Modify the request to avoid conflicts
4. Update or delete conflicting resources if appropriate

**Example Scenarios:**
- Creating a student with an email that already exists
- Scheduling a class in a room that's already booked
- Enrolling a student in a course they're already enrolled in
- Creating a subject with a duplicate subject code

---

### INTERNAL_ERROR (500 Internal Server Error)

**Description:** An unexpected error occurred on the server.

**Common Causes:**
- Database connection failures
- Unhandled exceptions
- Server configuration issues
- External service failures

**Example Response:**

```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**How to Fix:**
1. Retry the request after a short delay
2. Check server logs for detailed error information
3. Contact support if the error persists
4. Verify server health using `/health` endpoint

**Example Scenarios:**
- Database connection timeout
- Unhandled exception in business logic
- File system errors
- Memory exhaustion

---

## HTTP Status Code Summary

| Error Code | HTTP Status | Retry Safe? | User Action Required? |
|------------|-------------|-------------|----------------------|
| VALIDATION_ERROR | 400 | No | Yes - Fix input data |
| UNAUTHORIZED | 401 | No | Yes - Re-authenticate |
| FORBIDDEN | 403 | No | Yes - Request permissions |
| NOT_FOUND | 404 | No | Yes - Verify resource ID |
| CONFLICT | 409 | No | Yes - Resolve conflict |
| INTERNAL_ERROR | 500 | Yes | No - Contact support |

## Error Handling Best Practices

### 1. Always Check the Success Field

```javascript
const response = await fetch('/api/v1/admin/students');
const result = await response.json();

if (!result.success) {
  handleError(result.error);
  return;
}

// Process successful response
processData(result.data);
```

### 2. Handle Specific Error Codes

```javascript
function handleError(error) {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      // Show validation errors to user
      showValidationErrors(error.details);
      break;
    
    case 'UNAUTHORIZED':
      // Redirect to login
      redirectToLogin();
      break;
    
    case 'NOT_FOUND':
      // Show not found message
      showNotFoundMessage();
      break;
    
    case 'CONFLICT':
      // Show conflict resolution options
      showConflictDialog(error.message);
      break;
    
    case 'INTERNAL_ERROR':
      // Show generic error and log
      showGenericError();
      logError(error);
      break;
    
    default:
      showGenericError();
  }
}
```

### 3. Display User-Friendly Messages

```javascript
const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  CONFLICT: 'This action conflicts with existing data.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
};

function getUserFriendlyMessage(errorCode) {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.INTERNAL_ERROR;
}
```

### 4. Log Errors for Debugging

```javascript
function logError(error) {
  console.error('API Error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: error.timestamp,
  });
  
  // Send to error tracking service
  if (window.errorTracker) {
    window.errorTracker.captureError(error);
  }
}
```

### 5. Implement Retry Logic for Transient Errors

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (result.success) {
        return result;
      }
      
      // Don't retry client errors (4xx)
      if (result.error.code !== 'INTERNAL_ERROR') {
        throw new Error(result.error.message);
      }
      
      // Retry with exponential backoff
      if (i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }
      
      throw new Error(result.error.message);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

## Common Error Scenarios and Solutions

### Scenario 1: Creating a Student with Duplicate Email

**Request:**
```bash
POST /api/v1/admin/students
{
  "email": "existing@student.ccs.edu",
  ...
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Email already exists",
    "code": "CONFLICT"
  }
}
```

**Solution:** Use a different email or update the existing student record.

---

### Scenario 2: Accessing Endpoint with Expired Token

**Request:**
```bash
GET /api/v1/admin/students
Authorization: Bearer <expired-token>
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Token expired",
    "code": "UNAUTHORIZED"
  }
}
```

**Solution:** Re-authenticate using `/api/v1/auth/login` to get a new token.

---

### Scenario 3: Creating Schedule with Conflict

**Request:**
```bash
POST /api/v1/admin/schedules
{
  "room": "Room 301",
  "day": "monday",
  "start_time": "08:00:00",
  "end_time": "10:00:00",
  ...
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Schedule conflict detected for room 301 on monday between 08:00:00 and 10:00:00",
    "code": "CONFLICT"
  }
}
```

**Solution:** Use `/api/v1/admin/schedules/check-conflict` first, then choose a different time or room.

---

## Support

If you encounter errors not covered in this document or need assistance:

- **Email:** support@ccs.edu
- **Documentation:** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/health
