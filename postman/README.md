# Postman Collection

This folder contains Postman collections and environments for testing the CCS Profiling API.

## 📁 Structure

```
postman/
├── collections/
│   └── ccs-profiling-api.postman_collection.json
├── environments/
│   ├── local.postman_environment.json
│   └── production.postman_environment.json
└── README.md
```

## 🚀 Quick Start

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Import `collections/ccs-profiling-api.postman_collection.json`
4. Import `environments/local.postman_environment.json`
5. Select "Local Environment" from the environment dropdown

### 2. Authentication Flow

The collection uses JWT-based authentication with automatic token management:

1. **Login**: Send a request to `Auth > Login`
   - The access token and refresh token are automatically saved to environment variables
   - Default credentials: `admin@example.com` / `password123`

2. **Authenticated Requests**: All other endpoints automatically use the saved token
   - Token is sent via `Authorization: Bearer {{token}}` header
   - Collection-level auth is configured for all requests

3. **Refresh Token**: Use `Auth > Refresh Token` when access token expires
   - Automatically updates both tokens in environment

### 3. Test the API

After logging in, you can test any endpoint:

- **Students**: CRUD operations for student management
- **Faculty**: CRUD operations for faculty management
- **Events**: Event management and participant tracking
- **Scheduling**: Schedule creation with conflict detection
- **Research**: Research project management
- **Reports**: Generate PDF/Excel reports
- **Analytics**: Dashboard and analytics data

## 📋 Available Endpoints

### Authentication (Public)
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user (requires auth)
- `POST /api/v1/auth/change-password` - Change password (requires auth)

### Students (Admin Only)
- `GET /api/v1/admin/students` - List students (paginated)
- `GET /api/v1/admin/students/:id` - Get student by ID
- `GET /api/v1/admin/students/:id/profile` - Get complete student profile
- `POST /api/v1/admin/students` - Create student
- `PUT /api/v1/admin/students/:id` - Update student
- `DELETE /api/v1/admin/students/:id` - Soft delete student

### Faculty (Admin Only)
- `GET /api/v1/admin/faculty` - List faculty (paginated)
- `GET /api/v1/admin/faculty/:id` - Get faculty by ID
- `POST /api/v1/admin/faculty` - Create faculty
- `PUT /api/v1/admin/faculty/:id` - Update faculty
- `DELETE /api/v1/admin/faculty/:id` - Soft delete faculty

### Events (Admin Only)
- `GET /api/v1/admin/events` - List events
- `GET /api/v1/admin/events/:id` - Get event by ID
- `POST /api/v1/admin/events` - Create event
- `PUT /api/v1/admin/events/:id` - Update event
- `DELETE /api/v1/admin/events/:id` - Delete event

### Scheduling (Admin Only)
- `GET /api/v1/admin/schedules` - List schedules
- `GET /api/v1/admin/schedules/room/:room` - Get schedules by room
- `POST /api/v1/admin/schedules/check-conflict` - Check for conflicts
- `POST /api/v1/admin/schedules` - Create schedule

### Research (Admin Only)
- `GET /api/v1/admin/research` - List research projects
- `POST /api/v1/admin/research` - Create research project

### Reports (Admin Only)
- `POST /api/v1/admin/reports/student-profile` - Generate student profile report
- `POST /api/v1/admin/reports/enrollments` - Generate enrollment report

### Analytics (Admin Only)
- `GET /api/v1/admin/dashboard` - Get dashboard metrics
- `GET /api/v1/admin/analytics/gpa` - Get GPA distribution
- `GET /api/v1/admin/analytics/skills` - Get skill distribution

## 🔧 Environment Variables

### Local Environment
```json
{
  "base_url": "http://localhost:3000",
  "token": "",
  "refreshToken": ""
}
```

### Production Environment
```json
{
  "base_url": "https://api.production.com",
  "token": "",
  "refreshToken": ""
}
```

**Note**: Tokens are automatically populated after login. Do not manually set them unless needed.

## 🔐 Security Notes

- **Never commit real tokens** to version control
- Tokens are automatically saved to environment after login
- Use separate environments for local/staging/production
- Rate limiting is enabled on auth endpoints (5 requests per 15 minutes)
- All admin endpoints require valid JWT token with admin role

## 📝 API Versioning

All endpoints use `/api/v1/` prefix:
- Public routes: `/api/v1/auth/*`
- Admin routes: `/api/v1/admin/*`

## 🧪 Testing Tips

1. **Start with Login**: Always login first to get a valid token
2. **Check Response**: Each response includes `success` field and proper error codes
3. **Pagination**: List endpoints support `?page=1&limit=10` query parameters
4. **Search/Filter**: Many endpoints support search and filter parameters
5. **Conflict Detection**: Use the schedule conflict check before creating schedules

## 🐛 Troubleshooting

### "Unauthorized" Error
- Ensure you've logged in and token is saved
- Check if token has expired (use refresh token endpoint)
- Verify you're using the correct environment

### "Not Found" Error
- Check if the API server is running on the correct port
- Verify the `base_url` in your environment
- Ensure you're using the correct endpoint path

### Rate Limit Error
- Auth endpoints are rate limited (5 requests per 15 minutes)
- Wait before retrying login/refresh requests

## 📚 Additional Resources

- [API Design Document](../STRUCTURE-GUIDE.md)
- [Authentication README](../src/modules/auth/README.md)
- [Security Middleware Documentation](../src/shared/middleware/SECURITY_MIDDLEWARE.md)

## ⚠️ Important Notes

- All endpoints return standardized JSON responses with `success` field
- Error responses include `error.code` and `error.message` fields
- Timestamps are in ISO 8601 format
- UUIDs are used for all entity IDs
- Soft delete is implemented for students, faculty, events, and research
