# Data Integrity Quick Reference

Quick reference guide for developers working with the Secretary Portal API data integrity utilities.

## Import Statement

```typescript
import {
  validateStateTransition,
  canUpdate,
  canDelete,
  canSubmit,
  canWithdraw,
  validateEntityExists,
  validateUnique,
  validateDateRange,
  validateNotPastDate,
  validatePositiveInteger,
  softDeleteTimestamp,
} from '../utils/dataIntegrity';
```

## State Transition Validation

### Valid Approval Workflow Transitions

```
draft → pending_approval → approved (terminal)
                        → rejected → draft
                        → withdrawn → draft
```

### Check if Operation is Allowed

```typescript
// Check if entity can be updated
if (!canUpdate(entity.status)) {
  throw new ValidationError(`Cannot update entity with status '${entity.status}'`);
}

// Check if entity can be deleted
if (!canDelete(entity.status)) {
  throw new ValidationError(`Cannot delete entity with status '${entity.status}'`);
}

// Check if entity can be submitted
if (!canSubmit(entity.status)) {
  throw new ValidationError(`Cannot submit entity with status '${entity.status}'`);
}

// Check if entity can be withdrawn
if (!canWithdraw(entity.status)) {
  throw new ValidationError(`Cannot withdraw entity with status '${entity.status}'`);
}
```

### Validate State Transition

```typescript
// Throws ValidationError if transition is invalid
validateStateTransition(currentStatus, newStatus);
```

## Entity Validation

### Validate Entity Exists

```typescript
const student = await getStudentById(id);
validateEntityExists(student, 'Student'); // Throws if null/undefined

// Now TypeScript knows student is not null
console.log(student.name); // ✓ Safe to access
```

### Validate Unique Constraint

```typescript
const exists = await db
  .select()
  .from(students)
  .where(eq(students.student_id, data.student_id))
  .limit(1);

validateUnique(exists.length > 0, 'Student ID'); // Throws if duplicate exists
```

## Date Validation

### Validate Date Range

```typescript
// Throws if end date is before or equal to start date
validateDateRange(startDate, endDate);

// With custom labels
validateDateRange(
  registrationDeadline,
  eventDate,
  'Registration deadline',
  'Event date'
);
```

### Validate Not Past Date

```typescript
// Throws if date is in the past
validateNotPastDate(eventDate);

// With custom label
validateNotPastDate(eventDate, 'Event date');
```

## Number Validation

### Validate Positive Integer

```typescript
// Throws if not a positive integer
validatePositiveInteger(maxParticipants);

// With custom label
validatePositiveInteger(maxParticipants, 'Max participants');
```

## Transaction Pattern

### Standard Transaction Pattern

```typescript
export async function createEntity(data, userId, ipAddress, userAgent) {
  // Use transaction for data integrity
  const result = await db.transaction(async (tx) => {
    // 1. Validate uniqueness
    const existing = await tx
      .select()
      .from(table)
      .where(eq(table.unique_field, data.unique_field))
      .limit(1);
    
    validateUnique(existing.length > 0, 'Field name');
    
    // 2. Create record
    const [newRecord] = await tx
      .insert(table)
      .values({
        ...data,
        status: 'draft', // Initial status for approval workflow
      })
      .returning();
    
    return newRecord;
  });
  
  // 3. Log action (outside transaction)
  await logCreate(userId, 'entity_type', result.id, result, ipAddress, userAgent);
  
  return result;
}
```

### Update with State Validation

```typescript
export async function updateEntity(id, data, userId, ipAddress, userAgent) {
  const result = await db.transaction(async (tx) => {
    // 1. Validate entity exists
    const existing = await tx
      .select()
      .from(table)
      .where(and(eq(table.id, id), isNull(table.deleted_at)))
      .limit(1);
    
    validateEntityExists(existing[0], 'Entity');
    
    const oldValues = existing[0];
    
    // 2. Validate state allows updates
    if (!canUpdate(oldValues.status)) {
      throw new ValidationError(`Cannot update entity with status '${oldValues.status}'`);
    }
    
    // 3. Update record
    const [updated] = await tx
      .update(table)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(table.id, id))
      .returning();
    
    return updated;
  });
  
  // Log action
  await logUpdate(userId, 'entity_type', id, oldValues, result, ipAddress, userAgent);
  
  return result;
}
```

### Delete with State Validation

```typescript
export async function deleteEntity(id, userId, ipAddress, userAgent) {
  const result = await db.transaction(async (tx) => {
    // 1. Validate entity exists
    const existing = await tx
      .select()
      .from(table)
      .where(and(eq(table.id, id), isNull(table.deleted_at)))
      .limit(1);
    
    validateEntityExists(existing[0], 'Entity');
    
    const oldValues = existing[0];
    
    // 2. Validate state allows deletion
    if (!canDelete(oldValues.status)) {
      throw new ValidationError(`Cannot delete entity with status '${oldValues.status}'`);
    }
    
    // 3. Perform soft delete
    const [deleted] = await tx
      .update(table)
      .set({
        deleted_at: softDeleteTimestamp(),
        updated_at: new Date(),
      })
      .where(eq(table.id, id))
      .returning();
    
    return deleted;
  });
  
  // Log action
  await logDelete(userId, 'entity_type', id, oldValues, ipAddress, userAgent);
  
  return result;
}
```

