/**
 * RBAC Permission Configuration
 * 
 * This file defines the comprehensive permission matrix for all five user roles.
 * Permissions are explicitly assigned without automatic inheritance between roles.
 * 
 * Permission Format: resource.action (e.g., student.read, schedule.approve)
 * Wildcard Support: resource.* (all actions on resource), *.* (all permissions)
 * 
 * Resolution Order (highest priority first):
 * 1. Explicit deny (specific permission in deny list)
 * 2. Explicit allow (specific permission in allow list)
 * 3. Wildcard allow (wildcard pattern in allow list)
 * 4. Default deny (if no match found, deny access)
 * 
 * Modules Covered:
 * - students, faculty, scheduling, research, events, instructions, enrollments
 * - academic_history, affiliations, skills, violations, uploads
 * - reports, analytics, dashboard, search, audit_logs
 */

import { Role, PermissionConfig } from '../types';

/**
 * Permission Configuration for All Roles
 * 
 * Each role has explicit allow and deny lists defining their access rights.
 * Explicit deny ALWAYS takes precedence over any allow rule.
 */
export const permissionConfig: PermissionConfig = {
  /**
   * ADMIN ROLE (Dean)
   * 
   * Full system access with no restrictions.
   * Can perform all operations across all modules.
   */
  [Role.ADMIN]: {
    allow: ['*.*'],
    deny: [],
  },

  /**
   * DEPARTMENT_CHAIR ROLE
   * 
   * Department-level management with broad access to academic and operational data.
   * Can review, approve, and manage most resources but cannot delete critical data.
   * 
   * Key Capabilities:
   * - Full schedule management (except delete)
   * - Research review and approval (except delete)
   * - Event approval and management (except delete)
   * - Enrollment management and approval
   * - Read access to student profiles, instructions, academic history
   * - Department-level reports and analytics
   * - Audit log access for department
   */
  [Role.DEPARTMENT_CHAIR]: {
    allow: [
      // Schedule Management
      'schedule.*',
      
      // Research Management
      'research.*',
      
      // Event Management
      'event.*',
      
      // Enrollment Management
      'enrollment.read',
      'enrollment.approve',
      'enrollment.manage',
      
      // Student Profile Access
      'student.read',
      'student.monitor',
      
      // Instruction Access
      'instruction.read',
      
      // Academic History Access
      'academic_history.read',
      
      // Skills Access
      'skill.read',
      
      // Violations Management
      'violation.read',
      'violation.review',
      'violation.manage',
      
      // Affiliations Management
      'affiliation.read',
      'affiliation.manage',
      
      // Upload Management
      'upload.manage',
      
      // Reports and Analytics
      'report.read',
      'report.generate',
      'analytics.read',
      
      // Dashboard Access
      'dashboard.read',
      
      // Search Capabilities
      'search.department',
      'search.student',
      'search.course',
      
      // Audit Log Access
      'audit_log.read',
    ],
    deny: [
      // Prevent deletion of critical data
      'schedule.delete',
      'research.delete',
      'event.delete',
      'student.delete',
      'enrollment.delete',
    ],
  },

  /**
   * FACULTY ROLE
   * 
   * Teaching and research operations with ownership constraints.
   * Can manage their own instructions, research, and course-related data.
   * 
   * Key Capabilities:
   * - Full instruction management (own instructions only)
   * - Research creation and submission
   * - Event proposal and attendance recording
   * - Student profile read access
   * - Enrollment read access for their courses
   * - Academic history read for advisees
   * - Course-related uploads
   * - Faculty-specific reports and dashboard
   */
  [Role.FACULTY]: {
    allow: [
      // Instruction Management (ownership validated separately)
      'instruction.*',
      
      // Research Operations
      'research.create',
      'research.submit',
      'research.read',
      
      // Event Operations
      'event.propose',
      'event.read',
      'event.record_attendance',
      
      // Student Profile Access
      'student.read',
      'student.interact',
      
      // Schedule Access
      'schedule.read',
      
      // Enrollment Access
      'enrollment.read',
      
      // Academic History Access
      'academic_history.read',
      
      // Skills Access
      'skill.read',
      
      // Violations Access
      'violation.read',
      
      // Affiliations Access
      'affiliation.read',
      
      // Upload Operations
      'upload.create',
      
      // Reports Access
      'report.read',
      
      // Dashboard Access
      'dashboard.read',
      
      // Search Capabilities
      'search.student',
      'search.course',
    ],
    deny: [
      // Prevent deletion of instructions (soft delete only)
      'instruction.delete',
      
      // Prevent student data modification
      'student.create',
      'student.update',
      'student.delete',
    ],
  },

  /**
   * SECRETARY ROLE
   * 
   * Encoding and administrative operations without approval rights.
   * Can create and update data but cannot approve or delete.
   * 
   * Key Capabilities:
   * - Student profile creation and updates
   * - Schedule creation and updates (draft only)
   * - Research encoding and document uploads
   * - Event encoding and attendance recording
   * - Enrollment creation and updates
   * - Academic history management
   * - Skills management
   * - Violations recording
   * - Affiliations management
   * - Upload management
   * - Operational dashboard and search
   */
  [Role.SECRETARY]: {
    allow: [
      // Student Management
      'student.*',
      
      // Schedule Management
      'schedule.create',
      'schedule.update',
      'schedule.read',
      
      // Research Encoding
      'research.encode',
      'research.upload_docs',
      'research.read',
      
      // Event Encoding
      'event.encode',
      'event.record_attendance',
      'event.read',
      
      // Enrollment Management
      'enrollment.*',
      
      // Academic History Management
      'academic_history.create',
      'academic_history.update',
      'academic_history.read',
      
      // Skills Management
      'skill.create',
      'skill.update',
      'skill.read',
      
      // Violations Management
      'violation.create',
      'violation.update',
      'violation.read',
      
      // Affiliations Management
      'affiliation.create',
      'affiliation.update',
      'affiliation.read',
      
      // Instruction Encoding Support
      'instruction.encode',
      'instruction.read',
      
      // Upload Management
      'upload.create',
      'upload.manage',
      
      // Dashboard Access
      'dashboard.read',
      
      // Search Capabilities
      'search.operational',
      'search.student',
    ],
    deny: [
      // Prevent approval operations
      'schedule.approve',
      'schedule.reject',
      'research.approve',
      'research.reject',
      'event.approve',
      'event.reject',
      'enrollment.approve',
      
      // Prevent deletion of critical data
      'student.delete',
      'schedule.delete',
      'enrollment.delete',
    ],
  },

  /**
   * STUDENT ROLE
   * 
   * Read-only access to own data and public information.
   * Cannot create, update, or delete any data except own profile updates.
   * 
   * Key Capabilities:
   * - Read own student profile
   * - Read own enrollments
   * - Read own academic history
   * - Read own skills
   * - Read published schedules
   * - Read approved events
   * - Read approved research
   * - Read instructions for enrolled courses
   * - Read public affiliations
   * - Upload assignment submissions
   * - Student-specific dashboard
   * - Limited public search
   */
  [Role.STUDENT]: {
    allow: [
      // Own Profile Access
      'student.read_own',
      
      // Schedule Access
      'schedule.read',
      
      // Research Access
      'research.read',
      
      // Event Access
      'event.read',
      
      // Instruction Access
      'instruction.read',
      
      // Enrollment Access
      'enrollment.read_own',
      
      // Academic History Access
      'academic_history.read_own',
      
      // Skills Access
      'skill.read_own',
      
      // Affiliations Access
      'affiliation.read',
      
      // Upload Operations
      'upload.create',
      
      // Dashboard Access
      'dashboard.read',
      
      // Search Capabilities
      'search.public',
    ],
    deny: [
      // Prevent all write operations on other users' data
      'student.create',
      'student.update',
      'student.delete',
      'student.read', // Can only read own profile
      
      // Prevent all administrative operations
      'schedule.create',
      'schedule.update',
      'schedule.delete',
      'schedule.approve',
      
      'research.create',
      'research.submit',
      'research.encode',
      'research.approve',
      
      'event.propose',
      'event.encode',
      'event.approve',
      
      'enrollment.create',
      'enrollment.update',
      'enrollment.approve',
      
      'academic_history.create',
      'academic_history.update',
      
      'skill.create',
      'skill.update',
      
      'violation.read',
      'violation.create',
      
      'affiliation.create',
      'affiliation.update',
      
      'instruction.create',
      'instruction.update',
      'instruction.delete',
      
      // Prevent access to reports and analytics
      'report.read',
      'report.generate',
      'analytics.read',
      
      // Prevent audit log access
      'audit_log.read',
    ],
  },
};

/**
 * Get permissions for a specific role
 * 
 * @param role - The role to get permissions for
 * @returns RolePermissions object with allow and deny lists
 * 
 * @example
 * ```typescript
 * const adminPerms = getPermissionsForRole(Role.ADMIN);
 * console.log(adminPerms.allow); // ['*.*']
 * console.log(adminPerms.deny);  // []
 * ```
 */
export function getPermissionsForRole(role: Role) {
  return permissionConfig[role];
}

/**
 * Get all configured roles
 * 
 * @returns Array of all roles defined in the permission configuration
 */
export function getAllRoles(): Role[] {
  return Object.keys(permissionConfig) as Role[];
}

/**
 * Check if a role exists in the configuration
 * 
 * @param role - The role to check
 * @returns true if the role is configured, false otherwise
 */
export function isValidRole(role: string): role is Role {
  return role in permissionConfig;
}
