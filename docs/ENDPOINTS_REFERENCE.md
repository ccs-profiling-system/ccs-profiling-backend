# API Endpoints Reference

Complete reference for all CCS Backend System API endpoints.

## Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://api.ccs.edu/api`

All endpoints are prefixed with `/v1` for versioning.

---

## Authentication Endpoints

### POST /v1/auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@ccs.edu",
  "password": "password123"
}
```

**Response (200):**
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

**Errors:**
- `401 UNAUTHORIZED` - Invalid credentials
- `400 VALIDATION_ERROR` - Invalid input

---

### GET /v1/auth/me

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@ccs.edu",
    "role": "admin",
    "is_active": true
  }
}
```

---

### POST /v1/auth/logout

Logout current user (invalidate token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Student Endpoints

### GET /v1/admin/students

List students with pagination and filters.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 10, max: 100) - Items per page
- `search` (string) - Search by name or student_id
- `program` (string) - Filter by program
- `year_level` (integer) - Filter by year level
- `status` (string) - Filter by status (active, inactive, graduated)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "student_id": "S-2024-0001",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@student.ccs.edu",
      "program": "BSCS",
      "year_level": 3,
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

---

### GET /v1/admin/students/:id

Get student by ID.

**Path Parameters:**
- `id` (uuid) - Student UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "S-2024-0001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@student.ccs.edu",
    "program": "BSCS",
    "year_level": 3,
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `404 NOT_FOUND` - Student not found

---

### GET /v1/admin/students/:id/profile

Get complete student profile with all related data.

**Path Parameters:**
- `id` (uuid) - Student UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "S-2024-0001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@student.ccs.edu",
    "program": "BSCS",
    "year_level": 3,
    "status": "active",
    "skills": [
      {
        "id": "uuid",
        "skill_name": "JavaScript",
        "proficiency_level": "advanced",
        "years_of_experience": 2
      }
    ],
    "violations": [
      {
        "id": "uuid",
        "violation_type": "Late Submission",
        "description": "Assignment submitted 2 days late",
        "violation_date": "2024-01-15",
        "resolution_status": "resolved"
      }
    ],
    "affiliations": [
      {
        "id": "uuid",
        "organization_name": "Computer Society",
        "role": "Member",
        "start_date": "2023-09-01",
        "is_active": true
      }
    ],
    "academic_history": [
      {
        "id": "uuid",
        "subject_code": "CS101",
        "subject_name": "Introduction to Programming",
        "grade": 1.25,
        "semester": "1st",
        "academic_year": "2023-2024",
        "credits": 3
      }
    ],
    "enrollments": [
      {
        "id": "uuid",
        "subject_code": "CS201",
        "subject_name": "Data Structures",
        "enrollment_status": "enrolled",
        "semester": "2nd",
        "academic_year": "2023-2024"
      }
    ],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### POST /v1/admin/students

Create a new student.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "middle_name": "Smith",
  "email": "john.doe@student.ccs.edu",
  "phone": "+1234567890",
  "date_of_birth": "2000-01-15",
  "address": "123 Main St, City, State",
  "year_level": 1,
  "program": "BSCS",
  "create_user_account": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "S-2024-0001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@student.ccs.edu",
    "program": "BSCS",
    "year_level": 1,
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Invalid input
- `409 CONFLICT` - Email already exists

---

### PUT /v1/admin/students/:id

Update an existing student.

**Path Parameters:**
- `id` (uuid) - Student UUID

**Request Body:**
```json
{
  "first_name": "John",
  "year_level": 2,
  "status": "active"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "S-2024-0001",
    "first_name": "John",
    "last_name": "Doe",
    "year_level": 2,
    "status": "active",
    "updated_at": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### DELETE /v1/admin/students/:id

Soft delete a student.

**Path Parameters:**
- `id` (uuid) - Student UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Student deleted successfully"
  }
}
```

---

## Faculty Endpoints

### GET /v1/admin/faculty

List faculty members with pagination and filters.

**Query Parameters:**
- `page` (integer) - Page number
- `limit` (integer) - Items per page
- `search` (string) - Search by name or faculty_id
- `department` (string) - Filter by department

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "faculty_id": "F-2024-0001",
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane.smith@ccs.edu",
      "department": "Computer Science",
      "position": "Associate Professor",
      "status": "active"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### POST /v1/admin/faculty

