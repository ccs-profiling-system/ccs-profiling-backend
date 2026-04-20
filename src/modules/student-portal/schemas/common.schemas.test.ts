/**
 * Common Schemas - Unit Tests
 * 
 * Tests for common validation schemas and helper functions.
 */

import {
  paginationSchema,
  emailSchema,
  optionalEmailSchema,
  phoneSchema,
  optionalPhoneSchema,
  dateSchema,
  optionalDateSchema,
  dateTimeSchema,
  uuidSchema,
  nonEmptyStringSchema,
  notificationTypeSchema,
  enrollmentStatusSchema,
  academicStandingSchema,
  researchApplicationStatusSchema,
  eventRegistrationStatusSchema,
  appointmentStatusSchema,
  messageSenderRoleSchema,
  idParamSchema,
  studentIdParamSchema,
  calculatePaginationMeta,
  calculateOffset,
} from './common.schemas';

describe('Common Schemas', () => {
  describe('paginationSchema', () => {
    it('should use default values when not provided', () => {
      const result = paginationSchema.parse({});
      expect(result).toEqual({ page: 1, limit: 10 });
    });

    it('should parse valid pagination parameters', () => {
      const result = paginationSchema.parse({ page: 2, limit: 20 });
      expect(result).toEqual({ page: 2, limit: 20 });
    });

    it('should coerce string numbers to integers', () => {
      const result = paginationSchema.parse({ page: '3', limit: '15' });
      expect(result).toEqual({ page: 3, limit: 15 });
    });

    it('should enforce maximum limit of 100', () => {
      expect(() => paginationSchema.parse({ page: 1, limit: 101 })).toThrow();
    });

    it('should reject negative page numbers', () => {
      expect(() => paginationSchema.parse({ page: -1, limit: 10 })).toThrow();
    });

    it('should reject zero page numbers', () => {
      expect(() => paginationSchema.parse({ page: 0, limit: 10 })).toThrow();
    });

    it('should reject negative limits', () => {
      expect(() => paginationSchema.parse({ page: 1, limit: -5 })).toThrow();
    });
  });

  describe('emailSchema', () => {
    it('should validate correct email format', () => {
      const result = emailSchema.parse('student@example.com');
      expect(result).toBe('student@example.com');
    });

    it('should reject invalid email format', () => {
      expect(() => emailSchema.parse('invalid-email')).toThrow('Invalid email format');
    });

    it('should reject empty string', () => {
      expect(() => emailSchema.parse('')).toThrow();
    });

    it('should validate email with subdomain', () => {
      const result = emailSchema.parse('student@mail.example.com');
      expect(result).toBe('student@mail.example.com');
    });
  });

  describe('optionalEmailSchema', () => {
    it('should allow undefined', () => {
      const result = optionalEmailSchema.parse(undefined);
      expect(result).toBeUndefined();
    });

    it('should validate correct email when provided', () => {
      const result = optionalEmailSchema.parse('student@example.com');
      expect(result).toBe('student@example.com');
    });

    it('should reject invalid email format', () => {
      expect(() => optionalEmailSchema.parse('invalid-email')).toThrow();
    });
  });

  describe('phoneSchema', () => {
    it('should validate phone with digits only', () => {
      const result = phoneSchema.parse('1234567890');
      expect(result).toBe('1234567890');
    });

    it('should validate phone with dashes', () => {
      const result = phoneSchema.parse('123-456-7890');
      expect(result).toBe('123-456-7890');
    });

    it('should validate phone with spaces', () => {
      const result = phoneSchema.parse('123 456 7890');
      expect(result).toBe('123 456 7890');
    });

    it('should validate phone with plus and parentheses', () => {
      const result = phoneSchema.parse('+1(234)567-890');
      expect(result).toBe('+1(234)567-890');
    });

    it('should reject phone with letters', () => {
      expect(() => phoneSchema.parse('123-ABC-7890')).toThrow('Invalid phone number format');
    });

    it('should reject phone shorter than 10 characters', () => {
      expect(() => phoneSchema.parse('123456789')).toThrow();
    });

    it('should reject phone longer than 15 characters', () => {
      expect(() => phoneSchema.parse('1234567890123456')).toThrow();
    });
  });

  describe('dateSchema', () => {
    it('should validate correct date format', () => {
      const result = dateSchema.parse('2024-01-15');
      expect(result).toBe('2024-01-15');
    });

    it('should reject invalid date format', () => {
      expect(() => dateSchema.parse('01/15/2024')).toThrow('Invalid date format');
    });

    it('should reject date without leading zeros', () => {
      expect(() => dateSchema.parse('2024-1-5')).toThrow();
    });

    it('should reject datetime string', () => {
      expect(() => dateSchema.parse('2024-01-15T10:30:00')).toThrow();
    });
  });

  describe('dateTimeSchema', () => {
    it('should validate ISO 8601 datetime format', () => {
      const result = dateTimeSchema.parse('2024-01-15T10:30:00Z');
      expect(result).toBe('2024-01-15T10:30:00Z');
    });

    it('should validate datetime with milliseconds', () => {
      const result = dateTimeSchema.parse('2024-01-15T10:30:00.123Z');
      expect(result).toBe('2024-01-15T10:30:00.123Z');
    });

    it('should reject date-only string', () => {
      expect(() => dateTimeSchema.parse('2024-01-15')).toThrow();
    });

    it('should reject invalid datetime format', () => {
      expect(() => dateTimeSchema.parse('2024-01-15 10:30:00')).toThrow();
    });
  });

  describe('uuidSchema', () => {
    it('should validate correct UUID v4 format', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = uuidSchema.parse(uuid);
      expect(result).toBe(uuid);
    });

    it('should reject invalid UUID format', () => {
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow('Invalid UUID format');
    });

    it('should reject UUID without dashes', () => {
      expect(() => uuidSchema.parse('550e8400e29b41d4a716446655440000')).toThrow();
    });
  });

  describe('nonEmptyStringSchema', () => {
    it('should validate non-empty string', () => {
      const result = nonEmptyStringSchema.parse('Hello');
      expect(result).toBe('Hello');
    });

    it('should trim whitespace', () => {
      const result = nonEmptyStringSchema.parse('  Hello  ');
      expect(result).toBe('Hello');
    });

    it('should reject empty string', () => {
      expect(() => nonEmptyStringSchema.parse('')).toThrow('Field cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      expect(() => nonEmptyStringSchema.parse('   ')).toThrow();
    });
  });

  describe('Enum Schemas', () => {
    describe('notificationTypeSchema', () => {
      it('should validate valid notification types', () => {
        expect(notificationTypeSchema.parse('academic')).toBe('academic');
        expect(notificationTypeSchema.parse('financial')).toBe('financial');
        expect(notificationTypeSchema.parse('event')).toBe('event');
        expect(notificationTypeSchema.parse('system')).toBe('system');
      });

      it('should reject invalid notification type', () => {
        expect(() => notificationTypeSchema.parse('invalid')).toThrow();
      });
    });

    describe('enrollmentStatusSchema', () => {
      it('should validate valid enrollment statuses', () => {
        expect(enrollmentStatusSchema.parse('enrolled')).toBe('enrolled');
        expect(enrollmentStatusSchema.parse('dropped')).toBe('dropped');
        expect(enrollmentStatusSchema.parse('completed')).toBe('completed');
      });

      it('should reject invalid enrollment status', () => {
        expect(() => enrollmentStatusSchema.parse('pending')).toThrow();
      });
    });

    describe('academicStandingSchema', () => {
      it('should validate valid academic standings', () => {
        expect(academicStandingSchema.parse('Good Standing')).toBe('Good Standing');
        expect(academicStandingSchema.parse('Probation')).toBe('Probation');
      });

      it('should reject invalid academic standing', () => {
        expect(() => academicStandingSchema.parse('Excellent')).toThrow();
      });
    });

    describe('researchApplicationStatusSchema', () => {
      it('should validate valid research application statuses', () => {
        expect(researchApplicationStatusSchema.parse('pending')).toBe('pending');
        expect(researchApplicationStatusSchema.parse('accepted')).toBe('accepted');
        expect(researchApplicationStatusSchema.parse('rejected')).toBe('rejected');
      });

      it('should reject invalid status', () => {
        expect(() => researchApplicationStatusSchema.parse('approved')).toThrow();
      });
    });

    describe('eventRegistrationStatusSchema', () => {
      it('should validate valid event registration statuses', () => {
        expect(eventRegistrationStatusSchema.parse('registered')).toBe('registered');
        expect(eventRegistrationStatusSchema.parse('cancelled')).toBe('cancelled');
        expect(eventRegistrationStatusSchema.parse('attended')).toBe('attended');
      });

      it('should reject invalid status', () => {
        expect(() => eventRegistrationStatusSchema.parse('pending')).toThrow();
      });
    });

    describe('appointmentStatusSchema', () => {
      it('should validate valid appointment statuses', () => {
        expect(appointmentStatusSchema.parse('scheduled')).toBe('scheduled');
        expect(appointmentStatusSchema.parse('completed')).toBe('completed');
        expect(appointmentStatusSchema.parse('cancelled')).toBe('cancelled');
      });

      it('should reject invalid status', () => {
        expect(() => appointmentStatusSchema.parse('pending')).toThrow();
      });
    });

    describe('messageSenderRoleSchema', () => {
      it('should validate valid sender roles', () => {
        expect(messageSenderRoleSchema.parse('student')).toBe('student');
        expect(messageSenderRoleSchema.parse('faculty')).toBe('faculty');
      });

      it('should reject invalid role', () => {
        expect(() => messageSenderRoleSchema.parse('admin')).toThrow();
      });
    });
  });

  describe('Parameter Schemas', () => {
    describe('idParamSchema', () => {
      it('should validate valid UUID in id parameter', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        const result = idParamSchema.parse({ id: uuid });
        expect(result).toEqual({ id: uuid });
      });

      it('should reject invalid UUID', () => {
        expect(() => idParamSchema.parse({ id: 'not-a-uuid' })).toThrow();
      });

      it('should reject missing id', () => {
        expect(() => idParamSchema.parse({})).toThrow();
      });
    });

    describe('studentIdParamSchema', () => {
      it('should validate valid UUID in studentId parameter', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        const result = studentIdParamSchema.parse({ studentId: uuid });
        expect(result).toEqual({ studentId: uuid });
      });

      it('should reject invalid UUID', () => {
        expect(() => studentIdParamSchema.parse({ studentId: 'not-a-uuid' })).toThrow();
      });
    });
  });

  describe('Helper Functions', () => {
    describe('calculatePaginationMeta', () => {
      it('should calculate correct pagination metadata', () => {
        const result = calculatePaginationMeta(100, 1, 10);
        expect(result).toEqual({
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
        });
      });

      it('should round up total pages', () => {
        const result = calculatePaginationMeta(95, 1, 10);
        expect(result).toEqual({
          total: 95,
          page: 1,
          limit: 10,
          totalPages: 10,
        });
      });

      it('should handle single page', () => {
        const result = calculatePaginationMeta(5, 1, 10);
        expect(result).toEqual({
          total: 5,
          page: 1,
          limit: 10,
          totalPages: 1,
        });
      });

      it('should handle zero total', () => {
        const result = calculatePaginationMeta(0, 1, 10);
        expect(result).toEqual({
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        });
      });

      it('should handle different page numbers', () => {
        const result = calculatePaginationMeta(100, 5, 10);
        expect(result).toEqual({
          total: 100,
          page: 5,
          limit: 10,
          totalPages: 10,
        });
      });
    });

    describe('calculateOffset', () => {
      it('should calculate correct offset for first page', () => {
        const result = calculateOffset(1, 10);
        expect(result).toBe(0);
      });

      it('should calculate correct offset for second page', () => {
        const result = calculateOffset(2, 10);
        expect(result).toBe(10);
      });

      it('should calculate correct offset for arbitrary page', () => {
        const result = calculateOffset(5, 20);
        expect(result).toBe(80);
      });

      it('should handle different limit values', () => {
        const result = calculateOffset(3, 15);
        expect(result).toBe(30);
      });
    });
  });
});
