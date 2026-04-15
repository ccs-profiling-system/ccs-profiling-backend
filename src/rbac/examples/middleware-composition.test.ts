/**
 * Middleware Composition Pattern Tests
 * 
 * This file demonstrates testing strategies for each middleware composition pattern.
 * Tests cover unit testing, integration testing, and error scenarios.
 * 
 * Test Patterns:
 * 1. Permission-Only: Test permission checks in isolation
 * 2. Permission + Ownership: Test permission and ownership validation
 * 3. Permission + Workflow: Test permission and workflow state validation
 * 4. Full Validation: Test all three validations together
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requirePermission, checkOwnership } from '../middleware';
import { Role, Permission } from '../types';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../../shared/errors';

// ============================================================================
// TEST SETUP AND UTILITIES
// ============================================================================

/**
 * Create mock request with user authentication
 */
function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    user: {
      userId: 'user-123',
      role: Role.FACULTY,
      email: 'faculty@example.com'
    },
    params: {},
    body: {},
    query: {},
    ...overrides
  };
}

/**
 * Create mock response
 */
function createMockResponse(): Partial<Response> {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
  };
}

/**
 * Create mock next function
 */
function createMockNext(): NextFunction {
  return vi.fn();
}

// ============================================================================
// PATTERN 1: PERMISSION-ONLY TESTS
// ============================================================================

describe('Pattern 1: Permission-Only Check', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  describe('Single Permission', () => {
    it('should allow access when user has required permission', () => {
      req.user = {
        userId: 'user-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };

      const middleware = requirePermission('student.read' as Permission);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(); // No error
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should deny access when user lacks required permission', () => {
      req.user = {
        userId: 'user-123',
        role: Role.STUDENT,
        email: 'student@example.com'
      };

      const middleware = requirePermission('student.delete' as Permission);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should return 401 when user is not authenticated', () => {
      req.user = undefined;

      const middleware = requirePermission('student.read' as Permission);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should allow admin to access any permission', () => {
      req.user = {
        userId: 'admin-123',
        role: Role.ADMIN,
        email: 'admin@example.com'
      };

      const middleware = requirePermission('student.delete' as Permission);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(); // No error
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple Permissions (OR Logic)', () => {
    it('should allow access when user has at least one permission', () => {
      req.user = {
        userId: 'user-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };

      const middleware = requirePermission([
        'research.create' as Permission,
        'research.submit' as Permission
      ]);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(); // No error
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should deny access when user has none of the permissions', () => {
      req.user = {
        userId: 'user-123',
        role: Role.STUDENT,
        email: 'student@example.com'
      };

      const middleware = requirePermission([
        'research.create' as Permission,
        'research.delete' as Permission
      ]);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should allow access when user has first permission', () => {
      req.user = {
        userId: 'user-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };

      const middleware = requirePermission([
        'instruction.create' as Permission,
        'instruction.delete' as Permission
      ]);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(); // No error (has create)
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Wildcard Permissions', () => {
    it('should allow access with resource wildcard permission', () => {
      req.user = {
        userId: 'user-123',
        role: Role.SECRETARY,
        email: 'secretary@example.com'
      };

      const middleware = requirePermission('student.create' as Permission);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(); // No error (has student.*)
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should allow access with global wildcard permission', () => {
      req.user = {
        userId: 'admin-123',
        role: Role.ADMIN,
        email: 'admin@example.com'
      };

      const middleware = requirePermission('any.permission' as Permission);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(); // No error (has *.*)
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Explicit Deny', () => {
    it('should deny access when permission is explicitly denied', () => {
      req.user = {
        userId: 'user-123',
        role: Role.DEPARTMENT_CHAIR,
        email: 'chair@example.com'
      };

      const middleware = requirePermission('schedule.delete' as Permission);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should deny even when wildcard would allow', () => {
      req.user = {
        userId: 'user-123',
        role: Role.SECRETARY,
        email: 'secretary@example.com'
      };

      // Secretary has student.* but student.delete is explicitly denied
      const middleware = requirePermission('student.delete' as Permission);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});

// ============================================================================
// PATTERN 2: PERMISSION + OWNERSHIP TESTS
// ============================================================================

describe('Pattern 2: Permission + Ownership Check', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockRequest({
      params: { id: 'instruction-456' }
    });
    res = createMockResponse();
    next = createMockNext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Ownership Validation', () => {
    it('should allow access when user has permission and owns resource', async () => {
      req.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };

      // Mock database to return resource owned by user
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: 'instruction-456', faculty_id: 'faculty-123' }
              ])
            })
          })
        })
      };

      // Apply permission middleware
      const permissionMiddleware = requirePermission('instruction.update' as Permission);
      permissionMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(); // Permission passed

      // Apply ownership middleware
      const ownershipMiddleware = checkOwnership('instruction');
      await ownershipMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(); // Ownership passed
    });

    it('should deny access when user does not own resource', async () => {
      req.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };

      // Mock database to return resource owned by different user
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: 'instruction-456', faculty_id: 'other-faculty' }
              ])
            })
          })
        })
      };

      const ownershipMiddleware = checkOwnership('instruction');
      await ownershipMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return 404 when resource does not exist', async () => {
      req.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };

      // Mock database to return no resource
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([])
            })
          })
        })
      };

      const ownershipMiddleware = checkOwnership('instruction');
      await ownershipMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('Bypass Roles', () => {
    it('should bypass ownership check for Admin role', async () => {
      req.user = {
        userId: 'admin-123',
        role: Role.ADMIN,
        email: 'admin@example.com'
      };

      const ownershipMiddleware = checkOwnership('instruction');
      await ownershipMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(); // No error (bypassed)
    });

    it('should bypass ownership check for Department_Chair role', async () => {
      req.user = {
        userId: 'chair-123',
        role: Role.DEPARTMENT_CHAIR,
        email: 'chair@example.com'
      };

      const ownershipMiddleware = checkOwnership('instruction');
      await ownershipMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(); // No error (bypassed)
    });

    it('should not bypass ownership check for Faculty role', async () => {
      req.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };

      // Mock database to return resource owned by different user
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: 'instruction-456', faculty_id: 'other-faculty' }
              ])
            })
          })
        })
      };

      const ownershipMiddleware = checkOwnership('instruction');
      await ownershipMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('Custom Options', () => {
    it('should use custom parameter name', async () => {
      req.params = { studentId: 'student-789' };
      req.user = {
        userId: 'student-789',
        role: Role.STUDENT,
        email: 'student@example.com'
      };

      // Mock database to return resource
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: 'student-789', user_id: 'student-789' }
              ])
            })
          })
        })
      };

      const ownershipMiddleware = checkOwnership('student', { paramName: 'studentId' });
      await ownershipMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(); // No error
    });

    it('should use custom ownership field', async () => {
      req.params = { id: 'enrollment-123' };
      req.user = {
        userId: 'student-789',
        role: Role.STUDENT,
        email: 'student@example.com'
      };

      // Mock database to return resource
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: 'enrollment-123', student_id: 'student-789' }
              ])
            })
          })
        })
      };

      const ownershipMiddleware = checkOwnership('enrollment', { ownerField: 'student_id' });
      await ownershipMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(); // No error
    });
  });
});

