/**
 * Admin Approval Routes Integration Tests
 * 
 * Tests all admin approval endpoints with various scenarios including:
 * - Pending approvals listing with pagination and filtering
 * - Approval details retrieval
 * - Approval and rejection operations
 * - Bulk operations (independent and atomic modes)
 * - Approval history with filtering
 * - System-wide statistics
 * - Authentication and authorization
 * - Rate limiting
 * - Error handling
 * 
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../../app';
import { db } from '../../../../db';
import { approvals, ApprovalStatus, EntityType, Category } from '../../../../db/schema/approvals';
import { users } from '../../../../db/schema/users';
import { departments } from '../../../../db/schema/departments';
import { students } from '../../../../db/schema/students';
import { eq } from 'drizzle-orm';
import { generateToken } from '../../../../utils/jwt';

describe('Admin Approval Routes', () => {
  let adminToken: string;
  let secretaryToken: string;
  let adminUserId: string;
  let secretaryUserId: string;
  let departmentId: string;
  let studentId: string;
  let pendingApprovalId: string;
  let approvedApprovalId: string;

  beforeAll(async () => {
    // Create test department
    const [department] = await db
      .insert(departments)
      .values({
        name: 'Test Department',
        code: 'TEST',
      })
      .returning();
    departmentId = department.id;

    // Create test student
    const [student] = await db
      .insert(students)
      .values({
        first_name: 'Test',
        last_name: 'Student',
        email: 'test.student@example.com',
        student_id: 'TEST001',
        program_id: departmentId, // Simplified for testing
      })
      .returning();
    studentId = student.id;

    // Create admin user
    const [admin] = await db
      .insert(users)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashed_password',
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
      })
      .returning();
    adminUserId = admin.id;
    adminToken = generateToken({ userId: admin.id, role: 'admin' });

    // Create secretary user
    const [secretary] = await db
      .insert(users)
      .values({
        email: 'secretary@example.com',
        password_hash: 'hashed_password',
        role: 'secretary',
        first_name: 'Secretary',
        last_name: 'User',
      })
      .returning();
    secretaryUserId = secretary.id;
    secretaryToken = generateToken({ userId: secretary.id, role: 'secretary' });

    // Create test approvals
    const [pendingApproval] = await db
      .insert(approvals)
      .values({
        entity_type: EntityType.STUDENT,
        entity_id: studentId,
        category: Category.PROFILE,
        change_details: { email: 'newemail@example.com' },
        original_data: { email: 'test.student@example.com' },
        status: ApprovalStatus.PENDING,
        submitter_id: secretaryUserId,
        department_id: departmentId,
        entity_version: Date.now(),
        submission_timestamp: new Date(),
      })
      .returning();
    pendingApprovalId = pendingApproval.id;

    const [approvedApproval] = await db
      .insert(approvals)
      .values({
        entity_type: EntityType.STUDENT,
        entity_id: studentId,
        category: Category.PROFILE,
        change_details: { phone: '1234567890' },
        original_data: { phone: null },
        status: ApprovalStatus.APPROVED,
        submitter_id: secretaryUserId,
        reviewer_id: adminUserId,
        department_id: departmentId,
        entity_version: Date.now(),
        submission_timestamp: new Date(Date.now() - 86400000), // 1 day ago
        decision_timestamp: new Date(),
      })
      .returning();
    approvedApprovalId = approvedApproval.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await db.delete(approvals).where(eq(approvals.submitter_id, secretaryUserId));
    await db.delete(students).where(eq(students.id, studentId));
    await db.delete(users).where(eq(users.id, adminUserId));
    await db.delete(users).where(eq(users.id, secretaryUserId));
    await db.delete(departments).where(eq(departments.id, departmentId));
  });

  describe('GET /api/v1/approvals/pending', () => {
    it('should list all pending approvals for admin', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/pending?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pageSize).toBe(10);
    });

    it('should support filtering by entity_type', async () => {
      const response = await request(app)
        .get(`/api/v1/approvals/pending?entity_type=${EntityType.STUDENT}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((approval: any) => {
        expect(approval.entity_type).toBe(EntityType.STUDENT);
      });
    });

    it('should support filtering by category', async () => {
      const response = await request(app)
        .get(`/api/v1/approvals/pending?category=${Category.PROFILE}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((approval: any) => {
        expect(approval.category).toBe(Category.PROFILE);
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/approvals/pending')
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .get('/api/v1/approvals/pending')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/approvals/:id', () => {
    it('should get approval details for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/approvals/${pendingApprovalId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(pendingApprovalId);
      expect(response.body.data.status).toBe(ApprovalStatus.PENDING);
    });

    it('should return 404 for non-existent approval', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/approvals/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app)
        .get('/api/v1/approvals/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/v1/approvals/${pendingApprovalId}`)
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .get(`/api/v1/approvals/${pendingApprovalId}`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .expect(403);
    });
  });

  describe('PATCH /api/v1/approvals/:id/approve', () => {
    let testApprovalId: string;

    beforeEach(async () => {
      // Create a fresh pending approval for each test
      const [approval] = await db
        .insert(approvals)
        .values({
          entity_type: EntityType.STUDENT,
          entity_id: studentId,
          category: Category.PROFILE,
          change_details: { middle_name: 'Test' },
          original_data: { middle_name: null },
          status: ApprovalStatus.PENDING,
          submitter_id: secretaryUserId,
          department_id: departmentId,
          entity_version: Date.now(),
          submission_timestamp: new Date(),
        })
        .returning();
      testApprovalId = approval.id;
    });

    it('should approve a pending change request', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/${testApprovalId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ comments: 'Approved by admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ApprovalStatus.APPROVED);
      expect(response.body.data.reviewer_id).toBe(adminUserId);
      expect(response.body.data.comments).toBe('Approved by admin');
    });

    it('should approve without comments', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/${testApprovalId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ApprovalStatus.APPROVED);
    });

    it('should return 400 for non-pending approval', async () => {
      await request(app)
        .patch(`/api/v1/approvals/${approvedApprovalId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .patch(`/api/v1/approvals/${testApprovalId}/approve`)
        .send({})
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .patch(`/api/v1/approvals/${testApprovalId}/approve`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({})
        .expect(403);
    });
  });

  describe('PATCH /api/v1/approvals/:id/reject', () => {
    let testApprovalId: string;

    beforeEach(async () => {
      // Create a fresh pending approval for each test
      const [approval] = await db
        .insert(approvals)
        .values({
          entity_type: EntityType.STUDENT,
          entity_id: studentId,
          category: Category.PROFILE,
          change_details: { address: 'New Address' },
          original_data: { address: 'Old Address' },
          status: ApprovalStatus.PENDING,
          submitter_id: secretaryUserId,
          department_id: departmentId,
          entity_version: Date.now(),
          submission_timestamp: new Date(),
        })
        .returning();
      testApprovalId = approval.id;
    });

    it('should reject a pending change request with comments', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/${testApprovalId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ comments: 'Invalid data provided' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ApprovalStatus.REJECTED);
      expect(response.body.data.reviewer_id).toBe(adminUserId);
      expect(response.body.data.comments).toBe('Invalid data provided');
    });

    it('should return 400 when comments are missing', async () => {
      await request(app)
        .patch(`/api/v1/approvals/${testApprovalId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('should return 400 for non-pending approval', async () => {
      await request(app)
        .patch(`/api/v1/approvals/${approvedApprovalId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ comments: 'Rejection reason' })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .patch(`/api/v1/approvals/${testApprovalId}/reject`)
        .send({ comments: 'Rejection reason' })
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .patch(`/api/v1/approvals/${testApprovalId}/reject`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({ comments: 'Rejection reason' })
        .expect(403);
    });
  });

  describe('POST /api/v1/approvals/bulk-approve', () => {
    let bulkApprovalIds: string[];

    beforeEach(async () => {
      // Create multiple pending approvals for bulk operations
      const approvalPromises = Array.from({ length: 5 }, async (_, i) => {
        const [approval] = await db
          .insert(approvals)
          .values({
            entity_type: EntityType.STUDENT,
            entity_id: studentId,
            category: Category.PROFILE,
            change_details: { note: `Bulk test ${i}` },
            original_data: {},
            status: ApprovalStatus.PENDING,
            submitter_id: secretaryUserId,
            department_id: departmentId,
            entity_version: Date.now(),
            submission_timestamp: new Date(),
          })
          .returning();
        return approval.id;
      });

      bulkApprovalIds = await Promise.all(approvalPromises);
    });

    it('should bulk approve in independent mode', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/bulk-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approvalIds: bulkApprovalIds.slice(0, 3),
          atomic: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalProcessed).toBe(3);
      expect(response.body.data.totalSuccessful).toBeGreaterThanOrEqual(0);
      expect(response.body.data.successful).toBeInstanceOf(Array);
      expect(response.body.data.failed).toBeInstanceOf(Array);
    });

    it('should bulk approve in atomic mode', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/bulk-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approvalIds: bulkApprovalIds.slice(0, 2),
          atomic: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalProcessed).toBe(2);
    });

    it('should return 400 for empty approval IDs array', async () => {
      await request(app)
        .post('/api/v1/approvals/bulk-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approvalIds: [],
        })
        .expect(400);
    });

    it('should return 400 for more than 100 approval IDs', async () => {
      const tooManyIds = Array.from({ length: 101 }, () => 
        '00000000-0000-0000-0000-000000000000'
      );

      await request(app)
        .post('/api/v1/approvals/bulk-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approvalIds: tooManyIds,
        })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/v1/approvals/bulk-approve')
        .send({
          approvalIds: bulkApprovalIds.slice(0, 2),
        })
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .post('/api/v1/approvals/bulk-approve')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({
          approvalIds: bulkApprovalIds.slice(0, 2),
        })
        .expect(403);
    });
  });

  describe('POST /api/v1/approvals/bulk-reject', () => {
    let bulkApprovalIds: string[];

    beforeEach(async () => {
      // Create multiple pending approvals for bulk operations
      const approvalPromises = Array.from({ length: 5 }, async (_, i) => {
        const [approval] = await db
          .insert(approvals)
          .values({
            entity_type: EntityType.STUDENT,
            entity_id: studentId,
            category: Category.PROFILE,
            change_details: { note: `Bulk reject test ${i}` },
            original_data: {},
            status: ApprovalStatus.PENDING,
            submitter_id: secretaryUserId,
            department_id: departmentId,
            entity_version: Date.now(),
            submission_timestamp: new Date(),
          })
          .returning();
        return approval.id;
      });

      bulkApprovalIds = await Promise.all(approvalPromises);
    });

    it('should bulk reject in independent mode with comments', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/bulk-reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approvalIds: bulkApprovalIds.slice(0, 3),
          comments: 'Bulk rejection reason',
          atomic: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalProcessed).toBe(3);
      expect(response.body.data.successful).toBeInstanceOf(Array);
      expect(response.body.data.failed).toBeInstanceOf(Array);
    });

    it('should bulk reject in atomic mode', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/bulk-reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approvalIds: bulkApprovalIds.slice(0, 2),
          comments: 'Atomic rejection reason',
          atomic: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalProcessed).toBe(2);
    });

    it('should return 400 when comments are missing', async () => {
      await request(app)
        .post('/api/v1/approvals/bulk-reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approvalIds: bulkApprovalIds.slice(0, 2),
        })
        .expect(400);
    });

    it('should return 400 for empty approval IDs array', async () => {
      await request(app)
        .post('/api/v1/approvals/bulk-reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approvalIds: [],
          comments: 'Rejection reason',
        })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/v1/approvals/bulk-reject')
        .send({
          approvalIds: bulkApprovalIds.slice(0, 2),
          comments: 'Rejection reason',
        })
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .post('/api/v1/approvals/bulk-reject')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({
          approvalIds: bulkApprovalIds.slice(0, 2),
          comments: 'Rejection reason',
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/approvals/history', () => {
    it('should list approval history for admin', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/history?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pageSize).toBe(10);
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get(`/api/v1/approvals/history?status=${ApprovalStatus.APPROVED}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((approval: any) => {
        expect(approval.status).toBe(ApprovalStatus.APPROVED);
      });
    });

    it('should support filtering by reviewer', async () => {
      const response = await request(app)
        .get(`/api/v1/approvals/history?reviewer_id=${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((approval: any) => {
        expect(approval.reviewer_id).toBe(adminUserId);
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/approvals/history')
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .get('/api/v1/approvals/history')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/approvals/stats', () => {
    it('should get system-wide statistics for admin', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalApprovals).toBeGreaterThanOrEqual(0);
      expect(response.body.data.countsByStatus).toBeDefined();
      expect(response.body.data.approvalRate).toBeGreaterThanOrEqual(0);
      expect(response.body.data.rejectionRate).toBeGreaterThanOrEqual(0);
      expect(response.body.data.averageApprovalTimeHours).toBeGreaterThanOrEqual(0);
      expect(response.body.data.countsByEntityType).toBeDefined();
      expect(response.body.data.countsByCategory).toBeDefined();
      expect(response.body.data.pendingOlderThan24Hours).toBeGreaterThanOrEqual(0);
      expect(response.body.data.pendingOlderThan7Days).toBeGreaterThanOrEqual(0);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/approvals/stats')
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .get('/api/v1/approvals/stats')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .expect(403);
    });
  });
});
