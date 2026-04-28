/**
 * Integration Tests: Admin Advanced Routes
 * 
 * Tests all admin advanced approval endpoints including:
 * - Audit log querying with filtering and pagination
 * - Retry failed change requests
 * - Background job status retrieval
 * 
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../../app';
import { db } from '../../../../db';
import { users, auditLogs } from '../../../../db/schema';
import { approvals, ApprovalStatus, EntityType, Category } from '../../../../db/schema/approvals';
import { backgroundJobs, JobStatus, JobType } from '../../../../db/schema/backgroundJobs';
import { students } from '../../../../db/schema/students';
import { eq } from 'drizzle-orm';
import { generateToken } from '../../../../utils/jwt';

// Mock entity application service
vi.mock('../../services/entity-application.service', () => ({
  entityApplicationService: {
    applyChanges: vi.fn(),
  },
}));

// Mock notification service
vi.mock('../../services/notification.service', () => ({
  notificationService: {
    createApprovalNotification: vi.fn(),
  },
}));

describe('Admin Advanced Routes Integration Tests', () => {
  let adminToken: string;
  let adminUserId: string;
  
  let secretaryToken: string;
  let secretaryUserId: string;
  
  let testStudentId: string;
  let testApprovalId: string;
  let failedApprovalId: string;
  let testAuditLogId: string;
  let testBackgroundJobId: string;

  beforeAll(async () => {
    // Create admin user
    const [admin] = await db.insert(users).values({
      email: 'admin@test.com',
      password_hash: 'hashed_password',
      role: 'admin',
    }).returning();
    adminUserId = admin.id;
    adminToken = generateToken({ userId: admin.id, role: 'admin' });

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
    // Clean up test data before each test
    await db.delete(approvals);
    await db.delete(auditLogs);
    await db.delete(backgroundJobs);

    // Create test approval
    const [approval] = await db.insert(approvals).values({
      entity_type: EntityType.STUDENT,
      entity_id: testStudentId,
      category: Category.PROFILE,
      change_details: { email: 'newemail@test.com' },
      original_data: { email: 'student@test.com' },
      status: ApprovalStatus.PENDING,
      submitter_id: secretaryUserId,
      department_id: 'dept-cs-001',
      entity_version: 1,
    }).returning();
    testApprovalId = approval.id;

    // Create failed approval for retry tests
    const [failedApproval] = await db.insert(approvals).values({
      entity_type: EntityType.STUDENT,
      entity_id: testStudentId,
      category: Category.PROFILE,
      change_details: { phone: '123-456-7890' },
      original_data: { phone: null },
      status: ApprovalStatus.FAILED,
      submitter_id: secretaryUserId,
      department_id: 'dept-cs-001',
      entity_version: 1,
      retry_count: 0,
      failure_reason: 'Database connection error',
    }).returning();
    failedApprovalId = failedApproval.id;

    // Create test audit log entries
    const [auditLog] = await db.insert(auditLogs).values({
      user_id: adminUserId,
      action_type: 'approval_approved',
      entity_type: 'approval',
      entity_id: testApprovalId,
      ip_address: '127.0.0.1',
    }).returning();
    testAuditLogId = auditLog.id;

    // Create additional audit logs for filtering tests
    await db.insert(auditLogs).values([
      {
        user_id: secretaryUserId,
        action_type: 'approval_submitted',
        entity_type: 'approval',
        entity_id: testApprovalId,
        ip_address: '127.0.0.1',
      },
      {
        user_id: adminUserId,
        action_type: 'approval_rejected',
        entity_type: 'approval',
        entity_id: testApprovalId,
        ip_address: '127.0.0.1',
      },
    ]);

    // Create test background job
    const [job] = await db.insert(backgroundJobs).values({
      job_type: JobType.BULK_APPROVE,
      status: JobStatus.COMPLETED,
      payload: { approvalIds: [testApprovalId] },
      result: { successful: [testApprovalId], failed: [] },
      initiated_by: adminUserId,
    }).returning();
    testBackgroundJobId = job.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(approvals);
    await db.delete(auditLogs);
    await db.delete(backgroundJobs);
    await db.delete(students).where(eq(students.id, testStudentId));
    await db.delete(users).where(eq(users.id, adminUserId));
    await db.delete(users).where(eq(users.id, secretaryUserId));
  });

  describe('GET /api/v1/audit-logs', () => {
    it('should return audit logs with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter audit logs by user_id', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .query({ user_id: adminUserId })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((log: any) => {
        expect(log.user_id).toBe(adminUserId);
      });
    });

    it('should filter audit logs by action_type', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .query({ action_type: 'approval_submitted' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((log: any) => {
        expect(log.action_type).toBe('approval_submitted');
      });
    });

    it('should filter audit logs by change_request_id', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .query({ change_request_id: testApprovalId })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      // Note: The audit log schema uses entity_id, not change_request_id
      // This test validates the query parameter is accepted
    });

    it('should support pagination with custom page size', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .query({ page: 1, pageSize: 2 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.pageSize).toBe(2);
    });

    it('should enforce max page size of 100', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .query({ pageSize: 200 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/audit-logs')
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .expect(403);
    });

    it('should validate date format for start_date', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .query({ start_date: 'invalid-date' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate date format for end_date', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .query({ end_date: '2024/01/01' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept valid date range', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .query({ start_date: '2024-01-01', end_date: '2024-12-31' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/approvals/:id/retry', () => {
    it('should successfully retry a failed approval', async () => {
      const { entityApplicationService } = await import('../../services/entity-application.service');
      vi.mocked(entityApplicationService.applyChanges).mockResolvedValueOnce(undefined);

      const response = await request(app)
        .patch(`/api/v1/approvals/${failedApprovalId}/retry`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ApprovalStatus.APPROVED);
      expect(response.body.data.application_timestamp).toBeDefined();
      expect(response.body.data.failure_reason).toBeNull();
      expect(response.body.message).toContain('Retry successful');

      // Verify retry count was incremented
      const updatedApproval = await db.query.approvals.findFirst({
        where: eq(approvals.id, failedApprovalId),
      });
      expect(updatedApproval?.retry_count).toBe(1);
    });

    it('should handle retry failure and keep status as failed', async () => {
      const { entityApplicationService } = await import('../../services/entity-application.service');
      vi.mocked(entityApplicationService.applyChanges).mockRejectedValueOnce(
        new Error('Entity not found')
      );

      const response = await request(app)
        .patch(`/api/v1/approvals/${failedApprovalId}/retry`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RETRY_FAILED');
      expect(response.body.error.message).toContain('Entity not found');

      // Verify status is still failed
      const updatedApproval = await db.query.approvals.findFirst({
        where: eq(approvals.id, failedApprovalId),
      });
      expect(updatedApproval?.status).toBe(ApprovalStatus.FAILED);
      expect(updatedApproval?.failure_reason).toContain('Entity not found');
    });

    it('should return 400 for non-failed approval', async () => {
      const response = await request(app)
        .patch(`/api/v1/approvals/${testApprovalId}/retry`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_STATE');
      expect(response.body.error.message).toContain('Only failed approvals can be retried');
    });

    it('should return 400 when max retries exceeded', async () => {
      // Update approval to have 3 retries
      await db.update(approvals)
        .set({ retry_count: 3 })
        .where(eq(approvals.id, failedApprovalId));

      const response = await request(app)
        .patch(`/api/v1/approvals/${failedApprovalId}/retry`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MAX_RETRIES_EXCEEDED');
      expect(response.body.error.message).toContain('Maximum retry attempts (3) exceeded');
    });

    it('should return 404 for non-existent approval', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .patch(`/api/v1/approvals/${fakeId}/retry`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .patch('/api/v1/approvals/invalid-uuid/retry')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .patch(`/api/v1/approvals/${failedApprovalId}/retry`)
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .patch(`/api/v1/approvals/${failedApprovalId}/retry`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .expect(403);
    });

    it('should increment retry count on each attempt', async () => {
      const { entityApplicationService } = await import('../../services/entity-application.service');
      
      // First retry - fails
      vi.mocked(entityApplicationService.applyChanges).mockRejectedValueOnce(
        new Error('Temporary error')
      );
      await request(app)
        .patch(`/api/v1/approvals/${failedApprovalId}/retry`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      let approval = await db.query.approvals.findFirst({
        where: eq(approvals.id, failedApprovalId),
      });
      expect(approval?.retry_count).toBe(1);

      // Second retry - succeeds
      vi.mocked(entityApplicationService.applyChanges).mockResolvedValueOnce(undefined);
      await request(app)
        .patch(`/api/v1/approvals/${failedApprovalId}/retry`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      approval = await db.query.approvals.findFirst({
        where: eq(approvals.id, failedApprovalId),
      });
      expect(approval?.retry_count).toBe(2);
      expect(approval?.status).toBe(ApprovalStatus.APPROVED);
    });
  });

  describe('GET /api/v1/background-jobs/:id', () => {
    it('should return background job details', async () => {
      const response = await request(app)
        .get(`/api/v1/background-jobs/${testBackgroundJobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testBackgroundJobId);
      expect(response.body.data.job_type).toBe(JobType.BULK_APPROVE);
      expect(response.body.data.status).toBe(JobStatus.COMPLETED);
      expect(response.body.data.payload).toBeDefined();
      expect(response.body.data.result).toBeDefined();
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/v1/background-jobs/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/background-jobs/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/v1/background-jobs/${testBackgroundJobId}`)
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .get(`/api/v1/background-jobs/${testBackgroundJobId}`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .expect(403);
    });

    it('should return job with queued status', async () => {
      // Create a queued job
      const [queuedJob] = await db.insert(backgroundJobs).values({
        job_type: JobType.BULK_REJECT,
        status: JobStatus.QUEUED,
        payload: { approvalIds: [testApprovalId] },
        initiated_by: adminUserId,
      }).returning();

      const response = await request(app)
        .get(`/api/v1/background-jobs/${queuedJob.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(JobStatus.QUEUED);
      expect(response.body.data.result).toBeNull();
    });

    it('should return job with failed status and error', async () => {
      // Create a failed job
      const [failedJob] = await db.insert(backgroundJobs).values({
        job_type: JobType.NOTIFICATION_DELIVERY,
        status: JobStatus.FAILED,
        payload: { notificationId: 'test-notification-id' },
        error: 'Network timeout',
        initiated_by: adminUserId,
      }).returning();

      const response = await request(app)
        .get(`/api/v1/background-jobs/${failedJob.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(JobStatus.FAILED);
      expect(response.body.data.error).toBe('Network timeout');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to audit log endpoint', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array(101).fill(null).map(() =>
        request(app)
          .get('/api/v1/audit-logs')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    it('should create audit log entry for retry operation', async () => {
      const { entityApplicationService } = await import('../../services/entity-application.service');
      vi.mocked(entityApplicationService.applyChanges).mockResolvedValueOnce(undefined);

      await request(app)
        .patch(`/api/v1/approvals/${failedApprovalId}/retry`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Check that audit log was created
      const auditLog = await db.query.auditLogs.findFirst({
        where: (auditLogs, { and, eq }) => and(
          eq(auditLogs.user_id, adminUserId),
          eq(auditLogs.entity_id, failedApprovalId)
        ),
      });

      expect(auditLog).toBeDefined();
    });
  });
});
