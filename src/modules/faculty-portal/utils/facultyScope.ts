/**
 * Faculty Scoping Utilities
 * 
 * Utilities for extracting faculty_id from authenticated users and validating
 * faculty access to resources. Ensures faculty members can only access their
 * own data and assigned resources.
 * 
 */

import { Request } from 'express';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

/**
 * User context from JWT token
 * Extended to include facultyId for faculty users
 */
export interface FacultyUserContext {
  userId: string;
  role: string;
  email: string;
  facultyId?: string;
}

/**
 * Faculty access validation error
 * Thrown when faculty attempts to access resources outside their scope
 */
export class FacultyAccessError extends Error {
  public readonly statusCode: number = 403;
  public readonly code: string = 'FACULTY_ACCESS_DENIED';

  constructor(message: string = 'Access denied: You can only access your own resources') {
    super(message);
    this.name = 'FacultyAccessError';
    Object.setPrototypeOf(this, FacultyAccessError.prototype);
  }
}

/**
 * Extract faculty_id from authenticated user
 * 
 * Retrieves the faculty_id from the authenticated user's JWT token context.
 * The faculty_id should be set during authentication when the user logs in
 * with faculty credentials.
 * 
 * @param user - Authenticated user from req.user
 * @returns Faculty ID string
 * @throws FacultyAccessError if faculty_id is not present
 * 
 * @example
 * ```typescript
 * const facultyId = extractFacultyId(req.user);
 * // Use facultyId to filter queries
 * const courses = await getCoursesByFaculty(facultyId);
 * ```
 */
export function extractFacultyId(user: FacultyUserContext | undefined): string {
  if (!user) {
    throw new FacultyAccessError('Authentication required');
  }

  if (!user.facultyId) {
    throw new FacultyAccessError(
      'Faculty ID not found in user context. Please ensure you are logged in as a faculty member.'
    );
  }

  return user.facultyId;
}

/**
 * Validate faculty access to a resource
 * 
 * Validates that the authenticated faculty member has access to a resource
 * by comparing the resource's faculty_id with the user's faculty_id.
 * 
 * This function should be called before allowing operations on faculty-scoped
 * resources such as profiles, courses, research projects, etc.
 * 
 * @param resourceFacultyId - Faculty ID associated with the resource
 * @param userFacultyId - Faculty ID of the authenticated user
 * @throws FacultyAccessError if faculty IDs do not match (HTTP 403)
 * 
 * @example
 * ```typescript
 * // Validate profile access
 * const userFacultyId = extractFacultyId(req.user);
 * const profile = await getProfileById(facultyId);
 * validateFacultyAccess(profile.faculty_id, userFacultyId);
 * 
 * // Validate research access
 * const research = await getResearchById(researchId);
 * validateFacultyAccess(research.primary_researcher_id, userFacultyId);
 * ```
 */
export function validateFacultyAccess(
  resourceFacultyId: string,
  userFacultyId: string
): void {
  if (resourceFacultyId !== userFacultyId) {
    throw new FacultyAccessError(
      'Access denied: You can only access your own resources'
    );
  }
}

/**
 * Extract and validate faculty ID from request
 * 
 * Convenience function that combines extractFacultyId and validates against
 * a route parameter. Useful for endpoints that use :facultyId in the URL.
 * 
 * @param req - Express request with authenticated user
 * @param paramName - Name of the route parameter containing faculty ID (default: 'facultyId')
 * @returns Faculty ID from user context
 * @throws FacultyAccessError if faculty IDs do not match
 * 
 * @example
 * ```typescript
 * // Route: PUT /api/admin/faculty/:facultyId/profile
 * async function updateProfile(req: AuthenticatedRequest, res: Response) {
 *   const facultyId = extractAndValidateFacultyId(req);
 *   // facultyId is validated to match req.params.facultyId
 *   const updatedProfile = await profileService.updateProfile(facultyId, req.body);
 *   res.json({ success: true, data: updatedProfile });
 * }
 * ```
 */
export function extractAndValidateFacultyId(
  req: Request,
  paramName: string = 'facultyId'
): string {
  const authenticatedReq = req as AuthenticatedRequest;
  const userFacultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);
  
  // If route has facultyId parameter, validate it matches user's facultyId
  const routeFacultyId = req.params[paramName];
  if (routeFacultyId) {
    validateFacultyAccess(routeFacultyId, userFacultyId);
  }
  
  return userFacultyId;
}

/**
 * Check if user is faculty
 * 
 * Type guard to check if the authenticated user has faculty role and facultyId.
 * 
 * @param user - User context from req.user
 * @returns true if user is faculty with facultyId, false otherwise
 * 
 * @example
 * ```typescript
 * if (isFaculty(req.user)) {
 *   // User is faculty, can access faculty endpoints
 *   const facultyId = req.user.facultyId;
 * }
 * ```
 */
export function isFaculty(user: any): user is FacultyUserContext {
  return (
    user !== undefined &&
    user !== null &&
    typeof user.facultyId === 'string' &&
    user.facultyId.trim() !== ''
  );
}
