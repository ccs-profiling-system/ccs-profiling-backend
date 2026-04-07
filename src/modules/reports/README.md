# Reports Module

The Reports module provides comprehensive report generation and management capabilities for the CCS Profiling System. It supports generating PDF and Excel reports for various entities and maintains a history of all generated reports.

## Features

- **On-Demand Report Generation**: Generate reports instantly for students, faculty, enrollments, and analytics
- **Report History Tracking**: All generated reports are saved and tracked in the database
- **Multiple Formats**: Support for PDF and Excel formats
- **Report Management**: List, view, download, and delete historical reports
- **Statistics Dashboard**: View report generation statistics and trends
- **File Storage**: Reports are stored on disk with configurable storage path

## Report Types

### 1. Student Profile Report (PDF)
Comprehensive student profile including personal information, skills, academic history, enrollments, affiliations, and violations.

**Endpoint**: `POST /api/v1/admin/reports/student-profile`

**Request Body**:
```json
{
  "student_id": "uuid"
}
```

### 2. Faculty Profile Report (PDF)
Faculty profile with personal information, department, position, and specialization.

**Endpoint**: `POST /api/v1/admin/reports/faculty-profile`

**Request Body**:
```json
{
  "faculty_id": "uuid"
}
```

### 3. Enrollment Report (Excel)
Detailed enrollment data with filtering options for semester, academic year, and program.

**Endpoint**: `POST /api/v1/admin/reports/enrollments`

**Request Body**:
```json
{
  "semester": "1st" | "2nd" | "summer" (optional),
  "academic_year": "string" (optional),
  "program": "string" (optional)
}
```

### 4. Analytics Report (PDF)
Analytics reports for various metrics including GPA distribution, skills, violations, research, and enrollments.

**Endpoint**: `POST /api/v1/admin/reports/analytics`

**Request Body**:
```json
{
  "report_type": "gpa" | "skills" | "violations" | "research" | "enrollments",
  "start_date": "ISO date string" (optional),
  "end_date": "ISO date string" (optional)
}
```

## Report Management Endpoints

### Get All Reports
Retrieve a paginated list of all generated reports with optional filtering.

**Endpoint**: `GET /api/v1/admin/reports`

**Query Parameters**:
- `page` (number, default: 1): Page number
- `pageSize` (number, default: 20): Items per page
- `report_type` (string, optional): Filter by report type
- `generated_by` (uuid, optional): Filter by user who generated the report
- `status` (string, optional): Filter by status
- `start_date` (ISO date, optional): Filter reports created after this date
- `end_date` (ISO date, optional): Filter reports created before this date

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "report_type": "student-profile",
      "report_name": "Student Profile - John Doe",
      "file_name": "student-profile-2024-01-15.pdf",
      "file_path": "./reports/student-profile-2024-01-15.pdf",
      "file_size": 245678,
      "format": "pdf",
      "status": "completed",
      "generated_by": "uuid",
      "parameters": "{\"student_id\":\"uuid\"}",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

### Get Report Statistics
Retrieve statistics about report generation.

**Endpoint**: `GET /api/v1/admin/reports/statistics`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalReports": 150,
    "reportsThisMonth": 25,
    "mostGenerated": "student-profile",
    "monthlyGrowth": 15.5,
    "totalSize": "125.50 MB"
  }
}
```

### Get Report by ID
Retrieve details of a specific report.

**Endpoint**: `GET /api/v1/admin/reports/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "report_type": "student-profile",
    "report_name": "Student Profile - John Doe",
    "file_name": "student-profile-2024-01-15.pdf",
    "file_path": "./reports/student-profile-2024-01-15.pdf",
    "file_size": 245678,
    "format": "pdf",
    "status": "completed",
    "generated_by": "uuid",
    "parameters": "{\"student_id\":\"uuid\"}",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Download Report
Download a previously generated report file.

**Endpoint**: `GET /api/v1/admin/reports/:id/download`

**Response**: Binary file (PDF or Excel) with appropriate headers

### Delete Report
Delete a report from the database and file system.

**Endpoint**: `DELETE /api/v1/admin/reports/:id`

**Response**:
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

## Database Schema

The reports table stores metadata about generated reports:

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,
  report_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  format VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed' NOT NULL,
  generated_by UUID NOT NULL REFERENCES users(id),
  parameters TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Configuration

Add the following environment variable to your `.env` file:

```env
REPORTS_STORAGE_PATH=./reports
```

This configures where report files are stored on disk.

## Architecture

### Repository Layer
`ReportRepository` handles all database operations for report history:
- Create report records
- Query reports with filters
- Get report statistics
- Delete reports

### Service Layer
`ReportService` contains business logic for report generation:
- Generate reports using PDFKit and ExcelJS
- Save report files to disk
- Track report history in database
- Manage report lifecycle

### Controller Layer
`ReportController` handles HTTP requests and responses:
- Validate request data
- Call service methods
- Format responses
- Handle errors

### Routes
All routes require authentication and admin role:
- `GET /api/v1/admin/reports` - List reports
- `GET /api/v1/admin/reports/statistics` - Get statistics
- `GET /api/v1/admin/reports/:id` - Get report details
- `GET /api/v1/admin/reports/:id/download` - Download report
- `DELETE /api/v1/admin/reports/:id` - Delete report
- `POST /api/v1/admin/reports/student-profile` - Generate student report
- `POST /api/v1/admin/reports/faculty-profile` - Generate faculty report
- `POST /api/v1/admin/reports/enrollments` - Generate enrollment report
- `POST /api/v1/admin/reports/analytics` - Generate analytics report

## Frontend Integration

The frontend `reportsService` provides methods to interact with all report endpoints:

```typescript
// Generate reports
await reportsService.generateStudentProfileReport(studentId);
await reportsService.generateFacultyProfileReport(facultyId);
await reportsService.generateEnrollmentReport({ semester, academic_year });
await reportsService.generateAnalyticsReport({ report_type, start_date, end_date });

// Manage reports
const reports = await reportsService.getReports(filters, page, pageSize);
const stats = await reportsService.getReportStatistics();
const report = await reportsService.getReportById(reportId);
const blob = await reportsService.downloadReport(reportId);
await reportsService.deleteReport(reportId);
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

Common error codes:
- `REPORT_NOT_FOUND`: Report ID doesn't exist
- `REPORT_FILE_NOT_FOUND`: Report file missing from disk
- `VALIDATION_ERROR`: Invalid request data
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Admin role required

## Testing

Run the test suite:
```bash
npm test
```

Test report generation:
```bash
# Generate a student profile report
curl -X POST http://localhost:3000/api/v1/admin/reports/student-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id": "uuid"}' \
  --output student-report.pdf
```

## Future Enhancements

- [ ] Scheduled report generation
- [ ] Email report delivery
- [ ] Custom report templates
- [ ] Report sharing and permissions
- [ ] Cloud storage integration (S3)
- [ ] Report caching and optimization
- [ ] Batch report generation
- [ ] Report preview without download
