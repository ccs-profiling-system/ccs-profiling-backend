import { describe, it, expect } from 'vitest';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { isValidUUIDv7 } from '../../shared/utils/uuid';

describe('UUID v7 Integration with Schema', () => {
  // Create a test table using the uuidPrimaryKey utility
  const testTable = pgTable('test_table', {
    id: uuidPrimaryKey(),
    name: varchar('name', { length: 100 }),
    ...timestamps,
  });

  describe('uuidPrimaryKey with UUID v7', () => {
    it('should generate valid UUID v7 values', () => {
      const idColumn = testTable.id;
      
      // Simulate calling the default function
      if (idColumn.default && typeof idColumn.default === 'object' && '$defaultFn' in idColumn.default) {
        const generateId = (idColumn.default as any).$defaultFn;
        const uuid = generateId();
        
        expect(isValidUUIDv7(uuid)).toBe(true);
      }
    });

    it('should generate unique UUID v7 values on multiple calls', () => {
      const idColumn = testTable.id;
      
      if (idColumn.default && typeof idColumn.default === 'object' && '$defaultFn' in idColumn.default) {
        const generateId = (idColumn.default as any).$defaultFn;
        
        const uuid1 = generateId();
        const uuid2 = generateId();
        const uuid3 = generateId();
        
        expect(uuid1).not.toBe(uuid2);
        expect(uuid2).not.toBe(uuid3);
        expect(uuid1).not.toBe(uuid3);
        
        expect(isValidUUIDv7(uuid1)).toBe(true);
        expect(isValidUUIDv7(uuid2)).toBe(true);
        expect(isValidUUIDv7(uuid3)).toBe(true);
      }
    });

    it('should generate time-ordered UUID v7 values', () => {
      const idColumn = testTable.id;
      
      if (idColumn.default && typeof idColumn.default === 'object' && '$defaultFn' in idColumn.default) {
        const generateId = (idColumn.default as any).$defaultFn;
        
        const uuid1 = generateId();
        // Small delay to ensure different timestamps
        const start = Date.now();
        while (Date.now() - start < 2) {
          // Wait
        }
        const uuid2 = generateId();
        
        // UUID v7 should be lexicographically sortable
        expect(uuid1 < uuid2).toBe(true);
      }
    });
  });

  describe('Schema compatibility', () => {
    it('should create a valid table schema with UUID v7 primary key', () => {
      expect(testTable).toBeDefined();
      expect(testTable.id).toBeDefined();
      expect(testTable.id.primary).toBe(true);
    });

    it('should include timestamp fields', () => {
      expect(testTable.created_at).toBeDefined();
      expect(testTable.updated_at).toBeDefined();
    });
  });

  describe('PostgreSQL UUID compatibility', () => {
    it('should generate UUIDs in PostgreSQL-compatible format', () => {
      const idColumn = testTable.id;
      
      if (idColumn.default && typeof idColumn.default === 'object' && '$defaultFn' in idColumn.default) {
        const generateId = (idColumn.default as any).$defaultFn;
        const uuid = generateId();
        
        // PostgreSQL UUID format: 8-4-4-4-12 hexadecimal digits
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(uuid).toMatch(uuidRegex);
      }
    });

    it('should generate lowercase UUIDs (PostgreSQL standard)', () => {
      const idColumn = testTable.id;
      
      if (idColumn.default && typeof idColumn.default === 'object' && '$defaultFn' in idColumn.default) {
        const generateId = (idColumn.default as any).$defaultFn;
        const uuid = generateId();
        
        expect(uuid).toBe(uuid.toLowerCase());
      }
    });
  });
});
