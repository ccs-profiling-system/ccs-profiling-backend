/**
 * Research Service
 * 
 * Provides business logic for research project management in the department chair portal.
 * All operations are department-scoped through faculty adviser relationships to ensure multi-tenant data isolation.
 * 
 * Features:
 * - List research projects with pagination and filtering
 * - Get individual research project details with faculty advisor and student researchers
 * - Approve/reject research projects with workflow validation
 * - Audit logging for approval/rejection actions
 * 
 * Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14, 11.2, 11.5, 13.1
 */

import { db } from '../../../db';
import { research, researchAdvisers, researchAuthors } from '../../../db/schema/research';
import { faculty } from '../../../db/schema/faculty';
import { students } from '../../../db/schema/students';
import { eq, and, isNull, or, ilike, sql, inArray } from 'drizzle-orm';
import { PaginatedResponse, PaginationParams } from '../types';
import { validateApprovalState, validateRejectionState } from '../utils/workflowValidation';
import { AuditLogRepository, CreateAuditLogData } from '../../audit-logs/repositories/auditLog.repository';

/**
 * Research filters for list queries
 */
export interface ResearchFilters extends PaginationParams {
  status?: string;
  faculty_id?: string;
  search?: string;
}

/**
 * Faculty adviser DTO
 */
export interface FacultyAdviserDTO {
  id: string;
  faculty_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  adviser_role: string;
}

/**
 * Student researcher DTO
 */
export interface StudentResearcherDTO {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  author_order: number;
}

/**
 * Research response DTO
 */
export interface ResearchDTO {
  id: string;
  title: string;
  abstract: string | null;
  research_type: string;
  status: string;
  start_date: string | null;
  completion_date: string | null;
  publication_url: string | null;
  faculty_advisers?: FacultyAdviserDTO[];
  student_researchers?: StudentResearcherDTO[];
  created_at: string;
  updated_at: string;
}

/**
 * Approval action data
 */
export interface ApprovalData {
  approver_notes?: string;
}

/**
 * Rejection action data
 */
export interface RejectionData {
  rejection_reason: string;
}

