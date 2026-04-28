/**
 * Middleware Composition Utilities
 * 
 * Type-safe utilities for composing RBAC middleware in Express routes.
 * Provides helper functions and types to ensure correct middleware ordering
 * and configuration.
 */

import { Request, Response, NextFunction } from 'express';
import { requirePermission, checkOwnership } from '../middleware';
import { Permission } from '../types';

/**
 * Options for checkOwnership middleware
 * Re-exported from checkOwnership.middleware.ts
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
 * Middleware function type
 */
export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Middleware composition configuration
 * 
 * Defines which middleware to apply and in what order.
 * Middleware is always applied in this order:
 * 1. Permission check (if specified)
 * 2. Ownership check (if specified)
 * 3. Workflow check (if specified)
 */
export interface MiddlewareComposition {
  /**
   * Required permission(s) for the endpoint
   * Can be a single permission or array of permissions (OR logic)
   */
  permission?: Permission | Permission[];

  /**
   * Ownership validation configuration
   * If specified, validates that the user owns the requested resource
   */
  ownership?: {
    /**
     * Type of resource to validate ownership for
     * Must match a configured resource type in checkOwnership middleware
     */
    resourceType: string;

    /**
     * Optional configuration for ownership check
     */
    options?: CheckOwnershipOptions;
  };

  /**
   * Workflow validation configuration (future implementation)
   * If specified, validates that the workflow state allows the requested action
   */
  workflow?: {
    /**
     * Type of resource to validate workflow for
     * Must match a configured workflow module
     */
    resourceType: string;
  };
}

/**
 * Compose middleware based on configuration
 * 
 * Creates an array of middleware functions in the correct order based on
 * the provided configuration. This ensures consistent middleware ordering
 * across all routes.
 * 
 * Execution Order:
 * 1. Permission check (403 if denied)
 * 2. Ownership check (403 if not owner, 404 if not found)
 * 3. Workflow check (400 if invalid state)
 * 
 * @param config - Middleware composition configuration
 * @returns Array of middleware functions to apply to route
 * 
 * @example
 * ```typescript
 * // Permission only
 * router.get('/students',
 *   ...composeMiddleware({ permission: 'student.read' }),
 *   getStudents
 * );
 * 
 * // Permission + Ownership
 * router.put('/instructions/:id',
 *   ...composeMiddleware({
 *     permission: 'instruction.update',
 *     ownership: { resourceType: 'instruction' }
 *   }),
 *   updateInstruction
 * );
 * 
 * // Full validation
 * router.post('/research/:id/submit',
 *   ...composeMiddleware({
 *     permission: 'research.submit',
 *     ownership: { resourceType: 'research' },
 *     workflow: { resourceType: 'research' }
 *   }),
 *   submitResearch
 * );
 * ```
 */
export function composeMiddleware(config: MiddlewareComposition): Middleware[] {
  const middleware: Middleware[] = [];

  // Step 1: Add permission check (if specified)
  if (config.permission) {
    middleware.push(requirePermission(config.permission));
  }

  // Step 2: Add ownership check (if specified)
  if (config.ownership) {
    middleware.push(
      checkOwnership(config.ownership.resourceType, config.ownership.options)
    );
  }

  // Step 3: Add workflow check (if specified) - future implementation
  // if (config.workflow) {
  //   middleware.push(checkWorkflow(config.workflow.resourceType));
  // }

  return middleware;
}

/**
 * Type-safe permission constants
 * 
 * Define permission constants for reusability and type safety.
 * Using constants prevents typos and provides autocomplete support.
 * 
 * @example
 * ```typescript
 * export const PERMISSIONS = {
 *   STUDENT_READ: 'student.read' as Permission,
 *   STUDENT_CREATE: 'student.create' as Permission,
 *   STUDENT_UPDATE: 'student.update' as Permission,
 *   STUDENT_DELETE: 'student.delete' as Permission,
 * } as const;
 * 
 * router.get('/students',
 *   requirePermission(PERMISSIONS.STUDENT_READ),
 *   getStudents
 * );
 * ```
 */
