/**
 * Faculty Portal - Research Service
 * Business logic layer for research project management
 * 
 * Handles research project creation, updates, and retrieval for faculty members.
 * Validates faculty association with research projects and enforces status transitions.
 * 
 * Requirements: 7.1-7.22, 12.2, 12.3, 12.6, 12.7, 12.8
 */

import { eq, and, or, isNull, sql, inArray } from 'drizzle-orm';
import { Database } from '../../../db';
import { research, researchAdvisers, researchAuthors, students, faculty } from '../../../db/schema';
import { ResearchProjectDTO, PaginationParams, PaginatedResponse } from '../types';
import { auditLogRepository } from '../../audit-logs';

/**
 * Research not found error
 * Thrown when a research project doesn't exist
 */
export class ResearchNotFoundError extends Error {
  public readonly statusCode: number = 404;
  public readonly code: string = 'RESEARCH_NOT_FOUND';

  constructor(researchId: string) {
    super(`Research project with ID ${researchId} not found`);
    this.name = 'ResearchNotFoundError';
    Object.setPrototypeOf(this, ResearchNotFoundError.prototype);
  }
}

/**
 * Research access denied error
 * Thrown when faculty attempts to access research they're not associated with
 */
export class ResearchAccessDeniedError extends Error {
  public readonly statusCode: number = 403;
  public readonly code: string = 'RESEARCH_ACCESS_DENIED';

  constructor() {
    super('You do not have permission to access this research project');
    this.name = 'ResearchAccessDeniedError';
    Object.setPrototypeOf(this, ResearchAccessDeniedError.prototype);
  }
}

/**
 * Invalid research status error
 * Thrown when attempting to update approved/rejected research
 */
export class InvalidResearchStatusError extends Error {
  public readonly statusCode: number = 400;
  public readonly code: string = 'INVALID_RESEARCH_STATUS';

  constructor(currentStatus: string) {
    super(`Cannot update research with status '${currentStatus}'. Only draft or pending_approval research can be updated.`);
    this.name = 'InvalidResearchStatusError';
    Object.setPrototypeOf(this, InvalidResearchStatusError.prototype);
  }
}

/**
 * Invalid status transition error
 * Thrown when attempting an invalid status transition
 */
export class InvalidStatusTransitionError extends Error {
  public readonly statusCode: number = 400;
  public readonly code: string = 'INVALID_STATUS_TRANSITION';

  constructor(fromStatus: string, toStatus: string) {
    super(`Invalid status transition from '${fromStatus}' to '${toStatus}'. Valid transitions: draft → pending_approval → approved/rejected`);
    this.name = 'InvalidStatusTransitionError';
    Object.setPrototypeOf(this, InvalidStatusTransitionError.prototype);
  }
}

/**
 * Research filters for list queries
 */
export interface ResearchFilters {
  status?: string;
}

/**
 * Create research input data
 */
export interface CreateResearchData {
  title: string;
  description: string;
  research_type: string;
  start_date: string;
  end_date?: string;
  funding_source?: string;
  budget?: number;
  student_researchers?: string[];
}

/**
 * Update research input data
 */
export interface UpdateResearchData {
  title?: string;
  description?: string;
  status?: string;
  end_date?: string;
  funding_source?: string;
  budget?: number;
  student_researchers?: string[];
}

export class ResearchService {
  constructor(private db: Database) {}

  /**
   * List research projects by faculty with pagination and filtering
   * 
   * Retrieves research projects where the faculty is the primary researcher or adviser.
   * Supports pagination and filtering by status.
   * 
   * @param facultyId - The faculty UUID
   * @param pagination - Pagination parameters (page, limit)
   * @param filters - Optional filters (status)
   * @returns Paginated list of research projects
   * 
   * Requirements:
   * - 7.1: Endpoint protected by faculty.research.read permission with pagination
   * - 7.2: Filter results by authenticated user's faculty_id as primary researcher or adviser
   * - 7.3: Accept page, limit, and status query parameters
   * - 7.4: Return results with pagination metadata
   * - 7.5: Return project details including title, description, status, dates, collaborators
   */
  async listResearchByFaculty(
    facultyId: string,
    pagination: PaginationParams,
    filters?: ResearchFilters
  ): Promise<PaginatedResponse<ResearchProjectDTO>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Build conditions for filtering
    const conditions = [isNull(research.deleted_at)];

