/**
 * Student Portal - Research Service Tests
 * Unit tests for research opportunity management service
 * 
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResearchService } from './research.service';
import { NotFoundError, ConflictError } from '../../../shared/errors';
import { StudentAccessError } from '../utils/studentScope';

// Mock database
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
} as any;

describe('ResearchService', () => {
  let service: ResearchService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ResearchService(mockDb);
  });

  describe('listOpportunities', () => {
    it('should return paginated list of research opportunities', async () => {
      const mockOpportunities = [
        {
          id: 'research-1',
          title: 'Machine Learning Research',
          abstract: 'Research on ML algorithms',
          research_type: 'thesis',
          start_date: '2024-06-01',
          faculty_id: 'faculty-1',
          faculty_first_name: 'John',
          faculty_last_name: 'Doe',
        },
      ];

      // Mock count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      // Mock opportunities query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockOpportunities),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      // Mock applicant count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.listOpportunities({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'research-1',
        title: 'Machine Learning Research',
        faculty_adviser_name: 'John Doe',
      });
      expect(result.meta).toMatchObject({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('getOpportunityById', () => {
    it('should return detailed opportunity information', async () => {
      const opportunityId = 'research-1';
      const mockOpportunity = {
        id: opportunityId,
        title: 'Machine Learning Research',
        abstract: 'Research on ML algorithms',
        research_type: 'thesis',
        status: 'ongoing',
        start_date: '2024-06-01',
        faculty_id: 'faculty-1',
        faculty_first_name: 'John',
        faculty_last_name: 'Doe',
        faculty_email: 'john.doe@example.com',
        faculty_phone: '1234567890',
      };

      // Mock opportunity query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockOpportunity]),
              }),
            }),
          }),
        }),
      });

      // Mock applicant count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      const result = await service.getOpportunityById(opportunityId);

      expect(result).toMatchObject({
        id: opportunityId,
        title: 'Machine Learning Research',
        faculty_adviser_name: 'John Doe',
        faculty_email: 'john.doe@example.com',
        current_applicants: 5,
      });
    });

    it('should throw NotFoundError if opportunity does not exist', async () => {
      const opportunityId = 'non-existent';

      // Mock opportunity not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      await expect(service.getOpportunityById(opportunityId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createApplication', () => {
    it('should create application for valid opportunity', async () => {
      const opportunityId = 'research-1';
      const studentId = 'student-123';
      const userId = 'user-123';
      const statementOfInterest = 'I am interested in this research';

      const mockOpportunity = {
        id: opportunityId,
        title: 'Machine Learning Research',
        status: 'ongoing',
      };

      const mockApplication = {
        id: 'app-1',
        research_id: opportunityId,
        student_id: studentId,
        application_date: '2024-01-15',
        statement_of_interest: statementOfInterest,
        status: 'pending',
        faculty_feedback: null,
      };

      // Mock opportunity check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockOpportunity]),
          }),
        }),
      });

      // Mock duplicate check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock insert
      mockDb.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockApplication]),
        }),
      });

      // Mock audit log insert
      mockDb.insert.mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      });

      // Mock adviser query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { faculty_first_name: 'John', faculty_last_name: 'Doe' },
              ]),
            }),
          }),
        }),
      });

      const result = await service.createApplication(
        opportunityId,
        studentId,
        userId,
        statementOfInterest
      );

      expect(result).toMatchObject({
        id: 'app-1',
        research_title: 'Machine Learning Research',
        status: 'pending',
      });
    });

    it('should throw ConflictError if student already applied', async () => {
      const opportunityId = 'research-1';
      const studentId = 'student-123';
      const userId = 'user-123';
      const statementOfInterest = 'I am interested in this research';

      const mockOpportunity = {
        id: opportunityId,
        title: 'Machine Learning Research',
        status: 'ongoing',
      };

      const mockExistingApplication = {
        id: 'app-1',
        research_id: opportunityId,
        student_id: studentId,
      };

      // Mock opportunity check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockOpportunity]),
          }),
        }),
      });

      // Mock duplicate check - application exists
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockExistingApplication]),
          }),
        }),
      });

      await expect(
        service.createApplication(opportunityId, studentId, userId, statementOfInterest)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getApplicationStatus', () => {
    it('should return application status for valid application owned by student', async () => {
      const applicationId = 'app-1';
      const studentId = 'student-123';

      const mockApplication = {
        id: applicationId,
        research_id: 'research-1',
        student_id: studentId,
        application_date: '2024-01-15',
        status: 'pending',
        faculty_feedback: null,
        research_title: 'Machine Learning Research',
        faculty_first_name: 'John',
        faculty_last_name: 'Doe',
      };

      // Mock application query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([mockApplication]),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.getApplicationStatus(applicationId, studentId);

      expect(result).toMatchObject({
        id: applicationId,
        research_title: 'Machine Learning Research',
        faculty_adviser_name: 'John Doe',
        status: 'pending',
      });
    });

    it('should throw StudentAccessError if application belongs to different student', async () => {
      const applicationId = 'app-1';
      const studentId = 'student-123';
      const otherStudentId = 'student-456';

      const mockApplication = {
        id: applicationId,
        research_id: 'research-1',
        student_id: otherStudentId, // Different student
        application_date: '2024-01-15',
        status: 'pending',
        faculty_feedback: null,
        research_title: 'Machine Learning Research',
        faculty_first_name: 'John',
        faculty_last_name: 'Doe',
      };

      // Mock application query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([mockApplication]),
                }),
              }),
            }),
          }),
        }),
      });

      await expect(service.getApplicationStatus(applicationId, studentId)).rejects.toThrow(
        StudentAccessError
      );
    });
  });
});
