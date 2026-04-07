# CCS Backend System API Documentation

## Overview

The CCS Comprehensive Profiling System Backend provides a RESTful API for managing academic and institutional data. This document provides comprehensive information about all available endpoints, request/response formats, and error handling.

## Accessing the Documentation

### Interactive Documentation (Swagger UI)

The API includes an interactive Swagger UI interface where you can:
- Browse all available endpoints
- View request/response schemas
- Test endpoints directly from the browser
- Download the OpenAPI specification

**Access URL:** `http://localhost:3000/api-docs`

### OpenAPI Specification

The raw OpenAPI 3.0 specification is available in JSON format:

**Access URL:** `http://localhost:3000/api-docs/json`

You can import this specification into tools like:
- Postman
- Insomnia
- API testing frameworks
- Code generators

## Authentication

All admin endpoints require JWT authentication. To authenticate:

1. **Login** using the `/api/v1/auth/login` endpoint
2. **Receive** a JWT token in the response
3. **Include** the token in subsequent requests using the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Example Login Request

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ccs.edu",
    "password": "your-password"
  }'
```

### Example Response

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@ccs.edu",
      "role": "admin"
    }
  }
}
```

## API Response Format

All API responses follow a standardized format for consistency.

### Success Response

```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    // Optional metadata (pagination, etc.)
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      // Optional additional error details
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Codes

The API uses standardized error codes to indicate the type of error:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed. Check the `details` field for specific validation errors. |
| `UNAUTHORIZED` | 401 | Authentication failed or token is invalid/expired. |
| `FORBIDDEN` | 403 | Insufficient permissions to access the resource. |
| `NOT_FOUND` | 404 | The requested resource was not found. |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate entry, scheduling conflict). |
| `INTERNAL_ERROR` | 500 | Internal server error. Contact support if this persists. |

### Error Response Examples

#### Validation Error

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Invalid email format",
      "year_level": "Must be between 1 and 5"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Not Found Error

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

#### Conflict Error

```json
{
  "success": false,
  "error": {
    "message": "Schedule conflict detected for room 301 on monday between 08:00:00 and 10:00:00",
    "code": "CONFLICT",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Pagination

List endpoints support pagination to handle large datasets efficiently.

### Query Parameters

- `page`: Page number (default: 1, minimum: 1)
- `limit`: Items per page (default: 10, minimum: 1, maximum: 100)

### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/admin/students?page=2&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Filtering and Search

Many list endpoints support filtering and search capabilities.

### Common Query Parameters

- `search`: Full-text search across relevant fields
- `status`: Filter by status (e.g., active, inactive, graduated)
- `program`: Filter by program (students)
- `department`: Filter by department (faculty)
- `year_level`: Filter by year level (students)

### Example: Search Students

```bash
curl -X GET "http://localhost:3000/api/v1/admin/students?search=john&program=BSCS&year_level=3" \
  -H "Authorization: Bearer <token>"
```

## API Endpoints Overview

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/change-password` - Change password

### Students
- `GET /api/v1/admin/students` - List students (paginated)
- `GET /api/v1/admin/students/:id` - Get student by ID
- `GET /api/v1/admin/students/:id/profile` - Get complete profile with aggregations
- `POST /api/v1/admin/students` - Create student
- `PUT /api/v1/admin/students/:id` - Update student
- `DELETE /api/v1/admin/students/:id` - Soft delete student
- `GET /api/v1/admin/students/deleted` - Get soft-deleted students
- `PATCH /api/v1/admin/students/:id/restore` - Restore soft-deleted student
- `DELETE /api/v1/admin/students/:id/permanent` - Permanently delete student

### Faculty
- `GET /api/v1/admin/faculty` - List faculty (paginated)
- `GET /api/v1/admin/faculty/:id` - Get faculty by ID
- `POST /api/v1/admin/faculty` - Create faculty
- `PUT /api/v1/admin/faculty/:id` - Update faculty
- `DELETE /api/v1/admin/faculty/:id` - Soft delete faculty

### Skills
- `GET /api/v1/admin/students/:studentId/skills` - List student skills
- `POST /api/v1/admin/students/:studentId/skills` - Add skill
- `PUT /api/v1/admin/skills/:id` - Update skill
- `DELETE /api/v1/admin/skills/:id` - Delete skill

### Violations
- `GET /api/v1/admin/students/:studentId/violations` - List violations
- `POST /api/v1/admin/students/:studentId/violations` - Record violation
- `PUT /api/v1/admin/violations/:id` - Update violation
- `DELETE /api/v1/admin/violations/:id` - Delete violation
- `PATCH /api/v1/admin/violations/:id/resolve` - Resolve violation

### Affiliations
- `GET /api/v1/admin/students/:studentId/affiliations` - List affiliations
- `POST /api/v1/admin/students/:studentId/affiliations` - Add affiliation
- `PUT /api/v1/admin/affiliations/:id` - Update affiliation
- `DELETE /api/v1/admin/affiliations/:id` - Delete affiliation

### Academic History
- `GET /api/v1/admin/students/:studentId/academic-history` - List grades
- `POST /api/v1/admin/students/:studentId/academic-history` - Add grade
- `PUT /api/v1/admin/academic-history/:id` - Update grade
- `DELETE /api/v1/admin/academic-history/:id` - Delete grade
- `GET /api/v1/admin/students/:studentId/gpa` - Calculate GPA

### Enrollments
- `GET /api/v1/admin/enrollments` - List all enrollments
- `GET /api/v1/admin/students/:studentId/enrollments` - Student enrollments
- `GET /api/v1/admin/instructions/:instructionId/enrollments` - Course enrollments
- `POST /api/v1/admin/enrollments` - Enroll student
- `PUT /api/v1/admin/enrollments/:id` - Update enrollment
- `DELETE /api/v1/admin/enrollments/:id` - Drop enrollment

### Instructions (Curriculum)
- `GET /api/v1/admin/instructions` - List subjects
- `GET /api/v1/admin/instructions/:id` - Get subject
- `POST /api/v1/admin/instructions` - Create subject
- `PUT /api/v1/admin/instructions/:id` - Update subject
- `DELETE /api/v1/admin/instructions/:id` - Delete subject

### Schedules
- `GET /api/v1/admin/schedules` - List schedules
- `GET /api/v1/admin/schedules/:id` - Get schedule
- `POST /api/v1/admin/schedules` - Create schedule (with conflict check)
- `PUT /api/v1/admin/schedules/:id` - Update schedule
- `DELETE /api/v1/admin/schedules/:id` - Delete schedule
- `POST /api/v1/admin/schedules/check-conflict` - Check for conflicts

### Research
- `GET /api/v1/admin/research` - List research
- `GET /api/v1/admin/research/:id` - Get research
- `POST /api/v1/admin/research` - Create research
- `PUT /api/v1/admin/research/:id` - Update research
- `DELETE /api/v1/admin/research/:id` - Delete research
- `POST /api/v1/admin/research/:id/authors` - Add author
- `DELETE /api/v1/admin/research/:id/authors/:studentId` - Remove author

### Events
- `GET /api/v1/admin/events` - List events
- `GET /api/v1/admin/events/:id` - Get event
- `POST /api/v1/admin/events` - Create event
- `PUT /api/v1/admin/events/:id` - Update event
- `DELETE /api/v1/admin/events/:id` - Delete event
- `POST /api/v1/admin/events/:id/participants` - Add participant

### Dashboard
- `GET /api/v1/admin/dashboard` - Get dashboard metrics
- `GET /api/v1/admin/dashboard/students` - Student statistics
- `GET /api/v1/admin/dashboard/faculty` - Faculty statistics

### Analytics
- `GET /api/v1/admin/analytics/gpa` - GPA distribution
- `GET /api/v1/admin/analytics/skills` - Skills distribution
- `GET /api/v1/admin/analytics/violations` - Violation trends

### Reports
- `POST /api/v1/admin/reports/student-profile` - Generate student profile report
- `POST /api/v1/admin/reports/faculty-profile` - Generate faculty profile report
- `POST /api/v1/admin/reports/enrollments` - Generate enrollment report

### Search
- `GET /api/v1/admin/search?q=query&type=students` - Global search

### Audit Logs
- `GET /api/v1/admin/audit-logs` - List audit logs
- `GET /api/v1/admin/audit-logs/user/:userId` - User activity logs

### Uploads
- `POST /api/v1/admin/uploads` - Upload file
- `GET /api/v1/admin/uploads/:id` - Get upload metadata
- `DELETE /api/v1/admin/uploads/:id` - Delete file

## Common Use Cases

### 1. Create a Student with User Account

```bash
curl -X POST http://localhost:3000/api/v1/admin/students \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@student.ccs.edu",
    "program": "BSCS",
    "year_level": 1,
    "create_user_account": true
  }'
```

### 2. Get Complete Student Profile

```bash
curl -X GET http://localhost:3000/api/v1/admin/students/{id}/profile \
  -H "Authorization: Bearer <token>"
```

This returns the student with all related data:
- Skills
- Violations
- Affiliations
- Academic History
- Enrollments

### 3. Check Schedule Conflict

```bash
curl -X POST http://localhost:3000/api/v1/admin/schedules/check-conflict \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "room": "Room 301",
    "day": "monday",
    "start_time": "08:00:00",
    "end_time": "10:00:00",
    "semester": "1st",
    "academic_year": "2023-2024"
  }'
