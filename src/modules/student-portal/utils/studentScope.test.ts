/**
 * Student Scoping Utilities - Unit Tests
 * 
 * Tests for student ID extraction and ownership validation functions.
 */

import { Request } from 'express';
import {
  extractStudentId,
  validateStudentOwnership,
  extractAndValidateStudentId,
  isStudent,
  StudentAccessError,
  StudentUserContext,
} from './studentScope';

describe('Student Scoping Utilities', () => {
  describe('extractStudentId', () => {
    it('should extract student ID from valid user context', () => {
      const user: StudentUserContext = {
        userId: 'user-123',
        role: 'student',
        email: 'student@example.com',
        studentId: 'student-456',
      };

      const result = extractStudentId(user);

      expect(result).toBe('student-456');
    });

    it('should throw StudentAccessError when user is undefined', () => {
      expect(() => extractStudentId(undefined)).toThrow(StudentAccessError);
      expect(() => extractStudentId(undefined)).toThrow('Authentication required');
    });

    it('should throw StudentAccessError when studentId is missing', () => {
      const user: StudentUserContext = {
        userId: 'user-123',
        role: 'student',
        email: 'student@example.com',
      };

      expect(() => extractStudentId(user)).toThrow(StudentAccessError);
      expect(() => extractStudentId(user)).toThrow(
        'Student ID not found in user context'
      );
    });

    it('should throw StudentAccessError when studentId is empty string', () => {
      const user: StudentUserContext = {
        userId: 'user-123',
        role: 'student',
        email: 'student@example.com',
        studentId: '',
      };

      expect(() => extractStudentId(user)).toThrow(StudentAccessError);
    });
  });

  describe('validateStudentOwnership', () => {
    it('should not throw when student IDs match', () => {
      expect(() => {
        validateStudentOwnership('student-123', 'student-123');
      }).not.toThrow();
    });

    it('should throw StudentAccessError when student IDs do not match', () => {
      expect(() => {
        validateStudentOwnership('student-123', 'student-456');
      }).toThrow(StudentAccessError);
      expect(() => {
        validateStudentOwnership('student-123', 'student-456');
      }).toThrow('Access denied: You can only access your own resources');
    });

    it('should throw StudentAccessError for different student IDs', () => {
      const resourceStudentId = 'student-aaa';
      const userStudentId = 'student-bbb';

      expect(() => {
        validateStudentOwnership(resourceStudentId, userStudentId);
      }).toThrow(StudentAccessError);
    });
  });

  describe('extractAndValidateStudentId', () => {
    it('should extract and return student ID when no route parameter exists', () => {
      const req = {
        user: {
          userId: 'user-123',
          role: 'student',
          email: 'student@example.com',
          studentId: 'student-456',
        },
        params: {},
      } as unknown as Request;

      const result = extractAndValidateStudentId(req);

      expect(result).toBe('student-456');
    });

    it('should extract and validate when route parameter matches', () => {
      const req = {
        user: {
          userId: 'user-123',
          role: 'student',
          email: 'student@example.com',
          studentId: 'student-456',
        },
        params: {
          studentId: 'student-456',
        },
      } as unknown as Request;

      const result = extractAndValidateStudentId(req);

      expect(result).toBe('student-456');
    });

    it('should throw StudentAccessError when route parameter does not match', () => {
      const req = {
        user: {
          userId: 'user-123',
          role: 'student',
          email: 'student@example.com',
          studentId: 'student-456',
        },
        params: {
          studentId: 'student-789',
        },
      } as unknown as Request;

      expect(() => extractAndValidateStudentId(req)).toThrow(StudentAccessError);
    });

    it('should support custom parameter name', () => {
      const req = {
        user: {
          userId: 'user-123',
          role: 'student',
          email: 'student@example.com',
          studentId: 'student-456',
        },
        params: {
          id: 'student-456',
        },
      } as unknown as Request;

      const result = extractAndValidateStudentId(req, 'id');

      expect(result).toBe('student-456');
    });

    it('should throw when custom parameter does not match', () => {
      const req = {
        user: {
          userId: 'user-123',
          role: 'student',
          email: 'student@example.com',
          studentId: 'student-456',
        },
        params: {
          id: 'student-999',
        },
      } as unknown as Request;

      expect(() => extractAndValidateStudentId(req, 'id')).toThrow(
        StudentAccessError
      );
    });
  });

  describe('isStudent', () => {
    it('should return true for valid student user context', () => {
      const user: StudentUserContext = {
        userId: 'user-123',
        role: 'student',
        email: 'student@example.com',
        studentId: 'student-456',
      };

      expect(isStudent(user)).toBe(true);
    });

    it('should return false when user is undefined', () => {
      expect(isStudent(undefined)).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(isStudent(null)).toBe(false);
    });

    it('should return false when studentId is missing', () => {
      const user = {
        userId: 'user-123',
        role: 'student',
        email: 'student@example.com',
      };

      expect(isStudent(user)).toBe(false);
    });

    it('should return false when studentId is empty string', () => {
      const user = {
        userId: 'user-123',
        role: 'student',
        email: 'student@example.com',
        studentId: '',
      };

      expect(isStudent(user)).toBe(false);
    });

    it('should return false when studentId is whitespace only', () => {
      const user = {
        userId: 'user-123',
        role: 'student',
        email: 'student@example.com',
        studentId: '   ',
      };

      expect(isStudent(user)).toBe(false);
    });

    it('should return false when studentId is not a string', () => {
      const user = {
        userId: 'user-123',
        role: 'student',
        email: 'student@example.com',
        studentId: 123,
      };

      expect(isStudent(user)).toBe(false);
    });
  });

  describe('StudentAccessError', () => {
    it('should have correct properties', () => {
      const error = new StudentAccessError('Custom message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(StudentAccessError);
      expect(error.name).toBe('StudentAccessError');
      expect(error.message).toBe('Custom message');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('STUDENT_ACCESS_DENIED');
    });

    it('should use default message when none provided', () => {
      const error = new StudentAccessError();

      expect(error.message).toBe('Access denied: You can only access your own resources');
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new StudentAccessError('Test error');
      }).toThrow(StudentAccessError);

      try {
        throw new StudentAccessError('Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(StudentAccessError);
        if (error instanceof StudentAccessError) {
          expect(error.statusCode).toBe(403);
        }
      }
    });
  });
});
