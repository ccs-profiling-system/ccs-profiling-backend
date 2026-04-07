# Validation Middleware

## Overview

The validation middleware provides Zod-based request validation for Express routes. It validates request bodies, query parameters, and route parameters against defined schemas, automatically formatting validation errors according to the API response format.

**Implements Requirements:** 21.1, 21.2

## Features

- ✅ Zod schema validation for request data
- ✅ Validates body, query, and params
- ✅ Automatic error formatting with field-specific messages
- ✅ Integration with global error handler
- ✅ Support for schema transformations and defaults
- ✅ Multiple request part validation

## Usage

### Basic Validation

```typescript
import { validate } from '@/shared/middleware/validator';
import { z } from 'zod';

// Define schema
const createStudentSchema = z.object({
  student_id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  year_level: z.number().int().min(1).max(5).optional(),
});

// Apply to route
router.post(
  '/students',
  validate(createStudentSchema, 'body'),
  studentController.create
);
```

### Validate Query Parameters

```typescript
const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)),
  limit: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)),
  search: z.string().optional(),
});

router.get(
  '/students',
  validate(paginationSchema, 'query'),
  studentController.list
);
```

### Validate Route Parameters

```typescript
const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

router.get(
  '/students/:id',
  validate(uuidParamSchema, 'params'),
  studentController.getById
);
```

### Validate Multiple Request Parts

```typescript
import { validateMultiple } from '@/shared/middleware/validator';

const schemas = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  query: z.object({
    include: z.string().optional(),
  }),
};

router.put(
  '/students/:id',
  validateMultiple(schemas),
  studentController.update
);
```

## Schema Examples

### Student Creation

```typescript
const createStudentSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  middle_name: z.string().optional(),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  year_level: z.number().int().min(1).max(5).optional(),
  program: z.string().optional(),
});
```

### Student Update

```typescript
const updateStudentSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  year_level: z.number().int().min(1).max(5).optional(),
  status: z.enum(['active', 'inactive', 'graduated']).optional(),
});
```

### Pagination

```typescript
const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => parseInt(val, 10))
    .default('1'),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => parseInt(val, 10))
    .default('10'),
  search: z.string().optional(),
  sort: z.enum(['asc', 'desc']).optional(),
});
```

### Enum Validation

```typescript
const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'graduated']),
});
```

### Nested Objects

```typescript
const createResearchSchema = z.object({
  title: z.string().min(1),
  abstract: z.string().optional(),
  research_type: z.enum(['thesis', 'capstone', 'publication']),
  authors: z.array(
    z.object({
      student_id: z.string().uuid(),
      author_order: z.number().int().positive(),
    })
  ),
  advisers: z.array(
    z.object({
      faculty_id: z.string().uuid(),
      adviser_role: z.enum(['adviser', 'co-adviser', 'panelist']),
    })
  ),
});
```

## Error Response Format

When validation fails, the middleware throws a `ValidationError` which is caught by the global error handler and formatted as:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email",
          "code": "invalid_string"
        },
        {
          "field": "year_level",
          "message": "Number must be less than or equal to 5",
          "code": "too_big"
        }
      ]
    }
  }
}
```

## Schema Transformations

Zod schemas support transformations that are applied after validation:

```typescript
const schema = z.object({
  // Trim whitespace
  name: z.string().trim(),
  
  // Convert string to number
  age: z.string().transform((val) => parseInt(val, 10)),
  
  // Convert to lowercase
  email: z.string().email().toLowerCase(),
  
  // Apply default value
  status: z.string().default('active'),
  
  // Custom transformation
  tags: z.array(z.string()).transform((tags) => tags.map(t => t.toLowerCase())),
});
```

## Best Practices

### 1. Define Schemas in Schema Files

```typescript
// src/modules/students/schemas/student.schema.ts
export const createStudentSchema = z.object({
  // ... schema definition
});

export const updateStudentSchema = z.object({
  // ... schema definition
});
```

### 2. Reuse Common Schemas

```typescript
// src/shared/schemas/common.schema.ts
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
});
```

### 3. Use Custom Error Messages

```typescript
const schema = z.object({
  email: z.string().email('Please provide a valid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
```

### 4. Combine with Sanitization

```typescript
import { sanitizeObject } from '@/shared/utils/sanitization';

router.post(
  '/students',
  validate(createStudentSchema, 'body'),
  (req, res, next) => {
    // Sanitize after validation
    req.body = sanitizeObject(req.body);
    next();
  },
  studentController.create
);
```

### 5. Validate Before Business Logic

Always place validation middleware before controller logic:

```typescript
// ✅ CORRECT
router.post(
  '/students',
  validate(createStudentSchema, 'body'),
  studentController.create
);

// ❌ WRONG - validation after controller
router.post(
  '/students',
  studentController.create,
  validate(createStudentSchema, 'body')
);
```

## Common Validation Patterns

### UUID Validation

```typescript
const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});
```

### Date Validation

```typescript
const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});
```

### Optional Fields with Defaults

```typescript
const schema = z.object({
  status: z.string().default('active'),
  is_active: z.boolean().default(true),
});
```

### Array Validation

```typescript
const schema = z.object({
  tags: z.array(z.string().min(1)).min(1, 'At least one tag is required'),
  skills: z.array(z.object({
    name: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
  })),
});
```

### Conditional Validation

```typescript
const schema = z.object({
  type: z.enum(['student', 'faculty']),
  student_id: z.string().optional(),
  faculty_id: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === 'student') return !!data.student_id;
    if (data.type === 'faculty') return !!data.faculty_id;
    return true;
  },
  {
    message: 'student_id required for students, faculty_id required for faculty',
  }
);
```

## Testing

### Unit Tests

```typescript
import { validate } from '@/shared/middleware/validator';
import { z } from 'zod';

describe('validate middleware', () => {
  it('should pass validation for valid data', () => {
    const schema = z.object({ name: z.string() });
    const req = { body: { name: 'John' } };
    const next = vi.fn();
    
    validate(schema, 'body')(req, {}, next);
    
    expect(next).toHaveBeenCalledWith();
  });
});
```

### Integration Tests

```typescript
import request from 'supertest';
import app from '@/app';

describe('POST /students', () => {
  it('should validate student creation', async () => {
    const response = await request(app)
      .post('/students')
      .send({
        student_id: '2021-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      });
    
    expect(response.status).toBe(201);
  });
  
  it('should reject invalid data', async () => {
    const response = await request(app)
      .post('/students')
      .send({
        student_id: '',
        email: 'invalid-email',
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

## Related Documentation

- [Input Sanitization Utilities](../utils/SANITIZATION_UTILS.md)
- [Error Handling](./errorHandler.ts)
- [API Response Format](../utils/apiResponse.ts)
- [Zod Documentation](https://zod.dev/)
