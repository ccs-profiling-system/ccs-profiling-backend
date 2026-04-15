/**
 * checkOwnership Middleware Tests
 * 
 * Comprehensive test suite for the checkOwnership middleware.
 * Tests authentication checks, role bypass logic, resource fetching,
 * ownership validation, error responses, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { checkOwnership, addResourceConfig, getResourceConfig } from './checkOwnership.middleware';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';
import { Role } from '../types';
import { db } from '../../db';

// Mock database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('checkOwnership Middleware', () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let mockNext: any;
  let mockDbSelect: any;
  let consoleDebugSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    // Reset mocks
    mockRequest = {
      user: {
        userId: 'user-123',
        email: 'test@example.com',
        role: Role.FACULTY,
      },
      params: {
        id: 'resource-456',
      },
    };
    mockResponse = {};
    mockNext = vi.fn();

    // Mock database query chain
    mockDbSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    vi.mocked(db.select).mockReturnValue(mockDbSelect);

    // Spy on console methods
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleDebugSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Authentication Checks', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
        })
      );
      expect(db.select).not.toHaveBeenCalled();
    });

    it('should proceed to ownership check when user is authenticated', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(db.select).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Role Bypass Logic', () => {
    it('should bypass ownership check for Admin role', async () => {
      // Arrange
      mockRequest.user!.role = Role.ADMIN;
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ownership check bypassed')
      );
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('role=admin')
      );
      expect(db.select).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should bypass ownership check for Department_Chair role', async () => {
      // Arrange
      mockRequest.user!.role = Role.DEPARTMENT_CHAIR;
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ownership check bypassed')
      );
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('role=department_chair')
      );
      expect(db.select).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should NOT bypass ownership check for Faculty role', async () => {
      // Arrange
      mockRequest.user!.role = Role.FACULTY;
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(db.select).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should NOT bypass ownership check for Secretary role', async () => {
      // Arrange
      mockRequest.user!.role = Role.SECRETARY;
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(db.select).toHaveBeenCalled();
    });

    it('should NOT bypass ownership check for Student role', async () => {
      // Arrange
      mockRequest.user!.role = Role.STUDENT;
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('Resource ID Extraction', () => {
    it('should extract resource ID from default param name "id"', async () => {
      // Arrange
      mockRequest.params = { id: 'resource-789' };
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-789', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should extract resource ID from custom param name', async () => {
      // Arrange
      mockRequest.params = { studentId: 'student-999' };
      mockDbSelect.limit.mockResolvedValue([
        { id: 'student-999', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('student', { paramName: 'studentId' });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return error when param name not found', async () => {
      // Arrange
      mockRequest.params = { wrongParam: 'value' };
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Resource ID parameter "id" not found in request',
        })
      );
    });
  });

  describe('Resource Fetching', () => {
    it('should fetch resource from database', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(db.select).toHaveBeenCalled();
      expect(mockDbSelect.from).toHaveBeenCalled();
      expect(mockDbSelect.where).toHaveBeenCalled();
      expect(mockDbSelect.limit).toHaveBeenCalledWith(1);
    });

    it('should return 404 when resource not found', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'student not found',
          statusCode: 404,
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockDbSelect.limit.mockRejectedValue(dbError);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe('Ownership Validation', () => {
    it('should grant access when user owns the resource', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ownership validated')
      );
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny access when user does not own the resource', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'different-user' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ownership validation failed')
      );
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access denied: You do not own this student',
          statusCode: 403,
        })
      );
    });

    it('should use default ownership field from config', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should use custom ownership field when provided', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', faculty_id: 'user-123' },
      ]);
      const middleware = checkOwnership('instruction', { ownerField: 'faculty_id' });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle missing ownership field on resource', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456' }, // No ownership field
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ownership field "user_id" not found')
      );
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cannot validate ownership: student does not have ownership information',
        })
      );
    });
  });

  describe('Resource Type Configuration', () => {
    it('should support student resource type', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should support faculty resource type', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('faculty');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should support instruction resource type', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', faculty_id: 'user-123' },
      ]);
      const middleware = checkOwnership('instruction');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should support research resource type', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', faculty_id: 'user-123' },
      ]);
      const middleware = checkOwnership('research');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should support enrollment resource type', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', student_id: 'user-123' },
      ]);
      const middleware = checkOwnership('enrollment');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should support academic_history resource type', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', student_id: 'user-123' },
      ]);
      const middleware = checkOwnership('academic_history');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw error for unknown resource type', () => {
      // Arrange & Act & Assert
      expect(() => checkOwnership('unknown_resource')).toThrow(
        'checkOwnership: Unknown resource type "unknown_resource"'
      );
    });
  });

  describe('Error Response Format', () => {
    it('should return UnauthorizedError with status 401 when not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should return NotFoundError with status 404 when resource not found', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should return ForbiddenError with status 403 when ownership validation fails', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'different-user' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should include resource type in error message', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', faculty_id: 'different-user' },
      ]);
      const middleware = checkOwnership('instruction');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access denied: You do not own this instruction',
        })
      );
    });
  });

  describe('Middleware Composition', () => {
    it('should work with requirePermission middleware', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'user-123' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should be chainable with other middleware', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValue([
        { id: 'resource-456', user_id: 'user-123' },
      ]);
      const middleware1 = checkOwnership('student');
      const middleware2 = checkOwnership('enrollment');

      // Act
      await middleware1(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Custom Resource Configuration', () => {
    it('should allow adding custom resource types', () => {
      // Arrange
      const mockTable = { id: 'mock-table' };
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      // Act
      addResourceConfig('custom_resource', mockTable, 'owner_id');
      const config = getResourceConfig();

      // Assert
      expect(config.custom_resource).toBeDefined();
      expect(config.custom_resource.table).toBe(mockTable);
      expect(config.custom_resource.ownerField).toBe('owner_id');
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Added resource config: type=custom_resource')
      );

      consoleInfoSpy.mockRestore();
    });

    it('should warn when overwriting existing resource config', () => {
      // Arrange
      const mockTable = { id: 'mock-table' };
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      // Act
      addResourceConfig('student', mockTable, 'new_owner_id');

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Overwriting existing resource config for "student"')
      );

      consoleWarnSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it('should return copy of resource config', () => {
      // Arrange & Act
      const config1 = getResourceConfig();
      const config2 = getResourceConfig();

      // Assert
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different objects
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user_id in request', async () => {
      // Arrange
      mockRequest.user!.userId = null;
      mockDbSelect.limit.mockResolvedValueOnce([
        { id: 'resource-456', user_id: 'some-user' },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should handle null owner_id in resource', async () => {
      // Arrange
      mockDbSelect.limit.mockResolvedValueOnce([
        { id: 'resource-456', user_id: null },
      ]);
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should handle empty resource ID', async () => {
      // Arrange
      mockRequest.params.id = '';
      const middleware = checkOwnership('student');

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      // Empty string is treated as validation error
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });
});
