import { db } from '../../../db';
import { students } from '../../../db/schema/students';
import { faculty } from '../../../db/schema/faculty';
import { events } from '../../../db/schema/events';
import { research, researchAuthors } from '../../../db/schema/research';
import { eq, and, isNull, asc } from 'drizzle-orm';

/**
 * Error thrown when department cannot be determined for an entity
 */
export class DepartmentNotFoundError extends Error {
  constructor(entityType: string, entityId: string, reason?: string) {
    super(
      `Cannot determine department for ${entityType} with ID ${entityId}${
        reason ? `: ${reason}` : ''
      }`
    );
    this.name = 'DepartmentNotFoundError';
  }
}

/**
 * Department Assignment Service
 * 
 * Determines the department_id for various entity types.
 * Used by the approval system to assign change requests to departments.
 */
export class DepartmentAssignmentService {
  /**
   * Determine the department ID for a given entity
   * 
   * @param entityType - Type of entity ('student', 'faculty', 'event', 'research')
   * @param entityId - UUID of the entity
   * @returns Department ID (string)
   * @throws DepartmentNotFoundError if department cannot be determined
   */
  async determineDepartmentId(entityType: string, entityId: string): Promise<string> {
    switch (entityType) {
      case 'student':
        return this.getStudentDepartment(entityId);
      case 'faculty':
        return this.getFacultyDepartment(entityId);
      case 'event':
        return this.getEventDepartment(entityId);
      case 'research':
        return this.getResearchDepartment(entityId);
      default:
        throw new DepartmentNotFoundError(
          entityType,
          entityId,
          `Unknown entity type: ${entityType}`
        );
    }
  }

  /**
   * Get department for a student entity
   * 
   * Students have a program field which maps to a department.
   * For now, we use the program field as the department identifier.
   * 
   * @param studentId - Student UUID
   * @returns Department ID
   * @throws DepartmentNotFoundError if student not found or has no program
   */
  private async getStudentDepartment(studentId: string): Promise<string> {
    const student = await db.query.students.findFirst({
      where: (students, { eq, and, isNull }) =>
        and(eq(students.id, studentId), isNull(students.deleted_at)),
    });

    if (!student) {
      throw new DepartmentNotFoundError('student', studentId, 'Student not found');
    }

    if (!student.program) {
      throw new DepartmentNotFoundError(
        'student',
        studentId,
        'Student has no program assigned'
      );
    }

    // For now, use program as department identifier
    // In a future enhancement, this could map to a departments table
    return student.program;
  }

  /**
   * Get department for a faculty entity
   * 
   * Faculty have a direct department field.
   * 
   * @param facultyId - Faculty UUID
   * @returns Department ID
   * @throws DepartmentNotFoundError if faculty not found or has no department
   */
  private async getFacultyDepartment(facultyId: string): Promise<string> {
    const facultyMember = await db.query.faculty.findFirst({
      where: (faculty, { eq, and, isNull }) =>
        and(eq(faculty.id, facultyId), isNull(faculty.deleted_at)),
    });

    if (!facultyMember) {
      throw new DepartmentNotFoundError('faculty', facultyId, 'Faculty not found');
    }

    if (!facultyMember.department) {
      throw new DepartmentNotFoundError(
        'faculty',
        facultyId,
        'Faculty has no department assigned'
      );
    }

    return facultyMember.department;
  }

  /**
   * Get department for an event entity
   * 
   * Events have a department_id field.
   * 
   * @param eventId - Event UUID
   * @returns Department ID
   * @throws DepartmentNotFoundError if event not found or has no department
   */
  private async getEventDepartment(eventId: string): Promise<string> {
    const event = await db.query.events.findFirst({
      where: (events, { eq, and, isNull }) =>
        and(eq(events.id, eventId), isNull(events.deleted_at)),
    });

    if (!event) {
      throw new DepartmentNotFoundError('event', eventId, 'Event not found');
    }

    if (!event.department_id) {
      throw new DepartmentNotFoundError(
        'event',
        eventId,
        'Event has no department assigned'
      );
    }

    return event.department_id;
  }

  /**
   * Get department for a research entity
   * 
   * Research projects don't have a direct department field.
   * We determine the department from the first author (student).
   * 
   * @param researchId - Research UUID
   * @returns Department ID
   * @throws DepartmentNotFoundError if research not found or has no authors
   */
  private async getResearchDepartment(researchId: string): Promise<string> {
    // First, verify the research exists
    const researchProject = await db.query.research.findFirst({
      where: (research, { eq, and, isNull }) =>
        and(eq(research.id, researchId), isNull(research.deleted_at)),
    });

    if (!researchProject) {
      throw new DepartmentNotFoundError('research', researchId, 'Research not found');
    }

    // Get the first author (lowest author_order) using a join query
    const [firstAuthorResult] = await db
      .select({
        student_id: researchAuthors.student_id,
        author_order: researchAuthors.author_order,
        program: students.program,
      })
      .from(researchAuthors)
      .innerJoin(students, eq(researchAuthors.student_id, students.id))
      .where(
        and(
          eq(researchAuthors.research_id, researchId),
          isNull(students.deleted_at)
        )
      )
      .orderBy(researchAuthors.author_order)
      .limit(1);

    if (!firstAuthorResult) {
      throw new DepartmentNotFoundError(
        'research',
        researchId,
        'Research has no authors assigned'
      );
    }

    // Get the student's department via their program
    if (!firstAuthorResult.program) {
      throw new DepartmentNotFoundError(
        'research',
        researchId,
        'First author has no program assigned'
      );
    }

    return firstAuthorResult.program;
  }
}

// Export singleton instance
export const departmentAssignmentService = new DepartmentAssignmentService();
