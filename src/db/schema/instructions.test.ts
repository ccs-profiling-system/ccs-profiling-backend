import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { instructions } from './instructions';
import { eq, and, isNull } from 'drizzle-orm';
import { generateUUIDv7 } from '../../shared/utils/uuid';

describe('Instructions Schema', () => {
  const connectionString = process.env.DATABASE_URL || '';
  const client = postgres(connectionString);
  const db = drizzle(client);

  afterAll(async () => {
    await client.end();
  });

  it('should create an instruction record with all required fields', async () => {
    const testInstruction = {
      id: generateUUIDv7(),
      subject_code: 'CS101',
      subject_name: 'Introduction to Computer Science',
      description: 'Fundamentals of computer science',
      credits: 3,
      curriculum_year: '2024-2025',
    };

    const [created] = await db.insert(instructions).values(testInstruction).returning();

    expect(created).toBeDefined();
    expect(created.id).toBe(testInstruction.id);
    expect(created.subject_code).toBe(testInstruction.subject_code);
    expect(created.subject_name).toBe(testInstruction.subject_name);
    expect(created.credits).toBe(testInstruction.credits);
    expect(created.curriculum_year).toBe(testInstruction.curriculum_year);
    expect(created.created_at).toBeDefined();
    expect(created.updated_at).toBeDefined();
    expect(created.deleted_at).toBeNull();

    // Cleanup
    await db.delete(instructions).where(eq(instructions.id, created.id));
  });

  it('should enforce unique constraint on (subject_code, curriculum_year)', async () => {
    const testInstruction = {
      id: generateUUIDv7(),
      subject_code: 'CS102',
      subject_name: 'Data Structures',
      credits: 3,
      curriculum_year: '2024-2025',
    };

    // Create first record
    const [first] = await db.insert(instructions).values(testInstruction).returning();

    // Attempt to create duplicate
    const duplicate = {
      id: generateUUIDv7(),
      subject_code: 'CS102', // Same subject_code
      subject_name: 'Different Name',
      credits: 4,
      curriculum_year: '2024-2025', // Same curriculum_year
    };

    await expect(
      db.insert(instructions).values(duplicate)
    ).rejects.toThrow();

    // Cleanup
    await db.delete(instructions).where(eq(instructions.id, first.id));
  });

  it('should allow same subject_code in different curriculum_year', async () => {
    const instruction1 = {
      id: generateUUIDv7(),
      subject_code: 'CS103',
      subject_name: 'Algorithms',
      credits: 3,
      curriculum_year: '2023-2024',
    };

    const instruction2 = {
      id: generateUUIDv7(),
      subject_code: 'CS103', // Same subject_code
      subject_name: 'Algorithms',
      credits: 3,
      curriculum_year: '2024-2025', // Different curriculum_year
    };

    const [created1] = await db.insert(instructions).values(instruction1).returning();
    const [created2] = await db.insert(instructions).values(instruction2).returning();

    expect(created1).toBeDefined();
    expect(created2).toBeDefined();
    expect(created1.subject_code).toBe(created2.subject_code);
    expect(created1.curriculum_year).not.toBe(created2.curriculum_year);

    // Cleanup
    await db.delete(instructions).where(eq(instructions.id, created1.id));
    await db.delete(instructions).where(eq(instructions.id, created2.id));
  });

  it('should support soft delete', async () => {
    const testInstruction = {
      id: generateUUIDv7(),
      subject_code: 'CS104',
      subject_name: 'Software Engineering',
      credits: 3,
      curriculum_year: '2024-2025',
    };

    const [created] = await db.insert(instructions).values(testInstruction).returning();

    // Soft delete
    await db
      .update(instructions)
      .set({ deleted_at: new Date() })
      .where(eq(instructions.id, created.id));

    // Verify soft deleted record is not returned in normal queries
    const found = await db
      .select()
      .from(instructions)
      .where(and(
        eq(instructions.id, created.id),
        isNull(instructions.deleted_at)
      ));

    expect(found.length).toBe(0);

    // Cleanup (hard delete)
    await db.delete(instructions).where(eq(instructions.id, created.id));
  });
});
