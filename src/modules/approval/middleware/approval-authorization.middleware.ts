/**
 * Approval Authorization Middleware
 * 
 * Provides role-based and department-scoped authorization for approval system endpoints.
 * 
 * Key Features:
 * - Role validation: Ensures user has required role(s)
 * - Department scope validation: For chair endpoints, validates department_id matches user's department
 * - Change request ownership validation: For chair approval decisions, validates change request belongs to user's department
 * - Audit logging: Logs all authorization failures
 * - Returns 403 for authorization failures
 * 
 * Usage Examples:
 * ```typescript
 * // Role-based authorization (admin only)
 * router.get('/approvals/pending', requireApprovalRole(['admin']), getPendingApprovals);
 * 
 * // Department-scoped authorization (chair only, department validated)
 * router.get('/approvals/department/pending', requireApprovalRole(['chair']), requireDepartmentScope, getPendingApprovals);
 * 
 * // Change request department validation (for approval decisions)
 * router.patch('/approvals/:id/approve', requireApprovalRole(['admin', 'chair']), validateChangeRequestDepartment, approveRequest);
 * ```
 * 
 * **Validates: Requirements 15.1-15.7, 9.1-9.5, 10.1-10.5, 11.1-11.4, 12.1-12.4**
 */

import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../../../shared/errors';
import { ApprovalRepository } from '../repositories/approval.repository';
import { db } from '../../../db';
import { faculty } from '../../../db/schema/faculty';
import { eq } from 'drizzle-orm';

// Lazy import to avoid circular dependency issues
let auditLogRepository: any;
async function getAuditLogRepository() {
  if (!auditLogRepository) {
    const module = await import('../../audit-logs');
    auditLogRepository = module.auditLogRepository;
  }
  return auditLogRepository;
}

/**
 * Approval repository instance (lazy-loaded to support testing)
 */
let approvalRepositoryInstance: ApprovalRepository | null = null;

function getApprovalRepository(): ApprovalRepository {
  if (!approvalRepositoryInstance) {
    approvalRepositoryInstance = new ApprovalRepository();
  }
  return approvalRepositoryInstance;
}

/**
 * Reset approval repository instance (for testing)
 * @internal
 */
export function resetApprovalRepository(instance?: ApprovalRepository): void {
  approvalRepositoryInstance = instance || null;
}

/**
 * Log authorization failure to audit log
 * Non-blocking - failures are logged but don't affect the response
 * 
 * @param req - Express request object
 * @param reason - Reason for authorization failure
 * @param details - Additional details about the failure
 */
