# Human-Readable ID Generator Guide

## Overview

The ID Generator service provides utilities for generating and parsing human-readable IDs for entities in the CCS Backend System. This ensures consistent, predictable, and user-friendly identifiers across the system.

## ID Format

Human-readable IDs follow this format:

```
{PREFIX}-{YEAR}-{SEQUENCE}
```

Where:
- **PREFIX**: Single letter identifying the entity type
  - `S` = Student
  - `F` = Faculty
- **YEAR**: 4-digit year (e.g., 2024)
- **SEQUENCE**: 4-digit zero-padded incremental counter (e.g., 0001, 0042, 9999)

### Examples

- Student IDs: `S-2024-0001`, `S-2024-0042`, `S-2024-9999`
- Faculty IDs: `F-2024-0001`, `F-2024-0042`, `F-2024-9999`

## Requirements Mapping

This implementation satisfies:
- **Requirement 2.3**: Student ID format and generation
- **Requirement 3.2**: Faculty ID format and generation

## Usage

### Generating IDs

```typescript
import { IDGenerator } from '@/shared/utils';

// Generate student ID with explicit year
const studentId = IDGenerator.generate('student', 1, 2024);
// Result: "S-2024-0001"

// Generate faculty ID with current year
const facultyId = IDGenerator.generate('faculty', 42);
// Result: "F-2024-0042" (assuming current year is 2024)

// Generate with large sequence numbers
const id = IDGenerator.generate('student', 9999, 2024);
// Result: "S-2024-9999"
```

### Parsing IDs

```typescript
import { IDGenerator } from '@/shared/utils';

// Parse a valid ID
const parsed = IDGenerator.parse('S-2024-0001');
// Result: { prefix: 'S', year: 2024, sequence: 1 }

// Parse invalid ID
const invalid = IDGenerator.parse('INVALID-ID');
// Result: null
```

### Validating IDs

```typescript
import { IDGenerator } from '@/shared/utils';

// Validate ID format
const isValid = IDGenerator.isValid('S-2024-0001');
// Result: true

const isInvalid = IDGenerator.isValid('INVALID');
// Result: false
```

### Getting Entity Type

```typescript
import { IDGenerator } from '@/shared/utils';

// Extract entity type from ID
const entityType = IDGenerator.getEntityType('S-2024-0001');
// Result: "student"

const facultyType = IDGenerator.getEntityType('F-2024-0001');
// Result: "faculty"

const invalid = IDGenerator.getEntityType('INVALID');
// Result: null
```

### Utility Methods

```typescript
import { IDGenerator } from '@/shared/utils';

// Get prefix for entity type
const prefix = IDGenerator.getPrefix('student');
// Result: "S"

// Get current year
const year = IDGenerator.getCurrentYear();
// Result: 2024 (current year)
```

## Integration with Services

The ID Generator is designed to work with the entity counter system (Task 16.7-16.8). Here's how it integrates:

### Service Layer Integration

```typescript
// services/student.service.ts
import { IDGenerator } from '@/shared/utils';
import { CounterRepository } from '@/repositories/counter.repository';

export class StudentService {
  constructor(
    private counterRepository: CounterRepository,
    private studentRepository: StudentRepository
  ) {}

  async createStudent(data: CreateStudentDTO): Promise<StudentResponseDTO> {
    return await this.db.transaction(async (tx) => {
      // Get current year
      const year = IDGenerator.getCurrentYear();
      
      // Get next sequence number from counter
      const sequence = await this.counterRepository.incrementCounter(
        'student',
        year,
        tx
      );
      
      // Generate human-readable ID
      const studentId = IDGenerator.generate('student', sequence, year);
      
      // Create student with generated ID
      const student = await this.studentRepository.create({
        ...data,
        student_id: studentId,
      }, tx);
      
      return this.toResponseDTO(student);
    });
  }
}
```

## Design Decisions

### Why Static Methods?

