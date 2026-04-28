/**
 * RBAC Middleware Exports
 * 
 * This module exports all RBAC middleware functions for use in route protection.
 */

export { requirePermission } from './requirePermission.middleware';
export { checkOwnership, addResourceConfig, getResourceConfig, CheckOwnershipOptions } from './checkOwnership.middleware';