### Submit for Approval

```typescript
export async function submitEntity(id, userId, ipAddress, userAgent) {
  const result = await db.transaction(async (tx) => {
    // 1. Validate entity exists
    const existing = await tx
      .select()
      .from(table)
      .where(and(eq(table.id, id), isNull(table.deleted_at)))
      .limit(1);
    
    validateEntityExists(existing[0], 'Entity');
    
    const oldValues = existing[0];
    
    // 2. Validate state allows submission
    if (!canSubmit(oldValues.status)) {
      throw new ValidationError(
        `Cannot submit entity with status '${oldValues.status}'. Only draft entities can be submitted.`
      );
    }
    
    // 3. Validate state transition
    validateStateTransition(oldValues.status, 'pending_approval');
    
    // 4. Update status
    const [updated] = await tx
      .update(table)
      .set({
        status: 'pending_approval',
        updated_at: new Date(),
      })
      .where(eq(table.id, id))
      .returning();
    
    return updated;
  });
  
  // Log action
  await logSubmit(userId, 'entity_type', id, ipAddress, userAgent);
  
  return result;
}
```

## Query Pattern with Soft Delete

### Always Exclude Soft-Deleted Records

```typescript
// Single record
const result = await db
  .select()
  .from(table)
  .where(and(
    eq(table.id, id),
    isNull(table.deleted_at) // ← Always include this
  ))
  .limit(1);

// Multiple records
const results = await db
  .select()
  .from(table)
  .where(and(
    // ... other conditions
    isNull(table.deleted_at) // ← Always include this
  ));
```

## Common Validation Patterns

### Create with Validation

```typescript
// Validate required fields (done by Zod schema)
// Validate uniqueness
const existing = await tx.select()...
validateUnique(existing.length > 0, 'Student ID');

// Validate date not in past
validateNotPastDate(data.event_date, 'Event date');

// Validate date range
if (data.completion_date) {
  validateDateRange(data.start_date, data.completion_date, 'Start date', 'Completion date');
}

// Validate positive integer
if (data.max_participants) {
  validatePositiveInteger(data.max_participants, 'Max participants');
}
```

### Update with Validation

```typescript
// Validate entity exists
validateEntityExists(existing[0], 'Student');

// Validate state allows updates
if (!canUpdate(oldValues.status)) {
  throw new ValidationError(`Cannot update entity with status '${oldValues.status}'`);
}

// Validate uniqueness if field is being updated
if (data.student_id && data.student_id !== oldValues.student_id) {
  const duplicate = await tx.select()...
  validateUnique(duplicate.length > 0, 'Student ID');
}
```

## Error Handling

All validation functions throw `ValidationError` which should be caught by the controller:

```typescript
try {
  const result = await updateEntity(id, data, userId, ipAddress, userAgent);
  return res.status(200).json(result);
} catch (error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }
  // Handle other errors
  return res.status(500).json({ error: 'Internal server error' });
}
```

## Testing

### Test State Transitions

```typescript
import { validateStateTransition } from './dataIntegrity';

it('should allow valid transition', () => {
  expect(() => {
    validateStateTransition('draft', 'pending_approval');
  }).not.toThrow();
});

it('should reject invalid transition', () => {
  expect(() => {
    validateStateTransition('approved', 'draft');
  }).toThrow(ValidationError);
});
```

### Test Entity Validation

```typescript
import { validateEntityExists } from './dataIntegrity';

it('should throw for null entity', () => {
  expect(() => {
    validateEntityExists(null, 'Student');
  }).toThrow('Student not found');
});
```

## Checklist for New Services

When creating a new service with approval workflow:

- [ ] Use transactions for all create/update/delete operations
- [ ] Validate entity existence before operations
- [ ] Validate uniqueness for unique fields
- [ ] Set initial status to 'draft' on creation
- [ ] Use `canUpdate()` to check if updates are allowed
- [ ] Use `canDelete()` to check if deletion is allowed
- [ ] Use `canSubmit()` to check if submission is allowed
- [ ] Use `validateStateTransition()` when changing status
- [ ] Perform soft deletes (set deleted_at timestamp)
- [ ] Exclude soft-deleted records in all queries
- [ ] Log all actions using audit logger
- [ ] Handle ValidationError in controllers

## Resources

- **Full Documentation**: `DATA_INTEGRITY.md`
- **Implementation Summary**: `DATA_INTEGRITY_SUMMARY.md`
- **Test Suite**: `utils/dataIntegrity.test.ts`
- **Verification Script**: `scripts/verifyDataIntegrity.ts`
