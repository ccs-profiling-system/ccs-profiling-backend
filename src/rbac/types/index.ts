/**
 * RBAC System Types and Interfaces
 * 
 * This module defines all TypeScript types and interfaces for the Role-Based Access Control system.
 * The RBAC system enforces fine-grained authorization controls across all API endpoints.
 * 
 * Permission Format: resource.action (e.g., student.read, schedule.approve)
 * Wildcard Support: resource.* (all actions on resource), *.* (all permissions)
 * Resolution Order: explicit deny → explicit allow → wildcard allow → default deny
 */

/**
 * Role - Enumeration of all supported user roles in the system
 * 
 * Five distinct roles with explicit permissions:
 * - admin: Dean role with access to all permissions
 * - department_chair: Manages department-level academic and operational data
 * - faculty: Handles teaching, instructional content, and participation
 * - secretary: Assists in encoding, documentation, and administrative tasks
 * - student: Limited access for viewing and participation tracking
 */
export enum Role {
  ADMIN = 'admin',
  DEPARTMENT_CHAIR = 'department_chair',
  FACULTY = 'faculty',
  SECRETARY = 'secretary',
  STUDENT = 'student',
}

/**
 * Permission - Type representing a permission in resource.action format
 * 
 * Examples:
 * - Specific permission: "student.read", "schedule.approve"
 * - Resource wildcard: "student.*" (all student operations)
 * - Global wildcard: "*.*" (all operations across all resources)
 * 
 * Format: resource.action | resource.* | *.*
 */
export type Permission = string;

/**
 * RolePermissions - Interface defining allow and deny lists for a role
 * 
 * Structure:
 * - allow: Array of permissions explicitly granted to the role
 * - deny: Array of permissions explicitly denied to the role
 * 
 * Resolution Order (highest priority first):
 * 1. Explicit deny (specific permission in deny list)
 * 2. Explicit allow (specific permission in allow list)
 * 3. Wildcard allow (wildcard pattern in allow list)
 * 4. Default deny (if no match found, deny access)
 * 
 * Example:
 * ```typescript
 * {
 *   allow: ["student.*", "schedule.read"],
 *   deny: ["student.delete"]
 * }
 * ```
 * Result: All student operations except delete, plus schedule read access
 */
export interface RolePermissions {
  /**
   * Array of permissions explicitly granted to the role
   * Supports specific permissions (e.g., "student.read") and wildcards (e.g., "student.*", "*.*")
   */
  allow: Permission[];

  /**
   * Array of permissions explicitly denied to the role
   * Takes precedence over all allow rules (explicit and wildcard)
   * Supports specific permissions and wildcards
   */
  deny: Permission[];
}

/**
 * PermissionConfig - Interface mapping roles to their permission definitions
 * 
 * Centralized configuration defining what each role can and cannot do.
 * Each role has explicit allow and deny lists without automatic inheritance.
 * 
 * Example:
 * ```typescript
 * {
 *   admin: { allow: ["*.*"], deny: [] },
 *   department_chair: { allow: ["schedule.*", "research.*"], deny: ["schedule.delete"] },
 *   faculty: { allow: ["instruction.*", "research.create"], deny: [] },
 *   secretary: { allow: ["student.create", "student.update"], deny: [] },
 *   student: { allow: ["student.read_own", "schedule.read"], deny: [] }
 * }
 * ```
 */
export interface PermissionConfig {
  [Role.ADMIN]: RolePermissions;
  [Role.DEPARTMENT_CHAIR]: RolePermissions;
  [Role.FACULTY]: RolePermissions;
  [Role.SECRETARY]: RolePermissions;
  [Role.STUDENT]: RolePermissions;
}

/**
 * PermissionCheckResult - Interface for permission resolution results
 * 
 * Returned by permission checking functions to indicate whether access is granted
 * and provide detailed reasoning for audit logging and debugging.
 * 
 * Example (granted):
 * ```typescript
 * {
 *   granted: true,
 *   reason: "Explicit allow: student.read"
 * }
 * ```
 * 
 * Example (denied):
 * ```typescript
 * {
 *   granted: false,
 *   reason: "Explicit deny: student.delete"
 * }
 * ```
 */
export interface PermissionCheckResult {
  /**
   * Whether the permission check was granted
   * true = access allowed, false = access denied
   */
  granted: boolean;

  /**
   * Human-readable explanation of the permission decision
   * 
   * Possible reasons:
   * - "Explicit deny: <permission>" - Permission explicitly denied
   * - "Explicit allow: <permission>" - Permission explicitly allowed
   * - "Wildcard allow: <pattern>" - Permission granted via wildcard
   * - "Default deny" - No matching rule found, access denied by default
   */
  reason: string;
}

/**
 * AuditLogEntry - Interface for authorization audit logging
 * 
 * Records authorization decisions for compliance and security monitoring.
 * Logs are selective: denials and sensitive operations only (not all read operations).
 * 
 * Sensitive operations: create, update, delete, approve, reject, manage
 * Non-sensitive operations: read, list, search (unless denied)
 * 
 * Example:
 * ```typescript
 * {
 *   user_id: "123e4567-e89b-12d3-a456-426614174000",
 *   role: "faculty",
 *   resource: "student",
 *   action: "delete",
 *   permission_granted: false,
 *   denial_reason: "Explicit deny: student.delete",
 *   timestamp: "2024-01-15T10:30:00Z"
 * }
 * ```
 */
export interface AuditLogEntry {
  /**
   * UUID of the user who attempted the operation
   */
  user_id: string;

  /**
   * Role of the user at the time of the operation
   */
  role: Role;

  /**
   * Resource being accessed (e.g., "student", "schedule", "research")
   */
  resource: string;

  /**
   * Action being performed (e.g., "read", "create", "update", "delete", "approve")
   */
  action: string;

  /**
   * Whether the permission was granted
   * true = access allowed, false = access denied
   */
  permission_granted: boolean;

  /**
   * Explanation for denial (only present when permission_granted is false)
   * 
   * Examples:
   * - "Explicit deny: student.delete"
   * - "Default deny: no matching permission"
   * - "Role does not have permission: schedule.approve"
   */
  denial_reason?: string;

  /**
   * ISO 8601 timestamp of when the authorization check occurred
   */
  timestamp: string;
}
