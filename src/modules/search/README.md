# Search Module

The Search Module provides comprehensive search functionality across all major entities in the CCS Profiling System.

## Features

- **Partial Text Matching**: All searches support partial text matching (case-insensitive)
- **Multi-Entity Search**: Search across students, faculty, events, and research simultaneously
- **Entity-Specific Search**: Search individual entity types for focused results
- **Performance Optimized**: Returns results within 500ms (Requirement 18.6)
- **Batch Query Prevention**: Uses efficient queries to prevent N+1 problems

## Architecture

The module follows the three-layer architecture:

```
search/
├── types/              # DTOs and interfaces
│   └── dtos.ts
├── schemas/            # Zod validation schemas
│   └── search.schema.ts
├── services/           # Business logic
│   ├── search.service.ts
│   └── search.service.test.ts
├── controllers/        # HTTP handlers
│   └── search.controller.ts
├── routes/             # Route definitions
│   └── search.routes.ts
└── index.ts            # Module exports
```

## API Endpoints

All endpoints require authentication and admin role.

### Global Search

```
GET /api/v1/admin/search?q=query&type=students
```

**Query Parameters:**
- `q` (required): Search query string
- `type` (optional): Entity type filter (`students`, `faculty`, `events`, `research`)

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [...],
    "faculty": [...],
    "events": [...],
    "research": [...],
    "meta": {
      "total": 42,
      "query": "john"
    }
  }
}
```

### Search Students

```
GET /api/v1/admin/search/students?q=query
```

Searches students by:
- First name (partial match)
- Last name (partial match)
- Student ID (partial match)

**Requirements:** 18.1, 18.5

### Search Faculty

```
GET /api/v1/admin/search/faculty?q=query
```

Searches faculty by:
- First name (partial match)
- Last name (partial match)
- Faculty ID (partial match)

**Requirements:** 18.2, 18.5

### Search Events

```
GET /api/v1/admin/search/events?q=query
```

Searches events by:
- Event name (partial match)
- Event type (partial match)

**Requirements:** 18.3, 18.5

### Search Research

```
GET /api/v1/admin/search/research?q=query
```

Searches research by:
- Title (partial match)
- Author names (via join)

**Requirements:** 18.4, 18.5

## Usage Examples

### Global Search

```typescript
// Search across all entities
const response = await fetch('/api/v1/admin/search?q=john', {
  headers: { Authorization: `Bearer ${token}` }
});

const { data } = await response.json();
console.log(`Found ${data.meta.total} results`);
```

### Entity-Specific Search

```typescript
// Search only students
const response = await fetch('/api/v1/admin/search/students?q=john', {
  headers: { Authorization: `Bearer ${token}` }
});

const { data } = await response.json();
console.log(`Found ${data.length} students`);
```

### Filtered Global Search

```typescript
// Search only students using global endpoint
const response = await fetch('/api/v1/admin/search?q=john&type=students', {
  headers: { Authorization: `Bearer ${token}` }
});

const { data } = await response.json();
console.log(`Found ${data.students.length} students`);
```

## Performance Considerations

1. **Batch Queries**: Research search uses batch queries to fetch authors, preventing N+1 problems
2. **Result Limits**: Search results are limited to 100 items per entity type
3. **Parallel Execution**: Global search executes all entity searches in parallel using `Promise.all`
4. **Database Indexes**: Leverages existing indexes on name fields and IDs for fast lookups

## Testing

Run the search module tests:

```bash
npm test -- src/modules/search/services/search.service.test.ts --run
```

## Requirements Coverage

- ✅ Requirement 18.1: Search students by name or student_id with partial text matching
- ✅ Requirement 18.2: Search faculty by name or faculty_id with partial text matching
- ✅ Requirement 18.3: Search events by name or type with partial text matching
- ✅ Requirement 18.4: Search research by title or author with partial text matching
- ✅ Requirement 18.5: Support partial text matching in search queries
- ✅ Requirement 18.6: Return search results within 500ms

## Future Enhancements

- Full-text search using PostgreSQL's `tsvector` and `tsquery`
- Search result ranking and relevance scoring
- Search history and suggestions
- Advanced filters (date ranges, status, etc.)
- Pagination for large result sets
