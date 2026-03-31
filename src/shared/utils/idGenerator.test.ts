import { describe, it, expect } from 'vitest';
import { IDGenerator, EntityType } from './idGenerator';

describe('IDGenerator', () => {
  describe('generate', () => {
    it('should generate student ID with correct format', () => {
      const id = IDGenerator.generate('student', 1, 2024);
      expect(id).toBe('S-2024-0001');
    });

    it('should generate faculty ID with correct format', () => {
      const id = IDGenerator.generate('faculty', 1, 2024);
      expect(id).toBe('F-2024-0001');
    });

    it('should pad sequence numbers with leading zeros', () => {
      expect(IDGenerator.generate('student', 1, 2024)).toBe('S-2024-0001');
      expect(IDGenerator.generate('student', 10, 2024)).toBe('S-2024-0010');
      expect(IDGenerator.generate('student', 100, 2024)).toBe('S-2024-0100');
      expect(IDGenerator.generate('student', 1000, 2024)).toBe('S-2024-1000');
    });

    it('should use current year when year is not provided', () => {
      const currentYear = new Date().getFullYear();
      const id = IDGenerator.generate('student', 1);
      expect(id).toBe(`S-${currentYear}-0001`);
    });

    it('should handle large sequence numbers', () => {
      const id = IDGenerator.generate('student', 9999, 2024);
      expect(id).toBe('S-2024-9999');
    });

    it('should handle sequence numbers beyond 4 digits', () => {
      const id = IDGenerator.generate('student', 10000, 2024);
      expect(id).toBe('S-2024-10000');
    });
  });

  describe('parse', () => {
    it('should parse valid student ID', () => {
      const parsed = IDGenerator.parse('S-2024-0001');
      expect(parsed).toEqual({
        prefix: 'S',
        year: 2024,
        sequence: 1,
      });
    });

    it('should parse valid faculty ID', () => {
      const parsed = IDGenerator.parse('F-2024-0001');
      expect(parsed).toEqual({
        prefix: 'F',
        year: 2024,
        sequence: 1,
      });
    });

    it('should parse ID with large sequence number', () => {
      const parsed = IDGenerator.parse('S-2024-9999');
      expect(parsed).toEqual({
        prefix: 'S',
        year: 2024,
        sequence: 9999,
      });
    });

    it('should return null for invalid format', () => {
      expect(IDGenerator.parse('INVALID')).toBeNull();
      expect(IDGenerator.parse('S-2024')).toBeNull();
      expect(IDGenerator.parse('S-2024-1')).toBeNull();
      expect(IDGenerator.parse('X-2024-0001')).toBeNull();
      expect(IDGenerator.parse('S-24-0001')).toBeNull();
      expect(IDGenerator.parse('S-2024-001')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(IDGenerator.parse('')).toBeNull();
    });
  });

  describe('isValid', () => {
    it('should return true for valid student IDs', () => {
      expect(IDGenerator.isValid('S-2024-0001')).toBe(true);
      expect(IDGenerator.isValid('S-2024-9999')).toBe(true);
    });

    it('should return true for valid faculty IDs', () => {
      expect(IDGenerator.isValid('F-2024-0001')).toBe(true);
      expect(IDGenerator.isValid('F-2024-9999')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(IDGenerator.isValid('INVALID')).toBe(false);
      expect(IDGenerator.isValid('S-2024')).toBe(false);
      expect(IDGenerator.isValid('S-2024-1')).toBe(false);
      expect(IDGenerator.isValid('X-2024-0001')).toBe(false);
      expect(IDGenerator.isValid('')).toBe(false);
    });
  });

  describe('getEntityType', () => {
    it('should return "student" for student IDs', () => {
      expect(IDGenerator.getEntityType('S-2024-0001')).toBe('student');
    });

    it('should return "faculty" for faculty IDs', () => {
      expect(IDGenerator.getEntityType('F-2024-0001')).toBe('faculty');
    });

    it('should return null for invalid IDs', () => {
      expect(IDGenerator.getEntityType('INVALID')).toBeNull();
      expect(IDGenerator.getEntityType('X-2024-0001')).toBeNull();
    });
  });

  describe('getPrefix', () => {
    it('should return "S" for student entity type', () => {
      expect(IDGenerator.getPrefix('student')).toBe('S');
    });

    it('should return "F" for faculty entity type', () => {
      expect(IDGenerator.getPrefix('faculty')).toBe('F');
    });
  });

  describe('getCurrentYear', () => {
    it('should return current year', () => {
      const currentYear = new Date().getFullYear();
      expect(IDGenerator.getCurrentYear()).toBe(currentYear);
    });
  });

  describe('round-trip generation and parsing', () => {
    it('should correctly round-trip student IDs', () => {
      const id = IDGenerator.generate('student', 42, 2024);
      const parsed = IDGenerator.parse(id);
      
      expect(parsed).not.toBeNull();
      expect(parsed?.prefix).toBe('S');
      expect(parsed?.year).toBe(2024);
      expect(parsed?.sequence).toBe(42);
    });

    it('should correctly round-trip faculty IDs', () => {
      const id = IDGenerator.generate('faculty', 123, 2024);
      const parsed = IDGenerator.parse(id);
      
      expect(parsed).not.toBeNull();
      expect(parsed?.prefix).toBe('F');
      expect(parsed?.year).toBe(2024);
      expect(parsed?.sequence).toBe(123);
    });

    it('should maintain sequence number through round-trip', () => {
      const sequences = [1, 10, 100, 1000, 9999];
      
      for (const seq of sequences) {
        const id = IDGenerator.generate('student', seq, 2024);
        const parsed = IDGenerator.parse(id);
        expect(parsed?.sequence).toBe(seq);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle sequence number 0', () => {
      const id = IDGenerator.generate('student', 0, 2024);
      expect(id).toBe('S-2024-0000');
      
      const parsed = IDGenerator.parse(id);
      expect(parsed?.sequence).toBe(0);
    });

    it('should handle different years', () => {
      expect(IDGenerator.generate('student', 1, 2020)).toBe('S-2020-0001');
      expect(IDGenerator.generate('student', 1, 2025)).toBe('S-2025-0001');
      expect(IDGenerator.generate('student', 1, 2030)).toBe('S-2030-0001');
    });

    it('should handle both entity types with same sequence', () => {
      const studentId = IDGenerator.generate('student', 1, 2024);
      const facultyId = IDGenerator.generate('faculty', 1, 2024);
      
      expect(studentId).toBe('S-2024-0001');
      expect(facultyId).toBe('F-2024-0001');
      expect(studentId).not.toBe(facultyId);
    });
  });
});
