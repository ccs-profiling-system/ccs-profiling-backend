/**
 * Permission Checker Service
 * 
 * This service implements the core permission checking logic for the RBAC system.
 * It provides fast, cached permission resolution with wildcard support and explicit deny precedence.
 * 
 * Key Features:
 * - Permission format: resource.action (e.g., student.read, schedule.approve)
 * - Wildcard support: resource.* (all actions on resource), *.* (all permissions)
 * - Resolution order: explicit deny → explicit allow → wildcard allow → default deny
 * - In-memory caching for sub-5ms performance
 * - Performance logging for development mode
 * 
 * @module PermissionChecker
 */

import { Role, Permission, PermissionCheckResult, RolePermissions } from '../types';
import { permissionConfig } from '../config/permissions.config';

/**
 * Cache key format: role:permission
 * Example: "faculty:student.read"
 */
type CacheKey = string;

/**
 * Performance metrics for monitoring
 */
interface PerformanceMetrics {
  totalChecks: number;
  cacheHits: number;
  cacheMisses: number;
  averageCheckTime: number;
}

/**
 * PermissionChecker - Singleton service for permission resolution
 * 
 * Implements the permission resolution algorithm with strict precedence order:
 * 1. Explicit deny (specific permission in deny list)
 * 2. Explicit allow (specific permission in allow list)
 * 3. Wildcard allow (wildcard pattern in allow list)
 * 4. Default deny (if no match found, deny access)
 * 
 * Performance optimizations:
 * - In-memory cache for permission check results
 * - Pre-computed wildcard patterns
 * - Fast string matching
 * 
 * @example
 * ```typescript
 * const checker = PermissionChecker.getInstance();
 * const result = checker.hasPermission(Role.FACULTY, 'student.read');
 * if (result.granted) {
 *   // Allow access
 * } else {
 *   // Deny access, log result.reason
 * }
 * ```
 */
export class PermissionChecker {
  private static instance: PermissionChecker;
  
  /**
   * In-memory cache for permission check results
   * Maps "role:permission" to PermissionCheckResult
   */
  private cache: Map<CacheKey, PermissionCheckResult>;
  
  /**
   * Performance metrics for monitoring
   */
  private metrics: PerformanceMetrics;
  
  /**
   * Development mode flag for performance logging
   */
  private isDevelopment: boolean;

  /**
   * Private constructor for singleton pattern
   * Initializes cache and loads permission configuration
   */
  private constructor() {
    this.cache = new Map();
    this.metrics = {
      totalChecks: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCheckTime: 0,
    };
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Pre-warm cache with common permissions
    this.preWarmCache();
    
    if (this.isDevelopment) {
      console.log('[PermissionChecker] Initialized with', this.cache.size, 'pre-warmed entries');
    }
  }

  /**
   * Get singleton instance of PermissionChecker
   * 
   * @returns The singleton PermissionChecker instance
   */
  public static getInstance(): PermissionChecker {
    if (!PermissionChecker.instance) {
      PermissionChecker.instance = new PermissionChecker();
    }
    return PermissionChecker.instance;
  }

  /**
   * Check if a role has a specific permission
   * 
   * Implements the permission resolution algorithm:
   * 1. Check explicit deny list (highest priority)
   * 2. Check explicit allow list
   * 3. Check wildcard allow patterns
   * 4. Default deny (no match found)
   * 
   * @param role - The user's role
   * @param permission - The permission to check (format: resource.action)
   * @returns PermissionCheckResult with granted flag and reason
   * 
   * @example
   * ```typescript
   * const result = checker.hasPermission(Role.FACULTY, 'student.read');
   * console.log(result.granted); // true or false
   * console.log(result.reason);  // "Explicit allow: student.read"
   * ```
   */
  public hasPermission(role: Role, permission: Permission): PermissionCheckResult {
    const startTime = this.isDevelopment ? performance.now() : 0;
    
    // Check cache first
    const cacheKey = this.getCacheKey(role, permission);
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      this.metrics.cacheHits++;
      this.metrics.totalChecks++;
      this.logPerformance(startTime, true);
      return cachedResult;
    }
    
    // Cache miss - compute permission
    this.metrics.cacheMisses++;
    this.metrics.totalChecks++;
    
    const result = this.computePermission(role, permission);
    
    // Store in cache
    this.cache.set(cacheKey, result);
    
    this.logPerformance(startTime, false);
    
