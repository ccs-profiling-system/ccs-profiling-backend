# Students Module

This module implements the complete student management functionality following the three-layer architecture pattern.

## Architecture

```
students/
├── types/
│   ├── dtos.ts              # Data Transfer Objects
│   └── index.ts             # Type exports
├── schemas/
│   └── student.schema.ts    # Zod validation schemas
├── repositories/
│   └── student.repository.ts # Database access layer
├── services/
│   ├── student.service.ts   # Business logic layer
│   └── student.service.test.ts # Unit tests
├── controllers/
│   └── student.controller.ts # HTTP request/response handling
├── routes/
│   └── student.routes.ts    # Route definitions
├── index.ts                 # Module exports
└── README.md                # This file
```

## Features Implemented

### Task 10.1: DTOs and Types ✅
- `CreateStudentDTO` - Input for creating students
- `UpdateStudentDTO` - Input for updating students
- `StudentResponseDTO` - Output returned to clients
- `StudentListResponseDTO` - Paginated list output
- `StudentProfileDTO` - Aggregated profile (extensible for related data)
- `StudentFilters` - Query filters for listing

### Task 10.2: Validation Schemas ✅
- `createStudentSchema` - Validates student creation
- `updateStudentSchema` - Validates student updates
- `studentIdParamSchema` - Validates UUID parameters
- `studentListQuerySchema` - Validates query parameters
- Email format validation
- UUID format validation
- Required field validation

### Task 10.3: Repository Layer ✅
- `findById()` - Find by UUID (soft-delete aware)
- `findByStudentId()` - Find by student_id (soft-delete aware)
- `findAll()` - Paginated list with filters (soft-delete aware)
- `create()` - Create new student
- `update()` - Update student
- `softDelete()` - Soft delete student
- `restore()` - Restore soft-deleted student
- `findByEmail()` - Find by email (soft-delete aware)
- Search by name or student_id
- Automatic soft-delete filtering

### Task 10.4: Service Layer ✅
- `getStudent()` - Get student by ID
- `listStudents()` - List with pagination and filters
- `createStudent()` - Create with optional user account
- `updateStudent()` - Update with validation
- `deleteStudent()` - Soft delete
- `getStudentProfile()` - Get aggregated profile
- Business rule validation (duplicate checks)
- Transaction support for multi-step operations
- DTO transformation

### Task 10.5: Controller and Routes ✅
- `GET /api/v1/admin/students` - List students
- `GET /api/v1/admin/students/:id` - Get student
- `GET /api/v1/admin/students/:id/profile` - Get profile
- `POST /api/v1/admin/students` - Create student
- `PUT /api/v1/admin/students/:id` - Update student
- `DELETE /api/v1/admin/students/:id` - Delete student
- Auth middleware applied
- Admin role middleware applied
- Input validation on all endpoints

## API Endpoints

### List Students
```
GET /api/v1/admin/students?page=1&limit=10&search=john&program=BSCS
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by name or student_id
- `program` (optional): Filter by program
- `year_level` (optional): Filter by year level
- `status` (optional): Filter by status

Response:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

### Get Student
```
GET /api/v1/admin/students/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "2021-00001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Create Student
```
POST /api/v1/admin/students
```

Request Body:
```json
{
  "student_id": "2021-00001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "program": "BSCS",
  "year_level": 1,
  "create_user_account": true
}
```

### Update Student
```
PUT /api/v1/admin/students/:id
```

Request Body:
```json
{
  "first_name": "Jane",
  "status": "inactive"
}
```

### Delete Student
```
DELETE /api/v1/admin/students/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "message": "Student deleted successfully"
  }
}
```

### Get Student Profile
```
GET /api/v1/admin/students/:id/profile
```

Returns complete student profile with aggregated data (extensible for skills, violations, affiliations, etc.)

## Requirements Mapping

- **Requirement 2.1**: Create student profile ✅
- **Requirement 2.3**: Store student data ✅
- **Requirement 2.5**: Retrieve student profile ✅
- **Requirement 2.6**: Update student profile ✅
- **Requirement 2.7**: Delete student profile (soft delete) ✅
- **Requirement 4.7**: Admin-only endpoints ✅
- **Requirement 4.8**: Admin route prefix ✅
- **Requirement 10.1**: Profile aggregation ✅
- **Requirement 21.2**: Email validation ✅
- **Requirement 21.3**: Required field validation ✅
- **Requirement 21.4**: UUID validation ✅
- **Requirement 21.5**: Date format validation ✅
- **Requirement 28.2**: Soft delete support ✅
- **Requirement 28.4**: Soft delete filtering ✅
- **Requirement 30.2**: API versioning ✅

## Testing

Unit tests are provided in `student.service.test.ts`:
- ✅ Get student by ID
- ✅ List students with pagination
- ✅ Create student
- ✅ Update student
- ✅ Delete student
- ✅ Duplicate validation
- ✅ Error handling

Run tests:
```bash
npm test -- student.service.test.ts
```

## Usage Example

```typescript
import { studentRoutes } from './modules/students';

// Register routes in your Express app
app.use('/api/v1/admin/students', studentRoutes);
```

## Design Patterns

1. **Three-Layer Architecture**: Clear separation of concerns
2. **DTO Pattern**: Prevents database schema leakage
3. **Repository Pattern**: Encapsulates data access
4. **Service Pattern**: Encapsulates business logic
5. **Soft Delete**: Preserves audit trail
6. **Transaction Support**: Ensures data consistency
7. **Validation**: Input validation at controller layer
8. **Error Handling**: Consistent error responses

## Future Enhancements

The `StudentProfileDTO` is designed to be extensible. When related modules are implemented, the profile endpoint can be enhanced to include:
- Skills
- Violations
- Affiliations
- Academic history
- Enrollments
- Research projects
