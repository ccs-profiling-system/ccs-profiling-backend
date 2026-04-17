/**
 * Report Service Tests
 * 
 * Tests for report generation service functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    reportService = new ReportService();
  });

  describe('exportReport', () => {
    it('should throw error for unsupported report type', async () => {
      await expect(
        reportService.exportReport('invalid_type', 'pdf', 'Computer Science')
      ).rejects.toThrow('Unsupported report type');
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        reportService.exportReport('student_stats', 'invalid_format', 'Computer Science')
      ).rejects.toThrow('Unsupported format');
    });

    it('should accept valid report types', async () => {
      const validTypes = [
        'student_stats',
        'faculty_stats',
      ];

      // These types should work
      for (const type of validTypes) {
        const result = await reportService.exportReport(type, 'pdf', 'Computer Science');
        expect(result).toHaveProperty('buffer');
        expect(result).toHaveProperty('fileName');
        expect(result).toHaveProperty('mimeType');
        expect(result.mimeType).toBe('application/pdf');
      }

      // These types should throw "not yet implemented"
      const placeholderTypes = ['schedule_summary', 'event_summary', 'research_summary'];
      for (const type of placeholderTypes) {
        await expect(
          reportService.exportReport(type, 'pdf', 'Computer Science')
        ).rejects.toThrow('not yet implemented');
      }
    });
  });

  describe('getStudentStats', () => {
    it('should return student statistics structure', async () => {
      const stats = await reportService.getStudentStats('Computer Science');

      expect(stats).toHaveProperty('totalStudents');
      expect(stats).toHaveProperty('enrollmentTrends');
      expect(stats).toHaveProperty('statusDistribution');
      expect(stats).toHaveProperty('yearLevelBreakdown');
      expect(Array.isArray(stats.enrollmentTrends)).toBe(true);
      expect(Array.isArray(stats.statusDistribution)).toBe(true);
      expect(Array.isArray(stats.yearLevelBreakdown)).toBe(true);
    });
  });

  describe('getFacultyStats', () => {
    it('should return faculty statistics structure', async () => {
      const stats = await reportService.getFacultyStats('Computer Science');

      expect(stats).toHaveProperty('totalFaculty');
      expect(stats).toHaveProperty('departmentDistribution');
      expect(stats).toHaveProperty('teachingLoadAnalysis');
      expect(stats).toHaveProperty('researchSupervisionCounts');
      expect(Array.isArray(stats.departmentDistribution)).toBe(true);
      expect(Array.isArray(stats.teachingLoadAnalysis)).toBe(true);
      expect(Array.isArray(stats.researchSupervisionCounts)).toBe(true);
    });
  });
});
