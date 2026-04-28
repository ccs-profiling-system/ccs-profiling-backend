/**
 * Filter Service Tests
 * 
 * Tests for filter options retrieval and caching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPrograms, getDepartments, getEventTypes, clearFilterCache } from './filter.service';
import { db } from '../../../db';

// Mock the database
vi.mock('../../../db', () => ({
  db: {
    selectDistinct: vi.fn(),
  },
}));

describe('Filter Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearFilterCache();
    vi.clearAllMocks();
  });

  describe('getPrograms', () => {
    it('should return distinct programs ordered alphabetically', async () => {
      const mockResult = [
        { program: 'Computer Science' },
        { program: 'Information Technology' },
        { program: 'Business Administration' },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResult),
      };

      vi.mocked(db.selectDistinct).mockReturnValue(mockQuery as any);

      const programs = await getPrograms();

      expect(programs).toEqual([
        'Business Administration',
        'Computer Science',
        'Information Technology',
      ]);
    });

    it('should filter out null and empty values', async () => {
      const mockResult = [
        { program: 'Computer Science' },
        { program: null },
        { program: '' },
        { program: '   ' },
        { program: 'Business Administration' },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResult),
      };

      vi.mocked(db.selectDistinct).mockReturnValue(mockQuery as any);

      const programs = await getPrograms();

      expect(programs).toEqual([
        'Business Administration',
        'Computer Science',
      ]);
    });

    it('should use cache on subsequent calls', async () => {
      const mockResult = [{ program: 'Computer Science' }];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResult),
      };

      vi.mocked(db.selectDistinct).mockReturnValue(mockQuery as any);

      // First call
      await getPrograms();
      expect(db.selectDistinct).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await getPrograms();
      expect(db.selectDistinct).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDepartments', () => {
    it('should return distinct departments ordered alphabetically', async () => {
      const mockResult = [
        { department: 'Computer Science' },
        { department: 'Mathematics' },
        { department: 'Engineering' },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResult),
      };

      vi.mocked(db.selectDistinct).mockReturnValue(mockQuery as any);

      const departments = await getDepartments();

      expect(departments).toEqual([
        'Computer Science',
        'Engineering',
        'Mathematics',
      ]);
    });
  });

  describe('getEventTypes', () => {
    it('should return distinct event types ordered alphabetically', async () => {
      const mockResult = [
        { event_type: 'workshop' },
        { event_type: 'seminar' },
        { event_type: 'competition' },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResult),
      };

      vi.mocked(db.selectDistinct).mockReturnValue(mockQuery as any);

      const eventTypes = await getEventTypes();

      expect(eventTypes).toEqual([
        'competition',
        'seminar',
        'workshop',
      ]);
    });
  });

  describe('clearFilterCache', () => {
    it('should clear cache and force new database query', async () => {
      const mockResult = [{ program: 'Computer Science' }];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResult),
      };

      vi.mocked(db.selectDistinct).mockReturnValue(mockQuery as any);

      // First call
      await getPrograms();
      expect(db.selectDistinct).toHaveBeenCalledTimes(1);

      // Clear cache
      clearFilterCache();

      // Next call should query database again
      await getPrograms();
      expect(db.selectDistinct).toHaveBeenCalledTimes(2);
    });
  });
});
