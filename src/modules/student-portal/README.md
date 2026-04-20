# Student Portal Module

This module provides a comprehensive REST API system for students to manage their academic activities, view progress, interact with advisors, and participate in campus events.

## Overview

The Student Portal API extends the CCS Profiling Backend with 26 new endpoints organized into 10 functional categories, all requiring JWT authentication with RBAC-based authorization using the `student.*` permission namespace.

### Key Features

- **Student-Scoped Data Isolation**: All endpoints filter data by student_id ensuring students only access their own records
- **Explicit Permission Model**: All endpoints protected by `requirePermission()` middleware with `student.resource.action` permissions
- **Comprehensive Academic Access**: Students can view courses, grades, progress, financial records, and advisor information
- **Interactive Features**: Support for research applications, event registration, and advisor communication
- **Type-Safe Validation**: Zod schemas for all request/response validation
- **Pagination Support**: Efficient data retrieval for large datasets

## Module Structure

```
src/modules/student-portal/
├── utils/
│   └── studentScope.ts          # Student scoping utilities
├── types/
│   └── index.ts                 # TypeScript types and DTOs
├── schemas/
│   └── common.schemas.ts        # Common Zod validation schemas
├── controllers/                 # Request handlers (to be implemented)
├── services/                    # Business logic (to be implemented)
└── routes/                      # Route definitions (to be implemented)
```

## Shared Utilities and Types

### Student Scoping Utilities (`utils/studentScope.ts`)

Utilities for extracting student_id from authenticated users and validating student access to resources.

#### Functions

**`extractStudentId(user)`**
- Extracts student_id from JWT token context
- Throws `StudentAccessError` if student_id is missing
- Returns: `string` (student ID)

**`validateStudentOwnership(resourceStudentId, userStudentId)`**
- Validates that the authenticated student owns the resource
- Throws `StudentAccessError` if IDs don't match
- Returns: `void`

**`extractAndValidateStudentId(req, paramName?)`**
- Convenience function combining extraction and validation
- Validates against route parameter if present
- Returns: `string` (student ID)

**`isStudent(user)`**
- Type guard to check if user is a student
- Returns: `boolean`

#### Error Classes

**`StudentAccessError`**
- HTTP 403 error for unauthorized access attempts
- Properties: `statusCode: 403`, `code: 'STUDENT_ACCESS_DENIED'`

#### Example Usage

```typescript
import { extractStudentId, validateStudentOwnership } from '../utils/studentScope';

// In a controller
async function getProfile(req: AuthenticatedRequest, res: Response) {
  // Extract student ID from JWT token
  const studentId = extractStudentId(req.user);
  
  // Fetch profile
  const profile = await profileService.getProfileById(studentId);
  
  res.json({ success: true, data: profile });
}

// Validate resource ownership
async function getNotification(req: AuthenticatedRequest, res: Response) {
  const studentId = extractStudentId(req.user);
  const notification = await notificationService.getById(req.params.id);
  
  // Ensure student owns this notification
  validateStudentOwnership(notification.student_id, studentId);
  
  res.json({ success: true, data: notification });
}
```

### TypeScript Types (`types/index.ts`)

Comprehensive type definitions for all DTOs and interfaces used throughout the student portal API.

#### Core Interfaces

- `StudentScope`: Student filtering interface
- `PaginationParams`: Pagination query parameters
- `PaginationMeta`: Pagination metadata for responses
- `PaginatedResponse<T>`: Generic paginated response wrapper

#### Type Literals

- `NotificationType`: 'academic' | 'financial' | 'event' | 'system'
- `EnrollmentStatus`: 'enrolled' | 'dropped' | 'completed'
- `AcademicStanding`: 'Good Standing' | 'Probation'
- `ResearchApplicationStatus`: 'pending' | 'accepted' | 'rejected'
- `EventRegistrationStatus`: 'registered' | 'cancelled' | 'attended'
- `AppointmentStatus`: 'scheduled' | 'completed' | 'cancelled'
- `MessageSenderRole`: 'student' | 'faculty'

#### Data Transfer Objects (DTOs)

**Profile & Dashboard**
- `StudentProfileDTO`: Student profile information
- `DashboardSummaryDTO`: Dashboard summary data
- `AcademicProgressDTO`: Academic progress tracking
- `FinancialRecordDTO`: Financial records and payment history

**Notifications & Courses**
- `NotificationDTO`: Notification data
- `CourseDTO`: Course information
- `CourseDetailsDTO`: Detailed course information
- `WeeklyScheduleDTO`: Weekly class schedule
- `ScheduleEntryDTO`: Individual schedule entry

**Grades**
- `GradeDTO`: Grade information
- `GPADTO`: GPA calculation data
- `GradeHistoryDTO`: Complete grade history

