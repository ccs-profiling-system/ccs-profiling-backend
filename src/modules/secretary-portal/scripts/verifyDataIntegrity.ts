/**
 * Data Integrity Verification Script
 * 
 * Verifies that all data integrity measures are properly configured
 * in the database schema and service layer.
 * 
 * Requirements: 17.1-17.8
 */

import { db } from '../../../db';
import { sql } from 'drizzle-orm';

interface ForeignKeyConstraint {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  delete_rule: string;
}

interface UniqueConstraint {
  table_name: string;
  column_name: string;
  constraint_name: string;
}

interface TableColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
}

/**
 * Verify foreign key constraints exist
 * 
 * Requirements: 17.1, 17.6
 */
async function verifyForeignKeyConstraints(): Promise<void> {
  console.log('\n=== Verifying Foreign Key Constraints ===\n');
  
  const expectedConstraints = [
    { table: 'students', column: 'user_id', references: 'users', onDelete: 'CASCADE' },
    { table: 'faculty', column: 'user_id', references: 'users', onDelete: 'CASCADE' },
    { table: 'schedules', column: 'instruction_id', references: 'instructions', onDelete: 'CASCADE' },
    { table: 'schedules', column: 'faculty_id', references: 'faculty', onDelete: 'CASCADE' },
    { table: 'event_participants', column: 'event_id', references: 'events', onDelete: 'CASCADE' },
    { table: 'event_participants', column: 'student_id', references: 'students', onDelete: 'CASCADE' },
    { table: 'event_participants', column: 'faculty_id', references: 'faculty', onDelete: 'CASCADE' },
    { table: 'research_authors', column: 'research_id', references: 'research', onDelete: 'CASCADE' },
    { table: 'research_authors', column: 'student_id', references: 'students', onDelete: 'CASCADE' },
    { table: 'research_advisers', column: 'research_id', references: 'research', onDelete: 'CASCADE' },
    { table: 'research_advisers', column: 'faculty_id', references: 'faculty', onDelete: 'CASCADE' },
  ];
  
  const result = await db.execute<ForeignKeyConstraint>(sql`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
      AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);
  
  const constraints = result.rows || [];
  
  let allFound = true;
  
  for (const expected of expectedConstraints) {
    const found = constraints.find(
      (c) =>
        c.table_name === expected.table &&
        c.column_name === expected.column &&
        c.foreign_table_name === expected.references
    );
    
    if (found) {
      const deleteRuleMatch = found.delete_rule === expected.onDelete;
      console.log(
        `✓ ${expected.table}.${expected.column} → ${expected.references} ` +
        `(ON DELETE ${found.delete_rule})${deleteRuleMatch ? '' : ' ⚠️  Expected: ' + expected.onDelete}`
      );
    } else {
      console.log(`✗ Missing: ${expected.table}.${expected.column} → ${expected.references}`);
      allFound = false;
    }
  }
  
  if (allFound) {
    console.log('\n✓ All foreign key constraints verified');
  } else {
    console.log('\n✗ Some foreign key constraints are missing');
  }
}

/**
 * Verify unique constraints exist
 * 
 * Requirements: 17.2
 */
async function verifyUniqueConstraints(): Promise<void> {
  console.log('\n=== Verifying Unique Constraints ===\n');
  
  const expectedConstraints = [
    { table: 'students', column: 'student_id' },
    { table: 'faculty', column: 'faculty_id' },
  ];
  
  const result = await db.execute<UniqueConstraint>(sql`
    SELECT
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);
  
  const constraints = result.rows || [];
  
  let allFound = true;
  
  for (const expected of expectedConstraints) {
    const found = constraints.find(
      (c) =>
        c.table_name === expected.table &&
        c.column_name === expected.column
    );
    
    if (found) {
      console.log(`✓ ${expected.table}.${expected.column} (${found.constraint_name})`);
    } else {
      console.log(`✗ Missing: ${expected.table}.${expected.column}`);
      allFound = false;
    }
  }
  
  if (allFound) {
    console.log('\n✓ All unique constraints verified');
  } else {
    console.log('\n✗ Some unique constraints are missing');
  }
}

/**
 * Verify soft delete columns exist
 * 
 * Requirements: 17.7
 */
async function verifySoftDeleteColumns(): Promise<void> {
  console.log('\n=== Verifying Soft Delete Columns ===\n');
  
  const expectedTables = [
    'students',
    'faculty',
    'schedules',
    'events',
    'research',
  ];
  
  const result = await db.execute<TableColumn>(sql`
    SELECT
      table_name,
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name IN ('created_at', 'updated_at', 'deleted_at')
    ORDER BY table_name, column_name;
  `);
  
  const columns = result.rows || [];
  
  let allFound = true;
  
  for (const table of expectedTables) {
    const createdAt = columns.find((c) => c.table_name === table && c.column_name === 'created_at');
    const updatedAt = columns.find((c) => c.table_name === table && c.column_name === 'updated_at');
    const deletedAt = columns.find((c) => c.table_name === table && c.column_name === 'deleted_at');
    
    if (createdAt && updatedAt && deletedAt) {
      console.log(`✓ ${table}: created_at, updated_at, deleted_at`);
    } else {
      console.log(`✗ ${table}: Missing timestamp columns`);
      if (!createdAt) console.log(`  - Missing: created_at`);
      if (!updatedAt) console.log(`  - Missing: updated_at`);
      if (!deletedAt) console.log(`  - Missing: deleted_at`);
      allFound = false;
    }
  }
  
  if (allFound) {
    console.log('\n✓ All soft delete columns verified');
  } else {
    console.log('\n✗ Some soft delete columns are missing');
  }
}

/**
 * Verify approval status columns exist
 * 
 * Requirements: 17.8
 */
async function verifyApprovalStatusColumns(): Promise<void> {
  console.log('\n=== Verifying Approval Status Columns ===\n');
  
  const expectedTables = [
    { table: 'events', column: 'status' },
    { table: 'research', column: 'status' },
  ];
  
  const result = await db.execute<TableColumn>(sql`
    SELECT
      table_name,
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'status'
    ORDER BY table_name;
  `);
  
  const columns = result.rows || [];
  
  let allFound = true;
  
  for (const expected of expectedTables) {
    const found = columns.find(
      (c) =>
        c.table_name === expected.table &&
        c.column_name === expected.column
    );
    
    if (found) {
      console.log(`✓ ${expected.table}.${expected.column} (${found.data_type})`);
    } else {
      console.log(`✗ Missing: ${expected.table}.${expected.column}`);
      allFound = false;
    }
  }
  
  if (allFound) {
    console.log('\n✓ All approval status columns verified');
  } else {
    console.log('\n✗ Some approval status columns are missing');
  }
}

/**
 * Main verification function
 */
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Data Integrity Verification Script                  ║');
  console.log('║       Requirements: 17.1-17.8                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    await verifyForeignKeyConstraints();
    await verifyUniqueConstraints();
    await verifySoftDeleteColumns();
    await verifyApprovalStatusColumns();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║       Verification Complete                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification if executed directly
if (require.main === module) {
  main();
}

export { main as verifyDataIntegrity };