Create a new faculty member.

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@ccs.edu",
  "department": "Computer Science",
  "position": "Associate Professor",
  "specialization": "Machine Learning, Data Science",
  "create_user_account": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "faculty_id": "F-2024-0001",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@ccs.edu",
    "department": "Computer Science",
    "status": "active"
  }
}
```

---

## Skills Endpoints

### GET /v1/admin/students/:studentId/skills

List all skills for a student.

**Path Parameters:**
- `studentId` (uuid) - Student UUID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "skill_name": "JavaScript",
      "proficiency_level": "advanced",
      "years_of_experience": 2,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /v1/admin/students/:studentId/skills

Add a skill to a student.

**Path Parameters:**
- `studentId` (uuid) - Student UUID

**Request Body:**
```json
{
  "skill_name": "Python",
  "proficiency_level": "intermediate",
  "years_of_experience": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "skill_name": "Python",
    "proficiency_level": "intermediate",
    "years_of_experience": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### PUT /v1/admin/skills/:id

Update a skill.

**Path Parameters:**
- `id` (uuid) - Skill UUID

**Request Body:**
```json
{
  "proficiency_level": "expert",
  "years_of_experience": 3
}
```

---

### DELETE /v1/admin/skills/:id

Delete a skill.

**Path Parameters:**
- `id` (uuid) - Skill UUID

---

## Violations Endpoints

### POST /v1/admin/students/:studentId/violations

Record a violation for a student.

**Path Parameters:**
- `studentId` (uuid) - Student UUID

**Request Body:**
```json
{
  "violation_type": "Late Submission",
  "description": "Assignment submitted 2 days late",
  "violation_date": "2024-01-15"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "violation_type": "Late Submission",
    "description": "Assignment submitted 2 days late",
    "violation_date": "2024-01-15",
    "resolution_status": "pending",
    "created_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

### PATCH /v1/admin/violations/:id/resolve

Resolve a violation.

**Path Parameters:**
- `id` (uuid) - Violation UUID

**Request Body:**
```json
{
  "resolution_notes": "Student apologized and submitted work"
}
```

---

## Enrollment Endpoints

### POST /v1/admin/enrollments

Enroll a student in a course.

**Request Body:**
```json
{
  "student_id": "uuid",
  "instruction_id": "uuid",
  "semester": "1st",
  "academic_year": "2023-2024"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "uuid",
    "instruction_id": "uuid",
    "subject_code": "CS101",
    "subject_name": "Introduction to Programming",
    "enrollment_status": "enrolled",
    "semester": "1st",
    "academic_year": "2023-2024",
    "enrolled_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `409 CONFLICT` - Student already enrolled in this course

---

## Schedule Endpoints

### POST /v1/admin/schedules

Create a new schedule with automatic conflict detection.

**Request Body:**
```json
{
  "schedule_type": "class",
  "instruction_id": "uuid",
  "faculty_id": "uuid",
  "room": "Room 301",
  "day": "monday",
  "start_time": "08:00:00",
  "end_time": "10:00:00",
  "semester": "1st",
  "academic_year": "2023-2024"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "schedule_type": "class",
    "subject_code": "CS101",
    "room": "Room 301",
    "day": "monday",
    "start_time": "08:00:00",
    "end_time": "10:00:00",
    "semester": "1st",
    "academic_year": "2023-2024"
  }
}
```

**Errors:**
- `409 CONFLICT` - Schedule conflict detected

---

### POST /v1/admin/schedules/check-conflict

Check for schedule conflicts before creating.

**Request Body:**
```json
{
  "room": "Room 301",
  "day": "monday",
  "start_time": "08:00:00",
  "end_time": "10:00:00",
  "semester": "1st",
  "academic_year": "2023-2024"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "has_conflict": true,
    "conflicts": [
      {
        "id": "uuid",
        "subject_code": "CS101",
        "room": "Room 301",
        "day": "monday",
        "start_time": "08:00:00",
        "end_time": "09:30:00"
      }
    ]
  }
}
```

---

## Dashboard Endpoints

### GET /v1/admin/dashboard

Get system-wide dashboard metrics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_students": 1500,
    "total_faculty": 50,
    "total_events": 25,
    "total_research": 100,
    "active_enrollments": 3000,
    "recent_activities": []
  }
}
```

---

## Search Endpoints

### GET /v1/admin/search

Global search across all entities.

**Query Parameters:**
- `q` (string, required) - Search query
- `type` (string) - Entity type (students, faculty, events, research, all)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "students": [...],
    "faculty": [...],
    "events": [...],
    "research": [...]
  }
}
```

---

## Rate Limits

- **API Routes:** 100 requests per minute per IP
- **Auth Routes:** 5 requests per 15 minutes per IP

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All IDs are UUIDs (v4)
3. All admin endpoints require authentication and admin role
4. Soft-deleted records are excluded from list/get operations by default
5. Use `/deleted` endpoints to view soft-deleted records
