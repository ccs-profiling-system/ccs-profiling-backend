# Postman Collections for CCS Profiling Backend

This directory contains Postman collections for testing the CCS Profiling Backend API.

## Collections

### 1. **ccs-profiling-api.postman_collection.json**
Main API collection for general endpoints.

### 2. **faculty-portal-api.postman_collection.json**
Complete API collection for Faculty Portal endpoints with automatic authentication.

### 3. **student-portal-api.postman_collection.json**
Complete API collection for Student Portal endpoints with automatic authentication.

## Test Credentials

All seeded users have the password: `pass1234`

### Student Accounts (10 accounts)
- `student1@ccs.edu` to `student10@ccs.edu`
- Role: `student`
- Permissions: All `student.*` permissions (profile, dashboard, courses, grades, research, events, advisor)

### Faculty Accounts (4 accounts)
- `john.doe@ccs.edu` - Professor, AI Specialization
- `jane.smith@ccs.edu` - Associate Professor, Network Security
- `robert.johnson@ccs.edu` - Assistant Professor, Software Engineering
- `chair.cs@ccs.edu` - Department Chair
- Role: `faculty`
- Permissions: All `faculty.*` permissions

### Admin Accounts (2 accounts)
- `admin@ccs.edu`
- `superadmin@ccs.edu`
- Role: `admin`
- Permissions: All permissions (`*.*`)

## RBAC Permissions

The system uses Role-Based Access Control (RBAC) with permissions defined in `src/rbac/config/permissions.config.ts`.

### Student Portal Permissions

Students have access to the following permissions via the `student.*` wildcard:

- `student.profile.read` - View own student profile
- `student.profile.update` - Update own profile (email, phone)
- `student.dashboard.read` - View dashboard summary
- `student.progress.read` - View academic progress
- `student.financial.read` - View financial records
- `student.notification.read` - View notifications
- `student.notification.update` - Mark notifications as read
- `student.course.read` - View enrolled courses and schedule
- `student.grade.read` - View grades and GPA
- `student.research.read` - View research opportunities
- `student.research.apply` - Apply to research opportunities
- `student.event.read` - View events
- `student.event.register` - Register/unregister for events
- `student.advisor.read` - View advisor information
- `student.advisor.message` - Send messages to advisor
- `student.advisor.appointment` - Book appointments with advisor

## How to Use

1. **Import Collection**: Import the desired collection into Postman
2. **Set Base URL**: Update the `baseUrl` variable (default: `http://localhost:3000/api`)
3. **Login**: Use the Login endpoint with test credentials
4. **Auto-Authentication**: The collection automatically captures and uses the access token
5. **Test Endpoints**: All subsequent requests will use the captured token

## Auto-Capture Features

The collections include scripts that automatically:
- Capture access token on login
- Capture refresh token
- Capture user ID, email, and role
- Capture student ID or faculty ID
- Set token expiry time
- Use bearer token authentication for all requests

## Troubleshooting

### "Insufficient permissions" Error

If you get a 403 Forbidden error with "Insufficient permissions":

1. **Verify Login**: Make sure you're logged in with the correct role
2. **Check Token**: Ensure the access token is captured (check collection variables)
3. **Verify Role**: Check that the user role matches the endpoint requirements
4. **Check Permissions**: Verify the role has the required permission in `permissions.config.ts`

### "Token expired" Error

If you get a 401 Unauthorized error:

1. Use the "Refresh Token" endpoint to get a new access token
2. Or login again to get fresh tokens

### Database Not Seeded

If you get "Not found" errors for students, courses, etc.:

1. Run the seed script: `npm run seed`
2. Or reset and seed: `npm run db:reset && npm run seed`

## Environment Variables

The collections use the following variables:

- `baseUrl` - API base URL (default: `http://localhost:3000/api`)
- `accessToken` - JWT access token (auto-captured on login)
- `refreshToken` - JWT refresh token (auto-captured on login)
- `userId` - User UUID (auto-captured on login)
- `userEmail` - User email (auto-captured on login)
- `userRole` - User role (auto-captured on login)
- `studentId` - Student ID (auto-captured for student logins)
- `facultyId` - Faculty ID (auto-captured for faculty logins)
- `tokenExpiry` - Token expiration timestamp (auto-calculated)

## Notes

- All endpoints require authentication except the login endpoint
- The system uses JWT bearer token authentication
- Permissions are checked on every request using RBAC middleware
- Students can only access their own data (enforced by student-scoping utilities)
- Faculty can only access their assigned courses and research
- Department chairs have broader access within their department
