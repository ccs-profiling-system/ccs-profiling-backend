/**
 * checkOwnership Middleware
 * 
 * Enforces resource ownership validation on API endpoints.
 * This middleware validates that the authenticated user owns the requested resource
 * or has a role that bypasses ownership checks.
 * 
 * Key Features:
 * - Single responsibility: ownership validation only (no permission or workflow validation)
 * - Configurable ownership fields per resource type
 * - Bypasses checks for Admin and Department_Chair roles
 * - Returns HTTP 403 if ownership validation fails
 * - Returns HTTP 404 if resource doesn't exist
 * - Supports custom parameter names for resource ID extraction
 * 
 * Usage Examples:
 * ```typescript
 * // Basic ownership check (uses req.params.id and default ownership field)
 * router.put('/instructions/:id', 
 *   requirePermission('instruction.update'),
 *   checkOwnership('instruction'),
 *   updateInstruction
 * );
 * 
 * // Custom parameter name
 * router.put('/students/:studentId/profile', 
 *   requirePermission('student.update'),
 *   checkOwnership('student', { paramName: 'studentId' }),
 *   updateStudentProfile
 * );
 * 
 * // Custom ownership field
 * router.put('/research/:id', 
 *   requirePermission('research.update'),
 *   checkOwnership('research', { ownerField: 'faculty_id' }),
 *   updateResearch
 * );
 * ```
 * 
 * @module checkOwnership
 */

import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';
import { Role } from '../types';
import { db } from '../../db';
import { 
  students, 
  faculty, 
  instructions, 
  research, 
  enrollments, 
  academicHistory 
} from '../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Resource type configuration mapping
 * Maps resource types to their database tables and default ownership fields
 */
const RESOURCE_CONFIG: Record<string, {
  table: any;
  ownerField: string;
}> = {
  student: {
    table: students,
    ownerField: 'user_id',
  },
  faculty: {
    table: faculty,
    ownerField: 'user_id',
  },
  instruction: {
    table: instructions,
    ownerField: 'faculty_id', // Instructions are owned by faculty who created them
  },
  research: {
    table: research,
    ownerField: 'faculty_id', // Research is owned by faculty advisers
  },
  enrollment: {
    table: enrollments,
    ownerField: 'student_id',
  },
  academic_history: {
    table: academicHistory,
    ownerField: 'student_id',
  },
};

/**
 * Roles that bypass ownership checks
 * These roles have elevated privileges and can access any resource
 */
const BYPASS_ROLES: Role[] = [Role.ADMIN, Role.DEPARTMENT_CHAIR];

/**
 * Options for checkOwnership middleware
 */
export interface CheckOwnershipOptions {
  /**
   * Name of the request parameter containing the resource ID
   * @default 'id'
   */
  paramName?: string;

  /**
   * Name of the ownership field in the resource
   * If not provided, uses the default from RESOURCE_CONFIG
   */
  ownerField?: string;
}

/**
 * checkOwnership Middleware Factory
 * 
 * Creates an Express middleware function that enforces ownership validation.
 * 
 * Execution Flow:
 * 1. Check if user is authenticated (req.user exists)
 * 2. If not authenticated, return HTTP 401 Unauthorized
 * 3. Check if user role bypasses ownership checks (Admin, Department_Chair)
 * 4. If bypass role, proceed to next middleware
 * 5. Extract resource ID from request params
 * 6. Fetch resource from database
 * 7. If resource not found, return HTTP 404 Not Found
 * 8. Compare resource owner field with requesting user ID
 * 9. If ownership validation fails, return HTTP 403 Forbidden
 * 10. If ownership validated, proceed to next middleware
 * 
 * @param resourceType - Type of resource to validate ownership for
 * @param options - Optional configuration for parameter name and ownership field
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * // Basic usage with defaults
 * app.put('/api/instructions/:id', checkOwnership('instruction'), handler);
 * 
 * // Custom parameter name
 * app.put('/api/students/:studentId', checkOwnership('student', { paramName: 'studentId' }), handler);
 * 
 * // Custom ownership field
 * app.put('/api/research/:id', checkOwnership('research', { ownerField: 'faculty_id' }), handler);
 * ```
 */
