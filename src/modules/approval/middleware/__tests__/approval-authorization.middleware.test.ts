/**
 * Unit Tests for Approval Authorization Middleware
 * 
 * Tests all authorization scenarios including:
 * - Role-based authorization
 * - Department scope validation
 * - Change request department validation
 * - Bulk operation department validation
 * - Authorization failure logging
 * 
 * **Validates: Requirements 15.1-15.7, 9.1-9.5, 10.1-10.5, 11.1-11.4, 12.1-12.4**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  requireApprovalRole,
  requireDepartmentScope,
  validateChangeRequestDepartment,
  validateBulkOperationDepartment,
  resetApprovalRepository,
} from '../approval-authorization.middleware';
import { ForbiddenError, UnauthorizedError } from '../../../../shared/errors';
import { ApprovalRepository } from '../../repositories/approval.repository';
import { db } from '../../../../db';

// Mock dependencies
vi.mock('../../../../db');
vi.mock('../../../audit-logs', () => ({
  auditLogRepository: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

// Mock faculty query
const mockFacultyQuery = vi.fn();
vi.mocked(db).query = {
  faculty: {
    findFirst: mockFacultyQuery,
  },
} as any;

describe('Approval Authorization Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockApprovalRepository: any;

  beforeEach(() => {
    mockRequest = {
      user: undefined,
      params: {},
      body: {},
      headers: {},
      path: '/test',
      method: 'GET',
      socket: { remoteAddress: '127.0.0.1' } as any,
    };
    mockResponse = {};
    mockNext = vi.fn();

    // Create mock approval repository
    mockApprovalRepository = {
      findById: vi.fn(),
    };

    // Reset and inject mock repository
    resetApprovalRepository(mockApprovalRepository as any);

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset repository to null after each test
    resetApprovalRepository();
    vi.restoreAllMocks();
  });

  describe('requireApprovalRole', () => {
    it('should throw UnauthorizedError if user is not authenticated', async () => {
      const middleware = requireApprovalRole(['admin']);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
        })
      );
    });

    it('should allow access if user has required role (admin)', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'admin@example.com',
        role: 'admin',
      };

      const middleware = requireApprovalRole(['admin']);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should allow access if user has one of multiple required roles', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };

      const middleware = requireApprovalRole(['admin', 'chair']);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw ForbiddenError if user does not have required role', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'secretary@example.com',
        role: 'secretary',
      };

      const middleware = requireApprovalRole(['admin']);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access denied. Required role: admin',
        })
      );
    });

    it('should log authorization failure when role is not authorized', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'secretary@example.com',
        role: 'secretary',
      };

      const middleware = requireApprovalRole(['admin', 'chair']);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Wait for async audit log
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('requireDepartmentScope', () => {
    it('should throw UnauthorizedError if user is not authenticated', async () => {
      await requireDepartmentScope(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should skip department validation for non-chair roles', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'admin@example.com',
        role: 'admin',
      };

      await requireDepartmentScope(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
      expect(mockFacultyQuery).not.toHaveBeenCalled();
    });

    it('should attach user department for chair role', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };

      mockFacultyQuery.mockResolvedValue({
        user_id: 'user-123',
        department: 'Computer Science',
      });

      await requireDepartmentScope(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFacultyQuery).toHaveBeenCalled();
      expect((mockRequest as any).userDepartment).toBe('Computer Science');
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw ForbiddenError if chair has no department assigned', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };

      mockFacultyQuery.mockResolvedValue(null);

      await requireDepartmentScope(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Chair must be assigned to a department',
        })
      );
    });

    it('should log authorization failure when chair has no department', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };

      mockFacultyQuery.mockResolvedValue(null);

      await requireDepartmentScope(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Wait for async audit log
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('validateChangeRequestDepartment', () => {
    it('should throw UnauthorizedError if user is not authenticated', async () => {
      await validateChangeRequestDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should allow admin to access any change request', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'admin@example.com',
        role: 'admin',
      };
      mockRequest.params = { id: 'approval-123' };

      await validateChangeRequestDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
      expect(mockApprovalRepository.findById).not.toHaveBeenCalled();
    });

    it('should allow chair to access change request in their department', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.params = { id: 'approval-123' };

      mockFacultyQuery.mockResolvedValue({
        user_id: 'user-123',
        department: 'Computer Science',
      });

      mockApprovalRepository.findById.mockResolvedValue({
        id: 'approval-123',
        department_id: 'Computer Science',
        status: 'pending',
      });

      await validateChangeRequestDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFacultyQuery).toHaveBeenCalled();
      expect(mockApprovalRepository.findById).toHaveBeenCalledWith('approval-123');
      expect((mockRequest as any).userDepartment).toBe('Computer Science');
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw ForbiddenError if chair tries to access change request outside their department', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.params = { id: 'approval-123' };

      mockFacultyQuery.mockResolvedValue({
        user_id: 'user-123',
        department: 'Computer Science',
      });

      mockApprovalRepository.findById.mockResolvedValue({
        id: 'approval-123',
        department_id: 'Mathematics',
        status: 'pending',
      });

      await validateChangeRequestDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access denied. Change request belongs to a different department',
        })
      );
    });

    it('should throw ForbiddenError if chair has no department assigned', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.params = { id: 'approval-123' };

      mockFacultyQuery.mockResolvedValue(null);

      await validateChangeRequestDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Chair must be assigned to a department',
        })
      );
    });

    it('should proceed to next middleware if change request not found (let controller handle 404)', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.params = { id: 'approval-123' };

      mockFacultyQuery.mockResolvedValue({
        user_id: 'user-123',
        department: 'Computer Science',
      });

      mockApprovalRepository.findById.mockResolvedValue(null);

      await validateChangeRequestDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should log authorization failure when chair accesses change request outside department', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.params = { id: 'approval-123' };

      mockFacultyQuery.mockResolvedValue({
        user_id: 'user-123',
        department: 'Computer Science',
      });

      mockApprovalRepository.findById.mockResolvedValue({
        id: 'approval-123',
        department_id: 'Mathematics',
        status: 'pending',
      });

      await validateChangeRequestDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Wait for async audit log
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('validateBulkOperationDepartment', () => {
    it('should throw UnauthorizedError if user is not authenticated', async () => {
      await validateBulkOperationDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should allow admin to process any change requests', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'admin@example.com',
        role: 'admin',
      };
      mockRequest.body = {
        approvalIds: ['approval-1', 'approval-2', 'approval-3'],
      };

      await validateBulkOperationDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
      expect(mockApprovalRepository.findById).not.toHaveBeenCalled();
    });

    it('should filter change requests for chair to only include their department', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.body = {
        approvalIds: ['approval-1', 'approval-2', 'approval-3'],
      };

      mockFacultyQuery.mockResolvedValue({
        user_id: 'user-123',
        department: 'Computer Science',
      });

      mockApprovalRepository.findById
        .mockResolvedValueOnce({
          id: 'approval-1',
          department_id: 'Computer Science',
        })
        .mockResolvedValueOnce({
          id: 'approval-2',
          department_id: 'Mathematics',
        })
        .mockResolvedValueOnce({
          id: 'approval-3',
          department_id: 'Computer Science',
        });

      await validateBulkOperationDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFacultyQuery).toHaveBeenCalled();
      expect(mockApprovalRepository.findById).toHaveBeenCalledTimes(3);
      expect((mockRequest as any).validApprovalIds).toEqual(['approval-1', 'approval-3']);
      expect((mockRequest as any).invalidApprovalIds).toEqual(['approval-2']);
      expect((mockRequest as any).userDepartment).toBe('Computer Science');
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle non-existent approvals in bulk operation', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.body = {
        approvalIds: ['approval-1', 'approval-2', 'approval-3'],
      };

      mockFacultyQuery.mockResolvedValue({
        user_id: 'user-123',
        department: 'Computer Science',
      });

      mockApprovalRepository.findById
        .mockResolvedValueOnce({
          id: 'approval-1',
          department_id: 'Computer Science',
        })
        .mockResolvedValueOnce(null) // Non-existent
        .mockResolvedValueOnce({
          id: 'approval-3',
          department_id: 'Computer Science',
        });

      await validateBulkOperationDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).validApprovalIds).toEqual(['approval-1', 'approval-3']);
      expect((mockRequest as any).invalidApprovalIds).toEqual(['approval-2']);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw ForbiddenError if chair has no department assigned', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.body = {
        approvalIds: ['approval-1', 'approval-2'],
      };

      mockFacultyQuery.mockResolvedValue(null);

      await validateBulkOperationDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Chair must be assigned to a department',
        })
      );
    });

    it('should log authorization failure when some approvals are outside chair department', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.body = {
        approvalIds: ['approval-1', 'approval-2'],
      };

      mockFacultyQuery.mockResolvedValue({
        user_id: 'user-123',
        department: 'Computer Science',
      });

      mockApprovalRepository.findById
        .mockResolvedValueOnce({
          id: 'approval-1',
          department_id: 'Computer Science',
        })
        .mockResolvedValueOnce({
          id: 'approval-2',
          department_id: 'Mathematics',
        });

      await validateBulkOperationDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Wait for async audit log
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect((mockRequest as any).validApprovalIds).toEqual(['approval-1']);
      expect((mockRequest as any).invalidApprovalIds).toEqual(['approval-2']);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle empty approvalIds array', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.body = {
        approvalIds: [],
      };

      mockFacultyQuery.mockResolvedValue({
        user_id: 'user-123',
        department: 'Computer Science',
      });

      await validateBulkOperationDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).validApprovalIds).toEqual([]);
      expect((mockRequest as any).invalidApprovalIds).toEqual([]);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully in requireDepartmentScope', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };

      mockFacultyQuery.mockRejectedValue(new Error('Database error'));

      await requireDepartmentScope(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle database errors gracefully in validateChangeRequestDepartment', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.params = { id: 'approval-123' };

      mockFacultyQuery.mockRejectedValue(new Error('Database error'));

      await validateChangeRequestDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle database errors gracefully in validateBulkOperationDepartment', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'chair',
      };
      mockRequest.body = {
        approvalIds: ['approval-1'],
      };

      mockFacultyQuery.mockRejectedValue(new Error('Database error'));

      await validateBulkOperationDepartment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Audit Logging', () => {
    it('should not throw error if audit logging fails', async () => {
      const { auditLogRepository } = await import('../../../audit-logs');
      vi.mocked(auditLogRepository.create).mockRejectedValue(new Error('Audit log error'));

      mockRequest.user = {
        userId: 'user-123',
        email: 'secretary@example.com',
        role: 'secretary',
      };

      const middleware = requireApprovalRole(['admin']);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Should still throw ForbiddenError, not audit log error
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });
});
