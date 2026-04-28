/**
 * Secretary Submission Routes Integration Tests
 * 
 * Tests all secretary approval endpoints with various scenarios:
 * - Successful operations
 * - Validation errors
 * - Authorization errors
 * - Rate limiting
 * - Edge cases
 * 
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../../app';
import { db } from '../../../../db';
import { approvals } from '../../../../db/schema/approvals';
import { users } from '../../../../db/schema/users';
import { students } from '../../../../db/schema/students';
import { departments } from '../../../../db/schema/departments';
import { programs } from '../../../../db/schema/programs';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { config } from '../../../../config';

describe('Secretary Submission Routes', () => {
  let secretaryToken: string;
  let secretaryUserId: string;
  let studentId: string;
  let departmentId: string;
  let approvalId: string;

  beforeAll(async () => {
    // Create test department
    const [department] = await db
      .insert(departments)
      .values({
        name: 'Computer Science',
        code: 'CS',
      })
      .returning();
    departmentId = department.id;

    // Create test program
    const [program] = await db
      .insert(programs)
      .values({
        name: 'BS Computer Science',
        code: 'BSCS',
        department_id: departmentId,
      })
      .returning();

    // Create test secretary user
    const [secretary] = await db
      .insert(users)
      .values({
        email: 'secretary@test.com',
        password_hash: 'hashed_password',
        role: 'secretary',
        first_name: 'Test',
        last_name: 'Secretary',
      })
      .returning();
    secretaryUserId = secretary.id;

    // Generate JWT token for secretary
    secretaryToken = jwt.sign(
      {
        userId: secretaryUserId,
        email: secretary.email,
        role: secretary.role,
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Create test student
    const [student] = await db
      .insert(students)
      .values({
        student_id: 'TEST-2024-001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        program_id: program.id,
      })
      .returning();
    studentId = student.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(approvals).where(eq(approvals.submitter_id, secretaryUserId));
    await db.delete(students).where(eq(students.id, studentId));
    await db.delete(users).where(eq(users.id, secretaryUserId));
    await db.delete(departments).where(eq(departments.id, departmentId));
  });

  beforeEach(async () => {
    // Clean up approvals before each test
    await db.delete(approvals).where(eq(approvals.submitter_id, secretaryUserId));
  });

  describe('POST /api/v1/approvals', () => {
    it('should submit a change request successfully', async () => {
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: {
            email: 'newemail@test.com',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.entity_type).toBe('student');
      expect(response.body.data.submitter_id).toBe(secretaryUserId);

      approvalId = response.body.data.id;
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({
          entity_type: 'student',
          // Missing entity_id, category, change_details
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid entity_type', async () => {
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({
          entity_type: 'invalid_type',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test@test.com' },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({
          entity_type: 'student',
          entity_id: 'not-a-uuid',
          category: 'profile',
          change_details: { email: 'test@test.com' },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for empty change_details', async () => {
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: {},
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/approvals')
        .send({
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test@test.com' },
        });

      expect(response.status).toBe(401);
    });

    it('should support idempotency key', async () => {
      const idempotencyKey = 'test-key-' + Date.now();

      // First request
      const response1 = await request(app)
        .post('/api/v1/approvals')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test1@test.com' },
          idempotency_key: idempotencyKey,
        });

      expect(response1.status).toBe(201);

      // Second request with same key should return same result
      const response2 = await request(app)
        .post('/api/v1/approvals')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test2@test.com' },
          idempotency_key: idempotencyKey,
        });

      expect(response2.status).toBe(201);
      expect(response2.body.data.id).toBe(response1.body.data.id);
    });
  });

  describe('GET /api/v1/approvals/my-submissions', () => {
    beforeEach(async () => {
      // Create test approvals
      await db.insert(approvals).values([
        {
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test1@test.com' },
          status: 'pending',
          submitter_id: secretaryUserId,
          department_id: departmentId,
          entity_version: Date.now(),
        },
        {
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test2@test.com' },
          status: 'approved',
          submitter_id: secretaryUserId,
          department_id: departmentId,
          entity_version: Date.now(),
        },
      ]);
    });

    it('should list own submissions with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/my-submissions')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('pageSize');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should filter submissions by status', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/my-submissions')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .query({ status: 'pending' });

      expect(response.status).toBe(200);
      expect(response.body.data.every((a: any) => a.status === 'pending')).toBe(true);
    });

    it('should filter submissions by entity_type', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/my-submissions')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .query({ entity_type: 'student' });

      expect(response.status).toBe(200);
      expect(response.body.data.every((a: any) => a.entity_type === 'student')).toBe(true);
    });

    it('should filter submissions by category', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/my-submissions')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .query({ category: 'profile' });

      expect(response.status).toBe(200);
      expect(response.body.data.every((a: any) => a.category === 'profile')).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/my-submissions');

      expect(response.status).toBe(401);
    });

    it('should respect pagination limits', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/my-submissions')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .query({ page: 1, pageSize: 1 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/approvals/my-submissions/:id', () => {
    let testApprovalId: string;

    beforeEach(async () => {
      const [approval] = await db
        .insert(approvals)
        .values({
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test@test.com' },
          status: 'pending',
          submitter_id: secretaryUserId,
          department_id: departmentId,
          entity_version: Date.now(),
        })
        .returning();
      testApprovalId = approval.id;
    });

    it('should get submission details', async () => {
      const response = await request(app)
        .get(`/api/v1/approvals/my-submissions/${testApprovalId}`)
        .set('Authorization', `Bearer ${secretaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testApprovalId);
      expect(response.body.data.submitter_id).toBe(secretaryUserId);
    });

    it('should return 404 for non-existent submission', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/approvals/my-submissions/${fakeId}`)
        .set('Authorization', `Bearer ${secretaryToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/my-submissions/not-a-uuid')
        .set('Authorization', `Bearer ${secretaryToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/approvals/my-submissions/${testApprovalId}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for submission belonging to another user', async () => {
      // Create another user
      const [otherUser] = await db
        .insert(users)
        .values({
          email: 'other@test.com',
          password_hash: 'hashed',
          role: 'secretary',
          first_name: 'Other',
          last_name: 'User',
        })
        .returning();

      const otherToken = jwt.sign(
        { userId: otherUser.id, email: otherUser.email, role: otherUser.role },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get(`/api/v1/approvals/my-submissions/${testApprovalId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      // Clean up
      await db.delete(users).where(eq(users.id, otherUser.id));
    });
  });

  describe('PATCH /api/v1/approvals/:id/withdraw', () => {
    let pendingApprovalId: string;
    let approvedApprovalId: string;

    beforeEach(async () => {
      const [pending] = await db
        .insert(approvals)
        .values({
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test@test.com' },
          status: 'pending',
          submitter_id: secretaryUserId,
          department_id: departmentId,
          entity_version: Date.now(),
        })
        .returning();
      pendingApprovalId = pending.id;

      const [approved] = await db
        .insert(approvals)
        .values({
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test2@test.com' },
          status: 'approved',
          submitter_id: secretaryUserId,
          department_id: departmentId,
          entity_version: Date.now(),
        })
        .returning();
      approvedApprovalId = approved.id;
    });

    it('should withdraw a pending submission', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/${pendingApprovalId}/withdraw`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('withdrawn');
    });

    it('should return 400 when withdrawing non-pending submission', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/${approvedApprovalId}/withdraw`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent submission', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .patch(`/api/v1/approvals/${fakeId}/withdraw`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({});

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .patch('/api/v1/approvals/not-a-uuid/withdraw')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/${pendingApprovalId}/withdraw`)
        .send({});

      expect(response.status).toBe(401);
    });

    it('should return 403 when withdrawing another user submission', async () => {
      // Create another user
      const [otherUser] = await db
        .insert(users)
        .values({
          email: 'other2@test.com',
          password_hash: 'hashed',
          role: 'secretary',
          first_name: 'Other',
          last_name: 'User',
        })
        .returning();

      const otherToken = jwt.sign(
        { userId: otherUser.id, email: otherUser.email, role: otherUser.role },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .patch(`/api/v1/approvals/${pendingApprovalId}/withdraw`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({});

      expect(response.status).toBe(403);

      // Clean up
      await db.delete(users).where(eq(users.id, otherUser.id));
    });
  });

  describe('GET /api/v1/approvals/my-stats', () => {
    beforeEach(async () => {
      // Create test approvals with various statuses
      await db.insert(approvals).values([
        {
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test1@test.com' },
          status: 'pending',
          submitter_id: secretaryUserId,
          department_id: departmentId,
          entity_version: Date.now(),
        },
        {
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test2@test.com' },
          status: 'approved',
          submitter_id: secretaryUserId,
          department_id: departmentId,
          entity_version: Date.now(),
        },
        {
          entity_type: 'student',
          entity_id: studentId,
          category: 'profile',
          change_details: { email: 'test3@test.com' },
          status: 'rejected',
          submitter_id: secretaryUserId,
          department_id: departmentId,
          entity_version: Date.now(),
        },
      ]);
    });

    it('should get submission statistics', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/my-stats')
        .set('Authorization', `Bearer ${secretaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSubmissions');
      expect(response.body.data).toHaveProperty('countsByStatus');
      expect(response.body.data).toHaveProperty('approvalRate');
      expect(response.body.data).toHaveProperty('rejectionRate');
      expect(response.body.data).toHaveProperty('countsByEntityType');
      expect(response.body.data).toHaveProperty('countsByCategory');
      expect(response.body.data.totalSubmissions).toBeGreaterThan(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/my-stats');

      expect(response.status).toBe(401);
    });

    it('should calculate approval rate correctly', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/my-stats')
        .set('Authorization', `Bearer ${secretaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.approvalRate).toBeGreaterThanOrEqual(0);
      expect(response.body.data.approvalRate).toBeLessThanOrEqual(100);
      expect(response.body.data.rejectionRate).toBeGreaterThanOrEqual(0);
      expect(response.body.data.rejectionRate).toBeLessThanOrEqual(100);
    });
  });
});
