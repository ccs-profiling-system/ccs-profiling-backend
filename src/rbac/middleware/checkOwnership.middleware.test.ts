/**
 * Unit Tests for checkOwnership Middleware
 * 
 * Tests the ownership validation middleware with focus on:
 * - HTTP 403 when ownership validation fails
 * - HTTP 401 when not authenticated
 * - HTTP 404 when resource doesn't exist
 * - Bypass for Admin and Department_Chair roles
 * 
 * Task 18: Basic Unit Tests (CRITICAL)
 * Sub-tasks:
 * - 18.6 Test checkOwnership() returns 403 when ownership validation fails
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';

// Create mock database
const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve([])),
      })),
    })),
  })),
};

// Mock the database module
vi.mock('../../db', () => ({
  db: mockDb,
}));

// Mock the schema
vi.mock('../../db/schema', () => ({
  students: { id: 'id', user_id: 'user_id' },
  faculty: { id: 'id', user_id: 'user_id' },
  instructions: { id: 'id', faculty_id: 'faculty_id' },
  research: { id: 'id', faculty_id: 'faculty_id' },
  enrollments: { id: 'id', student_id: 'student_id' },
  academicHistory: { id: 'id', student_id: 'student_id' },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value })),
}));

// Import after mocks are set up
const { checkOwnership } = await import('./checkOwnership.middleware');

describe('checkOwnership Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: undefined,
      params: {},
      body: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();

    // Reset database mock
    vi.clearAllMocks();
  });

  describe('18.6 - Returns 403 when ownership validation fails', () => {
    it('should throw ForbiddenError when user does not own the resource', async () => {
      const middleware = checkOwnership('instruction');
      
      // Faculty user trying to access another faculty's instruction
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      mockRequest.params = { id: 'instruction-456' };
      
      // Mock database to return instruction owned by different user
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'instruction-456', faculty_id: 'faculty-999' } // Different owner
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain('You do not own this instruction');
    });

    it('should throw ForbiddenError when student tries to access another student\'s data', async () => {
      const middleware = checkOwnership('student');
      
      mockRequest.user = {
        userId: 'user-123',
        role: Role.STUDENT,
        email: 'student@example.com',
      };
      mockRequest.params = { id: 'student-456' };
      
      // Mock database to return student profile owned by different user
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'student-456', user_id: 'user-999' } // Different owner
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain('You do not own this student');
    });

    it('should throw ForbiddenError when faculty tries to access another faculty\'s research', async () => {
      const middleware = checkOwnership('research');
      
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      mockRequest.params = { id: 'research-789' };
      
      // Mock database to return research owned by different faculty
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'research-789', faculty_id: 'faculty-888' } // Different owner
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should throw ForbiddenError with descriptive message', async () => {
      const middleware = checkOwnership('enrollment');
      
      mockRequest.user = {
        userId: 'student-123',
        role: Role.STUDENT,
        email: 'student@example.com',
      };
      mockRequest.params = { id: 'enrollment-456' };
      
      // Mock database to return enrollment owned by different student
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'enrollment-456', student_id: 'student-999' }
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toBe('Access denied: You do not own this enrollment');
    });
  });

  describe('Authentication Check', () => {
    it('should throw UnauthorizedError when user is not authenticated', async () => {
      const middleware = checkOwnership('instruction');
      
      // No user authenticated
      mockRequest.user = undefined;
      mockRequest.params = { id: 'instruction-123' };
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain('Authentication required');
    });

    it('should check authentication before ownership', async () => {
      const middleware = checkOwnership('student');
      
      mockRequest.user = null as any;
      mockRequest.params = { id: 'student-123' };
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Should fail with UnauthorizedError, not ForbiddenError
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('Bypass for Admin and Department_Chair', () => {
    it('should bypass ownership check for Admin role', async () => {
      const middleware = checkOwnership('instruction');
      
      mockRequest.user = {
        userId: 'admin-123',
        role: Role.ADMIN,
        email: 'admin@example.com',
      };
      mockRequest.params = { id: 'instruction-456' };
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Should call next() without error (bypass ownership check)
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should bypass ownership check for Department_Chair role', async () => {
      const middleware = checkOwnership('research');
      
      mockRequest.user = {
        userId: 'chair-123',
        role: Role.DEPARTMENT_CHAIR,
        email: 'chair@example.com',
      };
      mockRequest.params = { id: 'research-789' };
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Should call next() without error (bypass ownership check)
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not bypass ownership check for Faculty role', async () => {
      const middleware = checkOwnership('instruction');
      
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      mockRequest.params = { id: 'instruction-456' };
      
      // Mock database to return instruction owned by different faculty
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'instruction-456', faculty_id: 'faculty-999' }
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Should check ownership and fail
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should not bypass ownership check for Student role', async () => {
      const middleware = checkOwnership('student');
      
      mockRequest.user = {
        userId: 'user-123',
        role: Role.STUDENT,
        email: 'student@example.com',
      };
      mockRequest.params = { id: 'student-456' };
      
      // Mock database to return student profile owned by different user
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'student-456', user_id: 'user-999' }
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Should check ownership and fail
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should not bypass ownership check for Secretary role', async () => {
      const middleware = checkOwnership('student');
      
      mockRequest.user = {
        userId: 'secretary-123',
        role: Role.SECRETARY,
        email: 'secretary@example.com',
      };
      mockRequest.params = { id: 'student-456' };
      
      // Mock database to return student profile owned by different user
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'student-456', user_id: 'user-999' }
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Should check ownership and fail
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('Resource Not Found', () => {
    it('should throw NotFoundError when resource does not exist', async () => {
      const middleware = checkOwnership('instruction');
      
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      mockRequest.params = { id: 'nonexistent-id' };
      
      // Mock database to return empty array (resource not found)
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain('instruction not found');
    });

    it('should return 404 before checking ownership', async () => {
      const middleware = checkOwnership('research');
      
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      mockRequest.params = { id: 'nonexistent-research' };
      
      // Mock database to return empty array
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Should fail with NotFoundError, not ForbiddenError
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('Ownership Validation Success', () => {
    it('should call next() when user owns the resource', async () => {
      const middleware = checkOwnership('instruction');
      
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      mockRequest.params = { id: 'instruction-456' };
      
      // Mock database to return instruction owned by the user
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'instruction-456', faculty_id: 'faculty-123' } // Same owner
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should allow student to access their own profile', async () => {
      const middleware = checkOwnership('student');
      
      mockRequest.user = {
        userId: 'user-123',
        role: Role.STUDENT,
        email: 'student@example.com',
      };
      mockRequest.params = { id: 'student-456' };
      
      // Mock database to return student profile owned by the user
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'student-456', user_id: 'user-123' } // Same owner
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow faculty to access their own research', async () => {
      const middleware = checkOwnership('research');
      
      mockRequest.user = {
        userId: 'faculty-789',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      mockRequest.params = { id: 'research-123' };
      
      // Mock database to return research owned by the faculty
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'research-123', faculty_id: 'faculty-789' } // Same owner
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Custom Parameter Name', () => {
    it('should support custom parameter name', async () => {
      const middleware = checkOwnership('student', { paramName: 'studentId' });
      
      mockRequest.user = {
        userId: 'user-123',
        role: Role.STUDENT,
        email: 'student@example.com',
      };
      mockRequest.params = { studentId: 'student-456' }; // Custom param name
      
      // Mock database to return student profile owned by the user
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'student-456', user_id: 'user-123' }
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw ValidationError when custom parameter is missing', async () => {
      const middleware = checkOwnership('student', { paramName: 'studentId' });
      
      mockRequest.user = {
        userId: 'user-123',
        role: Role.STUDENT,
        email: 'student@example.com',
      };
      mockRequest.params = { id: 'student-456' }; // Wrong param name
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain('studentId');
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for unknown resource type', () => {
      expect(() => {
        checkOwnership('unknown_resource');
      }).toThrow('Unknown resource type');
    });

    it('should throw ValidationError when resource ID is empty', async () => {
      const middleware = checkOwnership('instruction');
      
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      mockRequest.params = { id: '' }; // Empty ID
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should throw ValidationError when resource ID parameter is missing', async () => {
      const middleware = checkOwnership('instruction');
      
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      mockRequest.params = {}; // No ID parameter
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should handle resource without ownership field', async () => {
      const middleware = checkOwnership('instruction');
      
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      mockRequest.params = { id: 'instruction-456' };
      
      // Mock database to return resource without ownership field
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([
              { id: 'instruction-456' } // Missing faculty_id
            ])),
          })),
        })),
      });
      
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain('Cannot validate ownership');
    });
  });
});