// ============================================================================
// PATTERN 3: PERMISSION + WORKFLOW TESTS (Future Implementation)
// ============================================================================

describe('Pattern 3: Permission + Workflow Check', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockRequest({
      params: { id: 'schedule-789' }
    });
    res = createMockResponse();
    next = createMockNext();
  });

  describe('Workflow State Validation', () => {
    it.skip('should allow approval when schedule is in pending_approval state', async () => {
      req.user = {
        userId: 'chair-123',
        role: Role.DEPARTMENT_CHAIR,
        email: 'chair@example.com'
      };

      // Mock workflow validation
      // const workflowMiddleware = checkWorkflow('schedule');
      // await workflowMiddleware(req as Request, res as Response, next);

      // expect(next).toHaveBeenCalledWith(); // No error
    });

    it.skip('should deny approval when schedule is already approved', async () => {
      req.user = {
        userId: 'chair-123',
        role: Role.DEPARTMENT_CHAIR,
        email: 'chair@example.com'
      };

      // Mock workflow validation
      // const workflowMiddleware = checkWorkflow('schedule');
      // await workflowMiddleware(req as Request, res as Response, next);

      // expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it.skip('should deny modification when schedule is approved', async () => {
      req.user = {
        userId: 'secretary-123',
        role: Role.SECRETARY,
        email: 'secretary@example.com'
      };

      // Mock workflow validation
      // const workflowMiddleware = checkWorkflow('schedule');
      // await workflowMiddleware(req as Request, res as Response, next);

      // expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('Workflow State Transitions', () => {
    it.skip('should allow transition from draft to pending_approval', async () => {
      // Test workflow state transition
    });

    it.skip('should allow transition from pending_approval to approved', async () => {
      // Test workflow state transition
    });

    it.skip('should allow transition from pending_approval to rejected', async () => {
      // Test workflow state transition
    });

    it.skip('should deny transition from approved to draft', async () => {
      // Test invalid workflow state transition
    });
  });
});

// ============================================================================
// PATTERN 4: FULL VALIDATION TESTS
// ============================================================================

