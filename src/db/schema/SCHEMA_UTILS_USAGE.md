# Schema Utilities Usage Guide

This document demonstrates how to use the common schema utilities for consistent table patterns across the CCS Backend System.

## Available Utilities

### 1. `uuidPrimaryKey()`
Creates a UUID primary key field with automatic random UUID generation.

### 2. `timestamps`
Provides standard `created_at` and `updated_at` timestamp fields.

### 3. `softDelete`
Provides a `deleted_at` timestamp field for soft delete functionality.

### 4. `timestampsWithSoftDelete`
Combines both timestamps and soft delete fields.

## Usage Examples

### Basic Table with Timestamps

```typescript
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';

export const myTable = pgTable('my_table', {
  id: uuidPrimaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  ...timestamps,
});
```

This creates a table with:
- `id` (UUID, primary key, auto-generated)
- `name` (varchar)
- `created_at` (timestamp, auto-set on creation)
- `updated_at` (timestamp, auto-set on creation and updates)

### Table with Soft Delete Support

```typescript
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';

export const myTable = pgTable('my_table', {
  id: uuidPrimaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  ...timestampsWithSoftDelete,
});
```

This creates a table with:
- `id` (UUID, primary key, auto-generated)
- `name` (varchar)
- `created_at` (timestamp, auto-set on creation)
- `updated_at` (timestamp, auto-set on creation and updates)
- `deleted_at` (timestamp, nullable, for soft delete)

### Table with Only Soft Delete (No Timestamps)

```typescript
import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, softDelete } from './utils';

export const myTable = pgTable('my_table', {
  id: uuidPrimaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  custom_created: timestamp('custom_created').defaultNow(),
  ...softDelete,
});
```

This creates a table with:
- `id` (UUID, primary key, auto-generated)
- `name` (varchar)
- `custom_created` (custom timestamp field)
- `deleted_at` (timestamp, nullable, for soft delete)

## Real-World Example: Events Table

```typescript
import { pgTable, varchar, text, date, time, integer } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';

export const events = pgTable('events', {
  id: uuidPrimaryKey(),
  event_name: varchar('event_name', { length: 200 }).notNull(),
  event_type: varchar('event_type', { length: 50 }).notNull(),
  description: text('description'),
  event_date: date('event_date').notNull(),
  start_time: time('start_time'),
  end_time: time('end_time'),
  location: varchar('location', { length: 200 }),
  max_participants: integer('max_participants'),
  ...timestampsWithSoftDelete,
});
```

## Benefits

1. **Consistency**: All tables follow the same patterns for common fields
2. **Maintainability**: Changes to common patterns only need to be made in one place
3. **Type Safety**: TypeScript ensures correct usage
4. **Reduced Boilerplate**: Less repetitive code across schema definitions
5. **Audit Trail**: Automatic tracking of creation and modification times
6. **Soft Delete**: Easy implementation of soft delete pattern for data retention

## Soft Delete Pattern

When using `softDelete` or `timestampsWithSoftDelete`, remember to:

1. **In Repositories**: Filter out soft-deleted records by default
   ```typescript
   // Always exclude soft-deleted records
   const activeRecords = await db
     .select()
     .from(myTable)
     .where(isNull(myTable.deleted_at));
   ```

2. **For Soft Delete**: Set `deleted_at` instead of actually deleting
   ```typescript
   await db
     .update(myTable)
     .set({ deleted_at: new Date() })
     .where(eq(myTable.id, id));
   ```

3. **For Restore**: Set `deleted_at` back to null
   ```typescript
   await db
     .update(myTable)
     .set({ deleted_at: null })
     .where(eq(myTable.id, id));
   ```

## Migration Considerations

When adding these utilities to existing tables:

1. **Adding Timestamps**: Existing records will get `NULL` values unless you provide defaults
2. **Adding Soft Delete**: Existing records will have `NULL` for `deleted_at` (which means active)
3. **Backward Compatibility**: Ensure your queries handle the new fields appropriately

## Related Requirements

- **Requirement 23.3**: Database Schema Design - UUID primary keys and timestamps
- **Requirement 28.1**: Soft Delete Strategy for Audit Trail
