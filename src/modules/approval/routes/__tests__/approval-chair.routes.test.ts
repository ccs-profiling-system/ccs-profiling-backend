/**
 * Integration Tests: Chair Department Routes
 * 
 * Tests all chair department approval endpoints including:
 * - Department-scoped pending approvals listing
 * - Department-scoped approval details retrieval
 * - Department-scoped approval/rejection
 * - Department-scoped bulk operations
 * - Department-scoped history and statistics
 * - Department scope enforcement (403 for out-of-department access)
 * 
 * Requirements: 9.1-9.5, 10.1-10.5, 11.1-11.4, 12.1-12.4
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../../app';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { approvals, ApprovalStatus, EntityType, Category } from '../../../../db/schema';
import { students } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateToken } from '../../../../utils/jwt';

describe('Chair Department Routes Integration Tests', () => {
  let chairToken: string;
  let chairUserId: string;
  const chairDepartmentId = 'dept-cs-001'; // Mock department ID
  
  let otherChairToken: string;
  let otherChairUserId: string;
  const otherDepartmentId = 'dept-math-001'; // Mock department ID
  
  let secretaryToken: string;
  let secretaryUserId: string;
  
  let testStudentId: string;
  let testApprovalId: string;
  let otherDeptApprovalId: string;

  beforeAll(async () => {
    // Create chair user for CS department
    const [chair] = await db.insert(users).values({
      email: 'chair.cs@test.com',
      password_hash: 'hashed_password',
      role: 'chair',
    }).returning();
    chairUserId = chair.id;
    chairToken = generateToken({ userId: chair.id, role: 'chair', departmentId: chairDepartmentId });

    // Create chair user for Math department
    const [otherChair] = await db.insert(users).values({
      email: 'chair.math@test.com',
      password_hash: 'hashed_password',
      role: 'chair',
    }).returning();
    otherChairUserId = otherChair.id;
    otherChairToken = generateToken({ userId: otherChair.id, role: 'chair', departmentId: otherDepartmentId });

    // Create secretary user
    const [secretary] = await db.insert(users).values({
      email: 'secretary@test.com',
      password_hash: 'hashed_password',
      role: 'secretary',
    }).returning();
    secretaryUserId = secretary.id;
    secretaryToken = generateToken({ userId: secretary.id, role: 'secretary' });

    // Create test student
    const [student] = await db.insert(students).values({
      student_id: 'CS-2024-001',
      first_name: 'Test',
      last_name: 'Student',
      email: 'student@test.com',
      program_id: 'test-program-id',
      year_level: 1,
      status: 'active',
      version: 1,
    }).returning();
    testStudentId = student.id;
  });

  beforeEach(async () => {
    // Clean up approvals before each test
    await db.delete(approvals);

    // Create test approval in CS department
    const [approval] = await db.insert(approvals).values({
      entity_type: EntityType.STUDENT,
      entity_id: testStudentId,
      category: Category.PROFILE,
      change_details: { email: 'newemail@test.com' },
      original_data: { email: 'student@test.com' },
      status: ApprovalStatus.PENDING,
      submitter_id: secretaryUserId,
      department_id: chairDepartmentId,
      entity_version: 1,
    }).returning();
    testApprovalId = approval.id;

    // Create test approval in Math department
    const [otherApproval] = await db.insert(approvals).values({
      entity_type: EntityType.STUDENT,
      entity_id: testStudentId,
      category: Category.PROFILE,
      change_details: { phone: '123-456-7890' },
      original_data: { phone: null },
      status: ApprovalStatus.PENDING,
      submitter_id: secretaryUserId,
      department_id: otherDepartmentId,
      entity_version: 1,
    }).returning();
    otherDeptApprovalId = otherApproval.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(approvals);
    await db.delete(students).where(eq(students.id, testStudentId));
    await db.delete(users).where(eq(users.id, chairUserId));
    await db.delete(users).where(eq(users.id, otherChairUserId));
    await db.delete(users).where(eq(users.id, secretaryUserId));
  });

  describe('GET /api/v1/approvals/department/pending', () => {
    it('should list pending approvals for chair department', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/department/pending')
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(testApprovalId);
      expect(response.body.data[0].department_id).toBe(chairDepartmentId);
      expect(response.body.pagination).toBeDefined();
    });

    it('should not include approvals from other departments', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/department/pending')
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(200);

      const otherDeptApproval = response.body.data.find(
        (a: any) => a.id === otherDeptApprovalId
      );
      expect(otherDeptApproval).toBeUndefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/department/pending?page=1&pageSize=10')
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pageSize).toBe(10);
    });

    it('should support filtering by entity_type', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/department/pending?entity_type=student')
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(200);

      expect(response.body.data.every((a: any) => a.entity_type === 'student')).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/approvals/department/pending')
        .expect(401);
    });

    it('should return 403 for non-chair users', async () => {
      await request(app)
        .get('/api/v1/approvals/department/pending')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/approvals/department/:id', () => {
    it('should get approval details for chair department', async () => {
      const response = await request(app)
        .get(`/api/v1/approvals/department/${testApprovalId}`)
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testApprovalId);
      expect(response.body.data.department_id).toBe(chairDepartmentId);
    });

    it('should return 403 for approval outside chair department', async () => {
      const response = await request(app)
        .get(`/api/v1/approvals/department/${otherDeptApprovalId}`)
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toContain('different department');
    });

    it('should return 404 for non-existent approval', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/v1/approvals/department/${fakeId}`)
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app)
        .get('/api/v1/approvals/department/invalid-uuid')
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(400);
    });
  });

  describe('PATCH /api/v1/approvals/department/:id/approve', () => {
    it('should approve change request in chair department', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/department/${testApprovalId}/approve`)
        .set('Authorization', `Bearer ${chairToken}`)
        .send({ comments: 'Approved by chair' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
      expect(response.body.data.reviewer_id).toBe(chairUserId);
      expect(response.body.data.comments).toBe('Approved by chair');
    });

    it('should return 403 for approval outside chair department', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/department/${otherDeptApprovalId}/approve`)
        .set('Authorization', `Bearer ${chairToken}`)
        .send({ comments: 'Approved' })
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent approval', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .patch(`/api/v1/approvals/department/${fakeId}/approve`)
        .set('Authorization', `Bearer ${chairToken}`)
        .send({ comments: 'Approved' })
        .expect(404);
    });

    it('should allow approval without comments', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/department/${testApprovalId}/approve`)
        .set('Authorization', `Bearer ${chairToken}`)
        .send({})
        .expect(200);

      expect(response.body.data.status).toBe('approved');
    });
  });

  describe('PATCH /api/v1/approvals/department/:id/reject', () => {
    it('should reject change request in chair department', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/department/${testApprovalId}/reject`)
        .set('Authorization', `Bearer ${chairToken}`)
        .send({ comments: 'Rejected by chair' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
      expect(response.body.data.reviewer_id).toBe(chairUserId);
      expect(response.body.data.comments).toBe('Rejected by chair');
    });

    it('should return 403 for approval outside chair department', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/department/${otherDeptApprovalId}/reject`)
        .set('Authorization', `Bearer ${chairToken}`)
        .send({ comments: 'Rejected' })
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 when comments are missing', async () => {
      await request(app)
        .patch(`/api/v1/approvals/department/${testApprovalId}/reject`)
        .set('Authorization', `Bearer ${chairToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/v1/approvals/department/bulk-approve', () => {
    let approval2Id: string;
    let approval3Id: string;

    beforeEach(async () => {
      // Create additional approvals in chair department
      const [approval2] = await db.insert(approvals).values({
        entity_type: EntityType.STUDENT,
        entity_id: testStudentId,
        category: Category.PROFILE,
        change_details: { phone: '111-222-3333' },
        status: ApprovalStatus.PENDING,
        submitter_id: secretaryUserId,
        department_id: chairDepartmentId,
        entity_version: 1,
      }).returning();
      approval2Id = approval2.id;

      const [approval3] = await db.insert(approvals).values({
        entity_type: EntityType.STUDENT,
        entity_id: testStudentId,
        category: Category.PROFILE,
        change_details: { address: '123 Main St' },
        status: ApprovalStatus.PENDING,
        submitter_id: secretaryUserId,
        department_id: chairDepartmentId,
        entity_version: 1,
      }).returning();
      approval3Id = approval3.id;
    });

    it('should bulk approve multiple approvals in chair department', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/department/bulk-approve')
        .set('Authorization', `Bearer ${chairToken}`)
        .send({
          approvalIds: [testApprovalId, approval2Id, approval3Id],
          atomic: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(3);
      expect(response.body.data.failed).toHaveLength(0);
    });

    it('should skip approvals outside chair department', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/department/bulk-approve')
        .set('Authorization', `Bearer ${chairToken}`)
        .send({
          approvalIds: [testApprovalId, otherDeptApprovalId],
          atomic: false,
        })
        .expect(200);

      expect(response.body.data.successful).toHaveLength(1);
      expect(response.body.data.failed).toHaveLength(1);
      expect(response.body.data.failed[0].error).toContain('department');
    });

    it('should return 400 for empty approval IDs array', async () => {
      await request(app)
        .post('/api/v1/approvals/department/bulk-approve')
        .set('Authorization', `Bearer ${chairToken}`)
        .send({ approvalIds: [] })
        .expect(400);
    });

    it('should return 400 for more than 100 approval IDs', async () => {
      const manyIds = Array(101).fill(testApprovalId);
      await request(app)
        .post('/api/v1/approvals/department/bulk-approve')
        .set('Authorization', `Bearer ${chairToken}`)
        .send({ approvalIds: manyIds })
        .expect(400);
    });
  });

  describe('POST /api/v1/approvals/department/bulk-reject', () => {
    let approval2Id: string;

    beforeEach(async () => {
      const [approval2] = await db.insert(approvals).values({
        entity_type: EntityType.STUDENT,
        entity_id: testStudentId,
        category: Category.PROFILE,
        change_details: { phone: '111-222-3333' },
        status: ApprovalStatus.PENDING,
        submitter_id: secretaryUserId,
        department_id: chairDepartmentId,
        entity_version: 1,
      }).returning();
      approval2Id = approval2.id;
    });

    it('should bulk reject multiple approvals in chair department', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/department/bulk-reject')
        .set('Authorization', `Bearer ${chairToken}`)
        .send({
          approvalIds: [testApprovalId, approval2Id],
          comments: 'Bulk rejected by chair',
          atomic: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(2);
      expect(response.body.data.failed).toHaveLength(0);
    });

    it('should return 400 when comments are missing', async () => {
      await request(app)
        .post('/api/v1/approvals/department/bulk-reject')
        .set('Authorization', `Bearer ${chairToken}`)
        .send({ approvalIds: [testApprovalId] })
        .expect(400);
    });

    it('should skip approvals outside chair department', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/department/bulk-reject')
        .set('Authorization', `Bearer ${chairToken}`)
        .send({
          approvalIds: [testApprovalId, otherDeptApprovalId],
          comments: 'Rejected',
          atomic: false,
        })
        .expect(200);

      expect(response.body.data.successful).toHaveLength(1);
      expect(response.body.data.failed).toHaveLength(1);
    });
  });

  describe('GET /api/v1/approvals/department/history', () => {
    beforeEach(async () => {
      // Create some processed approvals
      await db.insert(approvals).values([
        {
          entity_type: EntityType.STUDENT,
          entity_id: testStudentId,
          category: Category.PROFILE,
          change_details: { email: 'approved@test.com' },
          status: ApprovalStatus.APPROVED,
          submitter_id: secretaryUserId,
          reviewer_id: chairUserId,
          department_id: chairDepartmentId,
          entity_version: 1,
        },
        {
          entity_type: EntityType.STUDENT,
          entity_id: testStudentId,
          category: Category.PROFILE,
          change_details: { email: 'rejected@test.com' },
          status: ApprovalStatus.REJECTED,
          submitter_id: secretaryUserId,
          reviewer_id: chairUserId,
          department_id: chairDepartmentId,
          entity_version: 1,
          comments: 'Not valid',
        },
      ]);
    });

    it('should list approval history for chair department', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/department/history')
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((a: any) => a.department_id === chairDepartmentId)).toBe(true);
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/department/history?status=approved')
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(200);

      expect(response.body.data.every((a: any) => a.status === 'approved')).toBe(true);
    });

    it('should not include approvals from other departments', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/department/history')
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(200);

      const otherDeptApproval = response.body.data.find(
        (a: any) => a.department_id === otherDepartmentId
      );
      expect(otherDeptApproval).toBeUndefined();
    });
  });

  describe('GET /api/v1/approvals/department/stats', () => {
    beforeEach(async () => {
      // Create various approvals for statistics
      await db.insert(approvals).values([
        {
          entity_type: EntityType.STUDENT,
          entity_id: testStudentId,
          category: Category.PROFILE,
          change_details: {},
          status: ApprovalStatus.APPROVED,
          submitter_id: secretaryUserId,
          reviewer_id: chairUserId,
          department_id: chairDepartmentId,
          entity_version: 1,
        },
        {
          entity_type: EntityType.FACULTY,
          entity_id: testStudentId,
          category: Category.RESEARCH,
          change_details: {},
          status: ApprovalStatus.REJECTED,
          submitter_id: secretaryUserId,
          reviewer_id: chairUserId,
          department_id: chairDepartmentId,
          entity_version: 1,
        },
      ]);
    });

    it('should get statistics for chair department', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/department/stats')
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSubmissions');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('byEntityType');
      expect(response.body.data).toHaveProperty('byCategory');
      expect(response.body.data).toHaveProperty('approvalRate');
    });

    it('should only include stats for chair department', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/department/stats')
        .set('Authorization', `Bearer ${chairToken}`)
        .expect(200);

      // Stats should only reflect CS department approvals
      expect(response.body.data.totalSubmissions).toBeGreaterThan(0);
    });

    it('should return 403 for chair without department', async () => {
      // Create chair without department
      const [chairNoDept] = await db.insert(users).values({
        email: 'chair.nodept@test.com',
        password_hash: 'hashed_password',
        role: 'chair',
      }).returning();
      
      const noDeptToken = generateToken({ userId: chairNoDept.id, role: 'chair' });

      await request(app)
        .get('/api/v1/approvals/department/stats')
        .set('Authorization', `Bearer ${noDeptToken}`)
        .expect(403);

      // Cleanup
      await db.delete(users).where(eq(users.id, chairNoDept.id));
    });
  });

  describe('Department Scope Enforcement', () => {
    it('should enforce department scope across all endpoints', async () => {
      // Try to access CS department approval with Math chair token
      const endpoints = [
        { method: 'get', path: `/api/v1/approvals/department/${testApprovalId}` },
        { method: 'patch', path: `/api/v1/approvals/department/${testApprovalId}/approve`, body: {} },
        { method: 'patch', path: `/api/v1/approvals/department/${testApprovalId}/reject`, body: { comments: 'test' } },
      ];

      for (const endpoint of endpoints) {
        const req = request(app)[endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${otherChairToken}`);
        
        if (endpoint.body) {
          req.send(endpoint.body);
        }

        const response = await req;
        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('FORBIDDEN');
      }
    });
  });
});