export function checkOwnership(
  resourceType: string,
  options: CheckOwnershipOptions = {}
) {
  const { paramName = 'id', ownerField } = options;

  // Validate resource type configuration
  const resourceConfig = RESOURCE_CONFIG[resourceType];
  if (!resourceConfig) {
    throw new Error(
      `checkOwnership: Unknown resource type "${resourceType}". ` +
      `Supported types: ${Object.keys(RESOURCE_CONFIG).join(', ')}`
    );
  }

  const effectiveOwnerField = ownerField || resourceConfig.ownerField;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Step 1: Check authentication
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { role, userId } = req.user;

      // Step 2: Check if role bypasses ownership checks
      if (BYPASS_ROLES.includes(role as Role)) {
        console.debug(
          `[RBAC] Ownership check bypassed: user=${userId} role=${role} resource=${resourceType}`
        );
        return next();
      }

      // Step 3: Extract resource ID from params
      const resourceId = req.params[paramName];
      if (!resourceId || resourceId.trim() === '') {
        throw new ValidationError(
          `Resource ID parameter "${paramName}" not found in request`
        );
      }

      // Step 4: Fetch resource from database
      const [resource] = await db
        .select()
        .from(resourceConfig.table)
        .where(eq(resourceConfig.table.id, resourceId))
        .limit(1);

      // Step 5: Handle resource not found
      if (!resource) {
        throw new NotFoundError(`${resourceType} not found`);
      }

      // Step 6: Compare ownership
      const resourceOwnerId = resource[effectiveOwnerField];
      
      if (!resourceOwnerId) {
        // Resource doesn't have an owner field - this might be a configuration error
        console.warn(
          `[RBAC] Ownership field "${effectiveOwnerField}" not found on ${resourceType} resource. ` +
          `Resource ID: ${resourceId}`
        );
        throw new ForbiddenError(
          `Cannot validate ownership: ${resourceType} does not have ownership information`
        );
      }

      // Step 7: Validate ownership
      if (resourceOwnerId !== userId) {
        console.warn(
          `[RBAC] Ownership validation failed: user=${userId} role=${role} ` +
          `resource=${resourceType} resourceId=${resourceId} ownerId=${resourceOwnerId}`
        );
        throw new ForbiddenError(
          `Access denied: You do not own this ${resourceType}`
        );
      }

      // Step 8: Ownership validated - proceed
      console.debug(
        `[RBAC] Ownership validated: user=${userId} resource=${resourceType} resourceId=${resourceId}`
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Add a custom resource type configuration
 * Allows extending the middleware with new resource types at runtime
 * 
 * @param resourceType - Name of the resource type
 * @param table - Drizzle table reference
 * @param ownerField - Name of the ownership field in the table
 * 
 * @example
 * ```typescript
 * import { uploads } from '../db/schema';
 * 
 * addResourceConfig('upload', uploads, 'user_id');
 * ```
 */
export function addResourceConfig(
  resourceType: string,
  table: any,
  ownerField: string
): void {
  if (RESOURCE_CONFIG[resourceType]) {
    console.warn(
      `[RBAC] Overwriting existing resource config for "${resourceType}"`
    );
  }

  RESOURCE_CONFIG[resourceType] = {
    table,
    ownerField,
  };

  console.info(
    `[RBAC] Added resource config: type=${resourceType} ownerField=${ownerField}`
  );
}

/**
 * Get the current resource configuration
 * Useful for debugging and testing
 * 
 * @returns Copy of the current resource configuration
 */
export function getResourceConfig(): Record<string, { table: any; ownerField: string }> {
  return { ...RESOURCE_CONFIG };
}