    if (filters?.status) {
      conditions.push(eq(research.status, filters.status));
    }

    // Find research IDs where faculty is an adviser
    const adviserResearchIds = await this.db
      .select({ research_id: researchAdvisers.research_id })
      .from(researchAdvisers)
      .where(eq(researchAdvisers.faculty_id, facultyId));

    const adviserResearchIdSet = new Set(adviserResearchIds.map(r => r.research_id));

    // Get total count of research projects associated with faculty
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(research)
      .where(and(...conditions));

    const allResearch = await this.db
      .select()
      .from(research)
      .where(and(...conditions))
      .orderBy(sql`${research.created_at} DESC`);

    // Filter by faculty association (as adviser)
    const facultyResearch = allResearch.filter(r => adviserResearchIdSet.has(r.id));
    const total = facultyResearch.length;

    // Apply pagination
    const paginatedResearch = facultyResearch.slice(offset, offset + limit);

    // Fetch related data for each research project
    const researchDTOs = await Promise.all(
      paginatedResearch.map(r => this.buildResearchDTO(r))
    );

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
   * Get research project by ID with faculty validation
   * 
   * Retrieves a single research project with full details.
   * Validates that the faculty is associated with the research project.
   * 
   * @param id - The research UUID
   * @param facultyId - The faculty UUID to validate association
   * @returns Research project details
   * @throws ResearchNotFoundError if research doesn't exist (HTTP 404)
   * @throws ResearchAccessDeniedError if faculty not associated with research (HTTP 403)
   * 
   * Requirements:
   * - 7.6: Endpoint protected by faculty.research.read permission
   * - 7.7: Validate research project is associated with authenticated faculty
   * - 7.8: Return HTTP 403 if faculty not associated with research
   * - 7.9: Include full project information, student researchers, and project milestones
   */
  async getResearchById(id: string, facultyId: string): Promise<ResearchProjectDTO> {
    // Fetch research project
    const researchResult = await this.db
      .select()
      .from(research)
      .where(and(eq(research.id, id), isNull(research.deleted_at)))
      .limit(1);

    if (researchResult.length === 0) {
      throw new ResearchNotFoundError(id);
    }

    const researchProject = researchResult[0];

    // Validate faculty association (as adviser)
    const adviserAssociation = await this.db
      .select()
      .from(researchAdvisers)
      .where(
        and(
          eq(researchAdvisers.research_id, id),
          eq(researchAdvisers.faculty_id, facultyId)
        )
      )
      .limit(1);

    if (adviserAssociation.length === 0) {
      throw new ResearchAccessDeniedError();
    }

    // Build and return DTO
    return this.buildResearchDTO(researchProject);
  }

