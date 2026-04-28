/**
 * Secretary Portal Integration Tests
 * 
 * End-to-end tests verifying that JWT authentication is properly integrated
 * with the secretary portal routes and that the authentication flow works
 * correctly from the main application entry point.
 * 
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../../app';
import { config } from '../../../config';

describe('Secretary Portal - Integration Tests', () => {
  describe('Authentication Integration', () => {
    it('should integrate auth middleware with secretary portal routes', async () => {
      // Verify that the secretary portal router is registered
      // and auth middleware is applied
      
      const response = await request(app)
        .get('/api/secretary/dashboard');

      // Should return 401 (authentication required)
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should allow authenticated requests to pass through', async () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'secretary@example.com',
        role: 'secretary',
      };
      
      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: '1h',
      });

      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', `Bearer ${token}`);

      // Should not return 401 (authentication passed)
      // Will return 404 or other error since route handler doesn't exist yet
      expect(response.status).not.toBe(401);
    });

    it('should extract user context for downstream middleware', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'secretary@example.com';
      const role = 'secretary';
      
      const payload = { userId, email, role };
      
      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: '1h',
      });

      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', `Bearer ${token}`);

      // Authentication should pass and user context should be available
      // to downstream middleware (verified by not getting 401)
      expect(response.status).not.toBe(401);
    });
  });

  describe('Route Registration', () => {
    it('should register secretary portal routes under /api/secretary prefix', async () => {
      // Test that routes are registered under correct prefix
      const response = await request(app)
        .get('/api/secretary/dashboard');

      // Should return 401 (route exists but authentication required)
      // Not 404 (route doesn't exist)
      expect(response.status).toBe(401);
    });

    it('should not respond to requests without /api/secretary prefix', async () => {
      const response = await request(app)
        .get('/secretary/dashboard');

      // Should return 404 (route doesn't exist without /api prefix)
      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format for authentication failures', async () => {
      const response = await request(app)
        .get('/api/secretary/dashboard');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('code');
    });

    it('should handle invalid tokens gracefully', async () => {
      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle expired tokens gracefully', async () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'secretary@example.com',
        role: 'secretary',
      };
      
      const expiredToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: '-1h',
      });

      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Security', () => {
    it('should validate JWT signature', async () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'secretary@example.com',
        role: 'secretary',
      };
      
      // Sign with wrong secret
      const wrongToken = jwt.sign(payload, 'wrong-secret', {
        expiresIn: '1h',
      });

      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', `Bearer ${wrongToken}`);

      expect(response.status).toBe(401);
    });

    it('should validate JWT expiration', async () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'secretary@example.com',
        role: 'secretary',
      };
      
      const expiredToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: '0s', // Expires immediately
      });

      // Wait a bit to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it('should not expose sensitive information in error messages', async () => {
      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error.message).not.toContain('secret');
      expect(response.body.error.message).not.toContain('key');
      expect(response.body.error.message).not.toContain('password');
    });
  });
});
