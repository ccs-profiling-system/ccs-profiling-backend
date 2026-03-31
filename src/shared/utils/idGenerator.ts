/**
 * Human-Readable ID Generator Service
 * 
 * Generates human-readable IDs for entities in the format:
 * - Students: S-YYYY-0001
 * - Faculty: F-YYYY-0001
 * 
 * Where:
 * - Prefix: S (Student) or F (Faculty)
 * - YYYY: Current year
 * - 0001: Incremental counter (4 digits, zero-padded)
 * 
 * Requirements: 2.3, 3.2
 */

export type EntityType = 'student' | 'faculty';

export interface IDGeneratorConfig {
  prefix: string;
  year: number;
  sequence: number;
}

export class IDGenerator {
  private static readonly PREFIXES: Record<EntityType, string> = {
    student: 'S',
    faculty: 'F',
  };

  private static readonly SEQUENCE_LENGTH = 4;

  /**
   * Generate a human-readable ID for the given entity type
   * 
   * @param entityType - The type of entity (student or faculty)
   * @param sequence - The sequence number for this entity type and year
   * @param year - Optional year (defaults to current year)
   * @returns Formatted ID string (e.g., "S-2024-0001")
   */
  static generate(
    entityType: EntityType,
    sequence: number,
    year?: number
  ): string {
    const prefix = this.PREFIXES[entityType];
    const currentYear = year ?? new Date().getFullYear();
    const paddedSequence = this.padSequence(sequence);

    return `${prefix}-${currentYear}-${paddedSequence}`;
  }

  /**
   * Parse a human-readable ID into its components
   * 
   * @param id - The ID to parse (e.g., "S-2024-0001")
   * @returns Parsed components or null if invalid format
   */
  static parse(id: string): IDGeneratorConfig | null {
    const pattern = /^([SF])-(\d{4})-(\d{4})$/;
    const match = id.match(pattern);

    if (!match) {
      return null;
    }

    return {
      prefix: match[1],
      year: parseInt(match[2], 10),
      sequence: parseInt(match[3], 10),
    };
  }

  /**
   * Validate if a string is a valid human-readable ID
   * 
   * @param id - The ID to validate
   * @returns True if valid, false otherwise
   */
  static isValid(id: string): boolean {
    return this.parse(id) !== null;
  }

  /**
   * Get the entity type from a human-readable ID
   * 
   * @param id - The ID to extract entity type from
   * @returns Entity type or null if invalid
   */
  static getEntityType(id: string): EntityType | null {
    const parsed = this.parse(id);
    if (!parsed) {
      return null;
    }

    return parsed.prefix === 'S' ? 'student' : 'faculty';
  }

  /**
   * Pad sequence number with leading zeros
   * 
   * @param sequence - The sequence number to pad
   * @returns Zero-padded sequence string
   */
  private static padSequence(sequence: number): string {
    return sequence.toString().padStart(this.SEQUENCE_LENGTH, '0');
  }

  /**
   * Get the prefix for a given entity type
   * 
   * @param entityType - The entity type
   * @returns The prefix character
   */
  static getPrefix(entityType: EntityType): string {
    return this.PREFIXES[entityType];
  }

  /**
   * Get the current year
   * 
   * @returns Current year as number
   */
  static getCurrentYear(): number {
    return new Date().getFullYear();
  }
}
