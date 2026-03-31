import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../index';
import { entityCounters } from '../schema/entityCounters';
import { EntityCounterRepository } from './entityCounter.repository';
import { eq, and } from 'drizzle-orm';

describe('EntityCounterRepository', () => {
  const repository = new EntityCounterRepository(db);
  const testYear = new Date().getFullYear();

  beforeEach(async () => {
    // Clean up test data
    await db.delete(entityCounters).where(eq(entityCounters.year, testYear));
  });

  describe('getOrCreateCounter', () => {
    it('should create a new counter if it does not exist', async () => {
      const counter = await repository.getOrCreateCounter('student', testYear);

      expect(counter).toBeDefined();
      expect(counter.entity_type).toBe('student');
      expect(counter.year).toBe(testYear);
      expect(counter.last_sequence).toBe(0);
    });

    it('should return existing counter if it already exists', async () => {
      // Create counter first
      const first = await repository.getOrCreateCounter('student', testYear);

      // Try to create again
      const second = await repository.getOrCreateCounter('student', testYear);

      expect(second.id).toBe(first.id);
      expect(second.last_sequence).toBe(0);
    });

    it('should handle concurrent creation attempts', async () => {
      // Simulate concurrent creation
      const results = await Promise.all([
        repository.getOrCreateCounter('faculty', testYear),
        repository.getOrCreateCounter('faculty', testYear),
        repository.getOrCreateCounter('faculty', testYear),
      ]);

      // All should return a counter (either created or existing)
      expect(results).toHaveLength(3);
      results.forEach(counter => {
        expect(counter).toBeDefined();
        expect(counter.entity_type).toBe('faculty');
      });

      // Verify only one counter was created
      const allCounters = await db
        .select()
        .from(entityCounters)
        .where(
          and(
            eq(entityCounters.entity_type, 'faculty'),
            eq(entityCounters.year, testYear)
          )
        );

      expect(allCounters).toHaveLength(1);
    });
  });

  describe('incrementCounter', () => {
    it('should increment counter within a transaction', async () => {
      // Create counter first
      await repository.getOrCreateCounter('student', testYear);

      // Increment within transaction
      const newSequence = await db.transaction(async (tx) => {
        return await repository.incrementCounter('student', testYear, tx);
      });

      expect(newSequence).toBe(1);

      // Verify the counter was updated
      const counter = await repository.getOrCreateCounter('student', testYear);
      expect(counter.last_sequence).toBe(1);
    });

    it('should increment counter multiple times sequentially', async () => {
      await repository.getOrCreateCounter('student', testYear);

      const sequence1 = await db.transaction(async (tx) => {
        return await repository.incrementCounter('student', testYear, tx);
      });

      const sequence2 = await db.transaction(async (tx) => {
        return await repository.incrementCounter('student', testYear, tx);
      });

      const sequence3 = await db.transaction(async (tx) => {
        return await repository.incrementCounter('student', testYear, tx);
      });

      expect(sequence1).toBe(1);
      expect(sequence2).toBe(2);
      expect(sequence3).toBe(3);
    });

    it('should throw error if counter does not exist', async () => {
      await expect(
        db.transaction(async (tx) => {
          return await repository.incrementCounter('nonexistent', testYear, tx);
        })
      ).rejects.toThrow('Counter not found');
    });

    it('should prevent race conditions with concurrent increments', async () => {
      // Create counter
      await repository.getOrCreateCounter('faculty', testYear);

      // Simulate concurrent increment requests
      const promises = Array.from({ length: 10 }, () =>
        db.transaction(async (tx) => {
          return await repository.incrementCounter('faculty', testYear, tx);
        })
      );

      const sequences = await Promise.all(promises);

      // All sequences should be unique
      const uniqueSequences = new Set(sequences);
      expect(uniqueSequences.size).toBe(10);

      // Sequences should be 1 through 10
      expect(sequences.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      // Final counter value should be 10
      const counter = await repository.getOrCreateCounter('faculty', testYear);
      expect(counter.last_sequence).toBe(10);
    });
  });

  describe('getCurrentSequence', () => {
    it('should return current sequence without incrementing', async () => {
      await repository.getOrCreateCounter('student', testYear);

      const sequence = await repository.getCurrentSequence('student', testYear);
      expect(sequence).toBe(0);

      // Increment once
      await db.transaction(async (tx) => {
        return await repository.incrementCounter('student', testYear, tx);
      });

      const newSequence = await repository.getCurrentSequence('student', testYear);
      expect(newSequence).toBe(1);
    });

    it('should return null if counter does not exist', async () => {
      const sequence = await repository.getCurrentSequence('nonexistent', testYear);
      expect(sequence).toBeNull();
    });
  });
});
