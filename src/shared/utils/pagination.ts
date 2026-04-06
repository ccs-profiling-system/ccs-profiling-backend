/**
 * Pagination Utilities
 * Provides helper functions for pagination calculations and types
 * 
 * Requirements: 27.1, 27.2
 */

/**
 * Pagination parameters for list queries
 * Used to specify page number and items per page
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Calculate offset for database queries based on page and limit
 * 
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Offset value for database query (0-indexed)
 * 
 * @example
 * calculateOffset(1, 10) // Returns 0
 * calculateOffset(2, 10) // Returns 10
 * calculateOffset(3, 25) // Returns 50
 * 
 * Requirement: 27.1
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total number of pages based on total items and limit
 * 
 * @param total - Total number of items
 * @param limit - Number of items per page
 * @returns Total number of pages
 * 
 * @example
 * calculateTotalPages(50, 10) // Returns 5
 * calculateTotalPages(51, 10) // Returns 6
 * calculateTotalPages(0, 10)  // Returns 0
 * calculateTotalPages(1, 10)  // Returns 1
 * 
 * Requirement: 27.2
 */
export function calculateTotalPages(total: number, limit: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.ceil(total / limit);
}

/**
 * Normalize pagination parameters with defaults and constraints
 * 
 * @param params - Raw pagination parameters
 * @param defaultLimit - Default limit if not provided (default: 10)
 * @param maxLimit - Maximum allowed limit (default: 100)
 * @returns Normalized pagination parameters
 * 
 * @example
 * normalizePaginationParams({ page: 2, limit: 50 })
 * // Returns: { page: 2, limit: 50 }
 * 
 * normalizePaginationParams({ page: -1, limit: 200 })
 * // Returns: { page: 1, limit: 100 } (normalized to valid values)
 * 
 * normalizePaginationParams({})
 * // Returns: { page: 1, limit: 10 } (defaults)
 */
export function normalizePaginationParams(
  params: PaginationParams,
  defaultLimit: number = 10,
  maxLimit: number = 100
): Required<PaginationParams> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(maxLimit, Math.max(1, params.limit || defaultLimit));

  return { page, limit };
}