export type PermissionConstants = Record<string, Permission>;

/**
 * Create type-safe permission constants
 * 
 * Helper function to create permission constant objects with proper typing.
 * 
 * @param permissions - Object mapping constant names to permission strings
 * @returns Type-safe permission constants
 * 
 * @example
 * ```typescript
 * const STUDENT_PERMISSIONS = createPermissionConstants({
 *   READ: 'student.read',
 *   CREATE: 'student.create',
 *   UPDATE: 'student.update',
 *   DELETE: 'student.delete',
 * });
 * 
 * router.get('/students',
 *   requirePermission(STUDENT_PERMISSIONS.READ),
 *   getStudents
 * );
 * ```
 */
export function createPermissionConstants<T extends Record<string, string>>(
  permissions: T
): { readonly [K in keyof T]: Permission } {
  const constants: any = {};
  
  for (const [key, value] of Object.entries(permissions)) {
    constants[key] = value as Permission;
  }
  
  return Object.freeze(constants);
}

/**
 * Middleware composition presets
 * 
 * Common middleware composition patterns for quick reuse.
 */
export const MiddlewarePresets = {
  /**
   * Read-only access pattern
   * - Permission check only
   * - No ownership or workflow validation
   * 
   * Use for: Public read operations, collection endpoints
   */
  readOnly: (permission: Permission): Middleware[] => {
    return composeMiddleware({ permission });
  },

  /**
   * Create operation pattern
   * - Permission check only
   * - No ownership check (no existing resource)
   * 
   * Use for: Create endpoints, POST operations
   */
  create: (permission: Permission): Middleware[] => {
    return composeMiddleware({ permission });
  },

  /**
   * Update own resource pattern
   * - Permission check
   * - Ownership validation
   * 
   * Use for: Update/delete operations on user-owned resources
   */
  updateOwn: (permission: Permission, resourceType: string): Middleware[] => {
    return composeMiddleware({
      permission,
      ownership: { resourceType }
    });
  },

  /**
   * Approval operation pattern
   * - Permission check
   * - Workflow validation
   * 
   * Use for: Approval/rejection operations, state transitions
   */
  approve: (permission: Permission, resourceType: string): Middleware[] => {
    return composeMiddleware({
      permission,
      workflow: { resourceType }
    });
  },

  /**
   * Submit own resource pattern
   * - Permission check
   * - Ownership validation
   * - Workflow validation
   * 
   * Use for: Submitting own content for approval
   */
  submitOwn: (permission: Permission, resourceType: string): Middleware[] => {
    return composeMiddleware({
      permission,
      ownership: { resourceType },
      workflow: { resourceType }
    });
  },
} as const;

/**
 * Validate middleware composition configuration
 * 
 * Checks that the middleware composition configuration is valid.
 * Throws an error if configuration is invalid.
 * 
 * @param config - Middleware composition configuration to validate
 * @throws Error if configuration is invalid
 * 
 * @example
 * ```typescript
 * const config = {
 *   permission: 'student.read',
 *   ownership: { resourceType: 'student' }
 * };
 * 
 * validateMiddlewareComposition(config); // No error
 * ```
 */
export function validateMiddlewareComposition(config: MiddlewareComposition): void {
  // At least one middleware must be specified
  if (!config.permission && !config.ownership && !config.workflow) {
    throw new Error(
      'Middleware composition must specify at least one of: permission, ownership, or workflow'
    );
  }

  // Validate permission format
  if (config.permission) {
    const permissions = Array.isArray(config.permission)
      ? config.permission
      : [config.permission];

    for (const permission of permissions) {
      if (typeof permission !== 'string' || permission.trim() === '') {
        throw new Error(`Invalid permission: ${permission}`);
      }

      // Check format: resource.action or resource.* or *.*
      const parts = permission.split('.');
      if (parts.length !== 2) {
        throw new Error(
          `Invalid permission format: ${permission}. Expected format: resource.action`
        );
      }
    }
  }

  // Validate ownership configuration
  if (config.ownership) {
    if (!config.ownership.resourceType || config.ownership.resourceType.trim() === '') {
      throw new Error('Ownership resourceType must be specified');
    }
  }

  // Validate workflow configuration
  if (config.workflow) {
    if (!config.workflow.resourceType || config.workflow.resourceType.trim() === '') {
      throw new Error('Workflow resourceType must be specified');
    }
  }
}

