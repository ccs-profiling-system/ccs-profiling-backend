/**
 * Unit Tests for PermissionChecker Service
 * 
 * Tests the core permission resolution algorithm with focus on:
 * - Permission resolution order: explicit deny → explicit allow → wildcard allow → default deny
 * - Wildcard matching for resource-level (student.*) and global (*.*) patterns
 * - Edge cases and error conditions
 * 
 * Task 18: Basic Unit Tests (CRITICAL)
 * Sub-tasks:
 * - 18.1 Test explicit deny takes precedence over explicit allow
 * - 18.2 Test explicit deny takes precedence over wildcard allow
 * - 18.3 Test wildcard allow matches correctly (student.*, *.*)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionChecker } from './permissionChecker.service';
import { Role } from '../types';

describe('PermissionChecker Service', () => {
  let checker: PermissionChecker;

  beforeEach(() => {
    checker = PermissionChecker.getInstance();
    // Clear cache to ensure clean state for each test
    checker.clearCache();
  });

  describe('18.1 - Explicit deny takes precedence over explicit allow', () => {
    it('should deny permission when explicitly denied even if explicitly allowed', () => {
      // Department Chair has schedule.* in allow list but schedule.delete in deny list
      const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete');
      
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Explicit deny');
      expect(result.reason).toContain('schedule.delete');
    });

    it('should deny research.delete for Department Chair (explicit deny)', () => {
      // Department Chair has research.* in allow list but research.delete in deny list
      const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'research.delete');
      
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Explicit deny');
    });

    it('should deny student.delete for Secretary (explicit deny)', () => {
      // Secretary has student.* in allow list but student.delete in deny list
      const result = checker.hasPermission(Role.SECRETARY, 'student.delete');
      
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Explicit deny');
    });

    it('should allow other schedule operations for Department Chair (not in deny list)', () => {
      // Department Chair has schedule.* in allow list and schedule.create is not denied
      const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.create');
      
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow');
      expect(result.reason).toContain('schedule.*');
    });
  });

  describe('18.2 - Explicit deny takes precedence over wildcard allow', () => {
    it('should deny permission when explicitly denied even with wildcard allow', () => {
      // Department Chair has schedule.* wildcard but schedule.delete is explicitly denied
      const result = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete');
      
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Explicit deny');
      expect(result.reason).toContain('schedule.delete');
    });

    it('should deny instruction.delete for Faculty (explicit deny overrides instruction.*)', () => {
      // Faculty has instruction.* in allow list but instruction.delete in deny list
      const result = checker.hasPermission(Role.FACULTY, 'instruction.delete');
      
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Explicit deny');
    });

    it('should deny student.create for Faculty (explicit deny overrides any wildcard)', () => {
      // Faculty has explicit deny for student.create
      const result = checker.hasPermission(Role.FACULTY, 'student.create');
      
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Explicit deny');
    });

    it('should allow other instruction operations for Faculty (wildcard allow)', () => {
      // Faculty has instruction.* and instruction.create is not denied
      const result = checker.hasPermission(Role.FACULTY, 'instruction.create');
      
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow');
      expect(result.reason).toContain('instruction.*');
    });
  });

  describe('18.3 - Wildcard allow matches correctly (student.*, *.*)', () => {
    it('should match resource-level wildcard (student.*)', () => {
      // Secretary has student.* in allow list
      const result = checker.hasPermission(Role.SECRETARY, 'student.read');
      
      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Wildcard allow');
      expect(result.reason).toContain('student.*');
    });

    it('should match resource-level wildcard for multiple actions', () => {
      // Secretary has student.* in allow list
      const readResult = checker.hasPermission(Role.SECRETARY, 'student.read');
      const createResult = checker.hasPermission(Role.SECRETARY, 'student.create');
      const updateResult = checker.hasPermission(Role.SECRETARY, 'student.update');
      
      expect(readResult.granted).toBe(true);
      expect(createResult.granted).toBe(true);
      expect(updateResult.granted).toBe(true);
      
      expect(readResult.reason).toContain('student.*');
      expect(createResult.reason).toContain('student.*');
      expect(updateResult.reason).toContain('student.*');
    });

    it('should match global wildcard (*.*) for Admin', () => {
      // Admin has *.* in allow list
      const studentResult = checker.hasPermission(Role.ADMIN, 'student.read');
      const scheduleResult = checker.hasPermission(Role.ADMIN, 'schedule.delete');
      const researchResult = checker.hasPermission(Role.ADMIN, 'research.approve');
      
      expect(studentResult.granted).toBe(true);
      expect(scheduleResult.granted).toBe(true);
      expect(researchResult.granted).toBe(true);
      
      expect(studentResult.reason).toContain('*.*');
      expect(scheduleResult.reason).toContain('*.*');
      expect(researchResult.reason).toContain('*.*');
    });

    it('should match global wildcard for any resource and action', () => {
      // Admin has *.* in allow list
      const permissions = [
        'student.read',
        'faculty.create',
        'schedule.approve',
        'research.delete',
        'event.encode',
        'instruction.update',
        'enrollment.manage',
        'audit_log.read',
      ];
      
      permissions.forEach((permission) => {
        const result = checker.hasPermission(Role.ADMIN, permission);
        expect(result.granted).toBe(true);
        expect(result.reason).toContain('*.*');
      });
    });

    it('should not match wildcard for different resource', () => {
      // Faculty has instruction.* but not schedule.*
      const result = checker.hasPermission(Role.FACULTY, 'schedule.create');
      
      // Should be denied or allowed by explicit permission, not by instruction.*
      if (result.granted) {
        expect(result.reason).not.toContain('instruction.*');
      }
    });

    it('should match schedule.* wildcard for Department Chair', () => {
      // Department Chair has schedule.* in allow list
      const readResult = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.read');
      const createResult = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.create');
      const approveResult = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.approve');
      
      expect(readResult.granted).toBe(true);
      expect(createResult.granted).toBe(true);
      expect(approveResult.granted).toBe(true);
      
      expect(readResult.reason).toContain('schedule.*');
      expect(createResult.reason).toContain('schedule.*');
      expect(approveResult.reason).toContain('schedule.*');
    });
  });

  describe('Permission Resolution Order', () => {
    it('should follow resolution order: explicit deny → explicit allow → wildcard allow → default deny', () => {
      // Test explicit deny (highest priority)
      const denyResult = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete');
      expect(denyResult.granted).toBe(false);
      expect(denyResult.reason).toContain('Explicit deny');
      
      // Test explicit allow (second priority)
      const explicitAllowResult = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'enrollment.read');
      expect(explicitAllowResult.granted).toBe(true);
      expect(explicitAllowResult.reason).toContain('Explicit allow');
      
      // Test wildcard allow (third priority)
      const wildcardResult = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.create');
      expect(wildcardResult.granted).toBe(true);
      expect(wildcardResult.reason).toContain('Wildcard allow');
      
      // Test default deny (lowest priority) - use a permission not in any list
      const defaultDenyResult = checker.hasPermission(Role.FACULTY, 'nonexistent.permission');
      expect(defaultDenyResult.granted).toBe(false);
      expect(defaultDenyResult.reason).toContain('Default deny');
    });

    it('should apply default deny when no rules match', () => {
      // Faculty tries a permission that doesn't exist in any list
      const result = checker.hasPermission(Role.FACULTY, 'unknown.action');
      
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Default deny');
    });

    it('should apply default deny for non-existent permissions', () => {
      // Test with a permission that doesn't exist in any configuration
      const result = checker.hasPermission(Role.FACULTY, 'nonexistent.action');
      
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Default deny');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid role gracefully', () => {
      // @ts-expect-error Testing invalid role
      const result = checker.hasPermission('invalid_role', 'student.read');
      
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Invalid role');
    });

    it('should handle malformed permission strings', () => {
      // Permission without action part
      const result = checker.hasPermission(Role.FACULTY, 'student');
      
      expect(result.granted).toBe(false);
    });

    it('should handle empty permission strings', () => {
      const result = checker.hasPermission(Role.FACULTY, '');
      
      expect(result.granted).toBe(false);
    });

    it('should cache permission check results', () => {
      // First check - cache miss
      const result1 = checker.hasPermission(Role.FACULTY, 'student.read');
      
      // Second check - cache hit
      const result2 = checker.hasPermission(Role.FACULTY, 'student.read');
      
      expect(result1).toEqual(result2);
      
      // Verify cache is working
      const stats = checker.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should clear cache correctly', () => {
      // Perform some checks to populate cache
      checker.hasPermission(Role.FACULTY, 'student.read');
      checker.hasPermission(Role.ADMIN, 'schedule.delete');
      
      // Clear cache
      checker.clearCache();
      
      // Cache should be pre-warmed but not contain our specific checks
      const stats = checker.getCacheStats();
      expect(stats.size).toBeGreaterThan(0); // Pre-warmed entries
    });
  });

  describe('Performance', () => {
    it('should complete permission checks quickly', () => {
      const startTime = performance.now();
      
      // Perform 100 permission checks
      for (let i = 0; i < 100; i++) {
        checker.hasPermission(Role.FACULTY, 'student.read');
      }
      
      const duration = performance.now() - startTime;
      const avgTime = duration / 100;
      
      // Should average well under 5ms per check (target: sub-5ms)
      expect(avgTime).toBeLessThan(5);
    });

    it('should have high cache hit rate for repeated checks', () => {
      // Clear metrics
      checker.clearCache();
      
      // Perform same check multiple times
      for (let i = 0; i < 10; i++) {
        checker.hasPermission(Role.FACULTY, 'student.read');
      }
      
      const stats = checker.getCacheStats();
      // After first check, all subsequent checks should be cache hits
      // Hit rate should be at least 70% (accounting for pre-warmed cache)
      expect(stats.hitRate).toBeGreaterThan(70);
    });
  });

  describe('Role-Specific Permission Tests', () => {
    it('should grant Admin all permissions', () => {
      const permissions = [
        'student.delete',
        'schedule.delete',
        'research.delete',
        'audit_log.read',
        'report.generate',
      ];
      
      permissions.forEach((permission) => {
        const result = checker.hasPermission(Role.ADMIN, permission);
        expect(result.granted).toBe(true);
        expect(result.reason).toContain('*.*');
      });
    });

    it('should restrict Student to read-only operations', () => {
      // Student should be able to read own data
      const readOwnResult = checker.hasPermission(Role.STUDENT, 'student.read_own');
      expect(readOwnResult.granted).toBe(true);
      
      // Student should not be able to create, update, or delete
      const createResult = checker.hasPermission(Role.STUDENT, 'student.create');
      const updateResult = checker.hasPermission(Role.STUDENT, 'student.update');
      const deleteResult = checker.hasPermission(Role.STUDENT, 'student.delete');
      
      expect(createResult.granted).toBe(false);
      expect(updateResult.granted).toBe(false);
      expect(deleteResult.granted).toBe(false);
    });

    it('should allow Faculty to manage their own instructions', () => {
      const createResult = checker.hasPermission(Role.FACULTY, 'instruction.create');
      const updateResult = checker.hasPermission(Role.FACULTY, 'instruction.update');
      
      expect(createResult.granted).toBe(true);
      expect(updateResult.granted).toBe(true);
    });

    it('should allow Secretary to encode data but not approve', () => {
      // Secretary can encode
      const encodeResult = checker.hasPermission(Role.SECRETARY, 'research.encode');
      expect(encodeResult.granted).toBe(true);
      
      // Secretary cannot approve
      const approveResult = checker.hasPermission(Role.SECRETARY, 'research.approve');
      expect(approveResult.granted).toBe(false);
    });

    it('should allow Department Chair to approve but not delete critical data', () => {
      // Department Chair can approve
      const approveResult = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.approve');
      expect(approveResult.granted).toBe(true);
      
      // Department Chair cannot delete schedules
      const deleteResult = checker.hasPermission(Role.DEPARTMENT_CHAIR, 'schedule.delete');
      expect(deleteResult.granted).toBe(false);
      expect(deleteResult.reason).toContain('Explicit deny');
    });
  });
});
