/**
 * Student Portal - Research Service
 * Business logic layer for research opportunity management
 * 
 * Handles research opportunity browsing, application submission, and status tracking.
 * Ensures students can only access their own applications.
 * 
 * Requirements: 13.1-13.6, 14.1-14.4, 15.1-15.8, 16.1-16.4, 29.1-29.5
 */

import { eq, asc, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { 
  research, 
  researchAdvisers, 
  researchApplications,
  faculty
} from '../../../db/schema';
import { NotFoundError } from '../../../shared/errors';
import { 
  ResearchOpportunityDTO, 
  ResearchOpportunityDetailsDTO,
  ResearchApplicationStatusDTO,
  PaginatedResponse,
  PaginationParams 
} from '../types';
import { StudentAccessError } from '../utils/studentScope';

export class ResearchService {
  constructor(private db: Database) {}

  /**
   * List available research opportunities with pagination
   * 
   * Retrieves approved research opportunities that are open for applications.
   * Filters by status 'approved' and application_deadline >= current date.
   * 
   * Note: The current research table schema doesn't have application_deadline or status='approved'.
   * This implementation uses status='ongoing' as a proxy for available opportunities.
   * 
   * @param params - Pagination parameters (page, limit)
   * @returns Paginated list of research opportunities
   * 
   * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
   */
  async listOpportunities(params: PaginationParams): Promise<PaginatedResponse<ResearchOpportunityDTO>> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    // Count total opportunities
    const countResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(research)
      .where(eq(research.status, 'ongoing'));

    const total = countResult[0]?.count || 0;

    // Fetch opportunities with pagination
    const opportunities = await this.db
      .select({
        id: research.id,
        title: research.title,
        description: research.abstract,
        research_type: research.research_type,
        start_date: research.start_date,
        faculty_id: researchAdvisers.faculty_id,
        faculty_first_name: faculty.first_name,
        faculty_last_name: faculty.last_name,
      })
      .from(research)
      .leftJoin(researchAdvisers, eq(research.id, researchAdvisers.research_id))
      .leftJoin(faculty, eq(researchAdvisers.faculty_id, faculty.id))
      .where(eq(research.status, 'ongoing'))
      .orderBy(asc(research.start_date))
      .limit(limit)
      .offset(offset);

    // Count applicants for each opportunity
    const opportunityIds = opportunities.map(o => o.id);
    const applicantCounts = opportunityIds.length > 0
      ? await this.db
          .select({
            research_id: researchApplications.research_id,
            count: sql<number>`count(*)::int`,
          })
          .from(researchApplications)
          .where(sql`${researchApplications.research_id} IN ${sql.raw(`(${opportunityIds.map(() => '?').join(',')})`)}`)
          .groupBy(researchApplications.research_id)
      : [];

    const applicantCountMap = new Map(
      applicantCounts.map(ac => [ac.research_id, ac.count])
    );

    const data = opportunities.map(opp => {
      return {
        id: opp.id,
        title: opp.title,
        description: opp.description,
        research_type: opp.research_type,
        faculty_adviser_name: opp.faculty_first_name && opp.faculty_last_name
          ? `${opp.faculty_first_name} ${opp.faculty_last_name}`
          : 'Not assigned',
        required_skills: null, // Not available in current schema
        start_date: opp.start_date || null,
        application_deadline: null, // Not available in current schema
        available_positions: null, // Not available in current schema
        current_applicants: applicantCountMap.get(opp.id) || 0,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get detailed information about a specific research opportunity
   * 
   * Retrieves comprehensive opportunity information including faculty contact details.
   * 
   * @param opportunityId - The research opportunity UUID
   * @returns Detailed research opportunity information
   * @throws NotFoundError if opportunity not found or not available
   * 
   * Requirements: 14.1, 14.2, 14.3
   */
  async getOpportunityById(opportunityId: string): Promise<ResearchOpportunityDetailsDTO> {
    const result = await this.db
      .select({
        id: research.id,
        title: research.title,
        description: research.abstract,
        research_type: research.research_type,
        status: research.status,
        start_date: research.start_date,
        faculty_id: researchAdvisers.faculty_id,
        faculty_first_name: faculty.first_name,
        faculty_last_name: faculty.last_name,
        faculty_email: faculty.email,
        faculty_phone: faculty.phone,
      })
      .from(research)
      .leftJoin(researchAdvisers, eq(research.id, researchAdvisers.research_id))
      .leftJoin(faculty, eq(researchAdvisers.faculty_id, faculty.id))
      .where(eq(research.id, opportunityId))
      .limit(1);

    const opportunity = result[0];

    if (!opportunity || opportunity.status !== 'ongoing') {
      throw new NotFoundError('Research opportunity not found or not available');
    }

    // Count current applicants
    const applicantCountResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(researchApplications)
      .where(eq(researchApplications.research_id, opportunityId));

    const currentApplicants = applicantCountResult[0]?.count || 0;

    return {
      id: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      research_type: opportunity.research_type,
      faculty_adviser_name: opportunity.faculty_first_name && opportunity.faculty_last_name
        ? `${opportunity.faculty_first_name} ${opportunity.faculty_last_name}`
        : 'Not assigned',
      required_skills: null, // Not available in current schema
      start_date: opportunity.start_date || null,
      application_deadline: null, // Not available in current schema
      available_positions: null, // Not available in current schema
      current_applicants: currentApplicants,
      full_description: opportunity.description || '',
      required_qualifications: null, // Not available in current schema
      time_commitment: null, // Not available in current schema
      compensation_details: null, // Not available in current schema
      faculty_email: opportunity.faculty_email || '',
      faculty_phone: opportunity.faculty_phone,
    };
  }

  /**
   * REMOVED: createApplication
   * 
   * Reason: Students are viewers in the profiling system.
   * Research applications are managed through Faculty → Secretary → Chair → Admin workflow.
   * Students can view opportunities and check application status, but cannot self-apply.
   */

  /**
   * Get application status
   * 
   * Retrieves application details including research title, faculty adviser,
   * application date, status, and feedback.
   * 
   * @param applicationId - The application UUID
   * @param studentId - The student UUID (for ownership validation)
   * @returns Application status details
   * @throws NotFoundError if application not found
   * @throws StudentAccessError if application doesn't belong to student
   * 
   * Requirements: 16.1, 16.2, 16.3
   */
  async getApplicationStatus(
    applicationId: string,
    studentId: string
  ): Promise<ResearchApplicationStatusDTO> {
    const result = await this.db
      .select({
        id: researchApplications.id,
        research_id: researchApplications.research_id,
        student_id: researchApplications.student_id,
        application_date: researchApplications.application_date,
        status: researchApplications.status,
        faculty_feedback: researchApplications.faculty_feedback,
        research_title: research.title,
        faculty_first_name: faculty.first_name,
        faculty_last_name: faculty.last_name,
      })
      .from(researchApplications)
      .leftJoin(research, eq(researchApplications.research_id, research.id))
      .leftJoin(researchAdvisers, eq(research.id, researchAdvisers.research_id))
      .leftJoin(faculty, eq(researchAdvisers.faculty_id, faculty.id))
      .where(eq(researchApplications.id, applicationId))
      .limit(1);

    const application = result[0];

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    // Validate ownership
    if (application.student_id !== studentId) {
      throw new StudentAccessError(
        'Access denied: You can only view your own applications'
      );
    }

    return {
      id: application.id,
      research_title: application.research_title || 'Unknown',
      faculty_adviser_name: application.faculty_first_name && application.faculty_last_name
        ? `${application.faculty_first_name} ${application.faculty_last_name}`
        : 'Not assigned',
      application_date: application.application_date,
      status: application.status as 'pending' | 'accepted' | 'rejected',
      faculty_feedback: application.faculty_feedback,
    };
  }
}
