/**
 * API Version Middleware Tests
 * 
 * Requirements: 30.5, 30.6
 */

import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { apiVersionMiddleware } from './apiVersion.middleware';

describe('apiVersionMiddleware', () => {
  it('should add X-API-Version header to response', () => {
    const req = {} as Request;
    const res = {
      setHeader: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    apiVersionMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-API-Version', '1.0.0');
    expect(next).toHaveBeenCalled();
  });

  it('should call next() to continue middleware chain', () => {
    const req = {} as Request;
    const res = {
      setHeader: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    apiVersionMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should not throw errors when setting header', () => {
    const req = {} as Request;
    const res = {
      setHeader: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    expect(() => {
      apiVersionMiddleware(req, res, next);
    }).not.toThrow();
  });
});
