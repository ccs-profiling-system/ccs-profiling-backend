import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DepartmentAssignmentService,
  DepartmentNotFoundError,
} from '../department-assignment.service';
import { db } from '../../../../db';

// Mock the database
vi.mock('../../../../db', () => ({
  db: {
    query: {
      students: {
        findFirst: vi.fn(),
      },
      faculty: {
        findFirst: vi.fn(),
      },
      events: {
        findFirst: vi.fn(),
      },
      research: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
  },
}));

describe('DepartmentAssignmentService', () => {
  let service: DepartmentAssignmentService;

  beforeEach(() => {
    service = new DepartmentAssignmentService();
    vi.clearAllMocks();
  });

  describe('determineDepartmentId', () => {
    it('should route to student handler for student entity type', async () => {
      const mockStudent = {
        id: 'student-123',
        program: 'Computer Science',
        deleted_at: null,
      };

      vi.mocked(db.query.students.findFirst).mockResolvedValue(mockStudent as any);

      const result = await service.determineDepartmentId('student', 'student-123');

      expect(result).toBe('Computer Science');
      expect(db.query.students.findFirst).toHaveBeenCalledOnce();
    });

    it('should route to faculty handler for faculty entity type', async () => {
      const mockFaculty = {
        id: 'faculty-123',
        department: 'Computer Science',
        deleted_at: null,
      };

      vi.mocked(db.query.faculty.findFirst).mockResolvedValue(mockFaculty as any);

      const result = await service.determineDepartmentId('faculty', 'faculty-123');

      expect(result).toBe('Computer Science');
      expect(db.query.faculty.findFirst).toHaveBeenCalledOnce();
    });

    it('should route to event handler for event entity type', async () => {
      const mockEvent = {
        id: 'event-123',
        department_id: 'Computer Science',
        deleted_at: null,
      };

      vi.mocked(db.query.events.findFirst).mockResolvedValue(mockEvent as any);

      const result = await service.determineDepartmentId('event', 'event-123');

      expect(result).toBe('Computer Science');
      expect(db.query.events.findFirst).toHaveBeenCalledOnce();
    });

    it('should route to research handler for research entity type', async () => {
      const mockResearch = {
        id: 'research-123',
        deleted_at: null,
      };

      vi.mocked(db.query.research.findFirst).mockResolvedValue(mockResearch as any);

      // Mock the select query for research authors
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            student_id: 'student-123',
            author_order: 1,
            program: 'Computer Science',
          },
        ]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await service.determineDepartmentId('research', 'research-123');

      expect(result).toBe('Computer Science');
      expect(db.query.research.findFirst).toHaveBeenCalledOnce();
    });

    it('should throw error for unknown entity type', async () => {
      await expect(
        service.determineDepartmentId('unknown', 'entity-123')
      ).rejects.toThrow(DepartmentNotFoundError);

      await expect(
        service.determineDepartmentId('unknown', 'entity-123')
      ).rejects.toThrow('Unknown entity type: unknown');
    });
  });

  describe('getStudentDepartment', () => {
    it('should return program as department for valid student', async () => {
      const mockStudent = {
        id: 'student-123',
        program: 'Computer Science',
        deleted_at: null,
      };

      vi.mocked(db.query.students.findFirst).mockResolvedValue(mockStudent as any);

      const result = await service.determineDepartmentId('student', 'student-123');

      expect(result).toBe('Computer Science');
    });

    it('should throw error when student not found', async () => {
      vi.mocked(db.query.students.findFirst).mockResolvedValue(undefined);

      await expect(
        service.determineDepartmentId('student', 'nonexistent-123')
      ).rejects.toThrow(DepartmentNotFoundError);

      await expect(
        service.determineDepartmentId('student', 'nonexistent-123')
      ).rejects.toThrow('Student not found');
    });

    it('should throw error when student has no program', async () => {
      const mockStudent = {
        id: 'student-123',
        program: null,
        deleted_at: null,
      };

      vi.mocked(db.query.students.findFirst).mockResolvedValue(mockStudent as any);

      await expect(
        service.determineDepartmentId('student', 'student-123')
      ).rejects.toThrow(DepartmentNotFoundError);

      await expect(
        service.determineDepartmentId('student', 'student-123')
      ).rejects.toThrow('Student has no program assigned');
    });

    it('should exclude soft-deleted students', async () => {
      const mockStudent = {
        id: 'student-123',
        program: 'Computer Science',
        deleted_at: new Date(),
      };

      vi.mocked(db.query.students.findFirst).mockResolvedValue(undefined);

      await expect(
        service.determineDepartmentId('student', 'student-123')
      ).rejects.toThrow(DepartmentNotFoundError);
    });
  });

  describe('getFacultyDepartment', () => {
    it('should return department for valid faculty', async () => {
      const mockFaculty = {
        id: 'faculty-123',
        department: 'Computer Science',
        deleted_at: null,
      };

      vi.mocked(db.query.faculty.findFirst).mockResolvedValue(mockFaculty as any);

      const result = await service.determineDepartmentId('faculty', 'faculty-123');

      expect(result).toBe('Computer Science');
    });

    it('should throw error when faculty not found', async () => {
      vi.mocked(db.query.faculty.findFirst).mockResolvedValue(undefined);

      await expect(
        service.determineDepartmentId('faculty', 'nonexistent-123')
      ).rejects.toThrow(DepartmentNotFoundError);

      await expect(
        service.determineDepartmentId('faculty', 'nonexistent-123')
      ).rejects.toThrow('Faculty not found');
    });

    it('should throw error when faculty has no department', async () => {
      const mockFaculty = {
        id: 'faculty-123',
        department: null,
        deleted_at: null,
      };

      vi.mocked(db.query.faculty.findFirst).mockResolvedValue(mockFaculty as any);

      await expect(
        service.determineDepartmentId('faculty', 'faculty-123')
      ).rejects.toThrow(DepartmentNotFoundError);

      await expect(
        service.determineDepartmentId('faculty', 'faculty-123')
      ).rejects.toThrow('Faculty has no department assigned');
    });

    it('should exclude soft-deleted faculty', async () => {
      vi.mocked(db.query.faculty.findFirst).mockResolvedValue(undefined);

      await expect(
        service.determineDepartmentId('faculty', 'faculty-123')
      ).rejects.toThrow(DepartmentNotFoundError);
    });
  });

  describe('getEventDepartment', () => {
    it('should return department_id for valid event', async () => {
      const mockEvent = {
        id: 'event-123',
        department_id: 'Computer Science',
        deleted_at: null,
      };

      vi.mocked(db.query.events.findFirst).mockResolvedValue(mockEvent as any);

      const result = await service.determineDepartmentId('event', 'event-123');

      expect(result).toBe('Computer Science');
    });

    it('should throw error when event not found', async () => {
      vi.mocked(db.query.events.findFirst).mockResolvedValue(undefined);

      await expect(
        service.determineDepartmentId('event', 'nonexistent-123')
      ).rejects.toThrow(DepartmentNotFoundError);

      await expect(
        service.determineDepartmentId('event', 'nonexistent-123')
      ).rejects.toThrow('Event not found');
    });

    it('should throw error when event has no department', async () => {
      const mockEvent = {
        id: 'event-123',
        department_id: null,
        deleted_at: null,
      };

      vi.mocked(db.query.events.findFirst).mockResolvedValue(mockEvent as any);

      await expect(
        service.determineDepartmentId('event', 'event-123')
      ).rejects.toThrow(DepartmentNotFoundError);

      await expect(
        service.determineDepartmentId('event', 'event-123')
      ).rejects.toThrow('Event has no department assigned');
    });

    it('should exclude soft-deleted events', async () => {
      vi.mocked(db.query.events.findFirst).mockResolvedValue(undefined);

      await expect(
        service.determineDepartmentId('event', 'event-123')
      ).rejects.toThrow(DepartmentNotFoundError);
    });
  });

  describe('getResearchDepartment', () => {
    it('should return first author program as department for valid research', async () => {
      const mockResearch = {
        id: 'research-123',
        deleted_at: null,
      };

      vi.mocked(db.query.research.findFirst).mockResolvedValue(mockResearch as any);

      // Mock the select query for research authors
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            student_id: 'student-123',
            author_order: 1,
            program: 'Computer Science',
          },
        ]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await service.determineDepartmentId('research', 'research-123');

      expect(result).toBe('Computer Science');
      expect(db.query.research.findFirst).toHaveBeenCalledOnce();
      expect(db.select).toHaveBeenCalledOnce();
    });

    it('should throw error when research not found', async () => {
      vi.mocked(db.query.research.findFirst).mockResolvedValue(undefined);

      await expect(
        service.determineDepartmentId('research', 'nonexistent-123')
      ).rejects.toThrow(DepartmentNotFoundError);

      await expect(
        service.determineDepartmentId('research', 'nonexistent-123')
      ).rejects.toThrow('Research not found');
    });

    it('should throw error when research has no authors', async () => {
      const mockResearch = {
        id: 'research-123',
        deleted_at: null,
      };

      vi.mocked(db.query.research.findFirst).mockResolvedValue(mockResearch as any);

      // Mock empty authors result
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await expect(
        service.determineDepartmentId('research', 'research-123')
      ).rejects.toThrow(DepartmentNotFoundError);

      await expect(
        service.determineDepartmentId('research', 'research-123')
      ).rejects.toThrow('Research has no authors assigned');
    });

    it('should throw error when first author has no program', async () => {
      const mockResearch = {
        id: 'research-123',
        deleted_at: null,
      };

      vi.mocked(db.query.research.findFirst).mockResolvedValue(mockResearch as any);

      // Mock author with no program
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            student_id: 'student-123',
            author_order: 1,
            program: null,
          },
        ]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await expect(
        service.determineDepartmentId('research', 'research-123')
      ).rejects.toThrow(DepartmentNotFoundError);

      await expect(
        service.determineDepartmentId('research', 'research-123')
      ).rejects.toThrow('First author has no program assigned');
    });

    it('should select first author by author_order', async () => {
      const mockResearch = {
        id: 'research-123',
        deleted_at: null,
      };

      vi.mocked(db.query.research.findFirst).mockResolvedValue(mockResearch as any);

      // Mock multiple authors, should pick the one with lowest author_order
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            student_id: 'student-123',
            author_order: 1,
            program: 'Computer Science',
          },
        ]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await service.determineDepartmentId('research', 'research-123');

      expect(result).toBe('Computer Science');
      expect(mockSelect.limit).toHaveBeenCalledWith(1);
    });

    it('should exclude soft-deleted research', async () => {
      vi.mocked(db.query.research.findFirst).mockResolvedValue(undefined);

      await expect(
        service.determineDepartmentId('research', 'research-123')
      ).rejects.toThrow(DepartmentNotFoundError);
    });
  });

  describe('DepartmentNotFoundError', () => {
    it('should create error with entity type and ID', () => {
      const error = new DepartmentNotFoundError('student', 'student-123');

      expect(error.name).toBe('DepartmentNotFoundError');
      expect(error.message).toBe(
        'Cannot determine department for student with ID student-123'
      );
    });

    it('should create error with reason', () => {
      const error = new DepartmentNotFoundError(
        'student',
        'student-123',
        'Student not found'
      );

      expect(error.message).toBe(
        'Cannot determine department for student with ID student-123: Student not found'
      );
    });
  });
});
