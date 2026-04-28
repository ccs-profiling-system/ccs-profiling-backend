/**
 * Pagination Utility
 * Provides pagination helper functions for list endpoints
 * 
 */

import { SQL } from 'drizzle-orm';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Build pagination metadata
 * 
 * @param total - Total number of records
 * @param page - Current page number (default: 1)
 * @param limit - Records per page (default: 10, max: 100)
 * @returns Pagination metadata object
 * 
 */
export function buildPaginationMeta(
  total: number,
  page: number = 1,
  limit: number = 10
): PaginationMeta {
  // Enforce defaults and handle invalid values
  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.min(Math.max(1, limit > 0 ? limit : 10), 100); // Enforce maximum limit of 100
  
  // Calculate total pages as ceiling(total / limit)
  const totalPages = Math.ceil(total / safeLimit);

  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
  };
}

/**
 * Apply pagination to a Drizzle query
 * 
 * @param page - Current page number (default: 1)
 * @param limit - Records per page (default: 10, max: 100)
 * @returns Object with limit and offset for query
 * 
 */
export function applyPagination(
  page: number = 1,
  limit: number = 10
): { limit: number; offset: number } {
  // Enforce defaults and handle invalid values
  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.min(Math.max(1, limit > 0 ? limit : 10), 100); // Enforce maximum limit of 100
  
  // Calculate offset
  const offset = (safePage - 1) * safeLimit;

  return {
    limit: safeLimit,
    offset,
  };
}

/**
 * Extract pagination parameters from query object
 * 
 * @param query - Query object with optional page and limit
 * @returns Normalized pagination parameters
 */
export function extractPaginationParams(query: any): PaginationParams {
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 10;

  // Handle NaN values
  const safePage = isNaN(page) ? 1 : Math.max(1, page);
  const safeLimit = isNaN(limit) ? 10 : Math.min(Math.max(1, limit), 100);

  return {
    page: safePage,
    limit: safeLimit,
  };
}