**Research & Events**
- `ResearchOpportunityDTO`: Research opportunity data
- `ResearchOpportunityDetailsDTO`: Detailed research information
- `ResearchApplicationStatusDTO`: Application status
- `EventDTO`: Event information
- `RegisteredEventDTO`: Registered event with attendance

**Advisor Communication**
- `AdvisorDTO`: Advisor information
- `MessageDTO`: Message data
- `AppointmentSlotDTO`: Available appointment slot
- `AppointmentDTO`: Appointment information

### Common Validation Schemas (`schemas/common.schemas.ts`)

Zod validation schemas for request validation and data sanitization.

#### Pagination

**`paginationSchema`**
- Validates `page` and `limit` query parameters
- Defaults: page=1, limit=10
- Maximum limit: 100

```typescript
// Usage
const { page, limit } = paginationSchema.parse(req.query);
```

#### Field Validators

**Email Validation**
- `emailSchema`: Required email validation
- `optionalEmailSchema`: Optional email validation

**Phone Validation**
- `phoneSchema`: Required phone validation (10-15 chars, digits/spaces/dashes/plus/parentheses)
- `optionalPhoneSchema`: Optional phone validation

**Date Validation**
- `dateSchema`: Date in YYYY-MM-DD format
- `optionalDateSchema`: Optional date
- `dateTimeSchema`: ISO 8601 datetime format
- `optionalDateTimeSchema`: Optional datetime

**Other Validators**
- `uuidSchema`: UUID v4 format validation
- `nonEmptyStringSchema`: Non-empty string with trim
- `optionalNonEmptyStringSchema`: Optional non-empty string

#### Enum Validators

All enum validators ensure only valid values are accepted:
- `notificationTypeSchema`
- `enrollmentStatusSchema`
- `academicStandingSchema`
- `researchApplicationStatusSchema`
- `eventRegistrationStatusSchema`
- `appointmentStatusSchema`
- `messageSenderRoleSchema`

#### Parameter Validators

- `idParamSchema`: Validates UUID in `:id` route parameter
- `studentIdParamSchema`: Validates UUID in `:studentId` route parameter

#### Helper Functions

**`calculatePaginationMeta(total, page, limit)`**
- Calculates pagination metadata
- Returns: `{ total, page, limit, totalPages }`

**`calculateOffset(page, limit)`**
- Calculates database query offset
- Returns: `number`

#### Example Usage

```typescript
import { paginationSchema, emailSchema, calculatePaginationMeta } from '../schemas/common.schemas';

// Validate pagination
const { page, limit } = paginationSchema.parse(req.query);

// Validate email
const updateProfileSchema = z.object({
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
});

// Calculate pagination metadata
const total = await countRecords();
const meta = calculatePaginationMeta(total, page, limit);

res.json({
  data: records,
  meta,
});
```

## Testing

All utilities and schemas have comprehensive unit tests:

```bash
# Run all student portal tests
npm test -- student-portal --run

# Run specific test files
npm test -- studentScope.test.ts --run
npm test -- common.schemas.test.ts --run
```

### Test Coverage

- **Student Scoping Utilities**: 22 tests covering all functions and error cases
- **Common Schemas**: 64 tests covering all validators and helper functions

## Requirements Mapping

This implementation satisfies the following requirements:

### Subtask 2.1: Student Scoping Utility
- **28.1**: Extract student_id from authenticated user context
- **28.2**: Apply student_id filtering to database queries
- **28.3**: Validate resource ownership before returning data
- **28.4**: Return HTTP 403 for unauthorized access attempts
- **28.5**: Apply scoping to all student-specific resources

### Subtask 2.2: TypeScript Types and Interfaces
- **30.1**: Define comprehensive DTOs for all data structures
- **30.2**: Define pagination types
- **30.3**: Define enum types for status fields
- **30.4**: Define type-safe interfaces
- **30.5**: Export all types for use across modules

### Subtask 2.3: Common Zod Validation Schemas
- **30.1-30.5**: Request validation schemas
- **31.1**: Pagination schema with defaults
- **31.2**: Page and limit parameter validation
- **31.3**: Enum validators for status fields
- **31.4**: Maximum limit enforcement (100)
- **31.5**: Pagination metadata calculation
- **31.6**: Total pages calculation

## Next Steps

The following modules will be implemented in subsequent tasks:

1. **Profile Management** (Task 3)
2. **Dashboard** (Task 4)
3. **Academic Progress** (Task 5)
4. **Financial Records** (Task 6)
5. **Notification Management** (Task 7)
6. **Course Management** (Task 9)
7. **Grade Management** (Task 10)
8. **Research Opportunities** (Task 11)
9. **Event Management** (Task 13)
10. **Advisor Communication** (Task 14)

Each module will use these shared utilities and types to ensure consistency and type safety across the entire student portal API.
