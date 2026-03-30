import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { authRateLimiter, apiRateLimiter } from './rateLimiter';

describe('Rate Limiter Middleware', () => {
  describe('authRateLimiter', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/auth/login', authRateLimiter, (_req: Request, res: Response) => {
        res.json({ success: true, message: 'Login successful' });
      });
    });

    it('should allow requests within rate limit', async () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        const response = await request(app).post('/auth/login').send({ email: 'test@example.com' });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', async () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        await request(app).post('/auth/login').send({ email: 'test@example.com' });
      }

      // 6th request should be blocked
      const response = await request(app).post('/auth/login').send({ email: 'test@example.com' });
      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.body.error.message).toContain('Too many authentication attempts');
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).post('/auth/login').send({ email: 'test@example.com' });
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });
  });

  describe('apiRateLimiter', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.get('/api/data', apiRateLimiter, (_req: Request, res: Response) => {
        res.json({ success: true, data: [] });
      });
    });

    it('should allow requests within rate limit', async () => {
      // Make 100 requests (the limit)
      for (let i = 0; i < 100; i++) {
        const response = await request(app).get('/api/data');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', async () => {
      // Make 100 requests (the limit)
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/data');
      }

      // 101st request should be blocked
      const response = await request(app).get('/api/data');
      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.body.error.message).toContain('Too many requests');
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/api/data');
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });
  });
});
