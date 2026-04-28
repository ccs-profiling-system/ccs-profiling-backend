/**
 * Student Scoping Utilities
 * 
 * Utilities for extracting student_id from authenticated users and validating
 * student access to resources. Ensures students can only access their own data.
 * 
 */

import { Request } from 'express';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';

/**
 * User context from JWT token
 * Extended to include studentId for student users
 */
export interface StudentUserContext {
  userId: string;
  role: string;
  email: string;
  studentId?: string;
}

/**
 * Student access validation error
 * Thrown when student attempts to access resources outside their scope
 */
export class StudentAccessError extends Error {
  public readonly statusCode: number = 403;
  public readonly code: string = 'STUDENT_ACCESS_DENIED';

  constructor(message: string = 'Access denied: You can only access your own resources') {
    super(message);
    this.name = 'StudentAccessError';
    Object.setPrototypeOf(this, StudentAccessError.prototype);
  }
}

/**
 * Extract student_id from authenticated user
 * 
 * Retrieves the student_id from the authenticated user's JWT token context.
 * The student_id should be set during authentication when the user logs in
 * with student credentials.
 * 
 * @param user - Authenticated user from req.user
 * @returns Student ID string
 * @throws StudentAccessError if student_id is not present
 * 
 * @example
 * ```typescript
 * const studentId = extractStudentId(req.user);
 * // Use studentId to filter queries
 * const profile = await getProfileByStudentId(studentId);
 * ```
 */
export function extractStudentId(user: StudentUserContext | undefined): string {
  if (!user) {
    throw new StudentAccessError('Authentication required');
  }

  if (!user.studentId) {
    throw new StudentAccessError(
      'Student ID not found in user context. Please ensure you are logged in as a student.'
    );
  }

  return user.studentId;
}

/**
 * Validate student ownership of a resource
 * 
 * Validates that the authenticated student has access to a resource
 * by comparing the resource's student_id with the user's student_id.
 * 
 * This function should be called before allowing operations on student-scoped
 * resources such as profiles, grades, notifications, etc.
 * 
 * @param resourceStudentId - Student ID associated with the resource
 * @param userStudentId - Student ID of the authenticated user
 * @throws StudentAccessError if student IDs do not match (HTTP 403)
 * 
 * @example
 * ```typescript
 * // Validate profile access
 * const userStudentId = extractStudentId(req.user);
 * const profile = await getProfileById(studentId);
 * validateStudentOwnership(profile.student_id, userStudentId);
 * 
 * // Validate notification access
 * const notification = await getNotificationById(notificationId);
 * validateStudentOwnership(notification.student_id, userStudentId);
 * ```
 */
export function validateStudentOwnership(
  resourceStudentId: string,
  userStudentId: string
): void {
  if (resourceStudentId !== userStudentId) {
    throw new StudentAccessError(
      'Access denied: You can only access your own resources'
    );
  }
}

/**
 * Extract and validate student ID from request
 * 
 * Convenience function that combines extractStudentId and validates against
 * a route parameter. Useful for endpoints that use :studentId in the URL.
 * 
 * @param req - Express request with authenticated user
 * @param paramName - Name of the route parameter containing student ID (default: 'studentId')
 * @returns Student ID from user context
 * @throws StudentAccessError if student IDs do not match
 * 
 * @example
 * ```typescript
 * // Route: PUT /api/student/:studentId/profile
 * async function updateProfile(req: AuthenticatedRequest, res: Response) {
 *   const studentId = extractAndValidateStudentId(req);
 *   // studentId is validated to match req.params.studentId
 *   const updatedProfile = await profileService.updateProfile(studentId, req.body);
 *   res.json({ success: true, data: updatedProfile });
 * }
 * ```
 */
export function extractAndValidateStudentId(
  req: Request,
  paramName: string = 'studentId'
): string {
  const authenticatedReq = req as AuthenticatedRequest;
  const userStudentId = extractStudentId(authenticatedReq.user as StudentUserContext);
  
  // If route has studentId parameter, validate it matches user's studentId
  const routeStudentId = req.params[paramName];
  if (routeStudentId) {
    validateStudentOwnership(routeStudentId, userStudentId);
  }
  
  return userStudentId;
}

/**
 * Check if user is student
 * 
 * Type guard to check if the authenticated user has student role and studentId.
 * 
 * @param user - User context from req.user
 * @returns true if user is student with studentId, false otherwise
 * 
 * @example
 * ```typescript
 * if (isStudent(req.user)) {
 *   // User is student, can access student endpoints
 *   const studentId = req.user.studentId;
 * }
 * ```
 */
export function isStudent(user: any): user is StudentUserContext {
  return (
    user !== undefined &&
    user !== null &&
    typeof user.studentId === 'string' &&
    user.studentId.trim() !== ''
  );
}