  /**
   * Create a new research project
   * 
   * Creates a new research project with the faculty as the primary adviser.
   * Sets initial status to 'draft'.
   * Validates start_date is not in the past and end_date is after start_date.
   * Creates audit log entry for the creation.
   * 
   * @param data - Research project data
   * @param facultyId - The faculty UUID (will be set as primary adviser)
   * @param userId - The user ID for audit logging
   * @returns Created research project details
   * 
   * Requirements:
   * - 7.10: Endpoint protected by faculty.research.create permission
   * - 7.11: Require title, description, research_type, start_date
   * - 7.12: Accept optional fields: end_date, funding_source, budget, student_researchers
   * - 7.13: Set authenticated user's faculty_id as primary researcher
   * - 7.14: Set initial status to 'draft'
   * - 7.15: Validate start_date is not in the past
   * - 7.16: Validate end_date is after start_date if provided
   * - 12.2: Create audit log entry for research creation
   */
  async createResearch(
    data: CreateResearchData,
    facultyId: string,
    userId: string
  ): Promise<ResearchProjectDTO> {
    // Note: Date validation is handled by Zod schema in controller layer
    // start_date not in past and end_date after start_date are validated there

    // Create research project with status 'draft'
    const newResearch = await this.db
      .insert(research)
      .values({
        title: data.title,
        abstract: data.description,
        research_type: data.research_type,
        status: 'draft',
        start_date: data.start_date,
        completion_date: data.end_date || null,
        // Note: funding_source and budget fields don't exist in current schema
        // These would need to be added via migration if required
      })
      .returning();

    const createdResearch = newResearch[0];

    // Add faculty as primary adviser
    await this.db.insert(researchAdvisers).values({
      research_id: createdResearch.id,
      faculty_id: facultyId,
      adviser_role: 'adviser',
    });

    // Add student researchers if provided
    if (data.student_researchers && data.student_researchers.length > 0) {
      const authorValues = data.student_researchers.map((studentId, index) => ({
        research_id: createdResearch.id,
        student_id: studentId,
        author_order: index + 1,
      }));

      await this.db.insert(researchAuthors).values(authorValues);
    }

    // Create audit log entry
    await auditLogRepository.create({
      user_id: userId,
      action_type: 'research_create',
      entity_type: 'research',
      entity_id: createdResearch.id,
      after_state: {
        title: data.title,
        research_type: data.research_type,
        status: 'draft',
      },
    });

    // Build and return DTO
    return this.buildResearchDTO(createdResearch);
  }

  /**
   * Update an existing research project
   * 
   * Updates research project fields with validation.
   * Validates faculty association, status transitions, and prevents updates to approved/rejected research.
   * Creates audit log entry for the update.
   * 
   * @param id - The research UUID
   * @param data - Research project update data
   * @param facultyId - The faculty UUID to validate association
   * @param userId - The user ID for audit logging
   * @returns Updated research project details
   * @throws ResearchNotFoundError if research doesn't exist (HTTP 404)
   * @throws ResearchAccessDeniedError if faculty not associated with research (HTTP 403)
   * @throws InvalidResearchStatusError if attempting to update approved/rejected research (HTTP 400)
   * @throws InvalidStatusTransitionError if status transition is invalid (HTTP 400)
   * 
   * Requirements:
   * - 7.17: Endpoint protected by faculty.research.update permission
   * - 7.18: Validate research project is associated with authenticated faculty
   * - 7.19: Accept optional fields: title, description, status, end_date, funding_source, budget, student_researchers
   * - 7.20: Validate status transitions (draft → pending_approval → approved/rejected)
   * - 7.21: Return HTTP 400 if attempting to update approved/rejected research
   * - 7.22: Return HTTP 403 if faculty not associated with research
   * - 12.3: Create audit log entry for research update
   */
  async updateResearch(
    id: string,
    data: UpdateResearchData,
    facultyId: string,
    userId: string
  ): Promise<ResearchProjectDTO> {
    // Fetch research project
    const researchResult = await this.db
      .select()
      .from(research)
      .where(and(eq(research.id, id), isNull(research.deleted_at)))
      .limit(1);

    if (researchResult.length === 0) {
      throw new ResearchNotFoundError(id);
    }

    const existingResearch = researchResult[0];

    // Validate faculty association (as adviser)
    const adviserAssociation = await this.db
      .select()
      .from(researchAdvisers)
      .where(
        and(
          eq(researchAdvisers.research_id, id),
          eq(researchAdvisers.faculty_id, facultyId)
        )
      )
      .limit(1);

    if (adviserAssociation.length === 0) {
      throw new ResearchAccessDeniedError();
    }

    // Validate status - cannot update approved or rejected research
    if (existingResearch.status === 'approved' || existingResearch.status === 'rejected') {
      throw new InvalidResearchStatusError(existingResearch.status);
    }

    // Validate status transition if status is being updated
    if (data.status && data.status !== existingResearch.status) {
      this.validateStatusTransition(existingResearch.status, data.status);
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.abstract = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.end_date !== undefined) updateData.completion_date = data.end_date;
    // Note: funding_source and budget fields don't exist in current schema

    // Update research project
    await this.db
      .update(research)
      .set(updateData)
      .where(eq(research.id, id));

    // Update student researchers if provided
    if (data.student_researchers !== undefined) {
      // Remove existing authors
      await this.db
        .delete(researchAuthors)
        .where(eq(researchAuthors.research_id, id));

      // Add new authors
      if (data.student_researchers.length > 0) {
        const authorValues = data.student_researchers.map((studentId, index) => ({
          research_id: id,
          student_id: studentId,
          author_order: index + 1,
        }));

        await this.db.insert(researchAuthors).values(authorValues);
      }
    }

    // Create audit log entry
    await auditLogRepository.create({
      user_id: userId,
      action_type: 'research_update',
      entity_type: 'research',
      entity_id: id,
      before_state: {
        title: existingResearch.title,
        status: existingResearch.status,
      },
      after_state: {
        title: data.title || existingResearch.title,
        status: data.status || existingResearch.status,
      },
    });

    // Fetch updated research and return DTO
    const updatedResearch = await this.db
      .select()
      .from(research)
      .where(eq(research.id, id))
      .limit(1);

    return this.buildResearchDTO(updatedResearch[0]);
  }

