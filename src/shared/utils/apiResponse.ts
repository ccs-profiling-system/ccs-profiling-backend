/**
 * API Response Utilities
 * Provides consistent response formatting for success and error responses
 * Implements Requirements 24.1, 24.2, 24.5-24.12
 */

/**
 * Standard success response structure
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: ErrorCode;
    timestamp: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any;
  };
}

/**
 * Error codes for different error scenarios
 * Requirement 24.5-24.10
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'    // 24.5 - Input validation failures
  | 'NOT_FOUND'           // 24.6 - Resource not found errors
  | 'UNAUTHORIZED'        // 24.7 - Authentication failures
  | 'FORBIDDEN'           // 24.8 - Authorization failures
  | 'INTERNAL_ERROR'      // 24.9 - Server errors
  | 'CONFLICT';           // 24.10 - Resource conflict errors

/**
 * Format a successful API response
 * Requirement 24.1, 24.2
 * 
 * @param data - The response payload
 * @param meta - Optional pagination metadata
 * @returns Formatted success response
 * 
 * @example
 * // Simple success response
 * formatSuccessResponse({ id: '123', name: 'John' })
 * // Returns: { success: true, data: { id: '123', name: 'John' } }
 * 
 * @example
 * // Success response with pagination
 * formatSuccessResponse(
 *   [{ id: '1' }, { id: '2' }],
 *   { page: 1, limit: 10, total: 50, totalPages: 5 }
 * )
 */
export function formatSuccessResponse<T>(
  data: T,
  meta?: PaginationMeta
): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return response;
}

/**
 * Format an error API response
 * Requirement 24.3, 24.4, 24.5-24.10, 24.12
 * 
 * @param message - Error message
 * @param code - Error code
 * @param details - Optional additional error details
 * @returns Formatted error response
 * 
 * @example
 * // Simple error response
 * formatErrorResponse('Student not found', 'NOT_FOUND')
 * 
 * @example
 * // Error response with details
 * formatErrorResponse(
 *   'Validation failed',
 *   'VALIDATION_ERROR',
 *   { field: 'email', message: 'Invalid email format' }
 * )
 */
export function formatErrorResponse(
  message: string,
  code: ErrorCode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any
): ErrorResponse {
  return {
    success: false,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    error: {
      message,
      code,
      timestamp: new Date().toISOString(), // Requirement 24.12 - ISO 8601 format
      ...(details && { 
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details 
      }),
    },
  };
}

/**
 * Format a paginated list response
 * Requirement 24.11
 * 
 * @param data - Array of items
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Formatted success response with pagination metadata
 * 
 * @example
 * formatPaginatedResponse(
 *   [{ id: '1' }, { id: '2' }],
 *   1,
 *   10,
 *   50
 * )
 * // Returns: {
 * //   success: true,
 * //   data: [...],
 * //   meta: { page: 1, limit: 10, total: 50, totalPages: 5 }
 * // }
 */
export function formatPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): SuccessResponse<T[]> {
  const totalPages = Math.ceil(total / limit);

  return formatSuccessResponse(data, {
    page,
    limit,
    total,
    totalPages,
  });
}

/**
 * Helper to create pagination metadata object
 * 
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
