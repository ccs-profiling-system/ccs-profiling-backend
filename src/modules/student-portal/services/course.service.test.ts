/**
 * Student Portal - Course Service Tests
 * Unit tests for course management service
 * 
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CourseService } from './course.service';
import { NotFoundError } from '../../../shared/errors';

// Mock database
const mockDb = {
  select: vi.fn(),
} as any;

describe('CourseService', () => {
  let service: CourseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CourseService(mockDb);
  });

  describe('getEnrolledCourses', () => {
    it('should return enrolled courses for current semester', async () => {
      const studentId = 'student-123';
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          course_code: 'CS101',
          course_name: 'Introduction to Computer Science',
          units: 3,
          enrollment_status: 'enrolled',
          instruction_id: 'instruction-1',
          semester: '1st',
          academic_year: '2024-2025',
        },
      ];

      // Mock enrollments query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockEnrollments),
            }),
          }),
        }),
      });

      // Mock schedule query (returns empty for simplicity)
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getEnrolledCourses(studentId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'enrollment-1',
        course_code: 'CS101',
        course_name: 'Introduction to Computer Science',
        units: 3,
        enrollment_status: 'enrolled',
      });
    });

    it('should return empty array if no enrollments', async () => {
      const studentId = 'student-123';

      // Mock empty enrollments
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await service.getEnrolledCourses(studentId);

      expect(result).toEqual([]);
    });
  });

  describe('getCourseDetails', () => {
    it('should return course details for enrolled course', async () => {
      const studentId = 'student-123';
      const courseId = 'enrollment-1';

      const mockEnrollment = {
        id: courseId,
        instruction_id: 'instruction-1',
        enrollment_status: 'enrolled',
        semester: '1st',
        academic_year: '2024-2025',
      };

      const mockInstruction = {
        subject_code: 'CS101',
        subject_name: 'Introduction to Computer Science',
        description: 'An introductory course to computer science',
        credits: 3,
      };

      // Mock enrollment query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEnrollment]),
          }),
        }),
      });

      // Mock instruction query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockInstruction]),
          }),
        }),
      });

      // Mock schedule query (returns empty)
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getCourseDetails(studentId, courseId);

      expect(result).toMatchObject({
        id: courseId,
        course_code: 'CS101',
        course_name: 'Introduction to Computer Science',
        description: 'An introductory course to computer science',
        units: 3,
        enrollment_status: 'enrolled',
      });
    });

    it('should throw NotFoundError if student not enrolled in course', async () => {
      const studentId = 'student-123';
      const courseId = 'enrollment-1';

      // Mock enrollment not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.getCourseDetails(studentId, courseId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getWeeklySchedule', () => {
    it('should return weekly schedule grouped by day', async () => {
      const studentId = 'student-123';

      const mockEnrollments = [
        {
          instruction_id: 'instruction-1',
          course_code: 'CS101',
          course_name: 'Introduction to Computer Science',
        },
      ];

      const mockSchedules = [
        {
          day: 'monday',
          start_time: '09:00:00',
          end_time: '10:30:00',
          room: 'Room 101',
          faculty_id: null,
        },
      ];

      // Mock enrollments query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockEnrollments),
          }),
        }),
      });

      // Mock schedules query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockSchedules),
        }),
      });

      const result = await service.getWeeklySchedule(studentId);

      expect(result).toHaveProperty('Monday');
      expect(result).toHaveProperty('Tuesday');
      expect(result).toHaveProperty('Wednesday');
      expect(result).toHaveProperty('Thursday');
      expect(result).toHaveProperty('Friday');
      expect(result).toHaveProperty('Saturday');
      expect(result).toHaveProperty('Sunday');
      expect(result.Monday).toHaveLength(1);
      expect(result.Monday[0]).toMatchObject({
        course_code: 'CS101',
        course_name: 'Introduction to Computer Science',
        room: 'Room 101',
        day: 'Monday',
        start_time: '09:00:00',
        end_time: '10:30:00',
      });
    });

    it('should return empty schedule if no enrollments', async () => {
      const studentId = 'student-123';

      // Mock empty enrollments
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getWeeklySchedule(studentId);

      expect(result.Monday).toEqual([]);
      expect(result.Tuesday).toEqual([]);
      expect(result.Wednesday).toEqual([]);
      expect(result.Thursday).toEqual([]);
      expect(result.Friday).toEqual([]);
      expect(result.Saturday).toEqual([]);
      expect(result.Sunday).toEqual([]);
    });
  });
});
