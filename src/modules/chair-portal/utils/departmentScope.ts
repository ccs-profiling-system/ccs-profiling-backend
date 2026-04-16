/**
 * Department Scoping Utilities
 * 
 * Provides utilities for extracting department information from authenticated users
 * and validating department-scoped access to resources.
 * 
 * These utilities ensure multi-tenant data isolation by preventing department chairs
 * from accessing resources outside their department scope.
 */

import { Request } from 'express';
import { NotFoundError } from '../../../shared/errors';
import { db } from '../../../db';
import { faculty } from '../../../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * User context from JWT token
 * Extended from Express Request.user
 */
export interface UserContext {
  userId: string;
  email: string;
  role: string;
}

/**
 * Department information extracted from user context
 */
export interface DepartmentInfo {
  departmentId: string;
  facultyId: string;
  facultyName: string;
}

/**
 * Extract department ID from authenticated user
 * 
 * Queries the faculty table to find the department associated with the user.
 * Department chairs must have a faculty record with a department affiliation.
 * 
 * @param user - Authenticated user context from JWT token
 * @returns Department information including department ID and faculty details
 * @throws NotFoundError if user has no faculty record or department affiliation
 * 
 * @example
 * ```typescript
 * const departmentInfo = await extractDepartmentId(req.user);
 * console.log(departmentInfo.departmentId); // "Computer Science"
 * ```
 */
export async function extractDepartmentId(user: UserContext): Promise<DepartmentInfo> {
  // Query faculty table to get department affiliation
  const result = await db
    .select({
      id: faculty.id,
      department: faculty.department,
      first_name: faculty.first_name,
      last_name: faculty.last_name,
    })
    .from(faculty)
    .where(and(
      eq(faculty.user_id, user.userId),
      isNull(faculty.deleted_at)
    ))
    .limit(1);

  const facultyRecord = result[0];

  if (!facultyRecord || !facultyRecord.department) {
    throw new NotFoundError(
      'User has no department affiliation. Department chairs must have a faculty record with a department.'
    );
  }

  return {
    departmentId: facultyRecord.department,
    facultyId: facultyRecord.id,
    facultyName: `${facultyRecord.first_name} ${facultyRecord.last_name}`,
  };
}

/**
 * Validate department access for a resource
 * 
 * Ensures that the user's department matches the resource's department.
 * Returns HTTP 404 if validation fails to prevent information leakage
 * (attacker cannot determine if resource exists in another department).
 * 
 * @param resourceDepartmentId - Department ID of the resource being accessed
 * @param userDepartmentId - Department ID of the authenticated user
 * @throws NotFoundError if departments do not match (prevents information leakage)
 * 
 * @example
 * ```typescript
 * // In a controller
 * const student = await studentRepository.findById(id);
 * if (!student) {
 *   throw new NotFoundError('Student not found');
 * }
 * 
 * // Validate department access
 * validateDepartmentAccess(student.department, departmentInfo.departmentId);
 * ```
 */
export function validateDepartmentAccess(
  resourceDepartmentId: string | null | undefined,
  userDepartmentId: string
): void {
  if (!resourceDepartmentId || resourceDepartmentId !== userDepartmentId) {
    // Return 404 instead of 403 to prevent information leakage
    // Attacker cannot determine if resource exists in another department
    throw new NotFoundError('Resource not found');
  }
}

/**
 * Extract department info from Express request
 * 
 * Convenience function that extracts department information from the
 * authenticated user in the Express request object.
 * 
 * @param req - Express request with authenticated user
 * @returns Department information
 * @throws NotFoundError if user has no department affiliation
 * 
 * @example
 * ```typescript
 * async function getStudents(req: Request, res: Response) {
 *   const departmentInfo = await extractDepartmentFromRequest(req);
 *   const students = await studentService.listStudents(departmentInfo.departmentId);
 *   res.json(students);
 * }
 * ```
 */
export async function extractDepartmentFromRequest(req: Request): Promise<DepartmentInfo> {
  if (!req.user) {
    throw new NotFoundError('User not authenticated');
  }

  return extractDepartmentId(req.user);
}

/**
 * Type guard to check if request has authenticated user
 * 
 * @param req - Express request
 * @returns true if request has user context
 */
export function hasAuthenticatedUser(req: Request): req is Request & { user: UserContext } {
  return req.user !== undefined && req.user !== null;
}
