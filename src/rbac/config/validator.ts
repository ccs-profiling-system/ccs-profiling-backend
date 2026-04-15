/**
 * Permission Configuration Validator
 * 
 * Validates the permission configuration on system startup to ensure:
 * - All permissions follow the resource.action format
 * - All roles are properly configured
 * - No invalid permission patterns exist
 * - Configuration is consistent and complete
 */

import { Role, PermissionConfig } from '../types';
import { permissionConfig } from './permissions.config';

/**
 * Permission format regex pattern
 * Matches: resource.action, resource.*, or *.*
 * Examples: student.read, schedule.*, *.*
 */
const PERMISSION_PATTERN = /^([a-z_]+|\*)\.(([a-z_]+)|\*)$/;

/**
 * ValidationError - Custom error for permission configuration validation failures
 */
export class PermissionConfigValidationError extends Error {
  constructor(message: string) {
    super(`Permission Configuration Validation Error: ${message}`);
    this.name = 'PermissionConfigValidationError';
  }
}

/**
 * Validate a single permission string format
 * 
 * @param permission - The permission string to validate
 * @returns true if valid, false otherwise
 * 
 * Valid formats:
 * - resource.action (e.g., student.read)
 * - resource.* (e.g., student.*)
 * - *.* (global wildcard)
 */
function isValidPermissionFormat(permission: string): boolean {
  return PERMISSION_PATTERN.test(permission);
}

/**
 * Validate permissions array
 * 
 * @param permissions - Array of permission strings
 * @param role - The role these permissions belong to
 * @param listType - Whether this is an 'allow' or 'deny' list
 * @throws PermissionConfigValidationError if any permission is invalid
 */
function validatePermissionArray(
  permissions: string[],
  role: Role,
  listType: 'allow' | 'deny'
): void {
  for (const permission of permissions) {
    if (!isValidPermissionFormat(permission)) {
      throw new PermissionConfigValidationError(
        `Invalid permission format in ${role} ${listType} list: "${permission}". ` +
        `Expected format: resource.action, resource.*, or *.*`
      );
    }
  }
}

/**
 * Validate that all required roles are configured
 * 
 * @param config - The permission configuration to validate
 * @throws PermissionConfigValidationError if any role is missing
 */
function validateAllRolesConfigured(config: PermissionConfig): void {
  const requiredRoles = [
    Role.ADMIN,
    Role.DEPARTMENT_CHAIR,
    Role.FACULTY,
    Role.SECRETARY,
    Role.STUDENT,
  ];

  for (const role of requiredRoles) {
    if (!config[role]) {
      throw new PermissionConfigValidationError(
        `Missing configuration for required role: ${role}`
      );
    }

    if (!config[role].allow || !Array.isArray(config[role].allow)) {
      throw new PermissionConfigValidationError(
        `Role ${role} is missing 'allow' array`
      );
    }

    if (!config[role].deny || !Array.isArray(config[role].deny)) {
      throw new PermissionConfigValidationError(
        `Role ${role} is missing 'deny' array`
      );
    }
  }
}

/**
 * Validate Admin role has full access
 * 
 * @param config - The permission configuration to validate
 * @throws PermissionConfigValidationError if Admin doesn't have *.* permission
 */
function validateAdminFullAccess(config: PermissionConfig): void {
  const adminPerms = config[Role.ADMIN];
  
  if (!adminPerms.allow.includes('*.*')) {
    throw new PermissionConfigValidationError(
      `Admin role must have '*.*' permission in allow list for full system access`
    );
  }

  if (adminPerms.deny.length > 0) {
    throw new PermissionConfigValidationError(
      `Admin role should not have any permissions in deny list`
    );
  }
}

/**
 * Validate role permissions structure
 * 
 * @param config - The permission configuration to validate
 * @throws PermissionConfigValidationError if any role has invalid permissions
 */
function validateRolePermissions(config: PermissionConfig): void {
  for (const role of Object.keys(config) as Role[]) {
    const rolePerms = config[role];

    // Validate allow list
    validatePermissionArray(rolePerms.allow, role, 'allow');

    // Validate deny list
    validatePermissionArray(rolePerms.deny, role, 'deny');

    // Check for duplicate permissions within allow list
    const allowSet = new Set(rolePerms.allow);
    if (allowSet.size !== rolePerms.allow.length) {
      throw new PermissionConfigValidationError(
        `Role ${role} has duplicate permissions in allow list`
      );
    }

    // Check for duplicate permissions within deny list
    const denySet = new Set(rolePerms.deny);
    if (denySet.size !== rolePerms.deny.length) {
      throw new PermissionConfigValidationError(
        `Role ${role} has duplicate permissions in deny list`
      );
    }
  }
}

/**
 * Validate the entire permission configuration
 * 
 * This function performs comprehensive validation of the permission configuration:
 * 1. Checks all required roles are configured
 * 2. Validates Admin has full access
 * 3. Validates all permission formats
 * 4. Checks for duplicates
 * 
 * @param config - The permission configuration to validate (defaults to permissionConfig)
 * @throws PermissionConfigValidationError if validation fails
 * 
 * @example
 * ```typescript
 * try {
 *   validatePermissionConfig();
 *   console.log('Permission configuration is valid');
 * } catch (error) {
 *   console.error('Invalid permission configuration:', error.message);
 *   process.exit(1);
 * }
 * ```
 */
export function validatePermissionConfig(
  config: PermissionConfig = permissionConfig
): void {
  try {
    // Validate all required roles are configured
    validateAllRolesConfigured(config);

    // Validate Admin has full access
    validateAdminFullAccess(config);

    // Validate all role permissions
    validateRolePermissions(config);

    console.log('✓ Permission configuration validation passed');
  } catch (error) {
    if (error instanceof PermissionConfigValidationError) {
      console.error('✗ Permission configuration validation failed:', error.message);
      throw error;
    }
    throw error;
  }
}

/**
 * Get validation summary for logging
 * 
 * @param config - The permission configuration to summarize
 * @returns Summary object with role counts and permission counts
 */
export function getValidationSummary(
  config: PermissionConfig = permissionConfig
): {
  totalRoles: number;
  rolesConfigured: string[];
  permissionCounts: Record<string, { allow: number; deny: number }>;
} {
  const rolesConfigured = Object.keys(config);
  const permissionCounts: Record<string, { allow: number; deny: number }> = {};

  for (const role of rolesConfigured) {
    const roleConfig = config[role as Role];
    permissionCounts[role] = {
      allow: roleConfig.allow.length,
      deny: roleConfig.deny.length,
    };
  }

  return {
    totalRoles: rolesConfigured.length,
    rolesConfigured,
    permissionCounts,
  };
}
