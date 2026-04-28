/**
 * Pagination Utility Tests
 */

import { describe, it, expect } from 'vitest';
import {
  buildPaginationMeta,
  applyPagination,
  extractPaginationParams,
} from './pagination';

describe('Pagination Utility', () => {
  describe('buildPaginationMeta', () => {
    it('should build pagination metadata with defaults', () => {
      const meta = buildPaginationMeta(100);
      
      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      });
    });

    it('should build pagination metadata with custom page and limit', () => {
      const meta = buildPaginationMeta(100, 2, 20);
      
      expect(meta).toEqual({
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5,
      });
    });

    it('should enforce maximum limit of 100', () => {
      const meta = buildPaginationMeta(1000, 1, 200);
      
      expect(meta.limit).toBe(100);
      expect(meta.totalPages).toBe(10); // 1000 / 100
    });

    it('should enforce minimum page of 1', () => {
      const meta = buildPaginationMeta(100, 0, 10);
      
      expect(meta.page).toBe(1);
    });

    it('should default to 10 for invalid limit', () => {
      const meta = buildPaginationMeta(100, 1, 0);
      
      expect(meta.limit).toBe(10);
    });

    it('should calculate totalPages correctly with ceiling', () => {
      const meta = buildPaginationMeta(95, 1, 10);
      
      expect(meta.totalPages).toBe(10); // Math.ceil(95 / 10)
    });

    it('should handle zero total', () => {
      const meta = buildPaginationMeta(0, 1, 10);
      
      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe('applyPagination', () => {
    it('should calculate limit and offset with defaults', () => {
      const result = applyPagination();
      
      expect(result).toEqual({
        limit: 10,
        offset: 0,
      });
    });

    it('should calculate limit and offset for page 2', () => {
      const result = applyPagination(2, 10);
      
      expect(result).toEqual({
        limit: 10,
        offset: 10,
      });
    });

    it('should calculate limit and offset for page 3 with limit 20', () => {
      const result = applyPagination(3, 20);
      
      expect(result).toEqual({
        limit: 20,
        offset: 40,
      });
    });

    it('should enforce maximum limit of 100', () => {
      const result = applyPagination(1, 200);
      
      expect(result.limit).toBe(100);
    });

    it('should enforce minimum page of 1', () => {
      const result = applyPagination(0, 10);
      
      expect(result.offset).toBe(0);
    });

    it('should default to 10 for invalid limit', () => {
      const result = applyPagination(1, 0);
      
      expect(result.limit).toBe(10);
    });
  });

  describe('extractPaginationParams', () => {
    it('should extract pagination params from query', () => {
      const query = { page: '2', limit: '20' };
      const params = extractPaginationParams(query);
      
      expect(params).toEqual({
        page: 2,
        limit: 20,
      });
    });

    it('should use defaults when params are missing', () => {
      const query = {};
      const params = extractPaginationParams(query);
      
      expect(params).toEqual({
        page: 1,
        limit: 10,
      });
    });

    it('should enforce maximum limit of 100', () => {
      const query = { page: '1', limit: '200' };
      const params = extractPaginationParams(query);
      
      expect(params.limit).toBe(100);
    });

    it('should enforce minimum page of 1', () => {
      const query = { page: '-1', limit: '10' };
      const params = extractPaginationParams(query);
      
      expect(params.page).toBe(1);
    });

    it('should handle invalid numeric values', () => {
      const query = { page: 'invalid', limit: 'invalid' };
      const params = extractPaginationParams(query);
      
      expect(params.page).toBe(1);
      expect(params.limit).toBe(10);
    });
  });
});
