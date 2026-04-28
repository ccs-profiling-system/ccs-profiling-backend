# Postman Collections for CCS Profiling Backend

This directory contains Postman collections for testing the CCS Profiling Backend API.

## Collections

### 1. **ccs-profiling-api.postman_collection.json**
Main API collection for general endpoints including admin approval system.

### 2. **chair-portal-api.postman_collection.json**
Complete API collection for Chair Portal endpoints with automatic authentication. Includes read-only access to curriculum and subjects data with export functionality.

### 3. **faculty-portal-api.postman_collection.json**
Complete API collection for Faculty Portal endpoints with automatic authentication. Includes department chair approval review endpoints.

### 4. **secretary-portal-api.postman_collection.json**
Complete API collection for Secretary Portal endpoints with automatic authentication. Includes approval submission and tracking endpoints.

### 5. **student-portal-api.postman_collection.json**
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

### Secretary Accounts (1 account)
- `secretary@ccs.edu`
- Role: `secretary`
- Permissions: All `secretary.*` permissions including approval submission

### Department Chair Accounts
- `chair.cs@ccs.edu` - Department Chair (Computer Science)
- Role: `department_chair` (NOT `faculty`)
- Permissions: All `chair.*` permissions including approval review and curriculum read access
- Password: `pass1234`

### Chair Portal Permissions

Department chairs have access to the following permissions:

**Curriculum & Subjects (Read-Only):**
- `chair.curriculum.read` - View curriculum and subjects data
  - List curriculum with pagination and filters
  - View curriculum details
  - List subjects with pagination and filters
  - View subject details
  - Export curriculum to PDF and Excel
  - View curriculum statistics

**Approval Review:**
- `chair.approval.review` - Review approval requests
- `chair.approval.approve` - Approve requests
- `chair.approval.reject` - Reject requests
- `chair.approval.bulk_action` - Perform bulk approve/reject

**Dashboard & Reports:**
- `chair.dashboard.read` - View dashboard statistics
- `chair.students.read` - View student records
- `chair.faculty.read` - View faculty records
- `chair.schedules.read` - View schedules
- `chair.events.read` - View events
- `chair.research.read` - View research projects
- `chair.reports.read` - View reports

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

### Approval System Permissions

The approval system has role-specific permissions:

**Secretary Permissions:**
- `secretary.approval.submit` - Submit approval requests
- `secretary.approval.view_own` - View own submissions
- `secretary.approval.withdraw` - Withdraw pending submissions

**Department Chair Permissions:**
- `chair.approval.review` - Review approval requests
- `chair.approval.approve` - Approve requests
- `chair.approval.reject` - Reject requests
- `chair.approval.bulk_action` - Perform bulk approve/reject

**Admin Permissions:**
- `admin.approval.*` - Full approval system access
- Can view, approve, reject all requests system-wide
- Access to audit logs and advanced features

## How to Use

1. **Import Collection**: Import the desired collection into Postman
2. **Set Base URL**: Update the `baseUrl` variable (default: `http://localhost:3000/api`)
3. **Login**: Use the Login endpoint with test credentials
4. **Auto-Authentication**: The collection automatically captures and uses the access token
5. **Test Endpoints**: All subsequent requests will use the captured token

## Using the Approval System

The approval system allows secretaries to submit requests that require department chair or admin approval.

### Workflow:

1. **Secretary Submits Request** (Secretary Portal)
   - Use `POST /secretary/approvals` to submit a new approval request
   - Specify entity type (event, research, document, schedule)
   - Provide change data and reason
   - System auto-captures approval ID

2. **Chair Reviews Request** (Faculty Portal - Chair)
   - Use `GET /chair/approvals/pending` to see pending requests
   - Use `GET /chair/approvals/:id` to view details
   - Use `PATCH /chair/approvals/:id/approve` to approve
   - Use `PATCH /chair/approvals/:id/reject` to reject with reason

3. **Secretary Tracks Status** (Secretary Portal)
   - Use `GET /secretary/approvals/my-submissions` to view all submissions
   - Use `GET /secretary/approvals/my-submissions/:id` for details
   - Use `PATCH /secretary/approvals/:id/withdraw` to withdraw if needed

4. **Admin Oversight** (Main CCS API)
   - Use `GET /api/admin/approvals/pending` to see all pending requests
   - Use `GET /api/admin/approvals/stats` for system-wide statistics
   - Use `GET /api/admin/approvals/audit-logs` for audit trail
   - Can approve/reject any request with override capability

### Approval Entity Types:
- `event` - Event creation/modification
- `research` - Research project changes
- `document` - Document uploads
- `schedule` - Schedule modifications

### Approval Statuses:
- `pending` - Awaiting review
- `approved` - Approved by reviewer
- `rejected` - Rejected with reason
- `withdrawn` - Withdrawn by submitter

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
