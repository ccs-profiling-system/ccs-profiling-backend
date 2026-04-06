/**
 * Pagination Utilities Tests
 * Tests for pagination helper functions
 * 
 * Requirements: 27.1, 27.2
 */

import { describe, it, expect } from 'vitest';
import {
  calculateOffset,
  calculateTotalPages,
  normalizePaginationParams,
  type PaginationParams,
} from './pagination';
import { createPaginationMeta, type PaginationMeta } from './apiResponse';

describe('Pagination Utilities', () => {
  describe('calculateOffset', () => {
    it('should calculate offset for page 1', () => {
      // Requirement 27.1 - Calculate offset for first page
      expect(calculateOffset(1, 10)).toBe(0);
      expect(calculateOffset(1, 25)).toBe(0);
      expect(calculateOffset(1, 100)).toBe(0);
    });

    it('should calculate offset for subsequent pages', () => {
      // Requirement 27.1 - Calculate offset for pagination
      expect(calculateOffset(2, 10)).toBe(10);
      expect(calculateOffset(3, 10)).toBe(20);
      expect(calculateOffset(5, 25)).toBe(100);
      expect(calculateOffset(10, 10)).toBe(90);
    });

    it('should handle different limit values', () => {
      expect(calculateOffset(2, 5)).toBe(5);
      expect(calculateOffset(2, 50)).toBe(50);
      expect(calculateOffset(3, 15)).toBe(30);
    });
  });

  describe('calculateTotalPages', () => {
    it('should calculate total pages for evenly divisible totals', () => {
      // Requirement 27.2 - Calculate total pages
      expect(calculateTotalPages(100, 10)).toBe(10);
      expect(calculateTotalPages(50, 10)).toBe(5);
      expect(calculateTotalPages(25, 25)).toBe(1);
    });

    it('should round up for non-evenly divisible totals', () => {
      // Requirement 27.2 - Round up partial pages
      expect(calculateTotalPages(51, 10)).toBe(6);
      expect(calculateTotalPages(101, 10)).toBe(11);
      expect(calculateTotalPages(26, 25)).toBe(2);
      expect(calculateTotalPages(1, 10)).toBe(1);
    });

    it('should return 0 for empty results', () => {
      // Requirement 27.6 - Handle empty results
      expect(calculateTotalPages(0, 10)).toBe(0);
      expect(calculateTotalPages(0, 25)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(calculateTotalPages(1, 1)).toBe(1);
      expect(calculateTotalPages(1, 100)).toBe(1);
      expect(calculateTotalPages(99, 100)).toBe(1);
      expect(calculateTotalPages(100, 100)).toBe(1);
      expect(calculateTotalPages(101, 100)).toBe(2);
    });
  });

  describe('createPaginationMeta', () => {
    it('should create complete pagination metadata', () => {
      // Requirements 27.1, 27.2, 27.3, 27.4, 27.5
      const meta = createPaginationMeta(1, 10, 50);

      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
    });

    it('should include correct page number', () => {
      // Requirement 27.3 - Include current page number
      expect(createPaginationMeta(1, 10, 50).page).toBe(1);
      expect(createPaginationMeta(2, 10, 50).page).toBe(2);
      expect(createPaginationMeta(5, 10, 50).page).toBe(5);
    });

    it('should include correct limit', () => {
      // Requirement 27.4 - Include page size limit
      expect(createPaginationMeta(1, 10, 50).limit).toBe(10);
      expect(createPaginationMeta(1, 25, 50).limit).toBe(25);
      expect(createPaginationMeta(1, 100, 50).limit).toBe(100);
    });

    it('should include correct total', () => {
      // Requirement 27.5 - Include total record count
      expect(createPaginationMeta(1, 10, 50).total).toBe(50);
      expect(createPaginationMeta(1, 10, 100).total).toBe(100);
      expect(createPaginationMeta(1, 10, 0).total).toBe(0);
    });

    it('should calculate totalPages correctly', () => {
      // Requirement 27.2 - Calculate total pages
      expect(createPaginationMeta(1, 10, 50).totalPages).toBe(5);
      expect(createPaginationMeta(1, 10, 51).totalPages).toBe(6);
      expect(createPaginationMeta(1, 10, 0).totalPages).toBe(0);
      expect(createPaginationMeta(1, 25, 100).totalPages).toBe(4);
    });

    it('should handle empty results', () => {
      // Requirement 27.6 - Handle empty results
      const meta = createPaginationMeta(1, 10, 0);

      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });

    it('should handle single item', () => {
      const meta = createPaginationMeta(1, 10, 1);

      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('normalizePaginationParams', () => {
    it('should use default values when params are empty', () => {
      const params: PaginationParams = {};
      const normalized = normalizePaginationParams(params);

      expect(normalized).toEqual({
        page: 1,
        limit: 10,
      });
    });

    it('should use provided values when valid', () => {
      const params: PaginationParams = { page: 2, limit: 25 };
      const normalized = normalizePaginationParams(params);

      expect(normalized).toEqual({
        page: 2,
        limit: 25,
      });
    });

    it('should normalize negative page to 1', () => {
      const params: PaginationParams = { page: -1, limit: 10 };
      const normalized = normalizePaginationParams(params);

      expect(normalized.page).toBe(1);
    });

    it('should normalize zero page to 1', () => {
      const params: PaginationParams = { page: 0, limit: 10 };
      const normalized = normalizePaginationParams(params);

      expect(normalized.page).toBe(1);
    });

    it('should cap limit at maxLimit', () => {
      const params: PaginationParams = { page: 1, limit: 200 };
      const normalized = normalizePaginationParams(params, 10, 100);

      expect(normalized.limit).toBe(100);
    });

    it('should normalize negative limit to 1', () => {
      const params: PaginationParams = { page: 1, limit: -10 };
      const normalized = normalizePaginationParams(params);

      expect(normalized.limit).toBe(1);
    });

    it('should normalize zero limit to default', () => {
      const params: PaginationParams = { page: 1, limit: 0 };
      const normalized = normalizePaginationParams(params);

      expect(normalized.limit).toBe(10);
    });

    it('should use custom default limit', () => {
      const params: PaginationParams = {};
      const normalized = normalizePaginationParams(params, 25);

      expect(normalized.limit).toBe(25);
    });

    it('should use custom max limit', () => {
      const params: PaginationParams = { limit: 150 };
      const normalized = normalizePaginationParams(params, 10, 50);

      expect(normalized.limit).toBe(50);
    });

    it('should handle undefined page and limit', () => {
      const params: PaginationParams = { page: undefined, limit: undefined };
      const normalized = normalizePaginationParams(params);

      expect(normalized).toEqual({
        page: 1,
        limit: 10,
      });
    });
  });

  describe('Type exports', () => {
    it('should export PaginationParams type', () => {
      const params: PaginationParams = { page: 1, limit: 10 };
      expect(params).toBeDefined();
    });

    it('should export PaginationMeta type', () => {
      const meta: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5,
      };
      expect(meta).toBeDefined();
    });
  });
});
