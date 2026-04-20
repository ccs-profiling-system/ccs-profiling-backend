/**
 * Faculty Portal - Affiliations Service Tests
 * Unit tests for affiliations management service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AffiliationsService } from './affiliations.service';
import { NotFoundError } from '../../../shared/errors';

// Mock database
const mockDb = {
  select: vi.fn(),
  delete: vi.fn(),
  insert: vi.fn(),
  transaction: vi.fn(),
} as any;

// Mock audit log repository
vi.mock('../../audit-logs', () => ({
  auditLogRepository: {
    create: vi.fn(),
  },
}));

describe('AffiliationsService', () => {
  let service: AffiliationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AffiliationsService(mockDb);
  });

  describe('getAffiliationsByFaculty', () => {
    it('should return affiliations for a valid faculty', async () => {
      const facultyId = 'faculty-123';
      const mockFaculty = [{ id: facultyId, deleted_at: null }];
      const mockAffiliations = [
        {
          id: 'aff-1',
          organizationName: 'IEEE',
          type: 'professional',
          role: 'Member',
          startDate: '2020-01-01',
          endDate: null,
          isActive: true,
        },
      ];

      // Mock faculty exists check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockFaculty),
          }),
        }),
      });

      // Mock affiliations query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockAffiliations),
          }),
        }),
      });

      const result = await service.getAffiliationsByFaculty(facultyId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'aff-1',
        organizationName: 'IEEE',
        type: 'professional',
        role: 'Member',
        joinDate: '2020-01-01',
        endDate: null,
        isActive: true,
      });
    });

    it('should throw NotFoundError if faculty does not exist', async () => {
      const facultyId = 'non-existent';

      // Mock faculty not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.getAffiliationsByFaculty(facultyId)).rejects.toThrow(NotFoundError);
    });

    it('should return empty array if no affiliations found', async () => {
      const facultyId = 'faculty-123';
      const mockFaculty = [{ id: facultyId, deleted_at: null }];

      // Mock faculty exists check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockFaculty),
          }),
        }),
      });

      // Mock empty affiliations
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getAffiliationsByFaculty(facultyId);

      expect(result).toEqual([]);
    });
  });

  describe('updateAffiliations', () => {
    it('should validate affiliation type', async () => {
      const facultyId = 'faculty-123';
      const userId = 'user-123';
      const mockFaculty = [{ id: facultyId, deleted_at: null }];

      // Mock faculty exists check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockFaculty),
          }),
        }),
      });

      const invalidAffiliations = [
        {
          organizationName: 'Test Org',
          type: 'invalid-type',
          role: 'Member',
          joinDate: '2020-01-01',
          isActive: true,
        },
      ];

      await expect(
        service.updateAffiliations(facultyId, invalidAffiliations as any, userId)
      ).rejects.toThrow('Invalid type');
    });

    it('should validate joinDate is not in the future', async () => {
      const facultyId = 'faculty-123';
      const userId = 'user-123';
      const mockFaculty = [{ id: facultyId, deleted_at: null }];

      // Mock faculty exists check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockFaculty),
          }),
        }),
      });

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const invalidAffiliations = [
        {
          organizationName: 'Test Org',
          type: 'professional',
          role: 'Member',
          joinDate: futureDateStr,
          isActive: true,
        },
      ];

      await expect(
        service.updateAffiliations(facultyId, invalidAffiliations as any, userId)
      ).rejects.toThrow('Join date cannot be in the future');
    });

    it('should validate endDate is after joinDate', async () => {
      const facultyId = 'faculty-123';
      const userId = 'user-123';
      const mockFaculty = [{ id: facultyId, deleted_at: null }];

      // Mock faculty exists check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockFaculty),
          }),
        }),
      });

      const invalidAffiliations = [
        {
          organizationName: 'Test Org',
          type: 'professional',
          role: 'Member',
          joinDate: '2020-12-31',
          endDate: '2020-01-01',
          isActive: true,
        },
      ];

      await expect(
        service.updateAffiliations(facultyId, invalidAffiliations as any, userId)
      ).rejects.toThrow('End date must be after join date');
    });
  });
});
