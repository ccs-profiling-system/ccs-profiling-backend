/**
 * Unit tests for Approval Audit Logging Middleware
 * 
 * Tests audit log creation for various approval workflow actions.
 * Verifies asynchronous logging behavior and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { approvalAuditMiddleware, logApprovalStateTransition } from '../approval-audit.middleware';

// Mock the audit log repository
const mockCreate = vi.fn();
vi.mock('../../modules/audit-logs', () => ({
  auditLogRepository: {
    create: (...args: any[]) => mockCreate(...args),
  },
}));

// Helper to create mock request
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/api/v1/approvals',
    params: {},
    body: {},
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    user: { userId: 'user-123', email: 'test@example.com', role: 'secretary' },
    ...overrides,
  } as Request;
}

// Helper to create mock response
function createMockResponse(): Response {
  const res: any = {
    statusCode: 200,
    json: vi.fn(),
    send: vi.fn(),
  };
  
  // Make json and send chainable
  res.json.mockReturnValue(res);
  res.send.mockReturnValue(res);
  
  return res as Response;
}

// Helper to create mock next function
function createMockNext(): NextFunction {
  return vi.fn();
}

// Helper to wait for async operations
function waitForAsync(ms: number = 10): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('approvalAuditMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should call next() immediately without blocking', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should log approval submission action', async () => {
    const req = createMockRequest({
      method: 'POST',
      path: '/api/v1/approvals',
      body: {
        entity_type: 'student',
        entity_id: 'student-123',
        category: 'profile',
        change_details: { name: 'John Doe' },
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    // Simulate response
    res.statusCode = 201;
    res.json({
      success: true,
      data: {
        id: 'approval-123',
        entity_type: 'student',
        entity_id: 'student-123',
        status: 'pending',
      },
    });

    // Wait for async logging
    await waitForAsync(50);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        action_type: 'approval_submitted',
        entity_type: 'student',
        entity_id: 'approval-123',
        ip_address: '127.0.0.1',
        after_state: expect.objectContaining({
          method: 'POST',
          path: '/api/v1/approvals',
          statusCode: 201,
          success: true,
          submission: {
            entity_type: 'student',
            entity_id: 'student-123',
            category: 'profile',
          },
          new_status: 'pending',
        }),
      })
    );
  });

  it('should log approval approved action', async () => {
    const req = createMockRequest({
      method: 'PATCH',
      path: '/api/v1/approvals/approval-123/approve',
      params: { id: 'approval-123' },
      body: { comments: 'Looks good' },
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    // Simulate response
    res.statusCode = 200;
    res.json({
      success: true,
      data: {
        id: 'approval-123',
        status: 'approved',
      },
    });

    await waitForAsync(50);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        action_type: 'approval_approved',
        entity_id: 'approval-123',
        after_state: expect.objectContaining({
          comments: 'Looks good',
          new_status: 'approved',
        }),
      })
    );
  });

  it('should log approval rejected action with required comments', async () => {
    const req = createMockRequest({
      method: 'PATCH',
      path: '/api/v1/approvals/approval-123/reject',
      params: { id: 'approval-123' },
      body: { comments: 'Invalid data provided' },
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    res.statusCode = 200;
    res.json({
      success: true,
      data: {
        id: 'approval-123',
        status: 'rejected',
      },
    });

    await waitForAsync(50);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: 'approval_rejected',
        after_state: expect.objectContaining({
          comments: 'Invalid data provided',
          new_status: 'rejected',
        }),
      })
    );
  });

  it('should log approval withdrawn action', async () => {
    const req = createMockRequest({
      method: 'PATCH',
      path: '/api/v1/approvals/approval-123/withdraw',
      params: { id: 'approval-123' },
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    res.statusCode = 200;
    res.json({
      success: true,
      data: {
        id: 'approval-123',
        status: 'withdrawn',
      },
    });

    await waitForAsync(50);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: 'approval_withdrawn',
        entity_id: 'approval-123',
      })
    );
  });

  it('should log bulk approve action with summary', async () => {
    const req = createMockRequest({
      method: 'POST',
      path: '/api/v1/approvals/bulk-approve',
      body: {
        approvalIds: ['approval-1', 'approval-2', 'approval-3'],
        atomic: false,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    res.statusCode = 200;
    res.json({
      success: true,
      data: {
        total: 3,
        successful: ['approval-1', 'approval-2'],
        failed: [{ id: 'approval-3', reason: 'Not found' }],
      },
    });

    await waitForAsync(50);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: 'approval_bulk_approved',
        entity_type: 'approval_bulk',
        after_state: expect.objectContaining({
          bulk_summary: {
            total: 3,
            successful: 2,
            failed: 1,
          },
        }),
      })
    );
  });

  it('should log bulk reject action with summary', async () => {
    const req = createMockRequest({
      method: 'POST',
      path: '/api/v1/approvals/bulk-reject',
      body: {
        approvalIds: ['approval-1', 'approval-2'],
        comments: 'Batch rejection',
        atomic: true,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    res.statusCode = 200;
    res.json({
      success: true,
      data: {
        total: 2,
        successful: ['approval-1', 'approval-2'],
        failed: [],
      },
    });

    await waitForAsync(50);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: 'approval_bulk_rejected',
        after_state: expect.objectContaining({
          bulk_summary: {
            total: 2,
            successful: 2,
            failed: 0,
          },
        }),
      })
    );
  });

  it('should log failed operations with error details', async () => {
    const req = createMockRequest({
      method: 'PATCH',
      path: '/api/v1/approvals/approval-123/approve',
      params: { id: 'approval-123' },
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    res.statusCode = 400;
    res.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid approval status',
      },
    });

    await waitForAsync(50);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        after_state: expect.objectContaining({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid approval status',
          },
        }),
      })
    );
  });

  it('should extract IP address from X-Forwarded-For header', async () => {
    const req = createMockRequest({
      method: 'POST',
      path: '/api/v1/approvals',
      headers: {
        'x-forwarded-for': '203.0.113.1, 198.51.100.1',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    res.json({ success: true, data: {} });

    await waitForAsync(50);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: '203.0.113.1',
      })
    );
  });

  it('should extract user agent from headers', async () => {
    const req = createMockRequest({
      method: 'POST',
      path: '/api/v1/approvals',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    res.json({ success: true, data: {} });

    await waitForAsync(50);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      })
    );
  });

  it('should handle missing user gracefully', async () => {
    const req = createMockRequest({
      method: 'POST',
      path: '/api/v1/approvals',
      user: undefined,
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    res.json({ success: true, data: {} });

    await waitForAsync(50);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: undefined,
      })
    );
  });

  it('should not throw error if audit log creation fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreate.mockRejectedValueOnce(new Error('Database error'));

    const req = createMockRequest({
      method: 'POST',
      path: '/api/v1/approvals',
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    res.json({ success: true, data: {} });

    await waitForAsync(50);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to create approval audit log:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should only log once even if json is called multiple times', async () => {
    const req = createMockRequest({
      method: 'POST',
      path: '/api/v1/approvals',
    });
    const res = createMockResponse();
    const next = createMockNext();

    approvalAuditMiddleware(req, res, next);

    res.json({ success: true, data: {} });
    res.json({ success: true, data: {} }); // Second call should be ignored

    await waitForAsync(50);

    expect(mockCreate).toHaveBeenCalledOnce();
  });
});

describe('logApprovalStateTransition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log state transition with previous and new status', async () => {
    await logApprovalStateTransition(
      'user-123',
      'approval-123',
      'student',
      'student-456',
      'approval_approved',
      'pending',
      'approved',
      { reviewer_comments: 'Approved by admin' }
    );

    expect(mockCreate).toHaveBeenCalledWith({
      user_id: 'user-123',
      action_type: 'approval_approved',
      entity_type: 'student',
      entity_id: 'approval-123',
      before_state: { status: 'pending' },
      after_state: {
        status: 'approved',
        previous_status: 'pending',
        new_status: 'approved',
        reviewer_comments: 'Approved by admin',
      },
    });
  });

  it('should log rejection state transition', async () => {
    await logApprovalStateTransition(
      'admin-123',
      'approval-456',
      'faculty',
      'faculty-789',
      'approval_rejected',
      'pending',
      'rejected',
      { rejection_reason: 'Invalid data' }
    );

    expect(mockCreate).toHaveBeenCalledWith({
      user_id: 'admin-123',
      action_type: 'approval_rejected',
      entity_type: 'faculty',
      entity_id: 'approval-456',
      before_state: { status: 'pending' },
      after_state: {
        status: 'rejected',
        previous_status: 'pending',
        new_status: 'rejected',
        rejection_reason: 'Invalid data',
      },
    });
  });

  it('should log conflict state transition', async () => {
    await logApprovalStateTransition(
      'system',
      'approval-789',
      'event',
      'event-123',
      'approval_conflicted',
      'approved',
      'conflicted',
      { conflict_reason: 'Entity version mismatch' }
    );

    expect(mockCreate).toHaveBeenCalledWith({
      user_id: 'system',
      action_type: 'approval_conflicted',
      entity_type: 'event',
      entity_id: 'approval-789',
      before_state: { status: 'approved' },
      after_state: {
        status: 'conflicted',
        previous_status: 'approved',
        new_status: 'conflicted',
        conflict_reason: 'Entity version mismatch',
      },
    });
  });

  it('should handle errors gracefully without throwing', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreate.mockRejectedValueOnce(new Error('Database error'));

    await expect(
      logApprovalStateTransition(
        'user-123',
        'approval-123',
        'student',
        'student-456',
        'approval_approved',
        'pending',
        'approved'
      )
    ).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to log approval state transition:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
