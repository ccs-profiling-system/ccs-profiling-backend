/**
 * Schedule Routes RBAC Integration Tests
 * 
 * Tests that schedule routes are properly protected with RBAC permissions.
 * Verifies that different roles have appropriate access to schedule endpoints.
 */

import { describe, it, expect } from 'vitest';
import { Role } from '../../../rbac/types';
import { PermissionChecker } from '../../../rbac/services/permissionChecker.service';

describe('Schedule Routes RBAC Protection', () => {
  const permissionChecker = PermissionChecker.getInstance();

  describe('POST /schedules - schedule.create Permission', () => {
    it('should allow Secretary to create schedules', () => {
      const result = permissionChecker.hasPermission(Role.SECRETARY, 'schedule.create');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: schedule.create');
    });

    it('should allow Department_Chair to create schedules', () => {
      const result = permissionChecker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.create');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: schedule.*');
    });

    it('should deny Faculty from creating schedules', () => {
      const result = permissionChecker.hasPermission(Role.FACULTY, 'schedule.create');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Default deny: no matching permission');
    });

    it('should deny Student from creating schedules', () => {
      const result = permissionChecker.hasPermission(Role.STUDENT, 'schedule.create');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: schedule.create');
    });

    it('should allow Admin to create schedules', () => {
      const result = permissionChecker.hasPermission(Role.ADMIN, 'schedule.create');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: *.*');
    });
  });

  describe('GET /schedules/:id - schedule.read Permission', () => {
    it('should allow Secretary to read schedules', () => {
      const result = permissionChecker.hasPermission(Role.SECRETARY, 'schedule.read');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: schedule.read');
    });

    it('should allow Department_Chair to read schedules', () => {
      const result = permissionChecker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.read');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: schedule.*');
    });

    it('should allow Faculty to read schedules', () => {
      const result = permissionChecker.hasPermission(Role.FACULTY, 'schedule.read');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: schedule.read');
    });

    it('should allow Student to read schedules', () => {
      const result = permissionChecker.hasPermission(Role.STUDENT, 'schedule.read');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: schedule.read');
    });

    it('should allow Admin to read schedules', () => {
      const result = permissionChecker.hasPermission(Role.ADMIN, 'schedule.read');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: *.*');
    });
  });

  describe('PUT /schedules/:id - schedule.update Permission', () => {
    it('should allow Secretary to update schedules', () => {
      const result = permissionChecker.hasPermission(Role.SECRETARY, 'schedule.update');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: schedule.update');
    });

    it('should allow Department_Chair to update schedules', () => {
      const result = permissionChecker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.update');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: schedule.*');
    });

    it('should deny Faculty from updating schedules', () => {
      const result = permissionChecker.hasPermission(Role.FACULTY, 'schedule.update');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Default deny: no matching permission');
    });

    it('should deny Student from updating schedules', () => {
      const result = permissionChecker.hasPermission(Role.STUDENT, 'schedule.update');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: schedule.update');
    });

    it('should allow Admin to update schedules', () => {
      const result = permissionChecker.hasPermission(Role.ADMIN, 'schedule.update');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: *.*');
    });
  });

  describe('POST /schedules/:id/approve - schedule.approve Permission', () => {
    it('should deny Secretary from approving schedules', () => {
      const result = permissionChecker.hasPermission(Role.SECRETARY, 'schedule.approve');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: schedule.approve');
    });

    it('should allow Department_Chair to approve schedules', () => {
      const result = permissionChecker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.approve');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: schedule.*');
    });

    it('should deny Faculty from approving schedules', () => {
      const result = permissionChecker.hasPermission(Role.FACULTY, 'schedule.approve');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Default deny: no matching permission');
    });

    it('should deny Student from approving schedules', () => {
      const result = permissionChecker.hasPermission(Role.STUDENT, 'schedule.approve');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: schedule.approve');
    });

    it('should allow Admin to approve schedules', () => {
      const result = permissionChecker.hasPermission(Role.ADMIN, 'schedule.approve');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: *.*');
    });
  });

  describe('DELETE /schedules/:id - schedule.delete Permission', () => {
    it('should deny Secretary from deleting schedules', () => {
      const result = permissionChecker.hasPermission(Role.SECRETARY, 'schedule.delete');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: schedule.delete');
    });

    it('should deny Department_Chair from deleting schedules', () => {
      const result = permissionChecker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: schedule.delete');
    });

    it('should deny Faculty from deleting schedules', () => {
      const result = permissionChecker.hasPermission(Role.FACULTY, 'schedule.delete');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Default deny: no matching permission');
    });

    it('should deny Student from deleting schedules', () => {
      const result = permissionChecker.hasPermission(Role.STUDENT, 'schedule.delete');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: schedule.delete');
    });

    it('should allow Admin to delete schedules', () => {
      const result = permissionChecker.hasPermission(Role.ADMIN, 'schedule.delete');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: *.*');
    });
  });

  describe('Role-Based Access Summary', () => {
    it('should verify Admin has full access to all schedule operations', () => {
      const operations = [
        'schedule.create',
        'schedule.read',
        'schedule.update',
        'schedule.approve',
        'schedule.delete',
      ];

      operations.forEach((permission) => {
        const result = permissionChecker.hasPermission(Role.ADMIN, permission);
        expect(result.granted).toBe(true);
        expect(result.reason).toContain('Wildcard allow: *.*');
      });
    });

    it('should verify Department_Chair can manage schedules but not delete', () => {
      const operations = [
        { permission: 'schedule.create', granted: true, reason: 'Wildcard allow: schedule.*' },
        { permission: 'schedule.read', granted: true, reason: 'Wildcard allow: schedule.*' },
        { permission: 'schedule.update', granted: true, reason: 'Wildcard allow: schedule.*' },
        { permission: 'schedule.approve', granted: true, reason: 'Wildcard allow: schedule.*' },
        { permission: 'schedule.delete', granted: false, reason: 'Explicit deny: schedule.delete' },
      ];

      operations.forEach(({ permission, granted, reason }) => {
        const result = permissionChecker.hasPermission(Role.DEPARTMENT_CHAIR, permission);
        expect(result.granted).toBe(granted);
        expect(result.reason).toContain(reason);
      });
    });

    it('should verify Secretary can create and update but not approve or delete', () => {
      const operations = [
        { permission: 'schedule.create', granted: true, reason: 'Explicit allow: schedule.create' },
        { permission: 'schedule.read', granted: true, reason: 'Explicit allow: schedule.read' },
        { permission: 'schedule.update', granted: true, reason: 'Explicit allow: schedule.update' },
        { permission: 'schedule.approve', granted: false, reason: 'Explicit deny: schedule.approve' },
        { permission: 'schedule.delete', granted: false, reason: 'Explicit deny: schedule.delete' },
      ];

      operations.forEach(({ permission, granted, reason }) => {
        const result = permissionChecker.hasPermission(Role.SECRETARY, permission);
        expect(result.granted).toBe(granted);
        expect(result.reason).toBe(reason);
      });
    });

    it('should verify Faculty can only read schedules', () => {
      const operations = [
        { permission: 'schedule.create', granted: false, reason: 'Default deny: no matching permission' },
        { permission: 'schedule.read', granted: true, reason: 'Explicit allow: schedule.read' },
        { permission: 'schedule.update', granted: false, reason: 'Default deny: no matching permission' },
        { permission: 'schedule.approve', granted: false, reason: 'Default deny: no matching permission' },
        { permission: 'schedule.delete', granted: false, reason: 'Default deny: no matching permission' },
      ];

      operations.forEach(({ permission, granted, reason }) => {
        const result = permissionChecker.hasPermission(Role.FACULTY, permission);
        expect(result.granted).toBe(granted);
        expect(result.reason).toBe(reason);
      });
    });

    it('should verify Student can only read schedules', () => {
      const operations = [
        { permission: 'schedule.create', granted: false, reason: 'Explicit deny: schedule.create' },
        { permission: 'schedule.read', granted: true, reason: 'Explicit allow: schedule.read' },
        { permission: 'schedule.update', granted: false, reason: 'Explicit deny: schedule.update' },
        { permission: 'schedule.approve', granted: false, reason: 'Explicit deny: schedule.approve' },
        { permission: 'schedule.delete', granted: false, reason: 'Explicit deny: schedule.delete' },
      ];

      operations.forEach(({ permission, granted, reason }) => {
        const result = permissionChecker.hasPermission(Role.STUDENT, permission);
        expect(result.granted).toBe(granted);
        expect(result.reason).toBe(reason);
      });
    });
  });
});