export class ResearchService {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.auditLogRepository = new AuditLogRepository(db);
  }

  /**
   * List research projects with pagination and filtering
   * 
   * Supports filtering by:
   * - status: Filter by research status (ongoing, completed, published, pending_approval, approved, rejected)
   * - faculty_id: Filter by faculty adviser ID
   * - search: Search by title or abstract (case-insensitive)
   * 
   * All results are scoped to the specified department through faculty adviser relationships.
   * 
   * @param departmentId - Department ID to scope the query
   * @param filters - Pagination and filter parameters
   * @returns Paginated list of research projects
   * 
   * Requirements: 7.1, 7.2, 7.3, 13.1, 13.6
   */
  async listResearch(
    departmentId: string,
    filters: ResearchFilters
  ): Promise<PaginatedResponse<ResearchDTO>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const offset = (page - 1) * limit;

    // First, get faculty IDs in the department
    const departmentFaculty = await db
      .select({ id: faculty.id })
      .from(faculty)
      .where(
        and(
          eq(faculty.department, departmentId),
          isNull(faculty.deleted_at)
        )
      );

    const facultyIds = departmentFaculty.map(f => f.id);

    // If no faculty in department, return empty results
    if (facultyIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    // Get research IDs that have advisers from this department
    const departmentResearchQuery = db
      .select({ research_id: researchAdvisers.research_id })
      .from(researchAdvisers)
      .where(inArray(researchAdvisers.faculty_id, facultyIds));

    const departmentResearchIds = (await departmentResearchQuery).map(r => r.research_id);

    // If no research in department, return empty results
    if (departmentResearchIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    // Build filter conditions
    const conditions = [
      inArray(research.id, departmentResearchIds),
      isNull(research.deleted_at),
    ];

    // Add status filter
    if (filters.status) {
      conditions.push(eq(research.status, filters.status));
    }

    // Add faculty filter
    if (filters.faculty_id) {
      // Get research IDs for this specific faculty
      const facultyResearchQuery = db
        .select({ research_id: researchAdvisers.research_id })
        .from(researchAdvisers)
        .where(eq(researchAdvisers.faculty_id, filters.faculty_id));

      const facultyResearchIds = (await facultyResearchQuery).map(r => r.research_id);

      if (facultyResearchIds.length > 0) {
        conditions.push(inArray(research.id, facultyResearchIds));
      } else {
        // No research for this faculty, return empty
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }
    }

    // Add search filter (title or abstract)
    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(research.title, searchPattern),
          ilike(research.abstract, searchPattern)
        )!
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(research)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    // Get paginated results
    const results = await db
      .select()
      .from(research)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${research.created_at} DESC`);

    // Transform to DTOs (without related data for list view)
    const researchDTOs = results.map(r => this.toDTO(r));

    return {
      data: researchDTOs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get research project by ID with department validation
   * 
   * Validates that the research project has at least one adviser from the specified department.
   * Returns null if research doesn't exist or is outside department scope.
   * Includes faculty advisers and student researchers in the response.
   * 
   * @param id - Research project ID
   * @param departmentId - Department ID to validate scope
   * @returns Research project details with advisers and researchers or null if not found
   * 
   * Requirements: 7.4, 7.5, 7.6, 13.2, 13.7
   */
  async getResearchById(id: string, departmentId: string): Promise<ResearchDTO | null> {
    // Get research project
    const result = await db
      .select()
      .from(research)
      .where(
        and(
          eq(research.id, id),
          isNull(research.deleted_at)
        )
      )
      .limit(1);

    if (!result[0]) {
      return null;
    }

    const researchProject = result[0];

    // Get faculty advisers
    const advisers = await db
      .select({
        id: faculty.id,
        faculty_id: faculty.faculty_id,
        first_name: faculty.first_name,
        last_name: faculty.last_name,
        email: faculty.email,
        department: faculty.department,
        adviser_role: researchAdvisers.adviser_role,
      })
      .from(researchAdvisers)
      .innerJoin(faculty, eq(researchAdvisers.faculty_id, faculty.id))
      .where(
        and(
          eq(researchAdvisers.research_id, id),
          isNull(faculty.deleted_at)
        )
      );

    // Validate at least one adviser is from the department
    const hasDepartmentAdviser = advisers.some(a => a.department === departmentId);
    if (!hasDepartmentAdviser) {
      return null;
    }

    // Get student researchers
    const researchers = await db
      .select({
        id: students.id,
        student_id: students.student_id,
        first_name: students.first_name,
        last_name: students.last_name,
        email: students.email,
        author_order: researchAuthors.author_order,
      })
      .from(researchAuthors)
      .innerJoin(students, eq(researchAuthors.student_id, students.id))
      .where(
        and(
          eq(researchAuthors.research_id, id),
          isNull(students.deleted_at)
        )
      )
      .orderBy(researchAuthors.author_order);

    return this.toDTO(
      researchProject,
      advisers.map(a => ({
        id: a.id,
        faculty_id: a.faculty_id,
        first_name: a.first_name,
        last_name: a.last_name,
        email: a.email,
        department: a.department,
        adviser_role: a.adviser_role || 'adviser',
      })),
      researchers.map(r => ({
        id: r.id,
        student_id: r.student_id,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        author_order: r.author_order,
      }))
    );
  }

  /**
   * Approve a research project
   * 
   * Validates:
   * - Research project exists and has adviser from department
   * - Research project status is 'pending_approval'
   * 
   * On success:
   * - Updates research status to 'approved'
   * - Creates audit log entry
   * 
   * @param id - Research project ID
   * @param departmentId - Department ID to validate scope
   * @param approvalData - Approval data including optional notes
   * @param userId - ID of user performing the approval
   * @returns Updated research project or null if not found
   * @throws Error if research is not in valid state for approval
   * 
   * Requirements: 7.7, 7.8, 7.9, 7.10, 11.2, 11.5
   */
  async approveResearch(
    id: string,
    departmentId: string,
    approvalData: ApprovalData,
    userId: string
  ): Promise<ResearchDTO | null> {
    // Get research and validate department scope
    const researchProject = await this.getResearchById(id, departmentId);
    if (!researchProject) {
      return null;
    }

    // Validate workflow state
    const validation = validateApprovalState(researchProject.status as any);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update research status
    await db
      .update(research)
      .set({
        status: 'approved',
        updated_at: new Date(),
      })
      .where(eq(research.id, id))
      .returning();

    // Create audit log entry
    const auditLogData: CreateAuditLogData = {
      user_id: userId,
      action_type: 'approve',
      entity_type: 'research',
      entity_id: id,
      before_state: { status: researchProject.status },
      after_state: { 
        status: 'approved',
        approver_notes: approvalData.approver_notes,
      },
    };

    await this.auditLogRepository.create(auditLogData);

    // Return updated research with related data
    return this.getResearchById(id, departmentId);
  }

  /**
   * Reject a research project
   * 
   * Validates:
   * - Research project exists and has adviser from department
   * - Research project status is 'pending_approval'
   * 
   * On success:
   * - Updates research status to 'rejected'
   * - Creates audit log entry with rejection reason
   * 
   * @param id - Research project ID
   * @param departmentId - Department ID to validate scope
   * @param rejectionData - Rejection data including required reason
   * @param userId - ID of user performing the rejection
   * @returns Updated research project or null if not found
   * @throws Error if research is not in valid state for rejection
   * 
   * Requirements: 7.11, 7.12, 7.13, 7.14, 11.2, 11.5
   */
  async rejectResearch(
    id: string,
    departmentId: string,
    rejectionData: RejectionData,
    userId: string
  ): Promise<ResearchDTO | null> {
    // Get research and validate department scope
    const researchProject = await this.getResearchById(id, departmentId);
    if (!researchProject) {
      return null;
    }

    // Validate workflow state
    const validation = validateRejectionState(researchProject.status as any);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update research status
    await db
      .update(research)
      .set({
        status: 'rejected',
        updated_at: new Date(),
      })
      .where(eq(research.id, id))
      .returning();

    // Create audit log entry
    const auditLogData: CreateAuditLogData = {
      user_id: userId,
      action_type: 'reject',
      entity_type: 'research',
      entity_id: id,
      before_state: { status: researchProject.status },
      after_state: { 
        status: 'rejected',
        rejection_reason: rejectionData.rejection_reason,
      },
    };

    await this.auditLogRepository.create(auditLogData);

    // Return updated research with related data
    return this.getResearchById(id, departmentId);
  }

  /**
   * Transform database entity to DTO
   */
  private toDTO(
    researchProject: any,
    advisers?: FacultyAdviserDTO[],
    researchers?: StudentResearcherDTO[]
  ): ResearchDTO {
    return {
      id: researchProject.id,
      title: researchProject.title,
      abstract: researchProject.abstract,
      research_type: researchProject.research_type,
      status: researchProject.status,
      start_date: researchProject.start_date,
      completion_date: researchProject.completion_date,
      publication_url: researchProject.publication_url,
      faculty_advisers: advisers,
      student_researchers: researchers,
      created_at: researchProject.created_at.toISOString(),
      updated_at: researchProject.updated_at.toISOString(),
    };
  }
}
