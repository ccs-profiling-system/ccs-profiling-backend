import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../errors';

describe('errorHandler integration', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Test routes that throw different errors
    app.get('/not-found', () => {
      throw new NotFoundError('Resource not found');
    });

    app.get('/validation', () => {
      throw new ValidationError('Invalid input', {
        email: 'Invalid email format',
      });
    });

    app.get('/unauthorized', () => {
      throw new UnauthorizedError('Invalid token');
    });

    app.get('/forbidden', () => {
      throw new ForbiddenError('Insufficient permissions');
    });

    app.get('/conflict', () => {
      throw new ConflictError('Resource already exists');
    });

    app.get('/unexpected', () => {
      throw new Error('Unexpected error');
    });

    // Apply error handler
    app.use(errorHandler);
  });

  it('should handle NotFoundError with correct response format', async () => {
    const response = await request(app).get('/not-found');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        message: 'Resource not found',
        code: 'NOT_FOUND',
        timestamp: expect.any(String),
      },
    });
  });

  it('should handle ValidationError with details', async () => {
    const response = await request(app).get('/validation');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
        details: {
          email: 'Invalid email format',
        },
        timestamp: expect.any(String),
      },
    });
  });

  it('should handle UnauthorizedError', async () => {
    const response = await request(app).get('/unauthorized');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        message: 'Invalid token',
        code: 'UNAUTHORIZED',
        timestamp: expect.any(String),
      },
    });
  });

  it('should handle ForbiddenError', async () => {
    const response = await request(app).get('/forbidden');

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
        timestamp: expect.any(String),
      },
    });
  });

  it('should handle ConflictError', async () => {
    const response = await request(app).get('/conflict');

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        message: 'Resource already exists',
        code: 'CONFLICT',
        timestamp: expect.any(String),
      },
    });
  });

  it('should handle unexpected errors with 500 status', async () => {
    const response = await request(app).get('/unexpected');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: expect.any(String),
      },
    });
    // Should not expose internal error details
    expect(response.body.error.message).not.toContain('Unexpected error');
  });

  it('should return valid ISO 8601 timestamps', async () => {
    const response = await request(app).get('/not-found');

    const timestamp = response.body.error.timestamp;
    expect(timestamp).toBeDefined();
    expect(() => new Date(timestamp)).not.toThrow();
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it('should always return JSON content-type', async () => {
    const response = await request(app).get('/not-found');

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});