describe('Pattern 4: Full Validation (Permission + Ownership + Workflow)', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockRequest({
      params: { id: 'research-123' }
    });
    res = createMockResponse();
    next = createMockNext();
  });

  describe('Complete Validation Chain', () => {
    it('should allow when all validations pass', async () => {
      req.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };

      // Mock database to return resource owned by user in draft state
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { 
                  id: 'research-123', 
                  faculty_id: 'faculty-123',
                  status: 'draft'
                }
              ])
            })
          })
        })
      };

      // Apply permission middleware
      const permissionMiddleware = requirePermission('research.submit' as Permission);
      permissionMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(); // Permission passed

      // Apply ownership middleware
      const ownershipMiddleware = checkOwnership('research');
      await ownershipMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(); // Ownership passed

      // Apply workflow middleware (future)
      // const workflowMiddleware = checkWorkflow('research');
      // await workflowMiddleware(req as Request, res as Response, next);
      // expect(next).toHaveBeenCalledWith(); // Workflow passed
    });

    it('should fail at permission check when user lacks permission', () => {
      req.user = {
        userId: 'student-123',
        role: Role.STUDENT,
        email: 'student@example.com'
      };

      const permissionMiddleware = requirePermission('research.submit' as Permission);
      permissionMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      // Ownership and workflow checks never executed (fail fast)
    });

    it('should fail at ownership check when user does not own resource', async () => {
      req.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };

      // Mock database to return resource owned by different user
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: 'research-123', faculty_id: 'other-faculty' }
              ])
            })
          })
        })
      };

      // Permission passes
      const permissionMiddleware = requirePermission('research.submit' as Permission);
      permissionMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(); // Permission passed

      // Ownership fails
      const ownershipMiddleware = checkOwnership('research');
      await ownershipMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      // Workflow check never executed (fail fast)
    });

    it.skip('should fail at workflow check when state is invalid', async () => {
      req.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };

      // Mock database to return resource owned by user but in wrong state
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { 
                  id: 'research-123', 
                  faculty_id: 'faculty-123',
                  status: 'approved' // Cannot submit approved research
                }
              ])
            })
          })
        })
      };

      // Permission passes
      const permissionMiddleware = requirePermission('research.submit' as Permission);
      permissionMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(); // Permission passed

      // Ownership passes
      const ownershipMiddleware = checkOwnership('research');
      await ownershipMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(); // Ownership passed

      // Workflow fails
      // const workflowMiddleware = checkWorkflow('research');
      // await workflowMiddleware(req as Request, res as Response, next);
      // expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('Execution Order', () => {
    it('should execute middleware in correct order', async () => {
      const executionOrder: string[] = [];

      req.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };

      // Track execution order
      const permissionMiddleware = requirePermission('research.submit' as Permission);
      const originalPermissionNext = next;
      const permissionNext = vi.fn(() => {
        executionOrder.push('permission');
        originalPermissionNext();
      });

      const ownershipMiddleware = checkOwnership('research');
      const ownershipNext = vi.fn(() => {
        executionOrder.push('ownership');
      });

      permissionMiddleware(req as Request, res as Response, permissionNext);
      await ownershipMiddleware(req as Request, res as Response, ownershipNext);

      expect(executionOrder).toEqual(['permission', 'ownership']);
    });
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  describe('HTTP Status Codes', () => {
    it('should return 401 for authentication errors', () => {
      req.user = undefined;

      const middleware = requirePermission('student.read' as Permission);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should return 403 for permission errors', () => {
      req.user = {
        userId: 'student-123',
        role: Role.STUDENT,
        email: 'student@example.com'
      };

      const middleware = requirePermission('student.delete' as Permission);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return 403 for ownership errors', async () => {
      req.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };
      req.params = { id: 'instruction-456' };

      // Mock database to return resource owned by different user
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: 'instruction-456', faculty_id: 'other-faculty' }
              ])
            })
          })
        })
      };

      const middleware = checkOwnership('instruction');
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return 404 for resource not found', async () => {
      req.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };
      req.params = { id: 'nonexistent-id' };

      // Mock database to return no resource
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([])
            })
          })
        })
      };

      const middleware = checkOwnership('instruction');
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('Error Messages', () => {
    it('should include permission in error message', () => {
      req.user = {
        userId: 'student-123',
        role: Role.STUDENT,
        email: 'student@example.com'
      };

      const middleware = requirePermission('student.delete' as Permission);
      middleware(req as Request, res as Response, next);

      const error = (next as any).mock.calls[0][0];
      expect(error.message).toContain('student.delete');
    });

    it('should include resource type in ownership error', async () => {
      req.user = {
        userId: 'faculty-123',
        role: Role.FACULTY,
        email: 'faculty@example.com'
      };
      req.params = { id: 'instruction-456' };

      // Mock database to return resource owned by different user
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: 'instruction-456', faculty_id: 'other-faculty' }
              ])
            })
          })
        })
      };

      const middleware = checkOwnership('instruction');
      await middleware(req as Request, res as Response, next);

      const error = (next as any).mock.calls[0][0];
      expect(error.message).toContain('instruction');
    });
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  it('should complete permission check in under 2ms', () => {
    req.user = {
      userId: 'faculty-123',
      role: Role.FACULTY,
      email: 'faculty@example.com'
    };

    const startTime = performance.now();
    const middleware = requirePermission('student.read' as Permission);
    middleware(req as Request, res as Response, next);
    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(2);
    expect(next).toHaveBeenCalledWith(); // No error
  });

  it('should handle multiple permission checks efficiently', () => {
    req.user = {
      userId: 'faculty-123',
      role: Role.FACULTY,
      email: 'faculty@example.com'
    };

    const startTime = performance.now();
    const middleware = requirePermission([
      'research.create' as Permission,
      'research.submit' as Permission,
      'research.update' as Permission
    ]);
    middleware(req as Request, res as Response, next);
    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(5);
    expect(next).toHaveBeenCalledWith(); // No error
  });
});
