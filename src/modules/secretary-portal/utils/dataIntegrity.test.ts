/**
 * Data Integrity Utilities Tests
 * 
 */

import { describe, it, expect } from 'vitest';
import {
  validateStateTransition,
  canUpdate,
  canDelete,
  canSubmit,
  canWithdraw,
  validateEntityExists,
  validateUnique,
  validateDateRange,
  validateNotPastDate,
  validatePositiveInteger,
  softDeleteTimestamp,
} from './dataIntegrity';
import { ValidationError } from '../../../shared/errors';
import { ApprovalStatus } from '../types';

describe('Data Integrity Utilities', () => {
  describe('validateStateTransition', () => {
    it('should allow draft → pending_approval transition', () => {
      expect(() => {
        validateStateTransition('draft', 'pending_approval');
      }).not.toThrow();
    });

    it('should allow pending_approval → approved transition', () => {
      expect(() => {
        validateStateTransition('pending_approval', 'approved');
      }).not.toThrow();
    });

    it('should allow pending_approval → rejected transition', () => {
      expect(() => {
        validateStateTransition('pending_approval', 'rejected');
      }).not.toThrow();
    });

    it('should allow pending_approval → withdrawn transition', () => {
      expect(() => {
        validateStateTransition('pending_approval', 'withdrawn');
      }).not.toThrow();
    });

    it('should allow rejected → draft transition', () => {
      expect(() => {
        validateStateTransition('rejected', 'draft');
      }).not.toThrow();
    });

    it('should allow withdrawn → draft transition', () => {
      expect(() => {
        validateStateTransition('withdrawn', 'draft');
      }).not.toThrow();
    });

    it('should reject draft → approved transition', () => {
      expect(() => {
        validateStateTransition('draft', 'approved');
      }).toThrow(ValidationError);
      expect(() => {
        validateStateTransition('draft', 'approved');
      }).toThrow(/Invalid state transition/);
    });

    it('should reject approved → any transition', () => {
      expect(() => {
        validateStateTransition('approved', 'draft');
      }).toThrow(ValidationError);
      expect(() => {
        validateStateTransition('approved', 'rejected');
      }).toThrow(ValidationError);
    });

    it('should reject draft → rejected transition', () => {
      expect(() => {
        validateStateTransition('draft', 'rejected');
      }).toThrow(ValidationError);
    });
  });

  describe('canUpdate', () => {
    it('should allow updates for draft status', () => {
      expect(canUpdate('draft')).toBe(true);
    });

    it('should allow updates for rejected status', () => {
      expect(canUpdate('rejected')).toBe(true);
    });

    it('should not allow updates for approved status', () => {
      expect(canUpdate('approved')).toBe(false);
    });

    it('should not allow updates for pending_approval status', () => {
      expect(canUpdate('pending_approval')).toBe(false);
    });

    it('should not allow updates for withdrawn status', () => {
      expect(canUpdate('withdrawn')).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('should allow deletes for draft status', () => {
      expect(canDelete('draft')).toBe(true);
    });

    it('should allow deletes for withdrawn status', () => {
      expect(canDelete('withdrawn')).toBe(true);
    });

    it('should not allow deletes for approved status', () => {
      expect(canDelete('approved')).toBe(false);
    });

    it('should not allow deletes for pending_approval status', () => {
      expect(canDelete('pending_approval')).toBe(false);
    });

    it('should not allow deletes for rejected status', () => {
      expect(canDelete('rejected')).toBe(false);
    });
  });

  describe('canSubmit', () => {
    it('should allow submit for draft status', () => {
      expect(canSubmit('draft')).toBe(true);
    });

    it('should allow submit for rejected status', () => {
      expect(canSubmit('rejected')).toBe(true);
    });

    it('should not allow submit for approved status', () => {
      expect(canSubmit('approved')).toBe(false);
    });

    it('should not allow submit for pending_approval status', () => {
      expect(canSubmit('pending_approval')).toBe(false);
    });

    it('should not allow submit for withdrawn status', () => {
      expect(canSubmit('withdrawn')).toBe(false);
    });
  });

  describe('canWithdraw', () => {
    it('should allow withdraw for pending_approval status', () => {
      expect(canWithdraw('pending_approval')).toBe(true);
    });

    it('should not allow withdraw for draft status', () => {
      expect(canWithdraw('draft')).toBe(false);
    });

    it('should not allow withdraw for approved status', () => {
      expect(canWithdraw('approved')).toBe(false);
    });

    it('should not allow withdraw for rejected status', () => {
      expect(canWithdraw('rejected')).toBe(false);
    });

    it('should not allow withdraw for withdrawn status', () => {
      expect(canWithdraw('withdrawn')).toBe(false);
    });
  });

  describe('validateEntityExists', () => {
    it('should not throw for existing entity', () => {
      const entity = { id: '123', name: 'Test' };
      expect(() => {
        validateEntityExists(entity, 'Student');
      }).not.toThrow();
    });

    it('should throw ValidationError for null entity', () => {
      expect(() => {
        validateEntityExists(null, 'Student');
      }).toThrow(ValidationError);
      expect(() => {
        validateEntityExists(null, 'Student');
      }).toThrow('Student not found');
    });

    it('should throw ValidationError for undefined entity', () => {
      expect(() => {
        validateEntityExists(undefined, 'Faculty');
      }).toThrow(ValidationError);
      expect(() => {
        validateEntityExists(undefined, 'Faculty');
      }).toThrow('Faculty not found');
    });
  });

  describe('validateUnique', () => {
    it('should not throw when duplicate does not exist', () => {
      expect(() => {
        validateUnique(false, 'Student ID');
      }).not.toThrow();
    });

    it('should throw ValidationError when duplicate exists', () => {
      expect(() => {
        validateUnique(true, 'Student ID');
      }).toThrow(ValidationError);
      expect(() => {
        validateUnique(true, 'Student ID');
      }).toThrow('Student ID already exists');
    });

    it('should throw ValidationError with custom field name', () => {
      expect(() => {
        validateUnique(true, 'Faculty ID');
      }).toThrow('Faculty ID already exists');
    });
  });

  describe('validateDateRange', () => {
    it('should not throw for valid date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      expect(() => {
        validateDateRange(startDate, endDate);
      }).not.toThrow();
    });

    it('should not throw for valid string date range', () => {
      expect(() => {
        validateDateRange('2024-01-01', '2024-12-31');
      }).not.toThrow();
    });

    it('should throw ValidationError when end date is before start date', () => {
      const startDate = new Date('2024-12-31');
      const endDate = new Date('2024-01-01');
      expect(() => {
        validateDateRange(startDate, endDate);
      }).toThrow(ValidationError);
      expect(() => {
        validateDateRange(startDate, endDate);
      }).toThrow(/End date must be after Start date/);
    });

    it('should throw ValidationError when dates are equal', () => {
      const date = new Date('2024-06-15');
      expect(() => {
        validateDateRange(date, date);
      }).toThrow(ValidationError);
    });

    it('should use custom labels in error message', () => {
      const startDate = new Date('2024-12-31');
      const endDate = new Date('2024-01-01');
      expect(() => {
        validateDateRange(startDate, endDate, 'Registration deadline', 'Event date');
      }).toThrow(/Event date must be after Registration deadline/);
    });
  });

  describe('validateNotPastDate', () => {
    it('should not throw for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      expect(() => {
        validateNotPastDate(futureDate);
      }).not.toThrow();
    });

    it('should not throw for today', () => {
      const today = new Date();
      expect(() => {
        validateNotPastDate(today);
      }).not.toThrow();
    });

    it('should throw ValidationError for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      expect(() => {
        validateNotPastDate(pastDate);
      }).toThrow(ValidationError);
      expect(() => {
        validateNotPastDate(pastDate);
      }).toThrow(/Date cannot be in the past/);
    });

    it('should use custom label in error message', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      expect(() => {
        validateNotPastDate(pastDate, 'Event date');
      }).toThrow(/Event date cannot be in the past/);
    });

    it('should work with string dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      expect(() => {
        validateNotPastDate(futureDate.toISOString());
      }).not.toThrow();
    });
  });

  describe('validatePositiveInteger', () => {
    it('should not throw for positive integer', () => {
      expect(() => {
        validatePositiveInteger(1);
      }).not.toThrow();
      expect(() => {
        validatePositiveInteger(100);
      }).not.toThrow();
    });

    it('should throw ValidationError for zero', () => {
      expect(() => {
        validatePositiveInteger(0);
      }).toThrow(ValidationError);
      expect(() => {
        validatePositiveInteger(0);
      }).toThrow(/Value must be a positive integer/);
    });

    it('should throw ValidationError for negative number', () => {
      expect(() => {
        validatePositiveInteger(-5);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for decimal number', () => {
      expect(() => {
        validatePositiveInteger(3.14);
      }).toThrow(ValidationError);
    });

    it('should use custom label in error message', () => {
      expect(() => {
        validatePositiveInteger(0, 'Max participants');
      }).toThrow(/Max participants must be a positive integer/);
    });
  });

  describe('softDeleteTimestamp', () => {
    it('should return a Date object', () => {
      const timestamp = softDeleteTimestamp();
      expect(timestamp).toBeInstanceOf(Date);
    });

    it('should return current timestamp', () => {
      const before = new Date();
      const timestamp = softDeleteTimestamp();
      const after = new Date();
      
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