  /**
   * Validate status transition
   * 
   * Valid transitions:
   * - draft → pending_approval
   * - pending_approval → approved
   * - pending_approval → rejected
   * 
   * @param fromStatus - Current status
   * @param toStatus - Target status
   * @throws InvalidStatusTransitionError if transition is invalid
   */
  private validateStatusTransition(fromStatus: string, toStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      draft: ['pending_approval'],
      pending_approval: ['approved', 'rejected'],
      approved: [],
      rejected: [],
    };

    const allowedTransitions = validTransitions[fromStatus] || [];

    if (!allowedTransitions.includes(toStatus)) {
      throw new InvalidStatusTransitionError(fromStatus, toStatus);
    }
  }

  /**
   * Build ResearchProjectDTO from database entity
   * 
   * Fetches related student researchers and advisers and constructs the DTO.
   * 
   * @param researchEntity - Research database entity
   * @returns ResearchProjectDTO with all related data
   */
  private async buildResearchDTO(researchEntity: any): Promise<ResearchProjectDTO> {
    // Fetch student researchers
    const authors = await this.db
      .select({
        student_id: researchAuthors.student_id,
        student_first_name: students.first_name,
        student_last_name: students.last_name,
        author_order: researchAuthors.author_order,
      })
      .from(researchAuthors)
      .innerJoin(students, eq(researchAuthors.student_id, students.id))
      .where(eq(researchAuthors.research_id, researchEntity.id))
      .orderBy(researchAuthors.author_order);

    // Fetch advisers
    const advisers = await this.db
      .select({
        faculty_id: researchAdvisers.faculty_id,
        faculty_first_name: faculty.first_name,
        faculty_last_name: faculty.last_name,
        adviser_role: researchAdvisers.adviser_role,
      })
      .from(researchAdvisers)
      .innerJoin(faculty, eq(researchAdvisers.faculty_id, faculty.id))
      .where(eq(researchAdvisers.research_id, researchEntity.id));

    return {
      id: researchEntity.id,
      title: researchEntity.title,
      description: researchEntity.abstract,
      research_type: researchEntity.research_type,
      status: researchEntity.status,
      start_date: researchEntity.start_date,
      end_date: researchEntity.completion_date,
      funding_source: null, // Not in current schema
      budget: null, // Not in current schema
      student_researchers: authors.map(a => ({
        student_id: a.student_id,
        student_name: `${a.student_first_name} ${a.student_last_name}`,
      })),
      advisers: advisers.map(a => ({
        faculty_id: a.faculty_id,
        faculty_name: `${a.faculty_first_name} ${a.faculty_last_name}`,
        adviser_role: a.adviser_role || 'adviser',
      })),
      created_at: researchEntity.created_at.toISOString(),
      updated_at: researchEntity.updated_at.toISOString(),
    };
  }
}
