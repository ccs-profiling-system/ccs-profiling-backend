/**
 * Filter Builder Utility
 * Provides dynamic filter building for Drizzle ORM queries
 * 
 * Requirements: 3.14-3.15, 4.14-4.15, 5.14, 6.17-6.18, 7.20-7.21, 8.28-8.29
 */

import { SQL, and, eq, gte, lte, ilike, or, sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

export interface FilterOptions {
  // Enum filters (exact match)
  enumFilters?: Record<string, string>;
  
  // Date range filters
  dateRangeFilters?: {
    field: PgColumn;
    startDate?: string;
    endDate?: string;
  }[];
  
  // Search filters (ILIKE for text fields)
  searchFilters?: {
    fields: PgColumn[];
    searchTerm?: string;
  };
  
  // Multiple field filters (OR condition)
  multiFieldFilters?: {
    field: PgColumn;
    values: string[];
  }[];
}

/**
 * Build WHERE clause for dynamic filtering
 * 
 * Supports:
 * - Filtering by multiple fields (exact match)
 * - Date range filtering (gte/lte)
 * - Enum filtering (exact match)
 * - Search (ILIKE for text fields)
 * 
 * @param filters - Filter options object
 * @param columnMap - Map of filter keys to database columns
 * @returns SQL condition for WHERE clause, or undefined if no filters
 * 
 * Requirements: 3.14-3.15, 4.14-4.15, 5.14, 6.17-6.18, 7.20-7.21, 8.28-8.29
 */
export function buildWhereClause(
  filters: Record<string, any>,
  columnMap: Record<string, PgColumn>
): SQL | undefined {
  const conditions: SQL[] = [];

  // Process each filter
  for (const [key, value] of Object.entries(filters)) {
    // Skip undefined, null, or empty string values
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const column = columnMap[key];
    if (!column) {
      continue; // Skip unknown filter keys
    }

    // Handle array values (IN clause)
    if (Array.isArray(value)) {
      if (value.length > 0) {
        const orConditions = value.map((v) => eq(column, v));
        conditions.push(or(...orConditions)!);
      }
    } else {
      // Handle single value (exact match)
      conditions.push(eq(column, value));
    }
  }

  // Return combined conditions or undefined if no filters
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Build date range filter condition
 * 
 * @param column - Database column to filter
 * @param startDate - Start date (ISO 8601 string)
 * @param endDate - End date (ISO 8601 string)
 * @returns SQL condition for date range, or undefined if no dates provided
 * 
 * Requirements: 6.17, 7.20, 8.28
 */
export function buildDateRangeFilter(
  column: PgColumn,
  startDate?: string,
  endDate?: string
): SQL | undefined {
  const conditions: SQL[] = [];

  if (startDate) {
    conditions.push(gte(column, new Date(startDate)));
  }

  if (endDate) {
    conditions.push(lte(column, new Date(endDate)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Build search filter condition (ILIKE for text fields)
 * 
 * Searches across multiple text fields using OR condition
 * 
 * @param columns - Array of database columns to search
 * @param searchTerm - Search term to match
 * @returns SQL condition for search, or undefined if no search term
 * 
 * Requirements: 3.15, 4.15, 6.18, 7.21, 8.29
 */
export function buildSearchFilter(
  columns: PgColumn[],
  searchTerm?: string
): SQL | undefined {
  if (!searchTerm || searchTerm.trim() === '') {
    return undefined;
  }

  const searchPattern = `%${searchTerm.trim()}%`;
  const conditions = columns.map((column) => ilike(column, searchPattern));

  return or(...conditions);
}

/**
 * Combine multiple filter conditions
 * 
 * @param conditions - Array of SQL conditions
 * @returns Combined SQL condition, or undefined if no conditions
 */
export function combineFilters(...conditions: (SQL | undefined)[]): SQL | undefined {
  const validConditions = conditions.filter((c): c is SQL => c !== undefined);
  return validConditions.length > 0 ? and(...validConditions) : undefined;
}

/**
 * Build advanced filter with enum, date range, and search support
 * 
 * @param options - Filter options
 * @returns SQL condition for WHERE clause, or undefined if no filters
 * 
 * Requirements: 3.14-3.15, 4.14-4.15, 5.14, 6.17-6.18, 7.20-7.21, 8.28-8.29
 */
export function buildAdvancedFilter(options: FilterOptions): SQL | undefined {
  const conditions: SQL[] = [];

  // Process enum filters
  if (options.enumFilters) {
    for (const [column, value] of Object.entries(options.enumFilters)) {
      if (value) {
        conditions.push(sql`${sql.raw(column)} = ${value}`);
      }
    }
  }

  // Process date range filters
  if (options.dateRangeFilters) {
    for (const dateFilter of options.dateRangeFilters) {
      const dateCondition = buildDateRangeFilter(
        dateFilter.field,
        dateFilter.startDate,
        dateFilter.endDate
      );
      if (dateCondition) {
        conditions.push(dateCondition);
      }
    }
  }

  // Process search filters
  if (options.searchFilters) {
    const searchCondition = buildSearchFilter(
      options.searchFilters.fields,
      options.searchFilters.searchTerm
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
