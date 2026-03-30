import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../errors';

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = {
      url: '/api/test',
      method: 'GET',
    };

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();

    // Mock console.error to avoid cluttering test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('AppError handling', () => {
    it('should handle NotFoundError with 404 status', () => {
      const error = new NotFoundError('Student not found');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Student not found',
          code: 'NOT_FOUND',
          timestamp: expect.any(String),
        },
      });
    });

    it('should handle ValidationError with 400 status and details', () => {
      const details = {
        email: 'Invalid email format',
        age: 'Must be positive',
      };
      const error = new ValidationError('Validation failed', details);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details,
          timestamp: expect.any(String),
        },
      });
    });

    it('should handle UnauthorizedError with 401 status', () => {
      const error = new UnauthorizedError('Invalid token');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'UNAUTHORIZED',
          timestamp: expect.any(String),
        },
      });
    });

    it('should handle ForbiddenError with 403 status', () => {
      const error = new ForbiddenError('Insufficient permissions');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
          timestamp: expect.any(String),
        },
      });
    });

    it('should handle ConflictError with 409 status', () => {
      const error = new ConflictError('Student ID already exists');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Student ID already exists',
          code: 'CONFLICT',
          timestamp: expect.any(String),
        },
      });
    });

    it('should handle custom AppError with custom status code', () => {
      const error = new AppError('Custom error', 'CUSTOM_ERROR', 418);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(418);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Custom error',
          code: 'CUSTOM_ERROR',
          timestamp: expect.any(String),
        },
      });
    });

    it('should not include details field when details is undefined', () => {
      const error = new ValidationError('Validation failed');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.error).not.toHaveProperty('details');
    });
  });

  describe('Unexpected error handling', () => {
    it('should handle generic Error with 500 status', () => {
      const error = new Error('Unexpected error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          timestamp: expect.any(String),
        },
      });
    });

    it('should log unexpected errors', () => {
      const error = new Error('Unexpected error');
      const consoleErrorSpy = vi.spyOn(console, 'error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected error:', {
        message: 'Unexpected error',
        stack: expect.any(String),
        url: '/api/test',
        method: 'GET',
      });
    });

    it('should not expose internal error details to client', () => {
      const error = new Error('Database connection failed: password=secret123');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.error.message).toBe('Internal server error');
      expect(callArgs.error.message).not.toContain('password');
      expect(callArgs.error.message).not.toContain('secret123');
    });
  });

  describe('Response format validation', () => {
    it('should always return success: false', () => {
      const errors = [
        new NotFoundError(),
        new ValidationError('Invalid'),
        new UnauthorizedError(),
        new Error('Generic'),
      ];

      errors.forEach((error) => {
        jsonMock.mockClear();
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs.success).toBe(false);
      });
    });

    it('should always include timestamp in ISO 8601 format', () => {
      const error = new NotFoundError();

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const callArgs = jsonMock.mock.calls[0][0];
      const timestamp = callArgs.error.timestamp;

      expect(timestamp).toBeDefined();
      expect(typeof timestamp).toBe('string');
      expect(() => new Date(timestamp)).not.toThrow();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should always include error object with message and code', () => {
      const error = new NotFoundError('Test');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.error).toBeDefined();
      expect(callArgs.error.message).toBeDefined();
      expect(callArgs.error.code).toBeDefined();
      expect(typeof callArgs.error.message).toBe('string');
      expect(typeof callArgs.error.code).toBe('string');
    });
  });

  describe('Edge cases', () => {
    it('should handle error with empty message', () => {
      const error = new AppError('', 'EMPTY_MESSAGE', 400);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '',
          code: 'EMPTY_MESSAGE',
          timestamp: expect.any(String),
        },
      });
    });

    it('should handle error with null details', () => {
      const error = new ValidationError('Test', null);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const callArgs = jsonMock.mock.calls[0][0];
      // Details should not be included when null
      expect(callArgs.error).not.toHaveProperty('details');
    });

    it('should handle error with complex details object', () => {
      const details = {
        fields: {
          email: ['Invalid format', 'Already exists'],
          password: ['Too short', 'Missing special character'],
        },
        metadata: {
          attemptCount: 3,
          lastAttempt: new Date().toISOString(),
        },
      };
      const error = new ValidationError('Validation failed', details);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.error.details).toEqual(details);
    });
  });
});
