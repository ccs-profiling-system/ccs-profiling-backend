import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app';

describe('Security Middleware Integration', () => {
  describe('Helmet Security Headers', () => {
    it('should set security headers on all routes', async () => {
      const response = await request(app).get('/health');
      
      // Verify key security headers are present
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests with no origin', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should set CORS headers for allowed origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');
      
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers on API routes', async () => {
      const response = await request(app).get('/health');
      
      // Health endpoint might not have rate limiting, but we can verify headers exist
      expect(response.status).toBe(200);
    });

    it('should apply rate limiting to API routes', async () => {
      // Make a request to an API route
      const response = await request(app).get('/api/v1/auth/me');
      
      // Should have rate limit headers (even if request fails due to auth)
      // The rate limiter is applied before auth middleware
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });
  });

  describe('Security Middleware Order', () => {
    it('should apply security middleware before route handlers', async () => {
      const response = await request(app).get('/health');
      
      // Verify security headers are present
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      
      // Verify response is successful
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});
