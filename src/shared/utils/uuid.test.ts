import { describe, it, expect } from 'vitest';
import { generateUUIDv7, extractTimestampFromUUIDv7, isValidUUIDv7 } from './uuid';

describe('UUID v7 Generator', () => {
  describe('generateUUIDv7', () => {
    it('should generate a valid UUID v7 format', () => {
      const uuid = generateUUIDv7();
      
      // Check format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUIDv7();
      const uuid2 = generateUUIDv7();
      
      expect(uuid1).not.toBe(uuid2);
    });

    it('should generate time-ordered UUIDs', () => {
      const uuid1 = generateUUIDv7();
      // Small delay to ensure different timestamps
      const start = Date.now();
      while (Date.now() - start < 2) {
        // Wait for at least 2ms
      }
      const uuid2 = generateUUIDv7();
      
      // UUID v7 should be lexicographically sortable
      expect(uuid1 < uuid2).toBe(true);
    });

    it('should have version 7 in the correct position', () => {
      const uuid = generateUUIDv7();
      const versionChar = uuid.charAt(14); // Position of version nibble
      
      expect(versionChar).toBe('7');
    });

    it('should have correct variant bits', () => {
      const uuid = generateUUIDv7();
      const variantChar = uuid.charAt(19); // Position of variant nibble
      
      // Variant should be 8, 9, a, or b (binary 10xx)
      expect(['8', '9', 'a', 'b']).toContain(variantChar.toLowerCase());
    });

    it('should generate multiple UUIDs without collision', () => {
      const uuids = new Set<string>();
      const count = 1000;
      
      for (let i = 0; i < count; i++) {
        uuids.add(generateUUIDv7());
      }
      
      expect(uuids.size).toBe(count);
    });
  });

  describe('extractTimestampFromUUIDv7', () => {
    it('should extract timestamp from a valid UUID v7', () => {
      const beforeTimestamp = Date.now();
      const uuid = generateUUIDv7();
      const afterTimestamp = Date.now();
      
      const extractedTimestamp = extractTimestampFromUUIDv7(uuid);
      
      expect(extractedTimestamp).not.toBeNull();
      expect(extractedTimestamp!).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(extractedTimestamp!).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should return null for invalid UUID format', () => {
      const invalidUuid = 'invalid-uuid-format';
      const timestamp = extractTimestampFromUUIDv7(invalidUuid);
      
      expect(timestamp).toBeNull();
    });

    it('should return null for non-v7 UUID', () => {
      // UUID v4 format
      const uuidV4 = '550e8400-e29b-41d4-a716-446655440000';
      const timestamp = extractTimestampFromUUIDv7(uuidV4);
      
      expect(timestamp).toBeNull();
    });

    it('should extract consistent timestamps', () => {
      const uuid = generateUUIDv7();
      const timestamp1 = extractTimestampFromUUIDv7(uuid);
      const timestamp2 = extractTimestampFromUUIDv7(uuid);
      
      expect(timestamp1).toBe(timestamp2);
    });
  });

  describe('isValidUUIDv7', () => {
    it('should validate a correct UUID v7', () => {
      const uuid = generateUUIDv7();
      
      expect(isValidUUIDv7(uuid)).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const invalidUuids = [
        'invalid-uuid',
        '12345',
        '',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        '550e8400-e29b-41d4-a716-446655440000', // UUID v4
        '018e5d7a-7c3f-4a1b-8c9d-0123456789ab', // Wrong version (4 instead of 7)
      ];
      
      invalidUuids.forEach(uuid => {
        expect(isValidUUIDv7(uuid)).toBe(false);
      });
    });

    it('should validate UUID v7 with correct variant bits', () => {
      const uuid = generateUUIDv7();
      
      expect(isValidUUIDv7(uuid)).toBe(true);
    });

    it('should reject UUID with wrong variant bits', () => {
      // UUID with variant bits 00 (invalid)
      const invalidVariant = '018e5d7a-7c3f-7a1b-0c9d-0123456789ab';
      
      expect(isValidUUIDv7(invalidVariant)).toBe(false);
    });

    it('should be case-insensitive', () => {
      const uuid = generateUUIDv7();
      const upperCaseUuid = uuid.toUpperCase();
      const lowerCaseUuid = uuid.toLowerCase();
      
      expect(isValidUUIDv7(upperCaseUuid)).toBe(true);
      expect(isValidUUIDv7(lowerCaseUuid)).toBe(true);
    });
  });

  describe('PostgreSQL compatibility', () => {
    it('should generate UUIDs compatible with PostgreSQL UUID type', () => {
      const uuid = generateUUIDv7();
      
      // PostgreSQL UUID format: 8-4-4-4-12 hexadecimal digits
      const parts = uuid.split('-');
      
      expect(parts).toHaveLength(5);
      expect(parts[0]).toHaveLength(8);
      expect(parts[1]).toHaveLength(4);
      expect(parts[2]).toHaveLength(4);
      expect(parts[3]).toHaveLength(4);
      expect(parts[4]).toHaveLength(12);
    });

    it('should generate lowercase UUIDs (PostgreSQL standard)', () => {
      const uuid = generateUUIDv7();
      
      expect(uuid).toBe(uuid.toLowerCase());
    });
  });

  describe('Time-ordering properties', () => {
    it('should maintain chronological order across multiple generations', () => {
      const uuids: string[] = [];
      
      for (let i = 0; i < 10; i++) {
        uuids.push(generateUUIDv7());
        // Small delay to ensure different timestamps
        const start = Date.now();
        while (Date.now() - start < 1) {
          // Wait
        }
      }
      
      // Check that UUIDs are in ascending order
      for (let i = 1; i < uuids.length; i++) {
        expect(uuids[i] > uuids[i - 1]).toBe(true);
      }
    });

    it('should have timestamps in ascending order', () => {
      const uuid1 = generateUUIDv7();
      const start = Date.now();
      while (Date.now() - start < 2) {
        // Wait for at least 2ms
      }
      const uuid2 = generateUUIDv7();
      
      const timestamp1 = extractTimestampFromUUIDv7(uuid1);
      const timestamp2 = extractTimestampFromUUIDv7(uuid2);
      
      expect(timestamp2!).toBeGreaterThan(timestamp1!);
    });
  });
});
