/**
 * Student Portal - Grade Service Tests
 * Unit tests for grade management service
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GradeService } from './grade.service';
import { NotFoundError } from '../../../shared/errors';
import { StudentAccessError } from '../utils/studentScope';

// Mock database
const mockDb = {
  select: vi.fn(),
} as any;

describe('GradeService', () => {
  let service: GradeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GradeService(mockDb);
  });

  describe('getCurrentSemesterGrades', () => {
    it('should return current semester grades with GPA', async () => {
      const studentId = 'student-123';
      const mockGrades = [
        {
          id: 'grade-1',
          subject_code: 'CS101',
          subject_name: 'Introduction to Computer Science',
          grade: '1.50',
          credits: 3,
          remarks: 'passed',
          semester: '1st',
          academic_year: '2024-2025',
        },
        {
          id: 'grade-2',
          subject_code: 'MATH101',
          subject_name: 'Calculus I',
          grade: '2.00',
          credits: 3,
          remarks: 'passed',
          semester: '1st',
          academic_year: '2024-2025',
        },
      ];

      // Mock grades query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockGrades),
          }),
        }),
      });

      const result = await service.getCurrentSemesterGrades(studentId);

      expect(result.grades).toHaveLength(2);
      expect(result.grades[0]).toMatchObject({
        id: 'grade-1',
        course_code: 'CS101',
        course_name: 'Introduction to Computer Science',
        grade_value: '1.50',
        grade_points: 1.5,
        units: 3,
        remarks: 'passed',
      });
      expect(result.semester_gpa).toBe(1.75); // (1.5*3 + 2.0*3) / 6 = 1.75
    });

    it('should return empty array and 0 GPA if no grades', async () => {
      const studentId = 'student-123';

      // Mock empty grades
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getCurrentSemesterGrades(studentId);

      expect(result.grades).toEqual([]);
      expect(result.semester_gpa).toBe(0);
    });
  });

  describe('getGradeById', () => {
    it('should return grade details for valid grade ID', async () => {
      const studentId = 'student-123';
      const gradeId = 'grade-1';

      const mockGrade = {
        id: gradeId,
        student_id: studentId,
        subject_code: 'CS101',
        subject_name: 'Introduction to Computer Science',
        grade: '1.50',
        credits: 3,
        remarks: 'passed',
        semester: '1st',
        academic_year: '2024-2025',
      };

      // Mock grade query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockGrade]),
          }),
        }),
      });

      const result = await service.getGradeById(studentId, gradeId);

      expect(result).toMatchObject({
        id: gradeId,
        course_code: 'CS101',
        course_name: 'Introduction to Computer Science',
        grade_value: '1.50',
        grade_points: 1.5,
        units: 3,
        remarks: 'passed',
      });
    });

    it('should throw NotFoundError if grade not found', async () => {
      const studentId = 'student-123';
      const gradeId = 'grade-1';

      // Mock grade not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.getGradeById(studentId, gradeId)).rejects.toThrow(NotFoundError);
    });

    it('should throw StudentAccessError if grade belongs to another student', async () => {
      const studentId = 'student-123';
      const gradeId = 'grade-1';

      const mockGrade = {
        id: gradeId,
        student_id: 'other-student',
        subject_code: 'CS101',
        subject_name: 'Introduction to Computer Science',
        grade: '1.50',
        credits: 3,
        remarks: 'passed',
        semester: '1st',
        academic_year: '2024-2025',
      };

      // Mock grade query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockGrade]),
          }),
        }),
      });

      await expect(service.getGradeById(studentId, gradeId)).rejects.toThrow(StudentAccessError);
    });
  });

  describe('getGradeHistory', () => {
    it('should return grade history grouped by semester', async () => {
      const studentId = 'student-123';
      const mockGrades = [
        {
          id: 'grade-1',
          subject_code: 'CS101',
          subject_name: 'Introduction to Computer Science',
          grade: '1.50',
          credits: 3,
          remarks: 'passed',
          semester: '1st',
          academic_year: '2024-2025',
        },
        {
          id: 'grade-2',
          subject_code: 'MATH101',
          subject_name: 'Calculus I',
          grade: '2.00',
          credits: 3,
          remarks: 'passed',
          semester: '1st',
          academic_year: '2024-2025',
        },
        {
          id: 'grade-3',
          subject_code: 'CS102',
          subject_name: 'Data Structures',
          grade: '1.75',
          credits: 3,
          remarks: 'passed',
          semester: '2nd',
          academic_year: '2023-2024',
        },
      ];

      // Mock grades query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockGrades),
          }),
        }),
      });

      const result = await service.getGradeHistory(studentId);

      expect(result.semesters).toHaveLength(2);
      expect(result.semesters[0]).toMatchObject({
        academic_year: '2024-2025',
        semester: '1st',
        semester_gpa: 1.75,
      });
      expect(result.semesters[0].grades).toHaveLength(2);
      expect(result.semesters[1]).toMatchObject({
        academic_year: '2023-2024',
        semester: '2nd',
        semester_gpa: 1.75,
      });
      expect(result.semesters[1].grades).toHaveLength(1);
    });

    it('should return empty semesters array if no grades', async () => {
      const studentId = 'student-123';

      // Mock empty grades
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getGradeHistory(studentId);

      expect(result.semesters).toEqual([]);
    });
  });

  describe('calculateGPA', () => {
    it('should calculate cumulative and current semester GPA', async () => {
      const studentId = 'student-123';
      
      // Determine current semester based on current date
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      let currentSemester: string;
      let currentAcademicYear: string;
      
      if (currentMonth >= 8 && currentMonth <= 12) {
        currentSemester = '1st';
        currentAcademicYear = `${currentYear}-${currentYear + 1}`;
      } else if (currentMonth >= 1 && currentMonth <= 5) {
        currentSemester = '2nd';
        currentAcademicYear = `${currentYear - 1}-${currentYear}`;
      } else {
        currentSemester = 'summer';
        currentAcademicYear = `${currentYear - 1}-${currentYear}`;
      }
      
      const mockGrades = [
        {
          grade: '1.50',
          credits: 3,
          remarks: 'passed',
          semester: currentSemester,
          academic_year: currentAcademicYear,
        },
        {
          grade: '2.00',
          credits: 3,
          remarks: 'passed',
          semester: currentSemester,
          academic_year: currentAcademicYear,
        },
        {
          grade: '1.75',
          credits: 3,
          remarks: 'passed',
          semester: '2nd',
          academic_year: '2023-2024',
        },
      ];

      // Mock grades query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockGrades),
        }),
      });

      const result = await service.calculateGPA(studentId);

      expect(result.cumulative_gpa).toBe(1.75); // (1.5*3 + 2.0*3 + 1.75*3) / 9 = 1.75
      expect(result.current_semester_gpa).toBe(1.75); // (1.5*3 + 2.0*3) / 6 = 1.75
      expect(result.total_units_attempted).toBe(9);
      expect(result.total_units_earned).toBe(9);
    });

    it('should handle no grades case', async () => {
      const studentId = 'student-123';

      // Mock empty grades
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.calculateGPA(studentId);

      expect(result.cumulative_gpa).toBe(0);
      expect(result.current_semester_gpa).toBeNull();
      expect(result.total_units_attempted).toBe(0);
      expect(result.total_units_earned).toBe(0);
    });

    it('should count only passed courses for units earned', async () => {
      const studentId = 'student-123';
      
      // Determine current semester based on current date
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      let currentSemester: string;
      let currentAcademicYear: string;
      
      if (currentMonth >= 8 && currentMonth <= 12) {
        currentSemester = '1st';
        currentAcademicYear = `${currentYear}-${currentYear + 1}`;
      } else if (currentMonth >= 1 && currentMonth <= 5) {
        currentSemester = '2nd';
        currentAcademicYear = `${currentYear - 1}-${currentYear}`;
      } else {
        currentSemester = 'summer';
        currentAcademicYear = `${currentYear - 1}-${currentYear}`;
      }
      
      const mockGrades = [
        {
          grade: '1.50',
          credits: 3,
          remarks: 'passed',
          semester: currentSemester,
          academic_year: currentAcademicYear,
        },
        {
          grade: '5.00',
          credits: 3,
          remarks: 'failed',
          semester: currentSemester,
          academic_year: currentAcademicYear,
        },
      ];

      // Mock grades query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockGrades),
        }),
      });

      const result = await service.calculateGPA(studentId);

      expect(result.total_units_attempted).toBe(6);
      expect(result.total_units_earned).toBe(3); // Only passed course
    });
  });
});