/**
 * Create a middleware composition with validation
 * 
 * Same as composeMiddleware but validates configuration first.
 * Useful in development to catch configuration errors early.
 * 
 * @param config - Middleware composition configuration
 * @returns Array of middleware functions
 * @throws Error if configuration is invalid
 * 
 * @example
 * ```typescript
 * router.put('/instructions/:id',
 *   ...composeMiddlewareWithValidation({
 *     permission: 'instruction.update',
 *     ownership: { resourceType: 'instruction' }
 *   }),
 *   updateInstruction
 * );
 * ```
 */
export function composeMiddlewareWithValidation(
  config: MiddlewareComposition
): Middleware[] {
  validateMiddlewareComposition(config);
  return composeMiddleware(config);
}

/**
 * Extended Request type with user information
 * 
 * Use this type in route handlers to get type-safe access to user info.
 * 
 * @example
 * ```typescript
 * import { AuthenticatedRequest } from '../rbac/utils/middleware-composer';
 * 
 * async function getStudents(req: AuthenticatedRequest, res: Response) {
 *   const userId = req.user.userId; // Type-safe
 *   const role = req.user.role; // Type-safe
 *   // ... business logic
 * }
 * ```
 */
export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: string;
    email: string;
  };
}

/**
 * Type guard to check if request is authenticated
 * 
 * @param req - Express request
 * @returns true if request has user info, false otherwise
 * 
 * @example
 * ```typescript
 * function handler(req: Request, res: Response) {
 *   if (isAuthenticated(req)) {
 *     // req.user is now type-safe
 *     const userId = req.user.userId;
 *   }
 * }
 * ```
 */
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return req.user !== undefined && req.user !== null;
}

/**
 * Middleware composition builder
 * 
 * Fluent API for building middleware compositions.
 * Provides a more readable way to compose middleware.
 * 
 * @example
 * ```typescript
 * router.put('/instructions/:id',
 *   ...new MiddlewareCompositionBuilder()
 *     .requirePermission('instruction.update')
 *     .checkOwnership('instruction')
 *     .build(),
 *   updateInstruction
 * );
 * ```
 */
export class MiddlewareCompositionBuilder {
  private config: MiddlewareComposition = {};

  /**
   * Add permission check to composition
   * 
   * @param permission - Single permission or array of permissions
   * @returns Builder instance for chaining
   */
  requirePermission(permission: Permission | Permission[]): this {
    this.config.permission = permission;
    return this;
  }

  /**
   * Add ownership check to composition
   * 
   * @param resourceType - Type of resource to validate ownership for
   * @param options - Optional ownership check configuration
   * @returns Builder instance for chaining
   */
  checkOwnership(resourceType: string, options?: CheckOwnershipOptions): this {
    this.config.ownership = { resourceType, options };
    return this;
  }

  /**
   * Add workflow check to composition (future implementation)
   * 
   * @param resourceType - Type of resource to validate workflow for
   * @returns Builder instance for chaining
   */
  checkWorkflow(resourceType: string): this {
    this.config.workflow = { resourceType };
    return this;
  }

  /**
   * Build middleware array from configuration
   * 
   * @returns Array of middleware functions
   */
  build(): Middleware[] {
    return composeMiddleware(this.config);
  }

  /**
   * Build middleware array with validation
   * 
   * @returns Array of middleware functions
   * @throws Error if configuration is invalid
   */
  buildWithValidation(): Middleware[] {
    validateMiddlewareComposition(this.config);
    return composeMiddleware(this.config);
  }
}

/**
 * Export all utilities
 */
export default {
  composeMiddleware,
  composeMiddlewareWithValidation,
  validateMiddlewareComposition,
  createPermissionConstants,
  MiddlewarePresets,
  MiddlewareCompositionBuilder,
  isAuthenticated,
};
