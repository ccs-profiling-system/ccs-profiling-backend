/**
 * Search Service
 * Business logic layer for search operations
 * 
 */

import { StudentRepository } from '../../students/repositories/student.repository';
import { FacultyRepository } from '../../faculty/repositories/faculty.repository';
import { EventRepository } from '../../events/repositories/event.repository';
import { ResearchRepository } from '../../research/repositories/research.repository';
import {
  SearchResponseDTO,
  StudentSearchResultDTO,
  FacultySearchResultDTO,
  EventSearchResultDTO,
  ResearchSearchResultDTO,
  EntitySearchResponseDTO,
} from '../types';

export class SearchService {
  constructor(
    private studentRepository: StudentRepository,
    private facultyRepository: FacultyRepository,
    private eventRepository: EventRepository,
    private researchRepository: ResearchRepository
  ) {}

  /**
   * Search students by name or student_id with partial text matching
   */
  async searchStudents(query: string): Promise<EntitySearchResponseDTO<StudentSearchResultDTO>> {
    const result = await this.studentRepository.findAll({
      search: query,
      limit: 100, // Return up to 100 results for search
    });

    const data = result.data.map((student) => ({
      id: student.id,
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      middle_name: student.middle_name || undefined,
      email: student.email,
      program: student.program || undefined,
      year_level: student.year_level || undefined,
      status: student.status || 'active',
    }));

    return {
      data,
      meta: {
        total: data.length,
        query,
      },
    };
  }

  /**
   * Search faculty by name or faculty_id with partial text matching
   */
  async searchFaculty(query: string): Promise<EntitySearchResponseDTO<FacultySearchResultDTO>> {
    const result = await this.facultyRepository.findAll({
      search: query,
      limit: 100, // Return up to 100 results for search
    });

    const data = result.data.map((faculty) => ({
      id: faculty.id,
      faculty_id: faculty.faculty_id,
      first_name: faculty.first_name,
      last_name: faculty.last_name,
      middle_name: faculty.middle_name || undefined,
      email: faculty.email,
      department: faculty.department,
      position: faculty.position || undefined,
      status: faculty.status || 'active',
    }));

    return {
      data,
      meta: {
        total: data.length,
        query,
      },
    };
  }

  /**
   * Search events by name or type with partial text matching
   */
  async searchEvents(query: string): Promise<EntitySearchResponseDTO<EventSearchResultDTO>> {
    const result = await this.eventRepository.findAll({
      search: query,
      limit: 100, // Return up to 100 results for search
    });

    const data = result.data.map((event) => ({
      id: event.id,
      event_name: event.event_name,
      event_type: event.event_type,
      description: event.description || undefined,
      event_date: event.event_date,
      location: event.location || undefined,
    }));

    return {
      data,
      meta: {
        total: data.length,
        query,
      },
    };
  }

  /**
   * Search research by title or author with partial text matching
   */
  async searchResearch(query: string): Promise<EntitySearchResponseDTO<ResearchSearchResultDTO>> {
    const result = await this.researchRepository.findAll({
      search: query,
      limit: 100, // Return up to 100 results for search
    });

    // Batch fetch authors for all research records to prevent N+1 queries
    const researchIds = result.data.map((r) => r.id);
    const { authors } = await this.researchRepository.getAuthorsAndAdvisersForMultiple(researchIds);

    // Group authors by research_id
    const authorsByResearch = new Map<string, string[]>();
    for (const { author, student } of authors) {
      if (!authorsByResearch.has(author.research_id)) {
        authorsByResearch.set(author.research_id, []);
      }
      const fullName = `${student.first_name} ${student.last_name}`;
      authorsByResearch.get(author.research_id)!.push(fullName);
    }

    const data = result.data.map((research) => ({
      id: research.id,
      title: research.title,
      abstract: research.abstract || undefined,
      research_type: research.research_type,
      status: research.status || 'ongoing',
      authors: authorsByResearch.get(research.id) || [],
    }));

    return {
      data,
      meta: {
        total: data.length,
        query,
      },
    };
  }

  /**
   * Global search across all entities
   * Searches students, faculty, events, and research in parallel
   */
  async globalSearch(query: string, type?: string): Promise<SearchResponseDTO> {
    // If type is specified, search only that entity type
    if (type) {
      switch (type) {
        case 'students': {
          const students = await this.searchStudents(query);
          return {
            students: students.data,
            meta: {
              total: students.meta.total,
              query,
              type,
            },
          };
        }
        case 'faculty': {
          const faculty = await this.searchFaculty(query);
          return {
            faculty: faculty.data,
            meta: {
              total: faculty.meta.total,
              query,
              type,
            },
          };
        }
        case 'events': {
          const events = await this.searchEvents(query);
          return {
            events: events.data,
            meta: {
              total: events.meta.total,
              query,
              type,
            },
          };
        }
        case 'research': {
          const research = await this.searchResearch(query);
          return {
            research: research.data,
            meta: {
              total: research.meta.total,
              query,
              type,
            },
          };
        }
        default:
          // Invalid type, fall through to global search
          break;
      }
    }

    // Search all entities in parallel
    const [students, faculty, events, research] = await Promise.all([
      this.searchStudents(query),
      this.searchFaculty(query),
      this.searchEvents(query),
      this.searchResearch(query),
    ]);

    const total =
      students.meta.total +
      faculty.meta.total +
      events.meta.total +
      research.meta.total;

    return {
      students: students.data,
      faculty: faculty.data,
      events: events.data,
      research: research.data,
      meta: {
        total,
        query,
      },
    };
  }
}
