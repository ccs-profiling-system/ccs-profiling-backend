/**
 * RBAC System Exports
 * 
 * This module provides a comprehensive Role-Based Access Control system
 * with fine-grained authorization controls across all API endpoints.
 * 
 * Key Features:
 * - Five distinct user roles with explicit permissions
 * - Wildcard support with explicit deny capability
 * - Clear resolution order: explicit deny → explicit allow → wildcard allow → default deny
 * - Modular middleware for permission checks, ownership validation, and workflow validation
 * - Selective audit logging for denials and sensitive operations
 * - Sub-5ms permission checks with in-memory caching
 * 
 * @module RBAC
 */

// Types
export { Role, Permission, RolePermissions, PermissionConfig, PermissionCheckResult, AuditLogEntry } from './types';

// Configuration
export { permissionConfig, getPermissionsForRole, getAllRoles, isValidRole } from './config/permissions.config';

// Services
export { PermissionChecker, permissionChecker } from './services/permissionChecker.service';

// Middleware
export { requirePermission, checkOwnership, addResourceConfig, getResourceConfig } from './middleware';

// Utilities
export {
  composeMiddleware,
  composeMiddlewareWithValidation,
  validateMiddlewareComposition,
  createPermissionConstants,
  MiddlewarePresets,
  MiddlewareCompositionBuilder,
  isAuthenticated,
  type Middleware,
  type MiddlewareComposition,
  type PermissionConstants,
  type AuthenticatedRequest,
} from './utils/middleware-composer';
