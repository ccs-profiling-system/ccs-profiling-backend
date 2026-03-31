import { eq, and, sql } from 'drizzle-orm';
import { db, Database } from '../index';
import { entityCounters } from '../schema/entityCounters';

/**
 * Entity Counter Repository
 * 
 * Manages sequential counter values for generating human-readable IDs.
 * Uses database-level locking (SELECT FOR UPDATE) to prevent race conditions
 * when multiple requests try to increment the counter simultaneously.
 * 
 * Requirements: 26.1, 26.2
 */
export class EntityCounterRepository {
  constructor(private readonly database: Database = db) {}

  /**
   * Get or create a counter for the given entity type and year.
   * 
   * If the counter doesn't exist, it creates one with last_sequence = 0.
   * Uses INSERT ... ON CONFLICT to handle concurrent creation attempts.
   * 
   * @param entityType - 'student' or 'faculty'
   * @param year - The year for the counter
   * @param tx - Optional transaction context
   * @returns The counter record
   */
  async getOrCreateCounter(
    entityType: string,
    year: number,
    tx?: Parameters<Parameters<Database['transaction']>[0]>[0]
  ) {
    const dbInstance = tx || this.database;

    // Use INSERT ... ON CONFLICT to atomically create or get existing counter
    const result = await dbInstance
      .insert(entityCounters)
      .values({
        entity_type: entityType,
        year: year,
        last_sequence: 0,
      })
      .onConflictDoNothing({
        target: [entityCounters.entity_type, entityCounters.year],
      })
      .returning();

    // If insert succeeded, return the new record
    if (result.length > 0) {
      return result[0];
    }

    // Otherwise, fetch the existing record
    const existing = await dbInstance
      .select()
      .from(entityCounters)
      .where(
        and(
          eq(entityCounters.entity_type, entityType),
          eq(entityCounters.year, year)
        )
      )
      .limit(1);

    return existing[0];
  }

  /**
   * Increment the counter for the given entity type and year.
   * 
   * Uses SELECT FOR UPDATE to lock the row during the transaction,
   * preventing race conditions when multiple requests try to increment
   * the counter simultaneously.
   * 
   * CRITICAL: This method MUST be called within a transaction to ensure
   * the lock is held until the transaction commits.
   * 
   * @param entityType - 'student' or 'faculty'
   * @param year - The year for the counter
   * @param tx - Transaction context (REQUIRED)
   * @returns The new sequence number
   */
  async incrementCounter(
    entityType: string,
    year: number,
    tx: Parameters<Parameters<Database['transaction']>[0]>[0]
  ): Promise<number> {
    // Step 1: Lock the counter row using SELECT FOR UPDATE
    // This prevents other transactions from reading or updating this row
    // until the current transaction commits or rolls back
    const locked = await tx.execute(sql`
      SELECT id, entity_type, year, last_sequence
      FROM entity_counters
      WHERE entity_type = ${entityType} AND year = ${year}
      FOR UPDATE
    `);

    if (locked.length === 0) {
      throw new Error(
        `Counter not found for entity_type=${entityType}, year=${year}. ` +
        `Call getOrCreateCounter first.`
      );
    }

    const currentSequence = locked[0].last_sequence as number;
    const newSequence = currentSequence + 1;

    // Step 2: Update the counter with the new sequence
    await tx
      .update(entityCounters)
      .set({ last_sequence: newSequence })
      .where(
        and(
          eq(entityCounters.entity_type, entityType),
          eq(entityCounters.year, year)
        )
      );

    return newSequence;
  }

  /**
   * Get the current counter value without incrementing.
   * 
   * @param entityType - 'student' or 'faculty'
   * @param year - The year for the counter
   * @returns The current sequence number, or null if counter doesn't exist
   */
  async getCurrentSequence(
    entityType: string,
    year: number
  ): Promise<number | null> {
    const result = await this.database
      .select()
      .from(entityCounters)
      .where(
        and(
          eq(entityCounters.entity_type, entityType),
          eq(entityCounters.year, year)
        )
      )
      .limit(1);

    return result.length > 0 ? result[0].last_sequence : null;
  }
}

// Export singleton instance
export const entityCounterRepository = new EntityCounterRepository();
