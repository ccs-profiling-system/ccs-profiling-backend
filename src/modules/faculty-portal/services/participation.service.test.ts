/**
 * Faculty Portal - Participation Service Tests
 * Unit tests for student participation management service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticipationService, InvalidStudentError, InvalidParticipationScoreError } from './participation.service';
import { CourseOwnershipError } from '../utils/courseOwnership';

// Mock database
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
} as any;

// Mock course ownership validation
vi.mock('../utils/courseOwnership', () => ({
  validateCourseOwnership: vi.fn(),
  CourseOwnershipError: class CourseOwnershipError extends Error {
    statusCode = 403;
    code = 'COURSE_NOT_ASSIGNED';
    constructor(courseId: string) {
      super(`Access denied: Course ${courseId} is not assigned to you`);
    }
  },
}));

// Mock audit log repository
vi.mock('../../audit-logs', () => ({
  auditLogRepository: {
    create: vi.fn(),
  },
}));

import { validateCourseOwnership } from '../utils/courseOwnership';
import { auditLogRepository } from '../../audit-logs';

describe('ParticipationService', () => {
  let service: ParticipationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ParticipationService(mockDb);
  });

  describe('getParticipationRecords', () => {
    it('should return participation records for a valid course', async () => {
      const subjectId = 'course-123';
      const facultyId = 'faculty-123';
      const mockRecords = [
        {
          id: 'part-1',
          date: '2024-01-15',
          student_id: 'student-1',
          student_first_name: 'John',
          student_last_name: 'Doe',
          participation_score: 4,
          remarks: 'Good participation',
        },
      ];

      // Mock course ownership validation
      vi.mocked(validateCourseOwnership).mockResolvedValue(undefined);

      // Mock participation records query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockRecords),
            }),
          }),
        }),
      });

      const result = await service.getParticipationRecords(subjectId, facultyId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'part-1',
        date: '2024-01-15',
        student_id: 'student-1',
        student_name: 'John Doe',
        participation_score: 4,
        remarks: 'Good participation',
      });
      expect(validateCourseOwnership).toHaveBeenCalledWith(subjectId, facultyId);
    });

    it('should filter by date when provided', async () => {
      const subjectId = 'course-123';
      const facultyId = 'faculty-123';
      const date = '2024-01-15';

      vi.mocked(validateCourseOwnership).mockResolvedValue(undefined);

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await service.getParticipationRecords(subjectId, facultyId, date);

      expect(validateCourseOwnership).toHaveBeenCalledWith(subjectId, facultyId);
    });

    it('should throw CourseOwnershipError if course not assigned to faculty', async () => {
      const subjectId = 'course-123';
      const facultyId = 'faculty-123';

      vi.mocked(validateCourseOwnership).mockRejectedValue(
        new CourseOwnershipError(subjectId)
      );

      await expect(
        service.getParticipationRecords(subjectId, facultyId)
      ).rejects.toThrow(CourseOwnershipError);
    });

    it('should return empty array if no records found', async () => {
      const subjectId = 'course-123';
      const facultyId = 'faculty-123';

      vi.mocked(validateCourseOwnership).mockResolvedValue(undefined);

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await service.getParticipationRecords(subjectId, facultyId);

      expect(result).toEqual([]);
    });
  });

  describe('submitParticipationRecords', () => {
    it('should successfully submit participation records', async () => {
      const subjectId = 'course-123';
      const facultyId = 'faculty-123';
      const userId = 'user-123';
      const date = '2024-01-15';
      const records = [
        { studentId: 'student-1', participationScore: 4, remarks: 'Good' },
        { studentId: 'student-2', participationScore: 5 },
      ];

      vi.mocked(validateCourseOwnership).mockResolvedValue(undefined);

      // Mock enrolled students check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { student_id: 'student-1' },
            { student_id: 'student-2' },
          ]),
        }),
      });

      // Mock existing records check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      // Mock insert
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.submitParticipationRecords(
        subjectId,
        facultyId,
        date,
        records,
        userId
      );

      expect(result).toMatchObject({
        success: true,
        recordsSaved: 2,
        message: 'Successfully saved 2 participation record(s) for 2024-01-15',
      });
      expect(auditLogRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        action_type: 'participation_submit',
        entity_type: 'participation',
        entity_id: subjectId,
        after_state: {
          date,
          records_count: 2,
          student_ids: ['student-1', 'student-2'],
        },
      });
    });

    it('should throw InvalidParticipationScoreError for score < 1', async () => {
      const subjectId = 'course-123';
      const facultyId = 'faculty-123';
      const userId = 'user-123';
      const date = '2024-01-15';
      const records = [
        { studentId: 'student-1', participationScore: 0 },
      ];

      vi.mocked(validateCourseOwnership).mockResolvedValue(undefined);

      await expect(
        service.submitParticipationRecords(subjectId, facultyId, date, records, userId)
      ).rejects.toThrow(InvalidParticipationScoreError);
    });

    it('should throw InvalidParticipationScoreError for score > 5', async () => {
      const subjectId = 'course-123';
      const facultyId = 'faculty-123';
      const userId = 'user-123';
      const date = '2024-01-15';
      const records = [
        { studentId: 'student-1', participationScore: 6 },
      ];

      vi.mocked(validateCourseOwnership).mockResolvedValue(undefined);

      await expect(
        service.submitParticipationRecords(subjectId, facultyId, date, records, userId)
      ).rejects.toThrow(InvalidParticipationScoreError);
    });

    it('should throw InvalidStudentError for non-enrolled students', async () => {
      const subjectId = 'course-123';
      const facultyId = 'faculty-123';
      const userId = 'user-123';
      const date = '2024-01-15';
      const records = [
        { studentId: 'student-1', participationScore: 4 },
        { studentId: 'student-2', participationScore: 5 },
      ];

      vi.mocked(validateCourseOwnership).mockResolvedValue(undefined);

      // Mock enrolled students check - only student-1 is enrolled
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { student_id: 'student-1' },
          ]),
        }),
      });

      await expect(
        service.submitParticipationRecords(subjectId, facultyId, date, records, userId)
      ).rejects.toThrow(InvalidStudentError);
    });

    it('should update existing records', async () => {
      const subjectId = 'course-123';
      const facultyId = 'faculty-123';
      const userId = 'user-123';
      const date = '2024-01-15';
      const records = [
        { studentId: 'student-1', participationScore: 5, remarks: 'Updated' },
      ];

      vi.mocked(validateCourseOwnership).mockResolvedValue(undefined);

      // Mock enrolled students check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { student_id: 'student-1' },
          ]),
        }),
      });

      // Mock existing records check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 'existing-1', student_id: 'student-1' },
          ]),
        }),
      });

      // Mock update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.submitParticipationRecords(
        subjectId,
        facultyId,
        date,
        records,
        userId
      );

      expect(result.recordsSaved).toBe(1);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw CourseOwnershipError if course not assigned to faculty', async () => {
      const subjectId = 'course-123';
      const facultyId = 'faculty-123';
      const userId = 'user-123';
      const date = '2024-01-15';
      const records = [
        { studentId: 'student-1', participationScore: 4 },
      ];

      vi.mocked(validateCourseOwnership).mockRejectedValue(
        new CourseOwnershipError(subjectId)
      );

      await expect(
        service.submitParticipationRecords(subjectId, facultyId, date, records, userId)
      ).rejects.toThrow(CourseOwnershipError);
    });
  });
});
