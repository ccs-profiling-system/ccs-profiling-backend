import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { helmetConfig, getCorsOptions } from './security';
import cors from 'cors';

describe('Security Middleware', () => {
  describe('Helmet Configuration', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(helmetConfig);
      app.get('/test', (_req: Request, res: Response) => {
        res.json({ success: true });
      });
    });

    it('should set security headers', async () => {
      const response = await request(app).get('/test');
      
      // Check for key security headers
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should hide X-Powered-By header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('should set HSTS header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    });
  });

  describe('CORS Configuration', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(cors(getCorsOptions()));
      app.get('/test', (_req: Request, res: Response) => {
        res.json({ success: true });
      });
    });

    it('should allow requests with no origin', async () => {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });

    it('should set CORS headers', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:5173');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');
      
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('should expose rate limit headers', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:5173');
      
      const exposedHeaders = response.headers['access-control-expose-headers'];
      expect(exposedHeaders).toBeDefined();
      if (exposedHeaders) {
        expect(exposedHeaders).toContain('X-API-Version');
        expect(exposedHeaders).toContain('RateLimit-Limit');
      }
    });
  });

  describe('getCorsOptions', () => {
    it('should return CORS options with correct configuration', () => {
      const options = getCorsOptions();
      
      expect(options.credentials).toBe(true);
      expect(options.methods).toContain('GET');
      expect(options.methods).toContain('POST');
      expect(options.methods).toContain('PUT');
      expect(options.methods).toContain('DELETE');
      expect(options.allowedHeaders).toContain('Content-Type');
      expect(options.allowedHeaders).toContain('Authorization');
      expect(options.maxAge).toBe(86400);
    });

    it('should have origin validation function', () => {
      const options = getCorsOptions();
      expect(typeof options.origin).toBe('function');
    });
  });
});
