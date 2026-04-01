import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../index';
import { entityCounters } from './entityCounters';
import { eq, and, sql } from 'drizzle-orm';
import { generateUUIDv7 } from '../../shared/utils/uuid';

describe('Entity Counters Schema', () => {
  const testYear = new Date().getFullYear();

  afterAll(async () => {
    // Clean up test data - clean up a range of years used in tests
    await db.delete(entityCounters).where(
      sql`${entityCounters.year} >= ${testYear} AND ${entityCounters.year} <= ${testYear + 10}`
    );
  });

  it('should create entity counter for student', async () => {
    const uniqueYear = testYear + Math.floor(Math.random() * 1000);
    const counter = await db.insert(entityCounters).values({
      id: generateUUIDv7(),
      entity_type: 'student',
      year: uniqueYear,
      last_sequence: 1,
    }).returning();

    expect(counter).toHaveLength(1);
    expect(counter[0].entity_type).toBe('student');
    expect(counter[0].year).toBe(uniqueYear);
    expect(counter[0].last_sequence).toBe(1);

    // Clean up
    await db.delete(entityCounters).where(eq(entityCounters.year, uniqueYear));
  });

  it('should create entity counter for faculty', async () => {
    const uniqueYear = testYear + Math.floor(Math.random() * 1000);
    const counter = await db.insert(entityCounters).values({
      id: generateUUIDv7(),
      entity_type: 'faculty',
      year: uniqueYear,
      last_sequence: 1,
    }).returning();

    expect(counter).toHaveLength(1);
    expect(counter[0].entity_type).toBe('faculty');
    expect(counter[0].year).toBe(uniqueYear);
    expect(counter[0].last_sequence).toBe(1);

    // Clean up
    await db.delete(entityCounters).where(eq(entityCounters.year, uniqueYear));
  });

  it('should enforce unique constraint on (entity_type, year)', async () => {
    // First insert should succeed
    await db.insert(entityCounters).values({
      id: generateUUIDv7(),
      entity_type: 'student',
      year: testYear + 1,
      last_sequence: 1,
    });

    // Second insert with same entity_type and year should fail
    await expect(
      db.insert(entityCounters).values({
        id: generateUUIDv7(),
        entity_type: 'student',
        year: testYear + 1,
        last_sequence: 2,
      })
    ).rejects.toThrow();

    // Clean up
    await db.delete(entityCounters).where(
      and(
        eq(entityCounters.entity_type, 'student'),
        eq(entityCounters.year, testYear + 1)
      )
    );
  });

  it('should allow same entity_type for different years', async () => {
    const counter1 = await db.insert(entityCounters).values({
      id: generateUUIDv7(),
      entity_type: 'student',
      year: testYear + 2,
      last_sequence: 1,
    }).returning();

    const counter2 = await db.insert(entityCounters).values({
      id: generateUUIDv7(),
      entity_type: 'student',
      year: testYear + 3,
      last_sequence: 1,
    }).returning();

    expect(counter1[0].year).toBe(testYear + 2);
    expect(counter2[0].year).toBe(testYear + 3);

    // Clean up
    await db.delete(entityCounters).where(eq(entityCounters.entity_type, 'student'));
  });

  it('should have default value of 0 for last_sequence', async () => {
    const counter = await db.insert(entityCounters).values({
      id: generateUUIDv7(),
      entity_type: 'faculty',
      year: testYear + 4,
    }).returning();

    expect(counter[0].last_sequence).toBe(0);

    // Clean up
    await db.delete(entityCounters).where(
      and(
        eq(entityCounters.entity_type, 'faculty'),
        eq(entityCounters.year, testYear + 4)
      )
    );
  });
});