    return result;
  }

  /**
   * Compute permission check result using resolution algorithm
   * 
   * Resolution order (highest priority first):
   * 1. Explicit deny - checkExplicitDeny()
   * 2. Explicit allow - checkExplicitAllow()
   * 3. Wildcard allow - checkWildcardAllow()
   * 4. Default deny - defaultDeny()
   * 
   * @param role - The user's role
   * @param permission - The permission to check
   * @returns PermissionCheckResult with granted flag and reason
   */
  private computePermission(role: Role, permission: Permission): PermissionCheckResult {
    const rolePermissions = permissionConfig[role];
    
    if (!rolePermissions) {
      return {
        granted: false,
        reason: `Invalid role: ${role}`,
      };
    }
    
    // Step 1: Check explicit deny (highest priority)
    const explicitDenyResult = this.checkExplicitDeny(rolePermissions, permission);
    if (explicitDenyResult !== null) {
      return explicitDenyResult;
    }
    
    // Step 2: Check explicit allow
    const explicitAllowResult = this.checkExplicitAllow(rolePermissions, permission);
    if (explicitAllowResult !== null) {
      return explicitAllowResult;
    }
    
    // Step 3: Check wildcard allow
    const wildcardAllowResult = this.checkWildcardAllow(rolePermissions, permission);
    if (wildcardAllowResult !== null) {
      return wildcardAllowResult;
    }
    
    // Step 4: Default deny
    return this.defaultDeny();
  }

  /**
   * Step 1: Check if permission is explicitly denied
   * 
   * Checks if the permission exists in the role's deny list.
   * Supports both specific permissions and wildcard patterns.
   * 
   * @param rolePermissions - The role's permission configuration
   * @param permission - The permission to check
   * @returns PermissionCheckResult if denied, null if not in deny list
   * 
   * @example
   * ```typescript
   * // Department chair has schedule.delete in deny list
   * checkExplicitDeny(deptChairPerms, 'schedule.delete')
   * // Returns: { granted: false, reason: 'Explicit deny: schedule.delete' }
   * ```
   */
  private checkExplicitDeny(
    rolePermissions: RolePermissions,
    permission: Permission
  ): PermissionCheckResult | null {
    if (this.matchesPermission(permission, rolePermissions.deny)) {
      return {
        granted: false,
        reason: `Explicit deny: ${permission}`,
      };
    }
    return null;
  }

  /**
   * Step 2: Check if permission is explicitly allowed
   * 
   * Checks if the permission exists exactly in the role's allow list.
   * Does NOT check wildcard patterns (that's step 3).
   * 
   * @param rolePermissions - The role's permission configuration
   * @param permission - The permission to check
   * @returns PermissionCheckResult if explicitly allowed, null if not in allow list
   * 
   * @example
   * ```typescript
   * // Faculty has research.create in allow list
   * checkExplicitAllow(facultyPerms, 'research.create')
   * // Returns: { granted: true, reason: 'Explicit allow: research.create' }
   * ```
   */
  private checkExplicitAllow(
    rolePermissions: RolePermissions,
    permission: Permission
  ): PermissionCheckResult | null {
    if (rolePermissions.allow.includes(permission)) {
      return {
        granted: true,
        reason: `Explicit allow: ${permission}`,
      };
    }
    return null;
  }

  /**
   * Step 3: Check if permission matches wildcard patterns in allow list
   * 
   * Checks if the permission matches any wildcard pattern in the allow list.
   * Supports resource.* and *.* patterns.
   * 
   * @param rolePermissions - The role's permission configuration
   * @param permission - The permission to check
   * @returns PermissionCheckResult if wildcard matches, null if no match
   * 
   * @example
   * ```typescript
   * // Department chair has schedule.* in allow list
   * checkWildcardAllow(deptChairPerms, 'schedule.create')
   * // Returns: { granted: true, reason: 'Wildcard allow: schedule.*' }
   * ```
   */
  private checkWildcardAllow(
    rolePermissions: RolePermissions,
    permission: Permission
  ): PermissionCheckResult | null {
    const wildcardMatch = this.findWildcardMatch(permission, rolePermissions.allow);
    if (wildcardMatch) {
      return {
        granted: true,
        reason: `Wildcard allow: ${wildcardMatch}`,
      };
    }
    return null;
  }

  /**
   * Step 4: Default deny - no matching permission found
   * 
   * Returns a denial result when no explicit deny, explicit allow,
   * or wildcard allow rule matches the permission.
   * 
   * @returns PermissionCheckResult with denial and default deny reason
   * 
   * @example
   * ```typescript
   * // Faculty tries to approve schedules (not in any allow list)
   * defaultDeny()
   * // Returns: { granted: false, reason: 'Default deny: no matching permission' }
   * ```
   */
  private defaultDeny(): PermissionCheckResult {
    return {
      granted: false,
      reason: 'Default deny: no matching permission',
    };
  }

  /**
   * Check if a permission matches any pattern in a list
   * Supports exact matches and wildcard patterns
   * 
   * @param permission - The permission to check
   * @param patterns - Array of permission patterns (can include wildcards)
   * @returns true if permission matches any pattern, false otherwise
   */
  private matchesPermission(permission: Permission, patterns: Permission[]): boolean {
    // Check exact match
    if (patterns.includes(permission)) {
      return true;
    }
    
    // Check wildcard matches
    return this.findWildcardMatch(permission, patterns) !== null;
  }

  /**
   * Find a wildcard pattern that matches the permission
   * 
   * Supports two wildcard patterns:
   * - resource.* : Matches all actions on a specific resource
   * - *.* : Matches all permissions across all resources
   * 
   * @param permission - The permission to check (format: resource.action)
   * @param patterns - Array of permission patterns
   * @returns The matching wildcard pattern, or null if no match
   * 
   * @example
   * ```typescript
   * findWildcardMatch('student.read', ['student.*']) // Returns 'student.*'
   * findWildcardMatch('student.read', ['*.*'])       // Returns '*.*'
   * findWildcardMatch('student.read', ['schedule.*']) // Returns null
   * ```
   */
  private findWildcardMatch(permission: Permission, patterns: Permission[]): Permission | null {
    // Check for global wildcard *.*
    if (patterns.includes('*.*')) {
      return '*.*';
    }
    
    // Extract resource from permission (e.g., "student" from "student.read")
    const [resource] = permission.split('.');
    
    if (!resource) {
      return null;
    }
    
    // Check for resource wildcard (e.g., "student.*")
    const resourceWildcard = `${resource}.*`;
    if (patterns.includes(resourceWildcard)) {
      return resourceWildcard;
    }
    
    return null;
  }

  /**
   * Generate cache key for role and permission
   * 
   * @param role - The user's role
   * @param permission - The permission
   * @returns Cache key in format "role:permission"
   */
  private getCacheKey(role: Role, permission: Permission): CacheKey {
    return `${role}:${permission}`;
  }

  /**
   * Pre-warm cache with common permissions
   * Computes and caches frequently used permission checks at startup
   */
  private preWarmCache(): void {
    const commonPermissions = [
      'student.read',
      'student.read_own',
      'schedule.read',
      'instruction.read',
      'event.read',
      'research.read',
    ];
    
    const roles = Object.values(Role);
    
    for (const role of roles) {
      for (const permission of commonPermissions) {
        const result = this.computePermission(role, permission);
        const cacheKey = this.getCacheKey(role, permission);
        this.cache.set(cacheKey, result);
      }
    }
  }

  /**
   * Log performance metrics in development mode
   * 
   * @param startTime - Performance.now() timestamp when check started
   * @param cacheHit - Whether this was a cache hit
   */
  private logPerformance(startTime: number, cacheHit: boolean): void {
    if (!this.isDevelopment) {
      return;
    }
    
    const duration = performance.now() - startTime;
    
    // Update average check time
    const totalTime = this.metrics.averageCheckTime * (this.metrics.totalChecks - 1);
    this.metrics.averageCheckTime = (totalTime + duration) / this.metrics.totalChecks;
    
    // Log if check took longer than 5ms (performance target)
    if (duration > 5) {
      console.warn(
        `[PermissionChecker] Slow permission check: ${duration.toFixed(2)}ms (cache ${cacheHit ? 'hit' : 'miss'})`
      );
    }
  }

  /**
   * Get performance metrics
   * Useful for monitoring and debugging
   * 
   * @returns Current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear the permission cache
   * Useful for testing or when permission configuration changes
   */
  public clearCache(): void {
    this.cache.clear();
    this.preWarmCache();
    
    if (this.isDevelopment) {
      console.log('[PermissionChecker] Cache cleared and pre-warmed');
    }
  }

  /**
   * Get cache statistics
   * 
   * @returns Object with cache size and hit rate
   */
  public getCacheStats(): { size: number; hitRate: number } {
    const hitRate = this.metrics.totalChecks > 0
      ? (this.metrics.cacheHits / this.metrics.totalChecks) * 100
      : 0;
    
    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }
}

/**
 * Export singleton instance for convenience
 */
export const permissionChecker = PermissionChecker.getInstance();
