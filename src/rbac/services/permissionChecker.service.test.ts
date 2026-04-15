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

  describe('Resolution Step Functions - Unit Tests', () => {
    describe('checkExplicitDeny()', () => {
      it('should return denial result when permission is in deny list', () => {
        const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete');
        expect(result.granted).toBe(false);
        expect(result.reason).toBe('Explicit deny: schedule.delete');
      });

      it('should return denial result when permission matches wildcard in deny list', () => {
        const result = checker.hasPermission(Role.STUDENT, 'student.create');
        expect(result.granted).toBe(false);
        expect(result.reason).toBe('Explicit deny: student.create');
      });

      it('should not deny when permission is not in deny list', () => {
        // Department chair can create schedules (not in deny list)
        const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.create');
        expect(result.granted).toBe(true);
      });

      it('should deny even when permission is in allow list (deny takes precedence)', () => {
        // Department chair has schedule.* in allow but schedule.delete in deny
        const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete');
        expect(result.granted).toBe(false);
        expect(result.reason).toBe('Explicit deny: schedule.delete');
      });
    });

    describe('checkExplicitAllow()', () => {
      it('should return allow result when permission is explicitly in allow list', () => {
        const result = checker.hasPermission(Role.FACULTY, 'research.create');
        expect(result.granted).toBe(true);
        expect(result.reason).toBe('Explicit allow: research.create');
      });

      it('should return allow result for student.read_own', () => {
        const result = checker.hasPermission(Role.STUDENT, 'student.read_own');
        expect(result.granted).toBe(true);
        expect(result.reason).toBe('Explicit allow: student.read_own');
      });

      it('should not allow when permission is only in wildcard form', () => {
        // Department chair has schedule.* but not schedule.create explicitly
        // This should be caught by wildcard allow, not explicit allow
        const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.create');
        expect(result.reason).toContain('Wildcard allow');
      });

      it('should check explicit allow before wildcard allow', () => {
        // Department chair has audit_log.read explicitly
        const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'audit_log.read');
        expect(result.granted).toBe(true);
        expect(result.reason).toBe('Explicit allow: audit_log.read');
      });
    });

    describe('checkWildcardAllow()', () => {
      it('should return allow result when permission matches resource.* pattern', () => {
        const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.create');
        expect(result.granted).toBe(true);
        expect(result.reason).toBe('Wildcard allow: schedule.*');
      });

      it('should return allow result when permission matches *.* pattern', () => {
        const result = checker.hasPermission(Role.ADMIN, 'custom_resource.custom_action');
        expect(result.granted).toBe(true);
        expect(result.reason).toBe('Wildcard allow: *.*');
      });

      it('should match any action on a resource with resource.* wildcard', () => {
        const actions = ['create', 'update', 'read', 'approve', 'custom_action'];
        
        for (const action of actions) {
          if (action === 'delete') continue; // Skip delete as it's explicitly denied
          const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, `schedule.${action}`);
          expect(result.granted).toBe(true);
          expect(result.reason).toBe('Wildcard allow: schedule.*');
        }
      });

      it('should not match different resource wildcards', () => {
        // Faculty has instruction.* but not schedule.*
        const result = checker.hasPermission(Role.FACULTY, 'schedule.approve');
        expect(result.granted).toBe(false);
        expect(result.reason).toBe('Default deny: no matching permission');
      });

      it('should not match when no wildcard patterns exist', () => {
        // Student has no wildcards in allow list
        const result = checker.hasPermission(Role.STUDENT, 'custom.action');
        expect(result.granted).toBe(false);
      });
    });

    describe('defaultDeny()', () => {
      it('should return denial when no rules match', () => {
        const result = checker.hasPermission(Role.FACULTY, 'schedule.approve');
        expect(result.granted).toBe(false);
        expect(result.reason).toBe('Default deny: no matching permission');
      });

      it('should return denial for secretary accessing audit logs', () => {
        const result = checker.hasPermission(Role.SECRETARY, 'audit_log.read');
        expect(result.granted).toBe(false);
        expect(result.reason).toBe('Default deny: no matching permission');
      });

      it('should return denial for undefined permissions', () => {
        const result = checker.hasPermission(Role.FACULTY, 'nonexistent.permission');
        expect(result.granted).toBe(false);
        expect(result.reason).toBe('Default deny: no matching permission');
      });

      it('should be the last step in resolution order', () => {
        // Test that default deny only applies when all other steps fail
        const result = checker.hasPermission(Role.STUDENT, 'admin.action');
        expect(result.granted).toBe(false);
        expect(result.reason).toBe('Default deny: no matching permission');
      });
    });

    describe('Resolution Order Enforcement', () => {
      it('should enforce order: explicit deny > explicit allow > wildcard allow > default deny', () => {
        // Step 1: Explicit deny wins over wildcard allow
        const denyResult = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete');
        expect(denyResult.granted).toBe(false);
        expect(denyResult.reason).toBe('Explicit deny: schedule.delete');

        // Step 2: Explicit allow wins over wildcard allow
        const explicitAllowResult = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'audit_log.read');
        expect(explicitAllowResult.granted).toBe(true);
        expect(explicitAllowResult.reason).toBe('Explicit allow: audit_log.read');

        // Step 3: Wildcard allow wins over default deny
        const wildcardResult = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.create');
        expect(wildcardResult.granted).toBe(true);
        expect(wildcardResult.reason).toBe('Wildcard allow: schedule.*');

        // Step 4: Default deny when nothing matches
        const defaultDenyResult = checker.hasPermission(Role.FACULTY, 'schedule.approve');
        expect(defaultDenyResult.granted).toBe(false);
        expect(defaultDenyResult.reason).toBe('Default deny: no matching permission');
      });

      it('should never allow when explicit deny exists, regardless of allow rules', () => {
        // Department chair has schedule.* (wildcard allow) but schedule.delete is denied
        const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete');
        expect(result.granted).toBe(false);
        expect(result.reason).toBe('Explicit deny: schedule.delete');
      });

      it('should check explicit allow before checking wildcards', () => {
        // Faculty has research.create explicitly and also matches instruction.* wildcard
        const explicitResult = checker.hasPermission(Role.FACULTY, 'research.create');
        expect(explicitResult.granted).toBe(true);
        expect(explicitResult.reason).toBe('Explicit allow: research.create');

        const wildcardResult = checker.hasPermission(Role.FACULTY, 'instruction.create');
        expect(wildcardResult.granted).toBe(true);
        expect(wildcardResult.reason).toBe('Wildcard allow: instruction.*');
      });
    });
  });

  describe('Integration Tests - Complex Permission Scenarios', () => {
    describe('Multi-Role Permission Comparison', () => {
      it('should enforce different permissions for same resource across roles', () => {
        const permission = 'schedule.approve';

        // Admin can approve
        expect(checker.hasPermission(Role.ADMIN, permission).granted).toBe(true);

        // Department chair can approve
        expect(checker.hasPermission(Role.DEPARTMENT_CHAIR, permission).granted).toBe(true);

        // Faculty cannot approve
        expect(checker.hasPermission(Role.FACULTY, permission).granted).toBe(false);

        // Secretary cannot approve
        expect(checker.hasPermission(Role.SECRETARY, permission).granted).toBe(false);

        // Student cannot approve
        expect(checker.hasPermission(Role.STUDENT, permission).granted).toBe(false);
      });

      it('should handle student.read permission differently across roles', () => {
        // Admin can read all students
        expect(checker.hasPermission(Role.ADMIN, 'student.read').granted).toBe(true);

        // Department chair can read all students
        expect(checker.hasPermission(Role.DEPARTMENT_CHAIR, 'student.read').granted).toBe(true);

        // Faculty can read students
        expect(checker.hasPermission(Role.FACULTY, 'student.read').granted).toBe(true);

        // Secretary can read students
        expect(checker.hasPermission(Role.SECRETARY, 'student.read').granted).toBe(true);

        // Student cannot read other students (only student.read_own)
        expect(checker.hasPermission(Role.STUDENT, 'student.read').granted).toBe(false);
        expect(checker.hasPermission(Role.STUDENT, 'student.read_own').granted).toBe(true);
      });
    });

    describe('Wildcard with Deny Override Scenarios', () => {
      it('should deny specific actions within wildcard-granted resource', () => {
        // Department chair has schedule.* but schedule.delete is denied
        expect(checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.create').granted).toBe(true);
        expect(checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.update').granted).toBe(true);
        expect(checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.read').granted).toBe(true);
        expect(checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.approve').granted).toBe(true);
        expect(checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete').granted).toBe(false);
      });

      it('should deny specific actions within wildcard for faculty instructions', () => {
        // Faculty has instruction.* but instruction.delete is denied
        expect(checker.hasPermission(Role.FACULTY, 'instruction.create').granted).toBe(true);
        expect(checker.hasPermission(Role.FACULTY, 'instruction.update').granted).toBe(true);
        expect(checker.hasPermission(Role.FACULTY, 'instruction.read').granted).toBe(true);
        expect(checker.hasPermission(Role.FACULTY, 'instruction.delete').granted).toBe(false);
      });

      it('should deny specific actions within wildcard for secretary', () => {
        // Secretary has student.* but student.delete is denied
        expect(checker.hasPermission(Role.SECRETARY, 'student.create').granted).toBe(true);
        expect(checker.hasPermission(Role.SECRETARY, 'student.update').granted).toBe(true);
        expect(checker.hasPermission(Role.SECRETARY, 'student.read').granted).toBe(true);
        expect(checker.hasPermission(Role.SECRETARY, 'student.delete').granted).toBe(false);
      });
    });

    describe('Cross-Module Permission Consistency', () => {
      it('should consistently apply permissions across different modules', () => {
        // Test that permission logic is consistent across different resource types
        const roles = [Role.ADMIN, Role.DEPARTMENT_CHAIR, Role.FACULTY, Role.SECRETARY, Role.STUDENT];
        const resources = ['schedule', 'research', 'event', 'instruction', 'student'];

        for (const role of roles) {
          for (const resource of resources) {
            const readResult = checker.hasPermission(role, `${resource}.read`);
            const createResult = checker.hasPermission(role, `${resource}.create`);

            // Results should be consistent (either granted or denied, not undefined)
            expect(readResult.granted).toBeDefined();
            expect(createResult.granted).toBeDefined();
            expect(readResult.reason).toBeDefined();
            expect(createResult.reason).toBeDefined();
          }
        }
      });
    });

    describe('Performance with Complex Permission Checks', () => {
      it('should maintain sub-5ms performance for complex permission scenarios', () => {
        const complexScenarios = [
          { role: Role.DEPARTMENT_CHAIR, permission: 'schedule.delete' }, // Explicit deny
          { role: Role.FACULTY, permission: 'instruction.create' }, // Wildcard allow
          { role: Role.SECRETARY, permission: 'schedule.approve' }, // Explicit deny
          { role: Role.STUDENT, permission: 'student.read_own' }, // Explicit allow
          { role: Role.ADMIN, permission: 'custom.action' }, // Global wildcard
        ];

        const iterations = 100;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
          for (const scenario of complexScenarios) {
            checker.hasPermission(scenario.role, scenario.permission);
          }
        }

        const endTime = performance.now();
        const averageTime = (endTime - startTime) / (iterations * complexScenarios.length);

        expect(averageTime).toBeLessThan(5);
      });
    });

    describe('Edge Cases in Complex Scenarios', () => {
      it('should handle permissions with similar names correctly', () => {
        // Test that student.read and student.read_own are treated as different permissions
        const studentReadResult = checker.hasPermission(Role.STUDENT, 'student.read');
        const studentReadOwnResult = checker.hasPermission(Role.STUDENT, 'student.read_own');

        expect(studentReadResult.granted).toBe(false);
        expect(studentReadOwnResult.granted).toBe(true);
      });

      it('should handle multiple wildcards correctly', () => {
        // Admin has *.* which should match everything
        const permissions = [
          'student.read',
          'schedule.approve',
          'custom.action',
          'deeply.nested.permission',
        ];

        for (const permission of permissions) {
          const result = checker.hasPermission(Role.ADMIN, permission);
          expect(result.granted).toBe(true);
          expect(result.reason).toBe('Wildcard allow: *.*');
        }
      });

      it('should handle permissions with no dots gracefully', () => {
        const result = checker.hasPermission(Role.FACULTY, 'invalidpermission');
        expect(result.granted).toBe(false);
        expect(result.reason).toBe('Default deny: no matching permission');
      });
    });
  });
});
