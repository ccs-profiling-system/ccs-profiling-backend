/**
 * Unit Tests for requirePermission Middleware
 * 
 * Tests the permission checking middleware with focus on:
 * - HTTP 401 when not authenticated
 * - HTTP 403 when permission denied
 * - Proper permission validation
 * - Multiple permission support (OR logic)
 * 
 * Task 18: Basic Unit Tests (CRITICAL)
 * Sub-tasks:
 * - 18.4 Test requirePermission() returns 403 when permission denied
 * - 18.5 Test requirePermission() returns 401 when not authenticated
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requirePermission } from './requirePermission.middleware';
import { Role } from '../types';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors';

// Mock the PermissionChecker service
vi.mock('../services/permissionChecker.service', () => {
  return {
    PermissionChecker: {
      getInstance: vi.fn(() => ({
        hasPermission: vi.fn((role: Role, permission: string) => {
          // Mock permission logic for testing
          if (role === Role.ADMIN) {
            return { granted: true, reason: 'Wildcard allow: *.*' };
          }
          if (role === Role.FACULTY && permission === 'student.read') {
            return { granted: true, reason: 'Explicit allow: student.read' };
          }
          if (role === Role.FACULTY && permission === 'instruction.create') {
            return { granted: true, reason: 'Wildcard allow: instruction.*' };
          }
          if (role === Role.STUDENT && permission === 'student.read_own') {
            return { granted: true, reason: 'Explicit allow: student.read_own' };
          }
          if (role === Role.FACULTY && permission === 'research.create') {
            return { granted: true, reason: 'Explicit allow: research.create' };
          }
          return { granted: false, reason: 'Default deny: no matching permission' };
        }),
      })),
    },
  };
});

describe('requirePermission Middleware', () => {
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
  });

  describe('18.5 - Returns 401 when not authenticated', () => {
    it('should throw UnauthorizedError when req.user is undefined', () => {
      const middleware = requirePermission('student.read');
      
      // req.user is undefined (not authenticated)
      mockRequest.user = undefined;
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain('Authentication required');
    });

    it('should throw UnauthorizedError when req.user is null', () => {
      const middleware = requirePermission('schedule.read');
      
      // req.user is null (not authenticated)
      mockRequest.user = null as any;
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should return 401 before checking permissions', () => {
      const middleware = requirePermission('student.read');
      
      // No user authenticated
      mockRequest.user = undefined;
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Should fail with UnauthorizedError, not ForbiddenError
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('18.4 - Returns 403 when permission denied', () => {
    it('should throw ForbiddenError when user lacks required permission', () => {
      const middleware = requirePermission('schedule.approve');
      
      // Student user (lacks schedule.approve permission)
      mockRequest.user = {
        userId: 'user-123',
        role: Role.STUDENT,
        email: 'student@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain('Permission denied');
      expect(error.message).toContain('schedule.approve');
    });

    it('should throw ForbiddenError with detailed message for single permission', () => {
      const middleware = requirePermission('student.delete');
      
      // Faculty user (lacks student.delete permission)
      mockRequest.user = {
        userId: 'user-456',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toBe('Permission denied: student.delete');
    });

    it('should throw ForbiddenError with multiple permissions message', () => {
      const middleware = requirePermission(['schedule.approve', 'schedule.reject']);
      
      // Faculty user (lacks both permissions)
      mockRequest.user = {
        userId: 'user-789',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain('requires one of');
      expect(error.message).toContain('schedule.approve');
      expect(error.message).toContain('schedule.reject');
    });

    it('should deny access for Student trying to create data', () => {
      const middleware = requirePermission('student.create');
      
      mockRequest.user = {
        userId: 'student-123',
        role: Role.STUDENT,
        email: 'student@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should deny access for Faculty trying to approve schedules', () => {
      const middleware = requirePermission('schedule.approve');
      
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('Permission Granted - Success Cases', () => {
    it('should call next() when user has required permission', () => {
      const middleware = requirePermission('student.read');
      
      // Faculty user (has student.read permission)
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should allow Admin to access any permission', () => {
      const middleware = requirePermission('schedule.delete');
      
      // Admin user (has all permissions)
      mockRequest.user = {
        userId: 'admin-123',
        role: Role.ADMIN,
        email: 'admin@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should allow Student to read own data', () => {
      const middleware = requirePermission('student.read_own');
      
      mockRequest.user = {
        userId: 'student-123',
        role: Role.STUDENT,
        email: 'student@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should allow Faculty to create instructions', () => {
      const middleware = requirePermission('instruction.create');
      
      mockRequest.user = {
        userId: 'faculty-456',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Multiple Permissions (OR Logic)', () => {
    it('should allow access if user has at least one of multiple permissions', () => {
      const middleware = requirePermission(['research.create', 'research.submit']);
      
      // Faculty has research.create
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny access if user has none of the multiple permissions', () => {
      const middleware = requirePermission(['schedule.approve', 'schedule.reject']);
      
      // Student has neither permission
      mockRequest.user = {
        userId: 'student-123',
        role: Role.STUDENT,
        email: 'student@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should support array of permissions with OR logic', () => {
      const middleware = requirePermission(['student.read', 'student.read_own']);
      
      // Faculty has student.read
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Edge Cases', () => {
    it('should throw error when no permissions are provided', () => {
      expect(() => {
        requirePermission([]);
      }).toThrow('At least one permission must be specified');
    });

    it('should handle single permission as string', () => {
      const middleware = requirePermission('student.read');
      
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle single permission as array', () => {
      const middleware = requirePermission(['student.read']);
      
      mockRequest.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should pass errors to next() middleware', () => {
      const middleware = requirePermission('student.read');
      
      // Not authenticated
      mockRequest.user = undefined;
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not call response methods directly', () => {
      const middleware = requirePermission('student.read');
      
      mockRequest.user = undefined;
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Middleware should use next(error), not res.status().json()
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('Execution Order', () => {
    it('should check authentication before permissions', () => {
      const middleware = requirePermission('student.read');
      
      // Not authenticated
      mockRequest.user = undefined;
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Should fail with UnauthorizedError (401), not ForbiddenError (403)
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should check permissions after authentication', () => {
      const middleware = requirePermission('schedule.approve');
      
      // Authenticated but lacks permission
      mockRequest.user = {
        userId: 'student-123',
        role: Role.STUDENT,
        email: 'student@example.com',
      };
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Should fail with ForbiddenError (403), not UnauthorizedError (401)
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });
});
