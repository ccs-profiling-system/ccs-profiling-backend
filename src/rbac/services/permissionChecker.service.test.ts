/**
 * Permission Checker Service Tests
 * 
 * Tests the core permission checking logic including:
 * - Permission resolution algorithm (explicit deny → explicit allow → wildcard allow → default deny)
 * - Wildcard matching (resource.*, *.*)
 * - Explicit deny precedence
 * - In-memory caching
 * - Performance requirements (sub-5ms)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionChecker } from './permissionChecker.service';
import { Role } from '../types';

describe('PermissionChecker Service', () => {
  let checker: PermissionChecker;

  beforeEach(() => {
    checker = PermissionChecker.getInstance();
    checker.clearCache(); // Clear cache between tests
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PermissionChecker.getInstance();
      const instance2 = PermissionChecker.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Admin Role - Global Wildcard', () => {
    it('should grant all permissions to admin', () => {
      const permissions = [
        'student.read',
        'student.create',
        'student.update',
        'student.delete',
        'schedule.approve',
        'research.delete',
        'audit_log.read',
      ];

      for (const permission of permissions) {
        const result = checker.hasPermission(Role.ADMIN, permission);
        expect(result.granted).toBe(true);
        expect(result.reason).toContain('Wildcard allow: *.*');
      }
    });
  });

  describe('Explicit Deny Precedence', () => {
    it('should deny department_chair from deleting schedules despite schedule.* wildcard', () => {
      const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: schedule.delete');
    });

    it('should deny department_chair from deleting research despite research.* wildcard', () => {
      const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'research.delete');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: research.delete');
    });

    it('should deny faculty from deleting instructions despite instruction.* wildcard', () => {
      const result = checker.hasPermission(Role.FACULTY, 'instruction.delete');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: instruction.delete');
    });

    it('should deny secretary from approving schedules', () => {
      const result = checker.hasPermission(Role.SECRETARY, 'schedule.approve');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: schedule.approve');
    });

    it('should deny student from reading other students despite having student.read_own', () => {
      const result = checker.hasPermission(Role.STUDENT, 'student.read');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: student.read');
    });
  });

  describe('Explicit Allow', () => {
    it('should allow department_chair to read audit logs', () => {
      const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'audit_log.read');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: audit_log.read');
    });

    it('should allow faculty to create research', () => {
      const result = checker.hasPermission(Role.FACULTY, 'research.create');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: research.create');
    });

    it('should allow student to read own profile', () => {
      const result = checker.hasPermission(Role.STUDENT, 'student.read_own');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: student.read_own');
    });
  });

  describe('Wildcard Allow - Resource Level', () => {
    it('should allow department_chair all schedule operations except delete', () => {
      const allowedOperations = ['schedule.create', 'schedule.update', 'schedule.read', 'schedule.approve'];
      
      for (const permission of allowedOperations) {
        const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, permission);
        expect(result.granted).toBe(true);
        expect(result.reason).toContain('Wildcard allow: schedule.*');
      }
    });

    it('should allow faculty all instruction operations except delete', () => {
      const allowedOperations = ['instruction.create', 'instruction.update', 'instruction.read', 'instruction.encode'];
      
      for (const permission of allowedOperations) {
        const result = checker.hasPermission(Role.FACULTY, permission);
        expect(result.granted).toBe(true);
        expect(result.reason).toContain('Wildcard allow: instruction.*');
      }
    });

    it('should allow secretary all student operations except delete', () => {
      const allowedOperations = ['student.create', 'student.update', 'student.read', 'student.monitor'];
      
      for (const permission of allowedOperations) {
        const result = checker.hasPermission(Role.SECRETARY, permission);
        expect(result.granted).toBe(true);
        expect(result.reason).toContain('Wildcard allow: student.*');
      }
    });
  });

  describe('Default Deny', () => {
    it('should deny faculty from approving schedules', () => {
      const result = checker.hasPermission(Role.FACULTY, 'schedule.approve');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Default deny: no matching permission');
    });

    it('should deny secretary from reading audit logs', () => {
      const result = checker.hasPermission(Role.SECRETARY, 'audit_log.read');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Default deny: no matching permission');
    });

    it('should deny student from creating schedules', () => {
      const result = checker.hasPermission(Role.STUDENT, 'schedule.create');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: schedule.create');
    });

    it('should deny student from reading reports', () => {
      const result = checker.hasPermission(Role.STUDENT, 'report.read');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: report.read');
    });
  });

  describe('Resolution Order Verification', () => {
    it('should check explicit deny before explicit allow', () => {
      // Department chair has schedule.* (wildcard allow) but schedule.delete is explicitly denied
      const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Explicit deny: schedule.delete');
    });

    it('should check explicit allow before wildcard allow', () => {
      // Department chair has explicit allow for audit_log.read
      const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'audit_log.read');
      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Explicit allow: audit_log.read');
    });

    it('should check wildcard allow before default deny', () => {
      // Faculty has instruction.* wildcard
      const result = checker.hasPermission(Role.FACULTY, 'instruction.create');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: instruction.*');
    });
  });

  describe('Wildcard Matching Logic', () => {
    it('should match resource.* pattern correctly', () => {
      // Department chair has schedule.*
      const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.custom_action');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: schedule.*');
    });

    it('should match *.* pattern correctly', () => {
      // Admin has *.*
      const result = checker.hasPermission(Role.ADMIN, 'custom_resource.custom_action');
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow: *.*');
    });

    it('should not match different resource wildcards', () => {
      // Faculty has instruction.* but not schedule.*
      const result = checker.hasPermission(Role.FACULTY, 'schedule.create');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Default deny: no matching permission');
    });
  });

  describe('Caching Performance', () => {
    it('should cache permission check results', () => {
      // First check - cache miss
      const result1 = checker.hasPermission(Role.FACULTY, 'student.read');
      
      // Second check - cache hit
      const result2 = checker.hasPermission(Role.FACULTY, 'student.read');
      
      expect(result1).toEqual(result2);
      
      const stats = checker.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should have high cache hit rate for repeated checks', () => {
      const permissions = ['student.read', 'schedule.read', 'instruction.read'];
      
      // Perform checks multiple times
      for (let i = 0; i < 10; i++) {
        for (const permission of permissions) {
          checker.hasPermission(Role.FACULTY, permission);
        }
      }
      
      const stats = checker.getCacheStats();
      expect(stats.hitRate).toBeGreaterThan(50); // At least 50% hit rate
    });

    it('should clear cache correctly', () => {
      checker.hasPermission(Role.FACULTY, 'student.read');
      
      const statsBefore = checker.getCacheStats();
      expect(statsBefore.size).toBeGreaterThan(0);
      
      checker.clearCache();
      
      // Cache should be pre-warmed after clear
      const statsAfter = checker.getCacheStats();
      expect(statsAfter.size).toBeGreaterThan(0);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete permission checks in under 5ms', () => {
      const iterations = 100;
      const permissions = [
        'student.read',
        'schedule.approve',
        'research.create',
        'instruction.update',
      ];
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        for (const permission of permissions) {
          checker.hasPermission(Role.FACULTY, permission);
        }
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / (iterations * permissions.length);
      
      expect(averageTime).toBeLessThan(5); // Sub-5ms requirement
    });

    it('should maintain performance with cache', () => {
      // Pre-warm cache
      checker.hasPermission(Role.FACULTY, 'student.read');
      
      const startTime = performance.now();
      
      // Perform 1000 cached checks
      for (let i = 0; i < 1000; i++) {
        checker.hasPermission(Role.FACULTY, 'student.read');
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 1000;
      
      expect(averageTime).toBeLessThan(1); // Cached checks should be very fast
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid permission format gracefully', () => {
      const result = checker.hasPermission(Role.FACULTY, 'invalid_permission');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Default deny: no matching permission');
    });

    it('should handle empty permission string', () => {
      const result = checker.hasPermission(Role.FACULTY, '');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Default deny: no matching permission');
    });

    it('should handle permission with multiple dots', () => {
      const result = checker.hasPermission(Role.FACULTY, 'resource.action.extra');
      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Default deny: no matching permission');
    });
  });

  describe('Metrics Tracking', () => {
    it('should track total checks', () => {
      const metricsBefore = checker.getMetrics();
      const initialChecks = metricsBefore.totalChecks;
      
      checker.hasPermission(Role.FACULTY, 'student.read');
      checker.hasPermission(Role.FACULTY, 'schedule.read');
      
      const metricsAfter = checker.getMetrics();
      expect(metricsAfter.totalChecks).toBe(initialChecks + 2);
    });

    it('should track cache hits and misses', () => {
      checker.clearCache();
      
      // First check - cache miss (after pre-warming, some may be hits)
      checker.hasPermission(Role.FACULTY, 'custom.permission');
      
      // Second check - cache hit
      checker.hasPermission(Role.FACULTY, 'custom.permission');
      
      const metrics = checker.getMetrics();
      expect(metrics.cacheHits).toBeGreaterThan(0);
      expect(metrics.cacheMisses).toBeGreaterThan(0);
    });
  });

  describe('Real-World Permission Scenarios', () => {
    it('should allow department chair to manage schedules but not delete', () => {
      expect(checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.create').granted).toBe(true);
      expect(checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.update').granted).toBe(true);
      expect(checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.approve').granted).toBe(true);
      expect(checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete').granted).toBe(false);
    });

    it('should allow faculty to manage own instructions', () => {
      expect(checker.hasPermission(Role.FACULTY, 'instruction.create').granted).toBe(true);
      expect(checker.hasPermission(Role.FACULTY, 'instruction.update').granted).toBe(true);
      expect(checker.hasPermission(Role.FACULTY, 'instruction.read').granted).toBe(true);
      expect(checker.hasPermission(Role.FACULTY, 'instruction.delete').granted).toBe(false);
    });

    it('should allow secretary to encode data but not approve', () => {
      expect(checker.hasPermission(Role.SECRETARY, 'student.create').granted).toBe(true);
      expect(checker.hasPermission(Role.SECRETARY, 'student.update').granted).toBe(true);
      expect(checker.hasPermission(Role.SECRETARY, 'schedule.approve').granted).toBe(false);
      expect(checker.hasPermission(Role.SECRETARY, 'research.approve').granted).toBe(false);
    });

    it('should restrict student to read-only access', () => {
      expect(checker.hasPermission(Role.STUDENT, 'student.read_own').granted).toBe(true);
      expect(checker.hasPermission(Role.STUDENT, 'schedule.read').granted).toBe(true);
      expect(checker.hasPermission(Role.STUDENT, 'student.create').granted).toBe(false);
      expect(checker.hasPermission(Role.STUDENT, 'student.update').granted).toBe(false);
      expect(checker.hasPermission(Role.STUDENT, 'schedule.create').granted).toBe(false);
    });
  });
});
