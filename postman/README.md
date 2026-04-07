# Postman Collection

Single-file Postman collection for the CCS Profiling API.

## 🚀 Quick Start

1. **Import Collection**
   - Open Postman
   - Click **Import**
   - Select `ccs-profiling-api.postman_collection.json`

2. **Configure Base URL** (if needed)
   - Click on the collection name
   - Go to **Variables** tab
   - Update `base_url` (default: `http://localhost:3000`)

3. **Login**
   - Send request: `Auth > Login`
   - Tokens automatically saved to collection variables

4. **Test Endpoints**
   - All requests now work with saved token
   - No additional setup needed

## 📋 Collection Variables

Built-in variables (no separate environment needed):

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://localhost:3000` | API server URL |
| `token` | (empty) | Auto-populated after login |
| `refreshToken` | (empty) | Auto-populated after login |

## 🔐 Authentication

- Login request automatically saves tokens
- All admin endpoints use saved token
- Refresh token endpoint updates both tokens
- No manual token copying needed

### Test Credentials

All users have the password: `pass1234`

**Admin Users:**
- `admin@ccs.edu`
- `superadmin@ccs.edu`

**Faculty Users:**
- `john.doe@ccs.edu` (Computer Science)
- `jane.smith@ccs.edu` (Information Technology)
- `robert.johnson@ccs.edu` (Computer Science)

**Student Users:**
- `student1@ccs.edu` (Alice Williams - 2021-00001)
- `student2@ccs.edu` (Bob Brown - 2021-00002)
- `student3@ccs.edu` (Charlie Davis - 2022-00001)
- `student4@ccs.edu` (Diana Miller - 2022-00002)
- `student5@ccs.edu` (Edward Wilson - 2023-00001)

## 📚 Available Endpoints

- **Auth**: Login, logout, refresh, change password, get current user
- **Students**: CRUD operations, profile aggregation
- **Faculty**: CRUD operations, department filtering
- **Instructions**: Subject/course management
- **Enrollments**: Student course enrollment management
- **Academic History**: Student grade records, GPA calculation
- **Skills**: Student skills management
- **Violations**: Student violation records
- **Affiliations**: Student organization memberships
- **Events**: Event management, participant tracking
- **Scheduling**: Schedule creation, conflict detection
- **Research**: Research project management, author/adviser tracking
- **Uploads**: File upload management with entity association
- **Audit Logs**: Complete audit trail for all system operations (NEW)
- **Analytics**: Dashboard metrics, GPA/skill distribution

## 💡 Tips

- All endpoints use `/api/v1/` prefix
- Admin endpoints use `/api/v1/admin/` prefix
- List endpoints support pagination (`?page=1&limit=10`)
- Auth endpoints are rate limited (5 req/15min)
- Audit logs track all create, update, and delete operations
- Audit logs include before/after states for compliance tracking
- Use audit logs to investigate changes and track user activity

## 🔍 Audit Logs Features

The Audit Logs module provides comprehensive tracking:

- **Track all mutations**: Create, update, and delete operations
- **Before/after states**: JSONB capture of state changes
- **User tracking**: See who made each change
- **Entity history**: View complete timeline for any entity
- **Compliance ready**: IP address and user agent tracking
- **Date range filtering**: Query logs by time period
- **Retention**: Logs retained for at least 1 year

### Audit Log Endpoints

1. `GET /api/v1/admin/audit-logs` - List all audit logs with filters
2. `GET /api/v1/admin/audit-logs/:id` - Get specific audit log
3. `GET /api/v1/admin/audit-logs/user/:userId` - User activity tracking
4. `GET /api/v1/admin/audit-logs/entity/:entityType/:entityId` - Entity history

## 🔗 Documentation

See collection description in Postman for detailed endpoint documentation.
