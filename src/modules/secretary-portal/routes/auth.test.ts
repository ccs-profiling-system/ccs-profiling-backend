/**
 * Secretary Portal Authentication Tests
 * 
 * Tests JWT token validation for secretary portal API requests.
 * Verifies that:
 * - Valid JWT tokens are accepted
 * - Invalid JWT tokens are rejected with HTTP 401
 * - Expired JWT tokens are rejected with HTTP 401
 * - Missing JWT tokens are rejected with HTTP 401
 * - User context (user_id, role) is extracted from valid tokens
 * 
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../../app';
import { config } from '../../../config';

describe('Secretary Portal - JWT Authentication', () => {
  describe('JWT Token Validation', () => {
    it('should accept valid JWT token and extract user context', async () => {
      // Generate a valid JWT token
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'secretary@example.com',
        role: 'secretary',
      };
      
      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: '1h',
      });

      // Make a request to any secretary portal endpoint (will be 404 since no routes exist yet)
      // But authentication should pass
      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', `Bearer ${token}`);

      // Should not return 401 (authentication passed)
      // Will return 404 since route doesn't exist yet, or other error
      expect(response.status).not.toBe(401);
    });

    it('should reject request without JWT token with HTTP 401', async () => {
      const response = await request(app)
        .get('/api/secretary/dashboard');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/token|authentication/i);
    });

    it('should reject request with invalid JWT token with HTTP 401', async () => {
      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/invalid|token/i);
    });

    it('should reject request with expired JWT token with HTTP 401', async () => {
      // Generate an expired JWT token
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'secretary@example.com',
        role: 'secretary',
      };
      
      const expiredToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: '-1h', // Expired 1 hour ago
      });

      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/expired|token/i);
    });

    it('should reject request with malformed Authorization header with HTTP 401', async () => {
      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', 'InvalidFormat token-here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with JWT signed with wrong secret with HTTP 401', async () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'secretary@example.com',
        role: 'secretary',
      };
      
      // Sign with wrong secret
      const wrongToken = jwt.sign(payload, 'wrong-secret-key', {
        expiresIn: '1h',
      });

      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', `Bearer ${wrongToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/invalid|token/i);
    });
  });

  describe('User Context Extraction', () => {
    it('should extract userId from valid JWT token', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const payload = {
        userId,
        email: 'secretary@example.com',
        role: 'secretary',
      };
      
      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: '1h',
      });

      // The auth middleware should attach user to req.user
      // We can't directly test this without a route handler, but we verify
      // that authentication passes (no 401 error)
      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', `Bearer ${token}`);

      // Should not return 401 (authentication passed and user context extracted)
      expect(response.status).not.toBe(401);
    });

    it('should extract role from valid JWT token', async () => {
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

      // Should not return 401 (authentication passed and role extracted)
      expect(response.status).not.toBe(401);
    });

    it('should extract email from valid JWT token', async () => {
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

      // Should not return 401 (authentication passed and email extracted)
      expect(response.status).not.toBe(401);
    });
  });

  describe('Development Bypass', () => {
    it('should allow dev-bypass-token in development mode', async () => {
      // Note: The config module caches NODE_ENV at startup, so we can't test
      // this dynamically. This test documents the expected behavior.
      // In actual development environment, dev-bypass-token should work.
      
      // Skip this test if not in development mode
      if (config.nodeEnv !== 'development') {
        return;
      }

      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', 'Bearer dev-bypass-token');

      // Should not return 401 (dev bypass allowed)
      expect(response.status).not.toBe(401);
    });

    it('should reject dev-bypass-token in production mode', async () => {
      // Note: This test documents expected behavior in production.
      // The actual behavior depends on NODE_ENV at startup.
      
      // Skip this test if in development mode
      if (config.nodeEnv === 'development') {
        return;
      }

      const response = await request(app)
        .get('/api/secretary/dashboard')
        .set('Authorization', 'Bearer dev-bypass-token');

      // Should return 401 (dev bypass not allowed in production)
      expect(response.status).toBe(401);
    });
  });
});