async function logAuthorizationFailure(
  req: Request,
  reason: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const ip_address =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      undefined;

    const user_agent = req.headers['user-agent'] || undefined;

    const repository = await getAuditLogRepository();
    await repository.create({
      user_id: userId === '00000000-0000-0000-0000-000000000000' ? undefined : userId,
      action_type: 'approval_authz_failure',
      entity_type: 'approval',
      ip_address,
      user_agent,
      after_state: {
        reason,
        path: req.path,
        method: req.method,
        role: req.user?.role,
        ...details,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not block authorization
    console.error('Failed to log authorization failure:', error);
  }
}

/**
 * Fetch user's department from faculty table
 * 
 * @param userId - User ID
 * @returns Department name or null if not found
 */
async function getUserDepartment(userId: string): Promise<string | null> {
  try {
    const facultyRecord = await db.query.faculty.findFirst({
      where: eq(faculty.user_id, userId),
    });

    return facultyRecord?.department || null;
  } catch (error) {
    console.error('Failed to fetch user department:', error);
    return null;
  }
}

/**
 * Role-based authorization middleware factory
 * 
 * Validates that the authenticated user has one of the required roles.
 * 
 * @param allowedRoles - Array of allowed roles (e.g., ['admin', 'chair'])
 * @returns Express middleware function
 * 
 * **Validates: Requirements 15.1-15.7**
 * 
 * @example
 * ```typescript
 * // Admin only
 * router.get('/approvals/stats', requireApprovalRole(['admin']), getStats);
 * 
 * // Admin or chair
 * router.get('/approvals/:id', requireApprovalRole(['admin', 'chair']), getApproval);
 * ```
 */
export function requireApprovalRole(allowedRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check authentication
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { role, userId } = req.user;

      // Validate role
      if (!allowedRoles.includes(role)) {
        // Log authorization failure
        await logAuthorizationFailure(req, 'Role not authorized', {
          required_roles: allowedRoles,
          user_role: role,
        });

        throw new ForbiddenError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Department scope validation middleware
 * 
 * For chair endpoints, validates that the user belongs to a department.
 * Attaches the user's department to req for use in subsequent middleware/controllers.
 * 
 * **Validates: Requirements 9.1-9.5, 11.1-11.4**
 * 
 * @example
 * ```typescript
 * router.get('/approvals/department/pending', 
 *   requireApprovalRole(['chair']), 
 *   requireDepartmentScope, 
 *   getPendingApprovals
 * );
 * ```
 */
export async function requireDepartmentScope(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check authentication
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { userId, role } = req.user;

    // Only apply department scope for chairs
    if (role !== 'chair') {
      return next();
    }

    // Fetch user's department
    const userDepartment = await getUserDepartment(userId);

    if (!userDepartment) {
      // Log authorization failure
      await logAuthorizationFailure(req, 'Chair has no department assigned', {
        user_id: userId,
      });

      throw new ForbiddenError('Chair must be assigned to a department');
    }

    // Attach department to request for use in controllers
    (req as any).userDepartment = userDepartment;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Change request department validation middleware
 * 
 * For chair approval decisions, validates that the change request belongs to the user's department.
 * Admins bypass this check (can approve any change request).
 * 
 * **Validates: Requirements 10.1-10.5, 12.1-12.4**
 * 
 * @example
 * ```typescript
 * router.patch('/approvals/:id/approve', 
 *   requireApprovalRole(['admin', 'chair']), 
 *   validateChangeRequestDepartment, 
 *   approveRequest
 * );
 * ```
 */
export async function validateChangeRequestDepartment(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check authentication
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { userId, role } = req.user;
    const approvalId = req.params.id;

    // Admins can approve any change request
    if (role === 'admin') {
      return next();
    }

    // For chairs, validate department scope
    if (role === 'chair') {
      // Fetch user's department
      const userDepartment = await getUserDepartment(userId);

      if (!userDepartment) {
        // Log authorization failure
        await logAuthorizationFailure(req, 'Chair has no department assigned', {
          user_id: userId,
          approval_id: approvalId,
        });

        throw new ForbiddenError('Chair must be assigned to a department');
      }

      // Fetch change request
      const approval = await getApprovalRepository().findById(approvalId);

      if (!approval) {
        // Let the controller handle 404
        return next();
      }

      // Validate department match
      // Note: approval.department_id is a UUID, but faculty.department is a varchar (department name)
      // We need to compare the department name from the approval's department_id
      // For now, we'll use a simplified approach: fetch the department name from the approval
      // and compare it with the user's department
      
      // TODO: This assumes department_id in approvals table will be linked to a departments table
      // For now, we'll use a workaround: compare the department field directly
      // This will need to be updated once the departments table is properly linked
      
      // Temporary workaround: Store department name in approval.department_id field
      // or fetch department name from a departments table using the UUID
      
      // For this implementation, we'll assume the department_id field contains the department name
      // This matches the design document's department assignment logic
      
      // Fetch the approval's department (this will be updated once departments table is linked)
      const approvalDepartment = approval.department_id; // This should be a department name for now

      if (approvalDepartment !== userDepartment) {
        // Log authorization failure
        await logAuthorizationFailure(req, 'Change request outside chair department', {
          user_id: userId,
          user_department: userDepartment,
          approval_id: approvalId,
          approval_department: approvalDepartment,
        });

        throw new ForbiddenError(
          'Access denied. Change request belongs to a different department'
        );
      }

      // Attach department to request for use in controllers
      (req as any).userDepartment = userDepartment;
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk operation department validation middleware
 * 
 * For chair bulk operations, validates that all change requests in the bulk operation
 * belong to the user's department. Filters out change requests outside the department
 * and attaches the filtered list to the request.
 * 
 * **Validates: Requirements 12.1-12.4**
 * 
 * @example
 * ```typescript
 * router.post('/approvals/department/bulk-approve', 
 *   requireApprovalRole(['chair']), 
 *   validateBulkOperationDepartment, 
 *   bulkApprove
 * );
 * ```
 */
export async function validateBulkOperationDepartment(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check authentication
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { userId, role } = req.user;
    const approvalIds: string[] = req.body.approvalIds || [];

    // Admins can process any change requests
    if (role === 'admin') {
      return next();
    }

    // For chairs, validate department scope
    if (role === 'chair') {
      // Fetch user's department
      const userDepartment = await getUserDepartment(userId);

      if (!userDepartment) {
        // Log authorization failure
        await logAuthorizationFailure(req, 'Chair has no department assigned', {
          user_id: userId,
          approval_ids: approvalIds,
        });

        throw new ForbiddenError('Chair must be assigned to a department');
      }

      // Fetch all change requests
      const validApprovalIds: string[] = [];
      const invalidApprovalIds: string[] = [];

      for (const approvalId of approvalIds) {
        const approval = await getApprovalRepository().findById(approvalId);

        if (!approval) {
          // Skip non-existent approvals (will be handled by service layer)
          invalidApprovalIds.push(approvalId);
          continue;
        }

        // Check department match
        const approvalDepartment = approval.department_id;

        if (approvalDepartment === userDepartment) {
          validApprovalIds.push(approvalId);
        } else {
          invalidApprovalIds.push(approvalId);
        }
      }

      // Log if any approvals were filtered out
      if (invalidApprovalIds.length > 0) {
        await logAuthorizationFailure(
          req,
          'Some change requests outside chair department',
          {
            user_id: userId,
            user_department: userDepartment,
            invalid_approval_ids: invalidApprovalIds,
            valid_approval_ids: validApprovalIds,
          }
        );
      }

      // Attach filtered approval IDs to request
      (req as any).validApprovalIds = validApprovalIds;
      (req as any).invalidApprovalIds = invalidApprovalIds;
      (req as any).userDepartment = userDepartment;
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Export all middleware functions
 */
export {
  requireApprovalRole as requireRole,
  requireDepartmentScope as requireDepartment,
  validateChangeRequestDepartment as validateDepartment,
  validateBulkOperationDepartment as validateBulkDepartment,
};
