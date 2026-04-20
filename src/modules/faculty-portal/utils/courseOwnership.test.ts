/**
 * Course Ownership Validation Tests
 * 
 * Unit tests for course ownership validation utilities.
 * Tests validation logic for faculty-course assignments.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateCourseOwnership,
  checkCourseOwnership,
  CourseNotFoundError,
  CourseOwnershipError,
} from './courseOwnership';
import { db } from '../../../db';

// Mock the database
vi.mock('../../../db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('Course Ownership Validation', () => {
  const mockCourseId = 'course-123';
  const mockFacultyId = 'faculty-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCourseOwnership', () => {
    it('should pass validation when course exists and is assigned to faculty', async () => {
      // Mock course exists and assignment exists
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValueOnce([{ id: mockCourseId }]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValueOnce([{ id: 'schedule-789' }]),
        });

      (db.select as any) = mockSelect;

      await expect(
        validateCourseOwnership(mockCourseId, mockFacultyId)
      ).resolves.toBeUndefined();
    });

    it('should throw CourseNotFoundError when course does not exist', async () => {
      // Mock course does not exist
      const mockSelect = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      });

      (db.select as any) = mockSelect;

      await expect(
        validateCourseOwnership(mockCourseId, mockFacultyId)
      ).rejects.toThrow(CourseNotFoundError);
    });

    it('should throw CourseOwnershipError when course is not assigned to faculty', async () => {
      // Mock course exists but assignment does not
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValueOnce([{ id: mockCourseId }]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValueOnce([]),
        });

      (db.select as any) = mockSelect;

      await expect(
        validateCourseOwnership(mockCourseId, mockFacultyId)
      ).rejects.toThrow(CourseOwnershipError);
    });

    it('should have correct status codes on errors', async () => {
      // Test CourseNotFoundError status code
      const mockSelect1 = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      });

      (db.select as any) = mockSelect1;

      try {
        await validateCourseOwnership(mockCourseId, mockFacultyId);
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('COURSE_NOT_FOUND');
      }

      // Test CourseOwnershipError status code
      const mockSelect2 = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValueOnce([{ id: mockCourseId }]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValueOnce([]),
        });

      (db.select as any) = mockSelect2;

      try {
        await validateCourseOwnership(mockCourseId, mockFacultyId);
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('COURSE_NOT_ASSIGNED');
      }
    });
  });

  describe('checkCourseOwnership', () => {
    it('should return true when faculty owns the course', async () => {
      // Mock course exists and assignment exists
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValueOnce([{ id: mockCourseId }]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValueOnce([{ id: 'schedule-789' }]),
        });

      (db.select as any) = mockSelect;

      const result = await checkCourseOwnership(mockCourseId, mockFacultyId);
      expect(result).toBe(true);
    });

    it('should return false when course does not exist', async () => {
      // Mock course does not exist
      const mockSelect = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      });

      (db.select as any) = mockSelect;

      const result = await checkCourseOwnership(mockCourseId, mockFacultyId);
      expect(result).toBe(false);
    });

    it('should return false when course is not assigned to faculty', async () => {
      // Mock course exists but assignment does not
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValueOnce([{ id: mockCourseId }]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValueOnce([]),
        });

      (db.select as any) = mockSelect;

      const result = await checkCourseOwnership(mockCourseId, mockFacultyId);
      expect(result).toBe(false);
    });

    it('should not throw errors', async () => {
      // Mock course does not exist
      const mockSelect = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      });

      (db.select as any) = mockSelect;

      // Should not throw, just return false
      await expect(
        checkCourseOwnership(mockCourseId, mockFacultyId)
      ).resolves.toBe(false);
    });
  });

  describe('Error Classes', () => {
    it('should create CourseNotFoundError with correct properties', () => {
      const error = new CourseNotFoundError(mockCourseId);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CourseNotFoundError);
      expect(error.name).toBe('CourseNotFoundError');
      expect(error.message).toBe(`Course with ID ${mockCourseId} not found`);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('COURSE_NOT_FOUND');
    });

    it('should create CourseOwnershipError with correct properties', () => {
      const error = new CourseOwnershipError(mockCourseId);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CourseOwnershipError);
      expect(error.name).toBe('CourseOwnershipError');
      expect(error.message).toBe(`Access denied: Course ${mockCourseId} is not assigned to you`);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('COURSE_NOT_ASSIGNED');
    });
  });
});
