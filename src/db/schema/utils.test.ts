import { describe, it, expect } from 'vitest';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { 
  uuidPrimaryKey, 
  timestamps, 
  softDelete, 
  timestampsWithSoftDelete 
} from './utils';

describe('Schema Utilities', () => {
  describe('uuidPrimaryKey', () => {
    it('should create a UUID primary key field that can be used in a table', () => {
      const testTable = pgTable('test_table', {
        id: uuidPrimaryKey(),
        name: varchar('name', { length: 100 }),
      });
      
      expect(testTable).toBeDefined();
      expect(testTable.id).toBeDefined();
    });
  });

  describe('timestamps', () => {
    it('should include created_at and updated_at fields', () => {
      expect(timestamps).toHaveProperty('created_at');
      expect(timestamps).toHaveProperty('updated_at');
    });

    it('should be usable in a table definition', () => {
      const testTable = pgTable('test_table', {
        id: uuidPrimaryKey(),
        ...timestamps,
      });
      
      expect(testTable).toBeDefined();
      expect(testTable.created_at).toBeDefined();
      expect(testTable.updated_at).toBeDefined();
    });
  });

  describe('softDelete', () => {
    it('should include deleted_at field', () => {
      expect(softDelete).toHaveProperty('deleted_at');
    });

    it('should be usable in a table definition', () => {
      const testTable = pgTable('test_table', {
        id: uuidPrimaryKey(),
        ...softDelete,
      });
      
      expect(testTable).toBeDefined();
      expect(testTable.deleted_at).toBeDefined();
    });
  });

  describe('timestampsWithSoftDelete', () => {
    it('should include all timestamp and soft delete fields', () => {
      expect(timestampsWithSoftDelete).toHaveProperty('created_at');
      expect(timestampsWithSoftDelete).toHaveProperty('updated_at');
      expect(timestampsWithSoftDelete).toHaveProperty('deleted_at');
    });

    it('should have three fields total', () => {
      const keys = Object.keys(timestampsWithSoftDelete);
      expect(keys).toHaveLength(3);
      expect(keys).toEqual(['created_at', 'updated_at', 'deleted_at']);
    });

    it('should be usable in a table definition', () => {
      const testTable = pgTable('test_table', {
        id: uuidPrimaryKey(),
        name: varchar('name', { length: 100 }),
        ...timestampsWithSoftDelete,
      });
      
      expect(testTable).toBeDefined();
      expect(testTable.id).toBeDefined();
      expect(testTable.name).toBeDefined();
      expect(testTable.created_at).toBeDefined();
      expect(testTable.updated_at).toBeDefined();
      expect(testTable.deleted_at).toBeDefined();
    });
  });
});
