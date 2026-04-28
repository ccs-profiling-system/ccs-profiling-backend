/**
 * RBAC Middleware Re-export
 * 
 * This file re-exports the requirePermission middleware from the rbac module
 * to maintain backward compatibility with imports from shared/middleware
 */

export { requirePermission } from '../../rbac/middleware/requirePermission.middleware';
