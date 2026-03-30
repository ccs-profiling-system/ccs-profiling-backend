# Input Sanitization Utilities

## Overview

Input sanitization utilities provide functions to clean and sanitize user input, preventing XSS attacks, SQL injection, and other security vulnerabilities. These utilities should be used in conjunction with validation middleware for defense-in-depth security.

**Implements Requirements:** 21.1, 21.2

## Features

- ✅ HTML tag removal
- ✅ XSS prevention
- ✅ SQL injection prevention
- ✅ Directory traversal prevention
- ✅ Email sanitization
- ✅ Phone number sanitization
- ✅ URL sanitization
- ✅ Filename sanitization
- ✅ Recursive object sanitization

## Available Functions

### sanitizeString

Removes HTML tags, null bytes, and normalizes whitespace.

```typescript
import { sanitizeString } from '@/shared/utils/sanitization';

sanitizeString('<script>alert("xss")</script>'); // Returns: 'alert("xss")'
sanitizeString('  Hello   World  '); // Returns: 'Hello World'
sanitizeString('Test\0String'); // Returns: 'TestString'
```

### sanitizeEmail

Converts email to lowercase and removes dangerous characters.

```typescript
import { sanitizeEmail } from '@/shared/utils/sanitization';

sanitizeEmail('  USER@EXAMPLE.COM  '); // Returns: 'user@example.com'
sanitizeEmail('<user@example.com>'); // Returns: 'user@example.com'
```

### sanitizePhone

Removes non-numeric characters except + and -.

```typescript
import { sanitizePhone } from '@/shared/utils/sanitization';

sanitizePhone('+1 (234) 567-8900'); // Returns: '+1234567-8900'
sanitizePhone('(555) 123-4567'); // Returns: '555123-4567'
```

### sanitizeUrl

Validates and sanitizes URLs, blocking dangerous protocols.

```typescript
import { sanitizeUrl } from '@/shared/utils/sanitization';

sanitizeUrl('https://example.com'); // Returns: 'https://example.com'
sanitizeUrl('javascript:alert(1)'); // Returns: '' (blocked)
sanitizeUrl('data:text/html,<script>'); // Returns: '' (blocked)
```

**Blocked protocols:**
- `javascript:`
- `data:`
- `vbscript:`
- `file:`

**Allowed protocols:**
- `http://`
- `https://`
- Relative URLs (`/path`, `./path`)

### sanitizeObject

Recursively sanitizes all string values in an object.

```typescript
import { sanitizeObject } from '@/shared/utils/sanitization';

const input = {
  name: '  John Doe  ',
  email: 'USER@EXAMPLE.COM',
  bio: '<script>alert("xss")</script>Hello',
  age: 25,
};

const sanitized = sanitizeObject(input);
// Returns:
// {
//   name: 'John Doe',
//   email: 'user@example.com',
//   bio: 'alert("xss")Hello',
//   age: 25
// }
```

**With custom field options:**

```typescript
const input = {
  name: 'John',
  contact_email: '  USER@EXAMPLE.COM  ',
  mobile_number: '+1 (234) 567-8900',
};

const sanitized = sanitizeObject(input, {
  emailFields: ['contact_email'],
  phoneFields: ['mobile_number'],
});
```

### sanitizeSqlInput

Removes SQL comment markers and statement terminators.

**Note:** This is a defense-in-depth measure. Always use parameterized queries.

```typescript
import { sanitizeSqlInput } from '@/shared/utils/sanitization';

sanitizeSqlInput("'; DROP TABLE users; --"); // Returns: "' DROP TABLE users "
sanitizeSqlInput('/* comment */ SELECT'); // Returns: ' comment  SELECT'
```

### sanitizeFilename

Prevents directory traversal and removes dangerous characters.

```typescript
import { sanitizeFilename } from '@/shared/utils/sanitization';

sanitizeFilename('../../../etc/passwd'); // Returns: '___etc_passwd'
sanitizeFilename('my file.txt'); // Returns: 'my_file.txt'
sanitizeFilename('file<>:"|?*.txt'); // Returns: 'file.txt'
```

### escapeHtml

Escapes HTML special characters to prevent XSS.

```typescript
import { escapeHtml } from '@/shared/utils/sanitization';

escapeHtml('<script>alert("xss")</script>');
// Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

escapeHtml('Tom & Jerry'); // Returns: 'Tom &amp; Jerry'
```

## Usage Patterns

### 1. Sanitize After Validation

```typescript
import { validate } from '@/shared/middleware/validator';
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

### 2. Sanitize in Service Layer

```typescript
import { sanitizeObject } from '@/shared/utils/sanitization';

class StudentService {
  async createStudent(data: CreateStudentDTO) {
    // Sanitize input data
    const sanitizedData = sanitizeObject(data);
    
    // Proceed with business logic
    const student = await this.studentRepository.create(sanitizedData);
    return this.toResponseDTO(student);
  }
}
```

### 3. Sanitize User-Generated Content

```typescript
import { sanitizeString, escapeHtml } from '@/shared/utils/sanitization';

// For storage (remove HTML)
const bioForStorage = sanitizeString(userInput.bio);

// For display (escape HTML)
const bioForDisplay = escapeHtml(userInput.bio);
```

### 4. Sanitize File Uploads

```typescript
import { sanitizeFilename } from '@/shared/utils/sanitization';

const uploadFile = async (file: Express.Multer.File) => {
  const safeFilename = sanitizeFilename(file.originalname);
  const timestamp = Date.now();
  const finalFilename = `${timestamp}_${safeFilename}`;
  
  // Save file with sanitized name
  await saveFile(finalFilename, file.buffer);
};
```

### 5. Sanitize Search Queries

```typescript
import { sanitizeString, sanitizeSqlInput } from '@/shared/utils/sanitization';

