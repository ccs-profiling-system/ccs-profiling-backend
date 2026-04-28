/**
 * Student Portal - Progress Service Tests
 * Unit tests for academic progress tracking service
 * 
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressService } from './progress.service';

// Mock database
const mockDb = {
  select: vi.fn(),
} as any;

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProgressService(mockDb);
  });

  describe('getAcademicProgress', () => {
    it('should return academic progress with Good Standing when GPA >= 2.0', async () => {
      const studentId = 'student-123';

      // Mock student info query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                year_level: 3,
                program: 'Computer Science',
              },
            ]),
          }),
        }),
      });

      // Mock credits earned query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              total_credits_earned: 60,
            },
          ]),
        }),
      });

      // Mock GPA calculation query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalGradePoints: 180.0,
              totalCredits: 60,
            },
          ]),
        }),
      });

      // Mock completed courses query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              {
                academic_year: '2022-2023',
                semester: '1st',
                course_code: 'CS101',
                course_name: 'Introduction to Computer Science',
                units: 3,
                grade: '3.0',
              },
              {
                academic_year: '2022-2023',
                semester: '1st',
                course_code: 'MATH101',
                course_name: 'Calculus I',
                units: 3,
                grade: '3.5',
              },
              {
                academic_year: '2022-2023',
                semester: '2nd',
                course_code: 'CS102',
                course_name: 'Data Structures',
                units: 3,
                grade: '3.0',
              },
            ]),
          }),
        }),
      });

      const result = await service.getAcademicProgress(studentId);

      expect(result).toMatchObject({
        total_credits_earned: 60,
        total_credits_required: 120,
        current_year_level: 3,
        academic_standing: 'Good Standing',
      });

      expect(result.completed_courses_by_semester).toHaveLength(2);
      expect(result.completed_courses_by_semester[0]).toMatchObject({
        academic_year: '2022-2023',
        semester: '1st',
        courses: expect.arrayContaining([
          expect.objectContaining({
            course_code: 'CS101',
            course_name: 'Introduction to Computer Science',
            units: 3,
            grade: '3.0',
          }),
          expect.objectContaining({
            course_code: 'MATH101',
            course_name: 'Calculus I',
            units: 3,
            grade: '3.5',
          }),
        ]),
      });
    });

    it('should return academic progress with Probation when GPA < 2.0', async () => {
      const studentId = 'student-456';

      // Mock student info query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                year_level: 2,
                program: 'Information Technology',
              },
            ]),
          }),
        }),
      });

      // Mock credits earned query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              total_credits_earned: 30,
            },
          ]),
        }),
      });

      // Mock GPA calculation query (GPA = 1.5)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalGradePoints: 45.0,
              totalCredits: 30,
            },
          ]),
        }),
      });

      // Mock completed courses query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              {
                academic_year: '2023-2024',
                semester: '1st',
                course_code: 'IT101',
                course_name: 'Introduction to IT',
                units: 3,
                grade: '1.5',
              },
            ]),
          }),
        }),
      });

      const result = await service.getAcademicProgress(studentId);

      expect(result.academic_standing).toBe('Probation');
      expect(result.total_credits_earned).toBe(30);
      expect(result.current_year_level).toBe(2);
    });

    it('should handle student with no completed courses', async () => {
      const studentId = 'student-789';

      // Mock student info query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                year_level: 1,
                program: 'Computer Science',
              },
            ]),
          }),
        }),
      });

      // Mock credits earned query (no credits)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              total_credits_earned: 0,
            },
          ]),
        }),
      });

      // Mock GPA calculation query (no grades)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalGradePoints: 0,
              totalCredits: 0,
            },
          ]),
        }),
      });

      // Mock completed courses query (empty)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getAcademicProgress(studentId);

      expect(result.total_credits_earned).toBe(0);
      expect(result.academic_standing).toBe('Probation'); // GPA 0 < 2.0
      expect(result.completed_courses_by_semester).toHaveLength(0);
    });

    it('should throw error when student not found', async () => {
      const studentId = 'nonexistent-student';

      // Mock student info query (not found)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.getAcademicProgress(studentId)).rejects.toThrow('Student not found');
    });

    it('should correctly group courses by academic year and semester', async () => {
      const studentId = 'student-999';

      // Mock student info query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                year_level: 2,
                program: 'Computer Science',
              },
            ]),
          }),
        }),
      });

      // Mock credits earned query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              total_credits_earned: 36,
            },
          ]),
        }),
      });

      // Mock GPA calculation query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalGradePoints: 108.0,
              totalCredits: 36,
            },
          ]),
        }),
      });

      // Mock completed courses query with multiple semesters
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              {
                academic_year: '2022-2023',
                semester: '1st',
                course_code: 'CS101',
                course_name: 'Intro to CS',
                units: 3,
                grade: '3.0',
              },
              {
                academic_year: '2022-2023',
                semester: '1st',
                course_code: 'MATH101',
                course_name: 'Calculus I',
                units: 3,
                grade: '3.0',
              },
              {
                academic_year: '2022-2023',
                semester: '2nd',
                course_code: 'CS102',
                course_name: 'Data Structures',
                units: 3,
                grade: '3.0',
              },
              {
                academic_year: '2023-2024',
                semester: '1st',
                course_code: 'CS201',
                course_name: 'Algorithms',
                units: 3,
                grade: '3.0',
              },
            ]),
          }),
        }),
      });

      const result = await service.getAcademicProgress(studentId);

      expect(result.completed_courses_by_semester).toHaveLength(3);
      
      // Check first semester has 2 courses
      const firstSemester = result.completed_courses_by_semester.find(
        s => s.academic_year === '2022-2023' && s.semester === '1st'
      );
      expect(firstSemester?.courses).toHaveLength(2);

      // Check second semester has 1 course
      const secondSemester = result.completed_courses_by_semester.find(
        s => s.academic_year === '2022-2023' && s.semester === '2nd'
      );
      expect(secondSemester?.courses).toHaveLength(1);

      // Check third semester has 1 course
      const thirdSemester = result.completed_courses_by_semester.find(
        s => s.academic_year === '2023-2024' && s.semester === '1st'
      );
      expect(thirdSemester?.courses).toHaveLength(1);
    });
  });
});
