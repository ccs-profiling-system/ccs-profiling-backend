import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { errorHandler } from './errorHandler';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
} from '../errors';

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      method: 'GET',
      url: '/api/test',
      path: '/api/test',
      query: {},
      headers: {}, // This will be overridden in specific tests
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-user-agent'),
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  describe('HTTP 400 - Validation Errors', () => {
    it('should return 400 with field-specific messages for validation errors', () => {
      const validationDetails = {
        fields: {
          email: 'Invalid email format',
          age: 'Must be a positive number',
        },
      };
      const error = new ValidationError('Validation failed', validationDetails);

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
          details: validationDetails,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('HTTP 401 - Authentication Failures', () => {
    it('should return 401 with generic message for authentication failures', () => {
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

    it('should use default message when no message provided', () => {
      const error = new UnauthorizedError();

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
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('HTTP 403 - Authorization Failures', () => {
    it('should return 403 with permission name for authorization failures', () => {
      const error = new ForbiddenError(
        'Missing required permission: secretary.student.create'
      );

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
          message: 'Missing required permission: secretary.student.create',
          code: 'FORBIDDEN',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('HTTP 404 - Resource Not Found', () => {
    it('should return 404 with entity type for resource not found', () => {
      const error = new NotFoundError('Student with ID 123 not found');

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
          message: 'Student with ID 123 not found',
          code: 'NOT_FOUND',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('HTTP 409 - Conflict Errors', () => {
    it('should return 409 with constraint details for conflict errors', () => {
      const error = new ConflictError(
        'Student with student_id "2021-12345" already exists'
      );

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
          message: 'Student with student_id "2021-12345" already exists',
          code: 'CONFLICT',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('HTTP 422 - Business Logic Errors', () => {
    it('should return 422 with reason for business logic errors', () => {
      const error = new UnprocessableEntityError(
        'Cannot update event with status "approved"'
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Cannot update event with status "approved"',
          code: 'UNPROCESSABLE_ENTITY',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('HTTP 500 - Internal Server Errors', () => {
    it('should return 500 with generic message for unexpected errors', () => {
      const error = new Error('Database connection failed');

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

    it('should not expose sensitive information in error messages', () => {
      const error = new Error('Connection to postgres://user:password@host failed');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.message).toBe('Internal server error');
      expect(response.error.message).not.toContain('password');
      expect(response.error.message).not.toContain('postgres://');
    });

    it('should not expose stack traces in error response', () => {
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.stack).toBeUndefined();
      expect(JSON.stringify(response)).not.toContain('at Object');
    });
  });

  describe('Consistent Error Response Format', () => {
    it('should return consistent format for all error types', () => {
      const errors = [
        new ValidationError('Validation failed'),
        new UnauthorizedError('Unauthorized'),
        new ForbiddenError('Forbidden'),
        new NotFoundError('Not found'),
        new ConflictError('Conflict'),
        new UnprocessableEntityError('Unprocessable'),
        new Error('Unexpected'),
      ];

      errors.forEach((error) => {
        jsonMock.mockClear();
        statusMock.mockClear();

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        const response = jsonMock.mock.calls[0][0];
        expect(response).toHaveProperty('success', false);
        expect(response).toHaveProperty('error');
        expect(response.error).toHaveProperty('message');
        expect(response.error).toHaveProperty('code');
        expect(response.error).toHaveProperty('timestamp');
        expect(response.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });
  });

  describe('Error Logging', () => {
    it('should log detailed error information for debugging', () => {
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(console.error).toHaveBeenCalled();
      const logCall = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const logData = JSON.parse(logCall);

      expect(logData).toHaveProperty('timestamp');
      expect(logData).toHaveProperty('error');
      expect(logData.error).toHaveProperty('name');
      expect(logData.error).toHaveProperty('message');
      expect(logData).toHaveProperty('request');
      expect(logData.request).toHaveProperty('method', 'GET');
      expect(logData.request).toHaveProperty('url', '/api/test');
    });

    it('should include request headers in logs', () => {
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const logCall = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const logData = JSON.parse(logCall);

      // Verify headers object exists in logs
      expect(logData.request).toHaveProperty('headers');
      expect(typeof logData.request.headers).toBe('object');
    });
  });

  describe('AppError with details', () => {
    it('should include details field when provided', () => {
      const details = { field: 'email', constraint: 'unique' };
      const error = new AppError('Custom error', 'CUSTOM_ERROR', 400, details);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Custom error',
          code: 'CUSTOM_ERROR',
          details,
          timestamp: expect.any(String),
        },
      });
    });

    it('should not include details field when not provided', () => {
      const error = new AppError('Custom error', 'CUSTOM_ERROR', 400);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.details).toBeUndefined();
    });
  });
});
