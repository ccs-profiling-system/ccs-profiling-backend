/**
 * Shared Approval Routes Integration Tests
 * 
 * Tests all shared approval endpoints accessible to authenticated users:
 * - Notification listing and management
 * - Approval system configuration
 * 
 * Requirements: 13.1-13.7, 14.1-14.6
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../../app';
import { db } from '../../../../db';
import { approvalNotifications } from '../../../../db/schema/approvalNotifications';
import { approvals } from '../../../../db/schema/approvals';
import { users } from '../../../../db/schema/users';
import { students } from '../../../../db/schema/students';
import { departments } from '../../../../db/schema/departments';
import { programs } from '../../../../db/schema/programs';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { config } from '../../../../config';

describe('Shared Approval Routes', () => {
  let userToken: string;
  let userId: string;
  let otherUserId: string;
  let otherUserToken: string;
  let departmentId: string;
  let studentId: string;
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

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: 'testuser@test.com',
        password_hash: 'hashed_password',
        role: 'secretary',
        first_name: 'Test',
        last_name: 'User',
      })
      .returning();
    userId = user.id;

    // Generate JWT token for user
    userToken = jwt.sign(
      {
        userId: userId,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Create another test user
    const [otherUser] = await db
      .insert(users)
      .values({
        email: 'otheruser@test.com',
        password_hash: 'hashed_password',
        role: 'secretary',
        first_name: 'Other',
        last_name: 'User',
      })
      .returning();
    otherUserId = otherUser.id;

    // Generate JWT token for other user
    otherUserToken = jwt.sign(
      {
        userId: otherUserId,
        email: otherUser.email,
        role: otherUser.role,
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

    // Create test approval
    const [approval] = await db
      .insert(approvals)
      .values({
        entity_type: 'student',
        entity_id: studentId,
        category: 'profile',
        change_details: { email: 'newemail@test.com' },
        status: 'pending',
        submitter_id: userId,
        department_id: departmentId,
        entity_version: Date.now(),
      })
      .returning();
    approvalId = approval.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(approvalNotifications).where(eq(approvalNotifications.user_id, userId));
    await db.delete(approvalNotifications).where(eq(approvalNotifications.user_id, otherUserId));
    await db.delete(approvals).where(eq(approvals.id, approvalId));
    await db.delete(students).where(eq(students.id, studentId));
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(users).where(eq(users.id, otherUserId));
    await db.delete(departments).where(eq(departments.id, departmentId));
  });

  beforeEach(async () => {
    // Clean up notifications before each test
    await db.delete(approvalNotifications).where(eq(approvalNotifications.user_id, userId));
    await db.delete(approvalNotifications).where(eq(approvalNotifications.user_id, otherUserId));
  });

  describe('GET /api/v1/notifications', () => {
    beforeEach(async () => {
      // Create test notifications
      await db.insert(approvalNotifications).values([
        {
          user_id: userId,
          change_request_id: approvalId,
          type: 'approval_approved',
          message: 'Your change request has been approved',
          priority: 'medium',
          read_status: false,
        },
        {
          user_id: userId,
          change_request_id: approvalId,
          type: 'approval_rejected',
          message: 'Your change request has been rejected',
          priority: 'high',
          read_status: true,
        },
        {
          user_id: userId,
          change_request_id: approvalId,
          type: 'conflict_detected',
          message: 'Conflict detected for your change request',
          priority: 'high',
          read_status: false,
        },
      ]);
    });

    it('should list user notifications with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('pageSize');
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination.total).toBe(3);
    });

    it('should filter notifications by read status (unread)', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ read_status: 'false' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every((n: any) => n.read_status === false)).toBe(true);
    });

    it('should filter notifications by read status (read)', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ read_status: 'true' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data.every((n: any) => n.read_status === true)).toBe(true);
    });

    it('should return all notifications when read_status is "all"', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ read_status: 'all' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3);
    });

    it('should return notifications ordered by created_at DESC', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      const timestamps = response.body.data.map((n: any) => new Date(n.created_at).getTime());
      
      // Verify descending order
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    });

    it('should respect pagination limits', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ page: 1, pageSize: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.pageSize).toBe(2);
    });

    it('should return empty array when no notifications exist', async () => {
      // Use other user who has no notifications
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/notifications');

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid page number', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ page: -1 });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid pageSize', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ pageSize: 101 }); // Max is 100

      expect(response.status).toBe(400);
    });

    it('should include notification details in response', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      const notification = response.body.data[0];
      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('user_id');
      expect(notification).toHaveProperty('change_request_id');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('message');
      expect(notification).toHaveProperty('priority');
      expect(notification).toHaveProperty('read_status');
      expect(notification).toHaveProperty('created_at');
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    let notificationId: string;
    let otherUserNotificationId: string;

    beforeEach(async () => {
      // Create test notification for user
      const [notification] = await db
        .insert(approvalNotifications)
        .values({
          user_id: userId,
          change_request_id: approvalId,
          type: 'approval_approved',
          message: 'Your change request has been approved',
          priority: 'medium',
          read_status: false,
        })
        .returning();
      notificationId = notification.id;

      // Create test notification for other user
      const [otherNotification] = await db
        .insert(approvalNotifications)
        .values({
          user_id: otherUserId,
          change_request_id: approvalId,
          type: 'approval_approved',
          message: 'Your change request has been approved',
          priority: 'medium',
          read_status: false,
        })
        .returning();
      otherUserNotificationId = otherNotification.id;
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.read_status).toBe(true);
      expect(response.body.data.id).toBe(notificationId);
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .patch(`/api/v1/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .patch('/api/v1/notifications/not-a-uuid/read')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .send({});

      expect(response.status).toBe(401);
    });

    it('should return 403 when marking another user notification as read', async () => {
      const response = await request(app)
        .patch(`/api/v1/notifications/${otherUserNotificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should be idempotent (marking already read notification)', async () => {
      // First mark as read
      const response1 = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response1.status).toBe(200);
      expect(response1.body.data.read_status).toBe(true);

      // Mark as read again
      const response2 = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response2.status).toBe(200);
      expect(response2.body.data.read_status).toBe(true);
    });

    it('should persist read status in database', async () => {
      await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      // Verify in database
      const notification = await db.query.approvalNotifications.findFirst({
        where: (approvalNotifications, { eq }) => eq(approvalNotifications.id, notificationId),
      });

      expect(notification?.read_status).toBe(true);
    });
  });

  describe('GET /api/v1/approvals/config', () => {
    it('should return approval system configuration', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('entityTypes');
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('approvalStatuses');
      expect(response.body.data).toHaveProperty('notificationTypes');
      expect(response.body.data).toHaveProperty('notificationPriorities');
      expect(response.body.data).toHaveProperty('workflowRules');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('rateLimits');
    });

    it('should return correct entity types', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.entityTypes).toEqual(['student', 'faculty', 'event', 'research']);
    });

    it('should return correct categories', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.categories).toEqual(['research', 'event', 'profile', 'general']);
    });

    it('should return correct approval statuses', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.approvalStatuses).toEqual([
        'draft',
        'pending',
        'approved',
        'rejected',
        'withdrawn',
        'failed',
        'conflicted',
      ]);
    });

    it('should return correct notification types', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.notificationTypes).toEqual([
        'approval_approved',
        'approval_rejected',
        'conflict_detected',
        'application_failed',
      ]);
    });

    it('should return correct notification priorities', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.notificationPriorities).toEqual(['low', 'medium', 'high']);
    });

    it('should return workflow rules', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.workflowRules).toHaveProperty('maxBulkOperationSize');
      expect(response.body.data.workflowRules).toHaveProperty('maxBulkOperationSizeAtomic');
      expect(response.body.data.workflowRules).toHaveProperty('backgroundJobThreshold');
      expect(response.body.data.workflowRules).toHaveProperty('maxRetryAttempts');
      expect(response.body.data.workflowRules).toHaveProperty('allowedStateTransitions');
      expect(response.body.data.workflowRules.maxBulkOperationSize).toBe(100);
      expect(response.body.data.workflowRules.maxBulkOperationSizeAtomic).toBe(50);
      expect(response.body.data.workflowRules.backgroundJobThreshold).toBe(20);
      expect(response.body.data.workflowRules.maxRetryAttempts).toBe(3);
    });

    it('should return allowed state transitions', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      const transitions = response.body.data.workflowRules.allowedStateTransitions;
      expect(transitions.draft).toEqual(['pending']);
      expect(transitions.pending).toEqual(['approved', 'rejected', 'withdrawn', 'conflicted', 'failed']);
      expect(transitions.conflicted).toEqual(['pending']);
      expect(transitions.failed).toEqual(['pending']);
      expect(transitions.approved).toEqual([]);
      expect(transitions.rejected).toEqual([]);
      expect(transitions.withdrawn).toEqual([]);
    });

    it('should return pagination defaults', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.defaultPageSize).toBe(20);
      expect(response.body.data.pagination.maxPageSize).toBe(100);
    });

    it('should return rate limits', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.rateLimits).toHaveProperty('submission');
      expect(response.body.data.rateLimits).toHaveProperty('bulkOperations');
      expect(response.body.data.rateLimits).toHaveProperty('readOperations');
      expect(response.body.data.rateLimits.submission.max).toBe(20);
      expect(response.body.data.rateLimits.bulkOperations.max).toBe(5);
      expect(response.body.data.rateLimits.readOperations.max).toBe(100);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/approvals/config');

      expect(response.status).toBe(401);
    });

    it('should be accessible to any authenticated user regardless of role', async () => {
      // Test with secretary token
      const response1 = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response1.status).toBe(200);

      // Test with other user token
      const response2 = await request(app)
        .get('/api/v1/approvals/config')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response2.status).toBe(200);
    });
  });
});