The ID Generator uses static methods because:
1. **Stateless**: No instance state is needed
2. **Pure Functions**: Same input always produces same output
3. **Simple API**: No need to instantiate before use
4. **Performance**: No object allocation overhead

### Why Zero-Padding?

Sequence numbers are zero-padded to 4 digits because:
1. **Consistent Length**: Makes IDs predictable and easier to read
2. **Sortable**: Lexicographic sorting matches numeric sorting
3. **Professional Appearance**: Looks more polished than variable-length numbers
4. **Database Indexing**: Fixed-length strings are more efficient to index

### Why Year-Based Sequences?

Including the year in the ID format provides:
1. **Context**: Immediately shows when the entity was created
2. **Reset Capability**: Sequences can reset each year if desired
3. **Scalability**: Prevents sequence number exhaustion
4. **Audit Trail**: Year provides temporal context

## Validation Rules

The ID Generator enforces these validation rules:

1. **Prefix**: Must be exactly one character (S or F)
2. **Year**: Must be exactly 4 digits
3. **Sequence**: Must be exactly 4 digits (zero-padded)
4. **Separators**: Must use hyphens (-) between components
5. **Format**: Must match pattern `^[SF]-\d{4}-\d{4}$`

## Error Handling

The ID Generator uses null returns for invalid inputs rather than throwing exceptions:

```typescript
// Returns null instead of throwing
const parsed = IDGenerator.parse('INVALID');
if (parsed === null) {
  // Handle invalid ID
}
```

This design choice:
- Avoids exception overhead
- Makes error handling explicit
- Follows functional programming patterns
- Simplifies testing

## Testing

The ID Generator includes comprehensive unit tests covering:

- ✅ Generation with different entity types
- ✅ Sequence number padding
- ✅ Current year default
- ✅ Parsing valid and invalid IDs
- ✅ Validation logic
- ✅ Entity type extraction
- ✅ Round-trip generation and parsing
- ✅ Edge cases (zero sequence, large numbers, different years)

Run tests with:

```bash
npm test -- idGenerator.test.ts
```

## Future Enhancements

Potential future improvements:

1. **Additional Entity Types**: Add support for other entities (events, research, etc.)
2. **Custom Prefixes**: Allow configuration of custom prefixes
3. **Sequence Length**: Make sequence length configurable
4. **Checksum**: Add checksum digit for validation
5. **Collision Detection**: Add methods to check for ID conflicts

## Related Tasks

- **Task 16.5**: UUID v7 generator (primary keys)
- **Task 16.7**: Entity counter table (sequence storage)
- **Task 16.8**: Counter repository (sequence management)
- **Task 16.9**: Integration into services (usage in create operations)

## API Reference

### Types

```typescript
type EntityType = 'student' | 'faculty';

interface IDGeneratorConfig {
  prefix: string;
  year: number;
  sequence: number;
}
```

### Methods

#### `generate(entityType, sequence, year?)`

Generates a human-readable ID.

**Parameters:**
- `entityType: EntityType` - The entity type ('student' or 'faculty')
- `sequence: number` - The sequence number
- `year?: number` - Optional year (defaults to current year)

**Returns:** `string` - Formatted ID

#### `parse(id)`

Parses an ID into its components.

**Parameters:**
- `id: string` - The ID to parse

**Returns:** `IDGeneratorConfig | null` - Parsed components or null if invalid

#### `isValid(id)`

Validates an ID format.

**Parameters:**
- `id: string` - The ID to validate

**Returns:** `boolean` - True if valid

#### `getEntityType(id)`

Extracts entity type from an ID.

**Parameters:**
- `id: string` - The ID to extract from

**Returns:** `EntityType | null` - Entity type or null if invalid

#### `getPrefix(entityType)`

Gets the prefix for an entity type.

**Parameters:**
- `entityType: EntityType` - The entity type

**Returns:** `string` - The prefix character

#### `getCurrentYear()`

Gets the current year.

**Returns:** `number` - Current year
