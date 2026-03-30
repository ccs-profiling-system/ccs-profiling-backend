import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from './index';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with all properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 500, { field: 'test' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('AppError');
    });

    it('should create an error without details', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 500);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 500);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error with default message', () => {
      const error = new NotFoundError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should create a 404 error with custom message', () => {
      const error = new NotFoundError('Student not found');

      expect(error.message).toBe('Student not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ValidationError', () => {
    it('should create a 400 error without details', () => {
      const error = new ValidationError('Validation failed');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeUndefined();
      expect(error.name).toBe('ValidationError');
    });

    it('should create a 400 error with validation details', () => {
      const details = {
        email: 'Invalid email format',
        age: 'Must be a positive number',
      };
      const error = new ValidationError('Validation failed', details);

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error with default message', () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should create a 401 error with custom message', () => {
      const error = new UnauthorizedError('Invalid token');

      expect(error.message).toBe('Invalid token');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create a 403 error with default message', () => {
      const error = new ForbiddenError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Forbidden');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });

    it('should create a 403 error with custom message', () => {
      const error = new ForbiddenError('Insufficient permissions');

      expect(error.message).toBe('Insufficient permissions');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('ConflictError', () => {
    it('should create a 409 error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe('CONFLICT');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });

    it('should create a 409 error for scheduling conflict', () => {
      const error = new ConflictError(
        'Schedule conflict detected for room A101 on Monday between 10:00 and 12:00'
      );

      expect(error.message).toContain('Schedule conflict');
      expect(error.code).toBe('CONFLICT');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('Error inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      const notFoundError = new NotFoundError();
      const validationError = new ValidationError('Invalid');
      const unauthorizedError = new UnauthorizedError();
      const forbiddenError = new ForbiddenError();
      const conflictError = new ConflictError('Conflict');

      expect(notFoundError).toBeInstanceOf(Error);
      expect(notFoundError).toBeInstanceOf(AppError);
      expect(notFoundError).toBeInstanceOf(NotFoundError);

      expect(validationError).toBeInstanceOf(Error);
      expect(validationError).toBeInstanceOf(AppError);
      expect(validationError).toBeInstanceOf(ValidationError);

      expect(unauthorizedError).toBeInstanceOf(Error);
      expect(unauthorizedError).toBeInstanceOf(AppError);
      expect(unauthorizedError).toBeInstanceOf(UnauthorizedError);

      expect(forbiddenError).toBeInstanceOf(Error);
      expect(forbiddenError).toBeInstanceOf(AppError);
      expect(forbiddenError).toBeInstanceOf(ForbiddenError);

      expect(conflictError).toBeInstanceOf(Error);
      expect(conflictError).toBeInstanceOf(AppError);
      expect(conflictError).toBeInstanceOf(ConflictError);
    });
  });
});
