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
   * 
   * Approval System Permissions:
   * - approval.review: Review all approval requests
   * - approval.approve: Approve any request
   * - approval.reject: Reject any request
   * - approval.bulk: Perform bulk operations
   * - approval.stats: View system-wide statistics
   * - approval.retry: Retry failed operations
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
   * - Department Chair Portal API access (chair.* namespace)
   * 
   * Department Chair Portal Permissions (chair.* namespace):
   * - chair.dashboard.read: Access to department dashboard statistics
   * - chair.student.read: View student records within department
   * - chair.student.approve: Approve pending student records
   * - chair.student.reject: Reject pending student records
   * - chair.faculty.read: View faculty records within department
   * - chair.faculty.monitor: View faculty teaching loads and statistics
   * - chair.schedule.read: View course schedules within department
   * - chair.schedule.create: Create new course schedules
   * - chair.schedule.approve: Approve pending schedules
   * - chair.event.read: View events within department
   * - chair.event.create: Create new events
   * - chair.event.update: Update draft or pending events
   * - chair.event.delete: Delete draft events or cancel approved events
   * - chair.event.approve: Approve pending events
   * - chair.event.reject: Reject pending events
   * - chair.research.read: View research projects within department
   * - chair.research.approve: Approve pending research projects
   * - chair.research.reject: Reject pending research projects
   * - chair.report.generate: Generate analytics reports for department
   * - chair.report.export: Export reports in PDF or Excel format
   */
  [Role.DEPARTMENT_CHAIR]: {
    allow: [
      // Department Chair Portal API (all chair.* permissions)
      'chair.*',
      
      // Approval System Permissions
      'approval.review',
      'approval.approve',
      'approval.reject',
      'approval.bulk',
      'approval.stats',
      
      // Curriculum Management
      'curriculum.*',
      
      // Subjects Management
      'subjects.*',
      
      // Syllabus Management
      'syllabus.*',
      
      // Lessons Management
      'lessons.*',
      
      // Rooms Management
      'rooms.*',
      
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
      
      // Faculty Profile Access
      'faculty.read',
      
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
   * - Faculty Portal API access (faculty.* namespace)
   * 
   * Faculty Portal Permissions (faculty.* namespace):
   * - faculty.profile.read: View own faculty profile
   * - faculty.profile.update: Update own faculty profile
   * - faculty.course.read: View assigned courses and teaching load
   * - faculty.roster.read: View student rosters for assigned courses
   * - faculty.attendance.read: View attendance records for assigned courses
   * - faculty.attendance.submit: Submit attendance records for assigned courses
   * - faculty.participation.read: View student participation records for assigned courses
   * - faculty.participation.submit: Submit student participation scores for assigned courses
   * - faculty.research.read: View own research projects
   * - faculty.research.create: Create new research projects
   * - faculty.research.update: Update own research projects
   * - faculty.event.read: View department events and own participation
   * - faculty.event.register: Register for department events
   * - faculty.material.upload: Upload course materials for assigned courses
   * - faculty.material.read: View course materials for assigned courses
   * - faculty.material.delete: Delete own course materials
   */
  [Role.FACULTY]: {
    allow: [
      // Faculty Portal API (all faculty.* permissions)
      'faculty.*',
      
      // Curriculum Access
      'curriculum.read',
      
      // Subjects Access
      'subjects.read',
      
      // Syllabus Access
      'syllabus.read',
      
      // Lessons Access
      'lessons.read',
      'lessons.create',
      'lessons.update',
      
      // Rooms Access
      'rooms.read',
      
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
   * - Secretary Portal API access (secretary.* namespace)
   * 
   * Secretary Portal Permissions (secretary.* namespace):
   * 
   * Dashboard:
   * - secretary.dashboard.read: Access to secretary dashboard statistics and recent activities
   * 
   * Student Management:
   * - secretary.student.read: View student records with pagination, filtering, and search
   * - secretary.student.create: Create new student records
   * - secretary.student.update: Update existing student records (creates pending change)
   * - secretary.student.delete: Soft delete student records
   * 
   * Faculty Management:
   * - secretary.faculty.read: View faculty records with pagination, filtering, and search
   * - secretary.faculty.create: Create new faculty records
   * - secretary.faculty.update: Update existing faculty records (creates pending change)
   * - secretary.faculty.delete: Soft delete faculty records
   * 
   * Schedule Management:
   * - secretary.schedule.read: View class schedules with pagination and filtering
   * - secretary.schedule.create: Create new class schedules
   * - secretary.schedule.update: Update existing class schedules
   * - secretary.schedule.delete: Soft delete class schedules
   * 
   * Document Management:
   * - secretary.document.upload: Upload documents with file validation (max 10MB)
   * - secretary.document.read: View and download documents with pagination and filtering
   * - secretary.document.delete: Delete documents and associated files
   * 
   * Event Management (with Approval Workflow):
   * - secretary.event.read: View events with pagination, filtering, and search
   * - secretary.event.create: Create new events (initial status: draft)
   * - secretary.event.update: Update events (draft status only, creates pending approval)
   * - secretary.event.delete: Soft delete events (draft status only)
   * 
   * Research Management (with Approval Workflow):
   * - secretary.research.read: View research projects with pagination, filtering, and search
   * - secretary.research.create: Create new research projects (initial status: draft)
   * - secretary.research.update: Update research projects (draft status only, creates pending approval)
   * - secretary.research.delete: Soft delete research projects (draft status only)
   * 
   * Pending Changes Management:
   * - secretary.pending.read: View pending changes with pagination and filtering
   * - secretary.pending.withdraw: Withdraw pending changes (pending_approval status only)
   * 
   * Report Generation:
   * - secretary.report.generate: Generate reports in PDF, Excel, or CSV formats
   * 
   * Filter Options:
   * - secretary.filter.read: Access dynamic filter options for dropdown menus
   */
  [Role.SECRETARY]: {
    allow: [
      // Secretary Portal API (all secretary.* permissions)
      'secretary.*',
      
      // Approval System Permissions
      'approval.submit',
      'approval.read',
      'approval.withdraw',
      
      // Curriculum Management
      'curriculum.read',
      'curriculum.create',
      'curriculum.update',
      
      // Subjects Management
      'subjects.read',
      'subjects.create',
      'subjects.update',
      
      // Syllabus Management
      'syllabus.read',
      'syllabus.create',
      'syllabus.update',
      
      // Lessons Management
      'lessons.read',
      'lessons.create',
      'lessons.update',
      
      // Rooms Management
      'rooms.read',
      'rooms.create',
      'rooms.update',
      
      // Student Management (legacy)
      'student.*',
      
      // Faculty Management
      'faculty.read',
      
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
      
      // Prevent deletion of critical data (legacy - secretary.* allows these)
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
   * - Student Portal API access (student.* namespace)
   * 
   * Student Portal Permissions (student.* namespace):
   * - student.profile.read: View own student profile
   * - student.profile.update: Update own profile (email, phone)
   * - student.dashboard.read: View dashboard summary
   * - student.progress.read: View academic progress
   * - student.financial.read: View financial records
   * - student.notification.read: View notifications
   * - student.notification.update: Mark notifications as read
   * - student.course.read: View enrolled courses and schedule
   * - student.grade.read: View grades and GPA
   * - student.research.read: View research opportunities
   * - student.research.apply: Apply to research opportunities
   * - student.event.read: View events
   * - student.event.register: Register/unregister for events
   * - student.advisor.read: View advisor information
   * - student.advisor.message: Send messages to advisor
   * - student.advisor.appointment: Book appointments with advisor
   */
  [Role.STUDENT]: {
    allow: [
      // Student Portal API (all student.* permissions)
      'student.*',
      
      // Own Profile Access (legacy)
      'student.read_own',
      
      // Curriculum Access
      'curriculum.read',
      
      // Subjects Access
      'subjects.read',
      
      // Syllabus Access
      'syllabus.read',
      
      // Lessons Access
      'lessons.read',
      
      // Rooms Access
      'rooms.read',
      
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
