/**
 * Research Service
 * Business logic layer for research operations
 * 
 * Requirements: 12.1, 12.6, 12.7, 26.6, 26.7
 */

import { ResearchRepository } from '../repositories/research.repository';
import { NotFoundError, ConflictError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import { db } from '../../../db';
import {
  CreateResearchDTO,
  UpdateResearchDTO,
  ResearchResponseDTO,
  ResearchListResponseDTO,
  AddAuthorDTO,
  AddAdviserDTO,
  ResearchFilters,
} from '../types';

export class ResearchService {
  constructor(private researchRepository: ResearchRepository) {}

  /**
   * Get research by ID
   * Requirement: 12.1
   */
  async getResearch(id: string): Promise<ResearchResponseDTO> {
    const researchRecord = await this.researchRepository.findById(id);
    if (!researchRecord) {
      throw new NotFoundError('Research not found');
    }

    // Fetch authors and advisers
    const authors = await this.researchRepository.getAuthors(id);
    const advisers = await this.researchRepository.getAdvisers(id);

    return this.toResponseDTO(researchRecord, authors, advisers);
  }

  /**
   * List research with pagination and filters
   * Requirement: 12.1
   */
  async listResearch(filters?: ResearchFilters): Promise<ResearchListResponseDTO> {
    const result = await this.researchRepository.findAll(filters);

    // Batch fetch authors and advisers for all research records
    const researchIds = result.data.map((r) => r.id);
    const { authors: allAuthors, advisers: allAdvisers } =
      await this.researchRepository.getAuthorsAndAdvisersForMultiple(researchIds);

    // Group authors and advisers by research ID
    const authorsByResearch = new Map<string, typeof allAuthors>();
    const advisersByResearch = new Map<string, typeof allAdvisers>();

    allAuthors.forEach((a) => {
      const researchId = a.author.research_id;
      if (!authorsByResearch.has(researchId)) {
        authorsByResearch.set(researchId, []);
      }
      authorsByResearch.get(researchId)!.push(a);
    });

    allAdvisers.forEach((a) => {
      const researchId = a.adviser.research_id;
      if (!advisersByResearch.has(researchId)) {
        advisersByResearch.set(researchId, []);
      }
      advisersByResearch.get(researchId)!.push(a);
    });

    // Transform to DTOs
    const researchWithDetails = result.data.map((research) => {
      const authors = authorsByResearch.get(research.id) || [];
      const advisers = advisersByResearch.get(research.id) || [];
      return this.toResponseDTO(research, authors, advisers);
    });

    return {
      data: researchWithDetails,
      meta: result.meta,
    };
  }

  /**
   * Create a new research with authors and advisers
   * Uses transaction to ensure atomicity
   * Requirements: 12.1, 12.6, 12.7, 26.6
   */
  async createResearch(data: CreateResearchDTO): Promise<ResearchResponseDTO> {
    // Generate UUID v7 for primary key
    const id = generateUUIDv7();

    // Use transaction for multi-step operation
    const result = await db.transaction(async (tx) => {
      // Create research
      const researchRecord = await this.researchRepository.create(
        {
          id,
          title: data.title,
          abstract: data.abstract,
          research_type: data.research_type,
          status: data.status || 'ongoing',
          start_date: data.start_date,
          completion_date: data.completion_date,
          publication_url: data.publication_url,
        },
        tx
      );

      // Add authors
      const authorPromises = data.author_ids.map((studentId, index) => {
        const authorId = generateUUIDv7();
        return this.researchRepository.addAuthor(
          {
            id: authorId,
            research_id: id,
            student_id: studentId,
            author_order: index + 1,
          },
          tx
        );
      });

      await Promise.all(authorPromises);

      // Add advisers
      const adviserPromises = data.adviser_ids.map((facultyId) => {
        const adviserId = generateUUIDv7();
        return this.researchRepository.addAdviser(
          {
            id: adviserId,
            research_id: id,
            faculty_id: facultyId,
            adviser_role: 'adviser',
          },
          tx
        );
      });

      await Promise.all(adviserPromises);

      return researchRecord;
    });

    // Fetch complete research with authors and advisers
    return this.getResearch(result.id);
  }

  /**
   * Update research by ID
   * Requirement: 12.1
   */
  async updateResearch(id: string, data: UpdateResearchDTO): Promise<ResearchResponseDTO> {
    // Check if research exists
    const existing = await this.researchRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Research not found');
    }

    // Update research
    await this.researchRepository.update(id, data);

    // Return updated research
    return this.getResearch(id);
  }

  /**
   * Delete research by ID (soft delete)
   * Requirement: 12.1
   */
  async deleteResearch(id: string): Promise<void> {
    const existing = await this.researchRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Research not found');
    }

    await this.researchRepository.softDelete(id);
  }

  /**
   * Add author to research
   * Requirements: 12.6, 26.7
   */
  async addAuthor(researchId: string, data: AddAuthorDTO): Promise<void> {
    // Verify research exists
    const research = await this.researchRepository.findById(researchId);
    if (!research) {
      throw new NotFoundError('Research not found');
    }

    // Verify student exists
    const student = await this.researchRepository.findStudentById(data.student_id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if author already exists
    const existingAuthor = await this.researchRepository.findExistingAuthor(
      researchId,
      data.student_id
    );

    if (existingAuthor) {
      throw new ConflictError('Author is already linked to this research');
    }

    // Generate UUID v7 for author
    const id = generateUUIDv7();

    // Add author
    await this.researchRepository.addAuthor({
      id,
      research_id: researchId,
      student_id: data.student_id,
      author_order: data.author_order,
    });
  }

  /**
   * Remove author from research
   * Requirement: 12.6
   */
  async removeAuthor(researchId: string, studentId: string): Promise<void> {
    // Verify research exists
    const research = await this.researchRepository.findById(researchId);
    if (!research) {
      throw new NotFoundError('Research not found');
    }

    // Verify author exists
    const existingAuthor = await this.researchRepository.findExistingAuthor(
      researchId,
      studentId
    );

    if (!existingAuthor) {
      throw new NotFoundError('Author not found for this research');
    }

    await this.researchRepository.removeAuthor(researchId, studentId);
  }

  /**
   * Add adviser to research
   * Requirements: 12.7, 26.7
   */
  async addAdviser(researchId: string, data: AddAdviserDTO): Promise<void> {
    // Verify research exists
    const research = await this.researchRepository.findById(researchId);
    if (!research) {
      throw new NotFoundError('Research not found');
    }

    // Verify faculty exists
    const facultyMember = await this.researchRepository.findFacultyById(data.faculty_id);
    if (!facultyMember) {
      throw new NotFoundError('Faculty not found');
    }

    // Check if adviser already exists
    const existingAdviser = await this.researchRepository.findExistingAdviser(
      researchId,
      data.faculty_id
    );

    if (existingAdviser) {
      throw new ConflictError('Adviser is already linked to this research');
    }

    // Generate UUID v7 for adviser
    const id = generateUUIDv7();

    // Add adviser
    await this.researchRepository.addAdviser({
      id,
      research_id: researchId,
      faculty_id: data.faculty_id,
      adviser_role: data.adviser_role || 'adviser',
    });
  }

  /**
   * Remove adviser from research
   * Requirement: 12.7
   */
  async removeAdviser(researchId: string, facultyId: string): Promise<void> {
    // Verify research exists
    const research = await this.researchRepository.findById(researchId);
    if (!research) {
      throw new NotFoundError('Research not found');
    }

    // Verify adviser exists
    const existingAdviser = await this.researchRepository.findExistingAdviser(
      researchId,
      facultyId
    );

    if (!existingAdviser) {
      throw new NotFoundError('Adviser not found for this research');
    }

    await this.researchRepository.removeAdviser(researchId, facultyId);
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(
    research: any,
    authors: any[],
    advisers: any[]
  ): ResearchResponseDTO {
    return {
      id: research.id,
      title: research.title,
      abstract: research.abstract || undefined,
      research_type: research.research_type,
      status: research.status,
      start_date: research.start_date
        ? (research.start_date instanceof Date
            ? research.start_date.toISOString().split('T')[0]
            : research.start_date)
        : undefined,
      completion_date: research.completion_date
        ? (research.completion_date instanceof Date
            ? research.completion_date.toISOString().split('T')[0]
            : research.completion_date)
        : undefined,
      publication_url: research.publication_url || undefined,
      authors: authors.map((a) => ({
        id: a.author.id,
        student_id: a.student.student_id,
        name: `${a.student.first_name} ${a.student.last_name}`,
        author_order: a.author.author_order,
      })),
      advisers: advisers.map((a) => ({
        id: a.adviser.id,
        faculty_id: a.faculty.faculty_id,
        name: `${a.faculty.first_name} ${a.faculty.last_name}`,
        adviser_role: a.adviser.adviser_role,
      })),
      created_at: research.created_at.toISOString(),
      updated_at: research.updated_at.toISOString(),
    };
  }
}
