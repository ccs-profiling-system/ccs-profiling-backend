import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApprovalStatisticsService } from '../approval-statistics.service';
import { db } from '../../db';
import { approvals, ApprovalStatus } from '../../db/schema/approvals';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('ApprovalStatisticsService', () => {
  let service: ApprovalStatisticsService;
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockDepartmentId = '123e4567-e89b-12d3-a456-426614174001';

  beforeEach(() => {
    service = new ApprovalStatisticsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSecretaryStats', () => {
    it('should return statistics for a secretary with submissions', async () => {
      // Mock status counts
      const mockStatusResults = [
        { status: ApprovalStatus.PENDING, count: 5 },
        { status: ApprovalStatus.APPROVED, count: 10 },
        { status: ApprovalStatus.REJECTED, count: 3 },
        { status: ApprovalStatus.WITHDRAWN, count: 2 },
      ];

      // Mock entity type counts
      const mockEntityTypeResults = [
        { entity_type: 'student', count: 8 },
        { entity_type: 'faculty', count: 7 },
        { entity_type: 'event', count: 5 },
      ];

      // Mock category counts
      const mockCategoryResults = [
        { category: 'profile', count: 10 },
        { category: 'research', count: 6 },
        { category: 'event', count: 4 },
      ];

      // Setup mock chain for status query
      const mockStatusSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue(mockStatusResults),
      };

      // Setup mock chain for entity type query
      const mockEntityTypeSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue(mockEntityTypeResults),
      };

      // Setup mock chain for category query
      const mockCategorySelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue(mockCategoryResults),
      };

      // Mock db.select to return different chains based on call order
      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockStatusSelect as any;
        if (callCount === 2) return mockEntityTypeSelect as any;
        return mockCategorySelect as any;
      });

      const result = await service.getSecretaryStats(mockUserId);

      expect(result.totalSubmissions).toBe(20);
      expect(result.countsByStatus).toEqual({
        pending: 5,
        approved: 10,
        rejected: 3,
        withdrawn: 2,
      });
      expect(result.approvalRate).toBe(76.92); // 10 / (10 + 3) * 100
      expect(result.rejectionRate).toBe(23.08); // 3 / (10 + 3) * 100
      expect(result.countsByEntityType).toEqual({
        student: 8,
        faculty: 7,
        event: 5,
      });
      expect(result.countsByCategory).toEqual({
        profile: 10,
        research: 6,
        event: 4,
      });
    });

    it('should handle secretary with no submissions', async () => {
      const mockEmptyResults: any[] = [];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue(mockEmptyResults),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await service.getSecretaryStats(mockUserId);

      expect(result.totalSubmissions).toBe(0);
      expect(result.countsByStatus).toEqual({});
      expect(result.approvalRate).toBe(0);
      expect(result.rejectionRate).toBe(0);
      expect(result.countsByEntityType).toEqual({});
      expect(result.countsByCategory).toEqual({});
    });

    it('should calculate 0% rates when no processed submissions exist', async () => {
      const mockStatusResults = [
        { status: ApprovalStatus.PENDING, count: 10 },
        { status: ApprovalStatus.DRAFT, count: 5 },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue(mockStatusResults),
      };

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockSelect as any;
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          groupBy: vi.fn().mockResolvedValue([]),
        } as any;
      });

      const result = await service.getSecretaryStats(mockUserId);

      expect(result.approvalRate).toBe(0);
      expect(result.rejectionRate).toBe(0);
    });
  });

  describe('getAdminStats', () => {
    it('should return system-wide statistics', async () => {
      const mockStatusResults = [
        { status: ApprovalStatus.PENDING, count: 15 },
        { status: ApprovalStatus.APPROVED, count: 50 },
        { status: ApprovalStatus.REJECTED, count: 10 },
      ];

      const mockAvgTimeResult = [{ avgHours: 12.5 }];

      const mockEntityTypeResults = [
        { entity_type: 'student', count: 30 },
        { entity_type: 'faculty', count: 25 },
      ];

      const mockCategoryResults = [
        { category: 'profile', count: 35 },
        { category: 'research', count: 20 },
      ];

      const mockPending24h = [{ count: 8 }];
      const mockPending7d = [{ count: 3 }];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        
        if (callCount === 1 || callCount === 3 || callCount === 4) {
          // Queries with groupBy (status, entity type, category)
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            groupBy: vi.fn(),
          };

          if (callCount === 1) {
            mockChain.groupBy.mockResolvedValue(mockStatusResults);
          } else if (callCount === 3) {
            mockChain.groupBy.mockResolvedValue(mockEntityTypeResults);
          } else if (callCount === 4) {
            mockChain.groupBy.mockResolvedValue(mockCategoryResults);
          }

          return mockChain as any;
        } else if (callCount === 2) {
          // Average time query (no groupBy, just where)
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockAvgTimeResult),
          };
          return mockChain as any;
        } else {
          // Pending count queries (no groupBy)
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn(),
          };

          if (callCount === 5) {
            mockChain.where.mockResolvedValue(mockPending24h);
          } else if (callCount === 6) {
            mockChain.where.mockResolvedValue(mockPending7d);
          }

          return mockChain as any;
        }
      });

      const result = await service.getAdminStats();

      expect(result.totalApprovals).toBe(75);
      expect(result.countsByStatus).toEqual({
        pending: 15,
        approved: 50,
        rejected: 10,
      });
      expect(result.approvalRate).toBe(83.33); // 50 / (50 + 10) * 100
      expect(result.rejectionRate).toBe(16.67); // 10 / (50 + 10) * 100
      expect(result.averageApprovalTimeHours).toBe(12.5);
      expect(result.countsByEntityType).toEqual({
        student: 30,
        faculty: 25,
      });
      expect(result.countsByCategory).toEqual({
        profile: 35,
        research: 20,
      });
      expect(result.pendingOlderThan24Hours).toBe(8);
      expect(result.pendingOlderThan7Days).toBe(3);
    });

    it('should handle zero average approval time', async () => {
      const mockStatusResults = [
        { status: ApprovalStatus.PENDING, count: 10 },
      ];

      const mockAvgTimeResult = [{ avgHours: null }];
      const mockEmptyResults: any[] = [];
      const mockCountResult = [{ count: 0 }];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        
        if (callCount === 1 || callCount === 3 || callCount === 4) {
          // Queries with groupBy
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            groupBy: vi.fn(),
          };

          if (callCount === 1) {
            mockChain.groupBy.mockResolvedValue(mockStatusResults);
          } else {
            mockChain.groupBy.mockResolvedValue(mockEmptyResults);
          }

          return mockChain as any;
        } else if (callCount === 2) {
          // Average time query (no groupBy)
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockAvgTimeResult),
          };
          return mockChain as any;
        } else {
          // Pending count queries
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn(),
          };
          mockChain.where.mockResolvedValue(mockCountResult);
          return mockChain as any;
        }
      });

      const result = await service.getAdminStats();

      expect(result.averageApprovalTimeHours).toBe(0);
    });

    it('should calculate correct rates with large numbers', async () => {
      const mockStatusResults = [
        { status: ApprovalStatus.APPROVED, count: 999 },
        { status: ApprovalStatus.REJECTED, count: 1 },
      ];

      const mockEmptyResults: any[] = [];
      const mockCountResult = [{ count: 0 }];
      const mockAvgTimeResult = [{ avgHours: 0 }];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        
        if (callCount === 1 || callCount === 3 || callCount === 4) {
          // Queries with groupBy
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            groupBy: vi.fn(),
          };

          if (callCount === 1) {
            mockChain.groupBy.mockResolvedValue(mockStatusResults);
          } else {
            mockChain.groupBy.mockResolvedValue(mockEmptyResults);
          }

          return mockChain as any;
        } else if (callCount === 2) {
          // Average time query (no groupBy)
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockAvgTimeResult),
          };
          return mockChain as any;
        } else {
          // Pending count queries
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn(),
          };
          mockChain.where.mockResolvedValue(mockCountResult);
          return mockChain as any;
        }
      });

      const result = await service.getAdminStats();

      expect(result.approvalRate).toBe(99.9); // 999 / 1000 * 100
      expect(result.rejectionRate).toBe(0.1); // 1 / 1000 * 100
    });
  });

  describe('getChairStats', () => {
    it('should return department-scoped statistics', async () => {
      const mockStatusResults = [
        { status: ApprovalStatus.PENDING, count: 5 },
        { status: ApprovalStatus.APPROVED, count: 20 },
        { status: ApprovalStatus.REJECTED, count: 5 },
      ];

      const mockAvgTimeResult = [{ avgHours: 8.75 }];

      const mockEntityTypeResults = [
        { entity_type: 'student', count: 15 },
        { entity_type: 'faculty', count: 10 },
      ];

      const mockCategoryResults = [
        { category: 'profile', count: 18 },
        { category: 'research', count: 7 },
      ];

      const mockPending24h = [{ count: 3 }];
      const mockPending7d = [{ count: 1 }];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        
        if (callCount === 1 || callCount === 3 || callCount === 4) {
          // Queries with groupBy (status, entity type, category)
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            groupBy: vi.fn(),
          };

          if (callCount === 1) {
            mockChain.groupBy.mockResolvedValue(mockStatusResults);
          } else if (callCount === 3) {
            mockChain.groupBy.mockResolvedValue(mockEntityTypeResults);
          } else if (callCount === 4) {
            mockChain.groupBy.mockResolvedValue(mockCategoryResults);
          }

          return mockChain as any;
        } else if (callCount === 2) {
          // Average time query (no groupBy, just where)
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockAvgTimeResult),
          };
          return mockChain as any;
        } else {
          // Pending count queries (no groupBy)
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn(),
          };

          if (callCount === 5) {
            mockChain.where.mockResolvedValue(mockPending24h);
          } else if (callCount === 6) {
            mockChain.where.mockResolvedValue(mockPending7d);
          }

          return mockChain as any;
        }
      });

      const result = await service.getChairStats(mockDepartmentId);

      expect(result.totalApprovals).toBe(30);
      expect(result.countsByStatus).toEqual({
        pending: 5,
        approved: 20,
        rejected: 5,
      });
      expect(result.approvalRate).toBe(80); // 20 / (20 + 5) * 100
      expect(result.rejectionRate).toBe(20); // 5 / (20 + 5) * 100
      expect(result.averageApprovalTimeHours).toBe(8.75);
      expect(result.countsByEntityType).toEqual({
        student: 15,
        faculty: 10,
      });
      expect(result.countsByCategory).toEqual({
        profile: 18,
        research: 7,
      });
      expect(result.pendingOlderThan24Hours).toBe(3);
      expect(result.pendingOlderThan7Days).toBe(1);
    });

    it('should handle department with no approvals', async () => {
      const mockEmptyResults: any[] = [];
      const mockCountResult = [{ count: 0 }];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        
        if (callCount <= 4) {
          const mockSelect = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            groupBy: vi.fn().mockResolvedValue(mockEmptyResults),
          };
          return mockSelect as any;
        } else {
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn(),
          };
          mockChain.where.mockResolvedValue(mockCountResult);
          return mockChain as any;
        }
      });

      const result = await service.getChairStats(mockDepartmentId);

      expect(result.totalApprovals).toBe(0);
      expect(result.countsByStatus).toEqual({});
      expect(result.approvalRate).toBe(0);
      expect(result.rejectionRate).toBe(0);
    });

    it('should round approval time to 2 decimal places', async () => {
      const mockStatusResults = [
        { status: ApprovalStatus.APPROVED, count: 10 },
      ];

      const mockAvgTimeResult = [{ avgHours: 15.6789 }];
      const mockEmptyResults: any[] = [];
      const mockCountResult = [{ count: 0 }];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        
        if (callCount === 1 || callCount === 3 || callCount === 4) {
          // Queries with groupBy
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            groupBy: vi.fn(),
          };

          if (callCount === 1) {
            mockChain.groupBy.mockResolvedValue(mockStatusResults);
          } else {
            mockChain.groupBy.mockResolvedValue(mockEmptyResults);
          }

          return mockChain as any;
        } else if (callCount === 2) {
          // Average time query (no groupBy)
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockAvgTimeResult),
          };
          return mockChain as any;
        } else {
          // Pending count queries
          const mockChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn(),
          };
          mockChain.where.mockResolvedValue(mockCountResult);
          return mockChain as any;
        }
      });

      const result = await service.getChairStats(mockDepartmentId);

      expect(result.averageApprovalTimeHours).toBe(15.68);
    });
  });

  describe('Rate Calculations', () => {
    it('should handle 100% approval rate', async () => {
      const mockStatusResults = [
        { status: ApprovalStatus.APPROVED, count: 50 },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue(mockStatusResults),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await service.getSecretaryStats(mockUserId);

      expect(result.approvalRate).toBe(100);
      expect(result.rejectionRate).toBe(0);
    });

    it('should handle 100% rejection rate', async () => {
      const mockStatusResults = [
        { status: ApprovalStatus.REJECTED, count: 25 },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue(mockStatusResults),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await service.getSecretaryStats(mockUserId);

      expect(result.approvalRate).toBe(0);
      expect(result.rejectionRate).toBe(100);
    });

    it('should handle 50/50 approval and rejection rate', async () => {
      const mockStatusResults = [
        { status: ApprovalStatus.APPROVED, count: 10 },
        { status: ApprovalStatus.REJECTED, count: 10 },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue(mockStatusResults),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await service.getSecretaryStats(mockUserId);

      expect(result.approvalRate).toBe(50);
      expect(result.rejectionRate).toBe(50);
    });
  });
});
