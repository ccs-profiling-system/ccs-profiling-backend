import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../app';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import bcrypt from 'bcrypt';

describe('Auth Controller Integration Tests', () => {
  let testUserId: string;
  let accessToken: string;

  beforeAll(async () => {
    // Create a test user
    const passwordHash = await bcrypt.hash('testpassword123', 10);
    const result = await db
      .insert(users)
      .values({
        email: 'authtest@example.com',
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
      })
      .returning();

    testUserId = result[0].id;
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'testpassword123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe('authtest@example.com');
      expect(response.body.data.user.role).toBe('admin');

      // Save token for other tests
      accessToken = response.body.data.accessToken;
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user info when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('authtest@example.com');
      expect(response.body.data.role).toBe('admin');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'testpassword123',
          newPassword: 'newpassword456',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Password changed successfully');

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'newpassword456',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });
  });
});
