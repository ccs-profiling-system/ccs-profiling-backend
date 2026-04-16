/**
 * Student Routes RBAC Integration Tests
 * 
 * Tests that student routes are properly protected with RBAC permissions.
 * Verifies that different roles have appropriate access to student endpoints.
 */

import { describe, it, expect } from 'vitest';
import { Role } from '../../../rbac/types';
import { PermissionChecker } from '../../../rbac/services/permissionChecker.service';

describe('Student Routes RBAC Protection', () => {
  const permissionChecker = PermissionChecker.getInstance();

  describe('POST /students - student.create Permission', () => {
    it('should allow Secretary to create students', () => {
      const result = permissionChecker.hasPermission(Role.SECRETARY, 'student.create');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: student.*');
    });

    it('should deny Faculty from creating students', () => {
      const result = permissionChecker.hasPermission(Role.FACULTY, 'student.create');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: student.create');
    });

    it('should deny Student from creating students', () => {
      const result = permissionChecker.hasPermission(Role.STUDENT, 'student.create');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: student.create');
    });

    it('should allow Admin to create students', () => {
      const result = permissionChecker.hasPermission(Role.ADMIN, 'student.create');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: *.*');
    });
  });

  describe('GET /students/:id - student.read Permission', () => {
    it('should allow Faculty to read student profiles', () => {
      const result = permissionChecker.hasPermission(Role.FACULTY, 'student.read');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: student.read');
    });

    it('should allow Department_Chair to read student profiles', () => {
      const result = permissionChecker.hasPermission(Role.DEPARTMENT_CHAIR, 'student.read');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: student.read');
    });

    it('should allow Secretary to read student profiles', () => {
      const result = permissionChecker.hasPermission(Role.SECRETARY, 'student.read');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: student.*');
    });

    it('should deny Student from reading other students (student.read)', () => {
      const result = permissionChecker.hasPermission(Role.STUDENT, 'student.read');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: student.read');
    });

    it('should allow Student to read own profile (student.read_own)', () => {
      const result = permissionChecker.hasPermission(Role.STUDENT, 'student.read_own');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: student.read_own');
    });

    it('should allow Admin to read student profiles', () => {
      const result = permissionChecker.hasPermission(Role.ADMIN, 'student.read');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: *.*');
    });
  });

  describe('PUT /students/:id - student.update Permission', () => {
    it('should allow Secretary to update students', () => {
      const result = permissionChecker.hasPermission(Role.SECRETARY, 'student.update');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: student.*');
    });

    it('should deny Faculty from updating students', () => {
      const result = permissionChecker.hasPermission(Role.FACULTY, 'student.update');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: student.update');
    });

    it('should deny Student from updating student profiles', () => {
      const result = permissionChecker.hasPermission(Role.STUDENT, 'student.update');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: student.update');
    });

    it('should deny Department_Chair from updating students', () => {
      const result = permissionChecker.hasPermission(Role.DEPARTMENT_CHAIR, 'student.update');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Default deny: no matching permission');
    });

    it('should allow Admin to update students', () => {
      const result = permissionChecker.hasPermission(Role.ADMIN, 'student.update');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: *.*');
    });
  });

  describe('DELETE /students/:id - student.delete Permission', () => {
    it('should allow Admin to delete students', () => {
      const result = permissionChecker.hasPermission(Role.ADMIN, 'student.delete');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: *.*');
    });

    it('should deny Secretary from deleting students', () => {
      const result = permissionChecker.hasPermission(Role.SECRETARY, 'student.delete');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: student.delete');
    });

    it('should deny Department_Chair from deleting students', () => {
      const result = permissionChecker.hasPermission(Role.DEPARTMENT_CHAIR, 'student.delete');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: student.delete');
    });

    it('should deny Faculty from deleting students', () => {
      const result = permissionChecker.hasPermission(Role.FACULTY, 'student.delete');
      expect(result.granted).toBe(false);
      // Faculty has explicit deny for student.delete in the permission config
      expect(result.reason).toBe('Explicit deny: student.delete');
    });

    it('should deny Student from deleting students', () => {
      const result = permissionChecker.hasPermission(Role.STUDENT, 'student.delete');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: student.delete');
    });
  });

  describe('Role-Based Access Summary', () => {
    it('should verify Admin has full access to all student operations', () => {
      const operations = [
        { permission: 'student.create', granted: true },
        { permission: 'student.read', granted: true },
        { permission: 'student.update', granted: true },
        { permission: 'student.delete', granted: true },
      ];

      operations.forEach(({ permission, granted }) => {
        const result = permissionChecker.hasPermission(Role.ADMIN, permission);
        expect(result.granted).toBe(granted);
        expect(result.reason).toContain('Wildcard allow: *.*');
      });
    });

    it('should verify Secretary can create and update but not delete', () => {
      const operations = [
        { permission: 'student.create', granted: true, reason: 'Wildcard allow: student.*' },
        { permission: 'student.read', granted: true, reason: 'Wildcard allow: student.*' },
        { permission: 'student.update', granted: true, reason: 'Wildcard allow: student.*' },
        { permission: 'student.delete', granted: false, reason: 'Explicit deny: student.delete' },
      ];

      operations.forEach(({ permission, granted, reason }) => {
        const result = permissionChecker.hasPermission(Role.SECRETARY, permission);
        expect(result.granted).toBe(granted);
        expect(result.reason).toContain(reason);
      });
    });

    it('should verify Faculty can read but not create, update, or delete', () => {
      const operations = [
        { permission: 'student.create', granted: false, reason: 'Explicit deny: student.create' },
        { permission: 'student.read', granted: true, reason: 'Explicit allow: student.read' },
        { permission: 'student.update', granted: false, reason: 'Explicit deny: student.update' },
        { permission: 'student.delete', granted: false, reason: 'Explicit deny: student.delete' },
      ];

      operations.forEach(({ permission, granted, reason }) => {
        const result = permissionChecker.hasPermission(Role.FACULTY, permission);
        expect(result.granted).toBe(granted);
        expect(result.reason).toBe(reason);
      });
    });

    it('should verify Student can only read own profile', () => {
      const operations = [
        { permission: 'student.create', granted: false, reason: 'Explicit deny: student.create' },
        { permission: 'student.read', granted: false, reason: 'Explicit deny: student.read' },
        { permission: 'student.read_own', granted: true, reason: 'Explicit allow: student.read_own' },
        { permission: 'student.update', granted: false, reason: 'Explicit deny: student.update' },
        { permission: 'student.delete', granted: false, reason: 'Explicit deny: student.delete' },
      ];

      operations.forEach(({ permission, granted, reason }) => {
        const result = permissionChecker.hasPermission(Role.STUDENT, permission);
        expect(result.granted).toBe(granted);
        expect(result.reason).toBe(reason);
      });
    });

    it('should verify Department_Chair can read and monitor but not delete', () => {
      const operations = [
        { permission: 'student.create', granted: false, reason: 'Default deny: no matching permission' },
        { permission: 'student.read', granted: true, reason: 'Explicit allow: student.read' },
        { permission: 'student.monitor', granted: true, reason: 'Explicit allow: student.monitor' },
        { permission: 'student.update', granted: false, reason: 'Default deny: no matching permission' },
        { permission: 'student.delete', granted: false, reason: 'Explicit deny: student.delete' },
      ];

      operations.forEach(({ permission, granted, reason }) => {
        const result = permissionChecker.hasPermission(Role.DEPARTMENT_CHAIR, permission);
        expect(result.granted).toBe(granted);
        expect(result.reason).toBe(reason);
      });
    });
  });
});
