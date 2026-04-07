# CCS Backend System Documentation

Welcome to the CCS Comprehensive Profiling System Backend API documentation.

## Documentation Overview

This directory contains comprehensive documentation for the CCS Backend API:

### 📚 Available Documentation

1. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**
   - Complete API usage guide
   - Authentication instructions
   - Response format specifications
   - Pagination and filtering
   - Best practices and examples
   - **Start here if you're new to the API**

2. **[ENDPOINTS_REFERENCE.md](./ENDPOINTS_REFERENCE.md)**
   - Quick reference for all endpoints
   - Request/response examples for each endpoint
   - Path parameters and query parameters
   - HTTP methods and status codes
   - **Use this as a quick lookup guide**

3. **[ERROR_CODES.md](./ERROR_CODES.md)**
   - Comprehensive error code reference
   - Error handling best practices
   - Common error scenarios and solutions
   - Troubleshooting guide
   - **Refer to this when handling errors**

4. **[openapi-annotations.ts](./openapi-annotations.ts)**
   - OpenAPI/Swagger annotations
   - JSDoc comments for endpoints
   - Schema definitions
   - **For developers maintaining the API**

## Interactive Documentation

### Swagger UI

Access the interactive API documentation at:

**Development:** http://localhost:3000/api-docs

The Swagger UI provides:
- ✅ Browse all endpoints with detailed descriptions
- ✅ View request/response schemas
- ✅ Test endpoints directly from the browser
- ✅ Download OpenAPI specification

### OpenAPI Specification

Download the raw OpenAPI 3.0 specification:

**JSON Format:** http://localhost:3000/api-docs/json

Import this into:
- Postman
- Insomnia
- API testing frameworks
- Code generators

## Quick Start

### 1. Authentication

First, obtain a JWT token:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ccs.edu",
    "password": "your-password"
  }'
```

### 2. Use the Token

Include the token in subsequent requests:

```bash
curl -X GET http://localhost:3000/api/v1/admin/students \
  -H "Authorization: Bearer <your-token>"
```

### 3. Explore the API

Visit http://localhost:3000/api-docs to explore all available endpoints interactively.

## API Structure

### Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://api.ccs.edu/api`

### Versioning

All endpoints are versioned: `/api/v1/...`

### Route Prefixes

- `/api/v1/auth/*` - Authentication endpoints (public)
- `/api/v1/admin/*` - Admin endpoints (requires authentication + admin role)

## Key Features

### 🔐 Security
- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting
- Input sanitization
- SQL injection prevention

### 📊 Data Management
- CRUD operations for all entities
- Soft delete support
- Transaction-safe operations
- Batch operations
- N+1 query prevention

### 🔍 Search & Filter
- Global search across entities
- Entity-specific search
- Advanced filtering
- Pagination support

### 📈 Analytics
- Dashboard metrics
- GPA distribution
- Skills distribution
- Violation trends
- Research metrics

### 📄 Reports
- PDF report generation
- Excel report generation
- Student profiles
- Faculty profiles
- Enrollment reports

### 🔔 Audit Trail
- Comprehensive audit logging
- Before/after state capture
- User activity tracking
- Entity history

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    // Optional metadata
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {},
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication failed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_ERROR` | 500 | Server error |

See [ERROR_CODES.md](./ERROR_CODES.md) for detailed information.

## Main Modules

### Core Entities
- **Students** - Student profile management
- **Faculty** - Faculty profile management
- **Users** - User account management

### Academic Management
- **Instructions** - Curriculum and subjects
- **Enrollments** - Course enrollments
- **Academic History** - Grades and transcripts
- **Schedules** - Class and exam scheduling

### Student Activities
- **Skills** - Student skills and competencies
- **Violations** - Disciplinary records
- **Affiliations** - Organization memberships

### Advanced Features
- **Research** - Research projects and thesis
- **Events** - Academic events
- **Uploads** - File management
- **Audit Logs** - Activity tracking

### System Features
- **Dashboard** - System metrics
- **Analytics** - Data insights
- **Reports** - Report generation
- **Search** - Global search

## Common Use Cases

### 1. Create a Student

```bash
POST /api/v1/admin/students
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@student.ccs.edu",
  "program": "BSCS",
  "year_level": 1,
  "create_user_account": true
}
```

### 2. Get Complete Student Profile

```bash
GET /api/v1/admin/students/{id}/profile
```

Returns student with all related data (skills, violations, affiliations, academic history, enrollments).

### 3. Check Schedule Conflict

```bash
POST /api/v1/admin/schedules/check-conflict
{
  "room": "Room 301",
  "day": "monday",
  "start_time": "08:00:00",
  "end_time": "10:00:00",
  "semester": "1st",
  "academic_year": "2023-2024"
}
```

### 4. Search Across All Entities

```bash
GET /api/v1/admin/search?q=john&type=all
```

## Development Tools

### Postman Collection

Import the OpenAPI specification into Postman:
1. Open Postman
2. Click "Import"
3. Enter URL: `http://localhost:3000/api-docs/json`
4. Click "Import"

### Code Generation

Generate client SDKs using the OpenAPI specification:

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3000/api-docs/json \
  -g typescript-axios \
  -o ./generated-client
```

## Testing

### Health Check

Verify the API is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### API Version

Check the API version:

```bash
curl -I http://localhost:3000/api/v1/admin/students
```

Look for the `X-API-Version` header.

## Rate Limiting

- **API Routes:** 100 requests per minute per IP
- **Auth Routes:** 5 requests per 15 minutes per IP

When rate limit is exceeded:
```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

## Support

### Documentation
- **Swagger UI:** http://localhost:3000/api-docs
- **API Docs:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Endpoints:** [ENDPOINTS_REFERENCE.md](./ENDPOINTS_REFERENCE.md)
- **Errors:** [ERROR_CODES.md](./ERROR_CODES.md)

### Contact
- **Email:** support@ccs.edu
- **Issues:** Report bugs or request features

## Version History

### v1.0.0 (2024)
- Initial release
- Complete CRUD operations for all entities
- Authentication and authorization
- Dashboard and analytics
- Report generation
- Global search
- Comprehensive API documentation

## Contributing

When adding new endpoints:
1. Add OpenAPI annotations in `openapi-annotations.ts`
2. Update `ENDPOINTS_REFERENCE.md` with examples
3. Document any new error codes in `ERROR_CODES.md`
4. Test the Swagger UI to ensure documentation is correct

## License

MIT License - See LICENSE file for details
