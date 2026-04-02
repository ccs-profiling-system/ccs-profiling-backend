import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../app';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

describe('Auth Controller Integration Tests', () => {
  let testUserId: string;
  let accessToken: string;
  const testEmail = `authtest.${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  beforeAll(async () => {
    // Clean up any existing test user first
    await db.delete(users).where(eq(users.email, testEmail));

    // Create a test user with UUID v7
    const passwordHash = await bcrypt.hash(testPassword, 10);
    
    // Import generateUUIDv7 if not already imported
    const { generateUUIDv7 } = await import('../../../shared/utils/uuid');
    
    const result = await db
      .insert(users)
      .values({
        id: generateUUIDv7(),
        email: testEmail,
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
      })
      .returning();

    testUserId = result[0].id;
  });

  afterAll(async () => {
    // Clean up test user after all tests
    await db.delete(users).where(eq(users.email, testEmail));
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('access');
      expect(response.body.data.tokens).toHaveProperty('refresh');
      expect(response.body.data.tokens.access).toHaveProperty('token');
      expect(response.body.data.tokens.refresh).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.user.role).toBe('admin');

      // Save token for other tests
      accessToken = response.body.data.tokens.access.token;
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
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
      expect(response.body.data.email).toBe(testEmail);
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
      // First, login to get a fresh token with the original password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      const token = loginResponse.body.data.tokens.access.token;

      // Change password
      const newPassword = 'newpassword456';
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: testPassword,
          newPassword: newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Password changed successfully');

      // Verify can login with new password
      const newLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: newPassword,
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);

      // Reset password back to original for other tests
      const resetToken = newLoginResponse.body.data.tokens.access.token;
      await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${resetToken}`)
        .send({
          oldPassword: newPassword,
          newPassword: testPassword,
        })
        .expect(200);
    });
  });
});
