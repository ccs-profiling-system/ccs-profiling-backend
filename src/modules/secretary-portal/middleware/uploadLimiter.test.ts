/**
 * Upload Limiter Middleware Tests
 * 
 * Tests for upload concurrency limiting functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { uploadLimiter, getActiveUploadCount, resetUploadCount } from './uploadLimiter';

describe('Upload Limiter Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset upload count before each test
    resetUploadCount();

    mockReq = {
      on: vi.fn(),
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    resetUploadCount();
  });

  it('should allow upload when under limit', () => {
    uploadLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(getActiveUploadCount()).toBe(1);
  });

  it('should reject upload when at limit', () => {
    // Fill up to the limit (10 concurrent uploads)
    for (let i = 0; i < 10; i++) {
      const req = { on: vi.fn() } as Partial<Request>;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), end: vi.fn() } as Partial<Response>;
      const next = vi.fn();
      uploadLimiter(req as Request, res as Response, next);
    }

    expect(getActiveUploadCount()).toBe(10);

    // Try one more upload - should be rejected
    uploadLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(503);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Server is currently processing maximum concurrent uploads. Please try again in a moment.',
        code: 'UPLOAD_LIMIT_REACHED',
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should decrement counter when response ends', () => {
    uploadLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(getActiveUploadCount()).toBe(1);

    // Simulate response end
    const endFn = mockRes.end as any;
    endFn();

    expect(getActiveUploadCount()).toBe(0);
  });

  it('should decrement counter when connection closes', () => {
    const onFn = vi.fn();
    mockReq.on = onFn;

    uploadLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(getActiveUploadCount()).toBe(1);

    // Get the close handler
    const closeHandler = onFn.mock.calls.find((call: any) => call[0] === 'close')?.[1];
    expect(closeHandler).toBeDefined();

    // Simulate connection close
    closeHandler();

    expect(getActiveUploadCount()).toBe(0);
  });

  it('should handle multiple concurrent uploads correctly', () => {
    const uploads: Array<{ req: Partial<Request>; res: Partial<Response>; next: NextFunction }> = [];

    // Create 5 concurrent uploads
    for (let i = 0; i < 5; i++) {
      const req = { on: vi.fn() } as Partial<Request>;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), end: vi.fn() } as Partial<Response>;
      const next = vi.fn();
      
      uploadLimiter(req as Request, res as Response, next);
      uploads.push({ req, res, next });
    }

    expect(getActiveUploadCount()).toBe(5);

    // Complete 2 uploads
    (uploads[0].res.end as any)();
    (uploads[1].res.end as any)();

    expect(getActiveUploadCount()).toBe(3);

    // Complete remaining uploads
    (uploads[2].res.end as any)();
    (uploads[3].res.end as any)();
    (uploads[4].res.end as any)();

    expect(getActiveUploadCount()).toBe(0);
  });

  it('should not decrement below zero on connection close', () => {
    resetUploadCount();
    expect(getActiveUploadCount()).toBe(0);

    const onFn = vi.fn();
    mockReq.on = onFn;

    uploadLimiter(mockReq as Request, mockRes as Response, mockNext);

    // Get the close handler
    const closeHandler = onFn.mock.calls.find((call: any) => call[0] === 'close')?.[1];

    // Simulate response end first
    (mockRes.end as any)();
    expect(getActiveUploadCount()).toBe(0);

    // Then simulate connection close - should not go negative
    closeHandler();
    expect(getActiveUploadCount()).toBe(0);
  });
});
