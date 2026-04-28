/**
 * requirePermission Middleware
 * 
 * Enforces permission checks on API endpoints using the RBAC system.
 * This middleware validates that the authenticated user has the required permission(s)
 * to perform the requested action.
 * 
 * Key Features:
 * - Single responsibility: permission checking only (no ownership or workflow validation)
 * - Supports single permission or multiple permissions with OR logic
 * - Returns HTTP 401 if not authenticated, HTTP 403 if permission denied
 * - Selective audit logging: logs denials and sensitive operations only
 * - Performance target: sub-2ms overhead
 * 
 * Usage Examples:
 * ```typescript
 * // Single permission check
 * router.get('/students', requirePermission('student.read'), getStudents);
 * 
 * // Multiple permissions (OR logic - user needs at least one)
 * router.post('/research', requirePermission(['research.create', 'research.submit']), createResearch);
 * 
 * // Composed with other middleware
 * router.put('/instructions/:id', 
 *   requirePermission('instruction.update'),
 *   checkOwnership('instruction'),
 *   updateInstruction
 * );
 * ```
 * 
 * @module requirePermission
 */

import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors';
import { PermissionChecker } from '../services/permissionChecker.service';
import { Permission, Role } from '../types';

// Lazy import to avoid circular dependency issues
let auditLogRepository: any;
async function getAuditLogRepository() {
  if (!auditLogRepository) {
    const module = await import('../../modules/audit-logs');
    auditLogRepository = module.auditLogRepository;
  }
  return auditLogRepository;
}

/**
 * Sensitive operations that should be logged when permitted
 * These operations modify data or perform critical actions
 */
const SENSITIVE_OPERATIONS = [
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'manage',
];

/**
 * Check if an action is considered sensitive for audit logging
 * 
 * @param permission - The permission being checked (format: resource.action)
 * @returns true if the action is sensitive, false otherwise
 */
function isSensitiveOperation(permission: Permission): boolean {
  const [, action] = permission.split('.');
  return action ? SENSITIVE_OPERATIONS.includes(action) : false;
}

/**
 * Log authorization decision for audit purposes
 * 
 * Selective logging strategy:
 * - Always log denials (WARNING level + database)
 * - Log sensitive operations when permitted (INFO level)
 * - Don't log successful non-sensitive operations (e.g., read, list, search)
 * 
 * @param req - Express request object with user info
 * @param permission - The permission that was checked
 * @param granted - Whether the permission was granted
 * @param reason - Reason for the decision (from PermissionChecker)
 */
async function logAuthorizationDecision(
  req: Request,
  permission: Permission,
  granted: boolean,
  reason: string
): Promise<void> {
  const user = req.user!;
  const [resource, action] = permission.split('.');
  
  // Always log denials
  if (!granted) {
    console.warn(
      `[RBAC] Permission denied: user=${user.userId} role=${user.role} ` +
      `resource=${resource} action=${action} reason="${reason}"`
    );
    
    // Log to database asynchronously (non-blocking)
    try {
      const ip_address =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        undefined;

      const user_agent = req.headers['user-agent'] || undefined;

      const repository = await getAuditLogRepository();
      await repository.create({
        user_id: user.userId === '00000000-0000-0000-0000-000000000000' ? undefined : user.userId,
        action_type: 'authz_failure',
        entity_type: 'authorization',
        ip_address,
        user_agent,
        after_state: {
          permission,
          resource,
          action,
          reason,
          path: req.path,
          method: req.method,
        },
      });
    } catch (error) {
      // Log to console but don't throw - audit logging should not block authorization
      console.error('Failed to log authorization failure:', error);
    }
    
    return;
  }
  
  // Log sensitive operations when permitted
  if (isSensitiveOperation(permission)) {
    console.info(
      `[RBAC] Sensitive operation permitted: user=${user.userId} role=${user.role} ` +
      `resource=${resource} action=${action}`
    );
  }
  
  // Don't log successful non-sensitive operations (read, list, search)
  // This prevents log explosion while maintaining security audit trail
}

/**
 * requirePermission Middleware Factory
 * 
 * Creates an Express middleware function that enforces permission checks.
 * 
 * Execution Flow:
 * 1. Check if user is authenticated (req.user exists)
 * 2. If not authenticated, return HTTP 401 Unauthorized
 * 3. Check if user has required permission(s)
 * 4. If multiple permissions provided, use OR logic (user needs at least one)
 * 5. If permission denied, log denial and return HTTP 403 Forbidden
 * 6. If permission granted and sensitive operation, log grant
 * 7. Call next() to proceed to next middleware
 * 
 * @param permissions - Single permission string or array of permissions (OR logic)
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * // Single permission
 * app.get('/api/students', requirePermission('student.read'), handler);
 * 
 * // Multiple permissions (OR logic)
 * app.post('/api/research', requirePermission(['research.create', 'research.submit']), handler);
 * ```
 */
export function requirePermission(permissions: Permission | Permission[]) {
  // Normalize to array for consistent handling
  const permissionList = Array.isArray(permissions) ? permissions : [permissions];
  
  // Validate that at least one permission is provided
  if (permissionList.length === 0) {
    throw new Error('requirePermission: At least one permission must be specified');
  }
  
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const startTime = performance.now();
    
    try {
      // Step 1: Check authentication
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      const { role, userId } = req.user;
      const permissionChecker = PermissionChecker.getInstance();
      
      // Step 2: Check permissions (OR logic - user needs at least one)
      let granted = false;
      let grantedPermission: Permission | null = null;
      let lastDenialReason = '';
      
      for (const permission of permissionList) {
        const result = permissionChecker.hasPermission(role as Role, permission);
        
        if (result.granted) {
          granted = true;
          grantedPermission = permission;
          lastDenialReason = result.reason;
          break;
        } else {
          lastDenialReason = result.reason;
        }
      }
      
      // Step 3: Handle permission denial
      if (!granted) {
        // Log denial for audit
        const deniedPermission = permissionList[0]; // Log first permission for simplicity
        await logAuthorizationDecision(req, deniedPermission, false, lastDenialReason);
        
        // Return detailed error response
        const errorMessage = permissionList.length === 1
          ? `Permission denied: ${permissionList[0]}`
          : `Permission denied: requires one of [${permissionList.join(', ')}]`;
        
        throw new ForbiddenError(errorMessage);
      }
      
      // Step 4: Permission granted - log if sensitive operation
      if (grantedPermission) {
        await logAuthorizationDecision(req, grantedPermission, true, lastDenialReason);
      }
      
      // Step 5: Check performance target (sub-2ms)
      const duration = performance.now() - startTime;
      if (duration > 2 && process.env.NODE_ENV === 'development') {
        console.warn(
          `[RBAC] Permission check exceeded 2ms target: ${duration.toFixed(2)}ms ` +
          `(user=${userId} permissions=${permissionList.join(',')})`
        );
      }
      
      // Step 6: Proceed to next middleware
      next();
    } catch (error) {
      next(error);
    }
  };
}
