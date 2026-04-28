/**
 * RBAC Integration Tests
 * 
 * Tests that all migrated admin modules are properly protected with RBAC permissions.
 * Verifies HTTP endpoints return correct status codes for different roles.
 * 
 * These tests verify the complete request flow:
 * 1. Authentication (JWT token)
 * 2. RBAC permission check
 * 3. HTTP response status
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app';

// Test user tokens for each role
let adminToken: string;
let chairToken: string;
let facultyToken: string;
let secretaryToken: string;
let studentToken: string;

/**
 * Generate JWT tokens for testing
 */
beforeAll(() => {
  const jwtSecret = process.env.JWT_SECRET || 'test-secret';

  adminToken = jwt.sign(
    { userId: 'admin-1', role: 'admin', email: 'admin@test.com' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  chairToken = jwt.sign(
    { userId: 'chair-1', role: 'department_chair', email: 'chair@test.com' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  facultyToken = jwt.sign(
    { userId: 'faculty-1', role: 'faculty', email: 'faculty@test.com' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  secretaryToken = jwt.sign(
    { userId: 'secretary-1', role: 'secretary', email: 'secretary@test.com' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  studentToken = jwt.sign(
    { userId: 'student-1', role: 'student', email: 'student@test.com' },
    jwtSecret,
    { expiresIn: '1h' }
  );
});

describe('RBAC Integration Tests - Migrated Admin Modules', () => {
  /**
   * Dashboard Module Tests
   * Permission: dashboard.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  describe('Dashboard Module', () => {
    const endpoint = '/api/v1/admin/dashboard';

    it('should allow Admin to access dashboard', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status); // 200 or 404 if no data
    });

    it('should allow Department Chair to access dashboard', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Faculty to access dashboard', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Secretary to access dashboard', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Student access to dashboard', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it('should deny unauthenticated access to dashboard', async () => {
      const response = await request(app).get(endpoint);
      
      expect(response.status).toBe(401);
    });
  });

  /**
   * Search Module Tests
   * Permissions: search.student, search.department
   */
  describe('Search Module', () => {
    describe('GET /search/students - search.student', () => {
      const endpoint = '/api/v1/admin/search/students?q=test';

      it('should allow Admin to search students', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect([200, 404]).toContain(response.status);
      });

      it('should allow Department Chair to search students', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${chairToken}`);
        
        expect([200, 404]).toContain(response.status);
      });

      it('should allow Faculty to search students', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${facultyToken}`);
        
        expect([200, 404]).toContain(response.status);
      });

      it('should allow Secretary to search students', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${secretaryToken}`);
        
        expect([200, 404]).toContain(response.status);
      });

      it('should deny Student from searching students', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${studentToken}`);
        
        expect(response.status).toBe(403);
      });
    });

    describe('GET /search/faculty - search.department', () => {
      const endpoint = '/api/v1/admin/search/faculty?q=test';

      it('should allow Admin to search faculty', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect([200, 404]).toContain(response.status);
      });

      it('should allow Department Chair to search faculty', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${chairToken}`);
        
        expect([200, 404]).toContain(response.status);
      });

      it('should deny Faculty from searching faculty', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${facultyToken}`);
        
        expect(response.status).toBe(403);
      });

      it('should deny Secretary from searching faculty', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${secretaryToken}`);
        
        expect(response.status).toBe(403);
      });
    });
  });

  /**
   * Audit Logs Module Tests
   * Permission: audit_log.read
   * Accessible by: Admin, Department Chair
   */
  describe('Audit Logs Module', () => {
    const endpoint = '/api/v1/admin/audit-logs';

    it('should allow Admin to access audit logs', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Department Chair to access audit logs', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Faculty from accessing audit logs', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect(response.status).toBe(403);
    });

    it('should deny Secretary from accessing audit logs', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect(response.status).toBe(403);
    });

    it('should deny Student from accessing audit logs', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  /**
   * Analytics Module Tests
   * Permission: analytics.read
   * Accessible by: Admin, Department Chair
   */
  describe('Analytics Module', () => {
    const endpoint = '/api/v1/admin/analytics/gpa';

    it('should allow Admin to access analytics', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Department Chair to access analytics', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Faculty from accessing analytics', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect(response.status).toBe(403);
    });

    it('should deny Secretary from accessing analytics', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect(response.status).toBe(403);
    });

    it('should deny Student from accessing analytics', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  /**
   * Reports Module Tests
   * Permissions: report.read, report.generate
   */
  describe('Reports Module', () => {
    describe('GET /reports - report.read', () => {
      const endpoint = '/api/v1/admin/reports';

      it('should allow Admin to list reports', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect([200, 404]).toContain(response.status);
      });

      it('should allow Department Chair to list reports', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${chairToken}`);
        
        expect([200, 404]).toContain(response.status);
      });

      it('should allow Faculty to list reports', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${facultyToken}`);
        
        expect([200, 404]).toContain(response.status);
      });

      it('should deny Secretary from listing reports', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${secretaryToken}`);
        
        expect(response.status).toBe(403);
      });

      it('should deny Student from listing reports', async () => {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${studentToken}`);
        
        expect(response.status).toBe(403);
      });
    });
  });

  /**
   * Violations Module Tests
   * Permissions: violation.read, violation.create, violation.update
   * Accessible by: Admin, Department Chair, Secretary
   */
  describe('Violations Module', () => {
    const endpoint = '/api/v1/admin/violations';

    it('should allow Admin to access violations', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Department Chair to access violations', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Secretary to access violations', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Faculty from accessing violations', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect(response.status).toBe(403);
    });

    it('should deny Student from accessing violations', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  /**
   * Skills Module Tests
   * Permissions: skill.read, skill.create, skill.update
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  describe('Skills Module', () => {
    const endpoint = '/api/v1/admin/skills';

    it('should allow Admin to access skills', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Department Chair to access skills', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Faculty to access skills', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Secretary to access skills', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Student from accessing skills', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  /**
   * Academic History Module Tests
   * Permissions: academic_history.read, academic_history.create
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  describe('Academic History Module', () => {
    const endpoint = '/api/v1/admin/academic-history';

    it('should allow Admin to access academic history', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Department Chair to access academic history', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Faculty to access academic history', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Secretary to access academic history', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Student from accessing academic history', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  /**
   * Affiliations Module Tests
   * Permissions: affiliation.read, affiliation.create
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  describe('Affiliations Module', () => {
    const endpoint = '/api/v1/admin/affiliations';

    it('should allow Admin to access affiliations', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Department Chair to access affiliations', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Faculty to access affiliations', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Secretary to access affiliations', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Student from accessing affiliations admin endpoint', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  /**
   * Events Module Tests
   * Permissions: event.read, event.create, event.update
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  describe('Events Module', () => {
    const endpoint = '/api/v1/admin/events';

    it('should allow Admin to access events', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Department Chair to access events', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Faculty to access events', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Secretary to access events', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Student from accessing events admin endpoint', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  /**
   * Research Module Tests
   * Permissions: research.read, research.create, research.update
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  describe('Research Module', () => {
    const endpoint = '/api/v1/admin/research';

    it('should allow Admin to access research', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Department Chair to access research', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Faculty to access research', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Secretary to access research', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Student from accessing research admin endpoint', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  /**
   * Instructions Module Tests
   * Permissions: instruction.read, instruction.create
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  describe('Instructions Module', () => {
    const endpoint = '/api/v1/admin/instructions';

    it('should allow Admin to access instructions', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Department Chair to access instructions', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Faculty to access instructions', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Secretary to access instructions', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Student from accessing instructions admin endpoint', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  /**
   * Enrollments Module Tests
   * Permissions: enrollment.read, enrollment.create
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  describe('Enrollments Module', () => {
    const endpoint = '/api/v1/admin/enrollments';

    it('should allow Admin to access enrollments', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Department Chair to access enrollments', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Faculty to access enrollments', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Secretary to access enrollments', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Student from accessing enrollments admin endpoint', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  /**
   * Faculty Module Tests
   * Permissions: faculty.read, faculty.create
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  describe('Faculty Module', () => {
    const endpoint = '/api/v1/admin/faculty';

    it('should allow Admin to access faculty', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Department Chair to access faculty', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${chairToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Faculty to access faculty list', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should allow Secretary to access faculty', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${secretaryToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should deny Student from accessing faculty admin endpoint', async () => {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(response.status).toBe(403);
    });
  });
});