const searchStudents = async (query: string) => {
  // Sanitize search input
  const sanitizedQuery = sanitizeSqlInput(sanitizeString(query));
  
  // Use parameterized query (primary defense)
  const results = await db
    .select()
    .from(students)
    .where(like(students.name, `%${sanitizedQuery}%`));
  
  return results;
};
```

## Security Best Practices

### Defense in Depth

Use multiple layers of security:

1. **Input Validation** (First line of defense)
   ```typescript
   validate(schema, 'body')
   ```

2. **Input Sanitization** (Second line of defense)
   ```typescript
   req.body = sanitizeObject(req.body)
   ```

3. **Parameterized Queries** (Third line of defense)
   ```typescript
   db.select().from(users).where(eq(users.id, userId))
   ```

4. **Output Encoding** (Fourth line of defense)
   ```typescript
   escapeHtml(userContent)
   ```

### When to Use Each Function

| Function | Use Case | Example |
|----------|----------|---------|
| `sanitizeString` | General text input | Names, descriptions, comments |
| `sanitizeEmail` | Email addresses | User registration, contact forms |
| `sanitizePhone` | Phone numbers | Contact information |
| `sanitizeUrl` | URLs and links | Website fields, publication URLs |
| `sanitizeObject` | Complex objects | Request bodies, nested data |
| `sanitizeSqlInput` | Search queries | Full-text search (with parameterized queries) |
| `sanitizeFilename` | File uploads | Original filenames |
| `escapeHtml` | Display content | Rendering user content in HTML |

### What NOT to Do

❌ **Don't rely solely on sanitization**
```typescript
// BAD: Only sanitization, no validation
const data = sanitizeObject(req.body);
await createStudent(data);
```

✅ **Do validate first, then sanitize**
```typescript
// GOOD: Validation + sanitization
router.post(
  '/students',
  validate(createStudentSchema, 'body'),
  (req, res, next) => {
    req.body = sanitizeObject(req.body);
    next();
  },
  studentController.create
);
```

❌ **Don't use sanitization as SQL injection prevention**
```typescript
// BAD: String concatenation with sanitization
const query = `SELECT * FROM users WHERE name = '${sanitizeSqlInput(name)}'`;
```

✅ **Do use parameterized queries**
```typescript
// GOOD: Parameterized query (primary defense)
const users = await db
  .select()
  .from(users)
  .where(eq(users.name, sanitizeString(name)));
```

## Common Patterns

### Sanitize Request Body

```typescript
import { sanitizeObject } from '@/shared/utils/sanitization';

app.use(express.json());
app.use((req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
});
```

### Sanitize Specific Fields

```typescript
const sanitizeStudentInput = (data: any) => {
  return {
    ...data,
    first_name: sanitizeString(data.first_name),
    last_name: sanitizeString(data.last_name),
    email: sanitizeEmail(data.email),
    phone: data.phone ? sanitizePhone(data.phone) : undefined,
    bio: sanitizeString(data.bio),
  };
};
```

### Sanitize Array of Objects

```typescript
const sanitizeStudents = (students: any[]) => {
  return students.map(student => sanitizeObject(student));
};
```

### Sanitize Nested Objects

```typescript
const input = {
  student: {
    name: '  John  ',
    email: 'USER@EXAMPLE.COM',
  },
  metadata: {
    tags: ['<script>tag1</script>', '  tag2  '],
  },
};

const sanitized = sanitizeObject(input);
// Recursively sanitizes all nested values
```

## Testing

### Unit Tests

```typescript
import { sanitizeString, sanitizeEmail } from '@/shared/utils/sanitization';

describe('sanitizeString', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>'))
      .toBe('alert("xss")');
  });
  
  it('should normalize whitespace', () => {
    expect(sanitizeString('  Hello   World  '))
      .toBe('Hello World');
  });
});

describe('sanitizeEmail', () => {
  it('should convert to lowercase', () => {
    expect(sanitizeEmail('USER@EXAMPLE.COM'))
      .toBe('user@example.com');
  });
});
```

### Integration Tests

```typescript
import request from 'supertest';
import app from '@/app';

describe('POST /students with sanitization', () => {
  it('should sanitize input data', async () => {
    const response = await request(app)
      .post('/students')
      .send({
        first_name: '  John  ',
        email: 'USER@EXAMPLE.COM',
        bio: '<script>alert("xss")</script>Hello',
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.first_name).toBe('John');
    expect(response.body.data.email).toBe('user@example.com');
    expect(response.body.data.bio).not.toContain('<script>');
  });
});
```

## Performance Considerations

### Sanitize Once

```typescript
// ✅ GOOD: Sanitize once at entry point
router.post('/students', (req, res, next) => {
  req.body = sanitizeObject(req.body);
  next();
}, studentController.create);

// ❌ BAD: Sanitizing multiple times
router.post('/students', (req, res, next) => {
  req.body = sanitizeObject(req.body);
  next();
}, (req, res, next) => {
  req.body = sanitizeObject(req.body); // Redundant
  next();
}, studentController.create);
```

### Selective Sanitization

For large objects, sanitize only necessary fields:

```typescript
// Instead of sanitizing entire object
const sanitized = sanitizeObject(largeObject);

// Sanitize only user-input fields
const sanitized = {
  ...largeObject,
  name: sanitizeString(largeObject.name),
  email: sanitizeEmail(largeObject.email),
  bio: sanitizeString(largeObject.bio),
};
```

## Related Documentation

- [Validation Middleware](../middleware/VALIDATION_MIDDLEWARE.md)
- [Error Handling](../middleware/errorHandler.ts)
- [Security Best Practices](../../docs/SECURITY.md)