```

### 4. Search Across All Entities

```bash
curl -X GET "http://localhost:3000/api/v1/admin/search?q=john&type=all" \
  -H "Authorization: Bearer <token>"
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **API Routes**: 100 requests per minute per IP
- **Auth Routes**: 5 requests per 15 minutes per IP

When rate limit is exceeded, the API returns:

```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later",
    "code": "RATE_LIMIT_EXCEEDED",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Best Practices

### 1. Always Handle Errors

Always check the `success` field and handle errors appropriately:

```javascript
const response = await fetch('/api/v1/admin/students');
const result = await response.json();

if (result.success) {
  // Handle success
  console.log(result.data);
} else {
  // Handle error
  console.error(result.error.message);
}
```

### 2. Use Pagination for Large Datasets

Always use pagination when fetching lists to avoid performance issues:

```javascript
// Good
fetch('/api/v1/admin/students?page=1&limit=20')

// Bad - fetches all records
fetch('/api/v1/admin/students?limit=10000')
```

### 3. Validate Input Before Sending

Validate data on the client side before sending to reduce unnecessary API calls:

```javascript
// Validate email format
if (!isValidEmail(email)) {
  showError('Invalid email format');
  return;
}

// Then make API call
await createStudent({ email, ... });
```

### 4. Store and Reuse JWT Tokens

Store the JWT token securely and reuse it for subsequent requests:

```javascript
// Login once
const { data } = await login(email, password);
localStorage.setItem('token', data.token);

// Reuse token
const token = localStorage.getItem('token');
fetch('/api/v1/admin/students', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Support

For issues, questions, or feature requests:
- Email: support@ccs.edu
- Documentation: http://localhost:3000/api-docs

## Version History

- **v1.0.0** (2024) - Initial release
  - Complete CRUD operations for all entities
  - Authentication and authorization
  - Dashboard and analytics
  - Report generation
  - Global search
