/**
 * Filter Service
 * Business logic for filter options in secretary portal
 * 
 */

import { db } from '../../../db';
import { students, faculty, events } from '../../../db/schema';
import { isNull, sql } from 'drizzle-orm';

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * In-memory cache for filter options
 * TTL: 5 minutes (300000 ms)
 */
const CACHE_TTL = 5 * 60 * 1000;
const cache: {
  programs?: CacheEntry<string[]>;
  departments?: CacheEntry<string[]>;
  eventTypes?: CacheEntry<string[]>;
} = {};

/**
 * Check if cache entry is valid
 */
function isCacheValid<T>(entry?: CacheEntry<T>): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Get distinct programs from students table
 * 
 * @returns Array of program names ordered alphabetically
 * 
 */
export async function getPrograms(): Promise<string[]> {
  // Check cache first
  if (isCacheValid(cache.programs)) {
    return cache.programs!.data;
  }

  // Query distinct programs from database
  const result = await db
    .selectDistinct({ program: students.program })
    .from(students)
    .where(isNull(students.deleted_at));

  // Filter out null/empty values and sort alphabetically
  const programs = result
    .map(row => row.program)
    .filter((program): program is string => !!program && program.trim() !== '')
    .sort((a, b) => a.localeCompare(b));

  // Update cache
  cache.programs = {
    data: programs,
    timestamp: Date.now(),
  };

  return programs;
}

/**
 * Get distinct departments from faculty table
 * 
 * @returns Array of department names ordered alphabetically
 * 
 */
export async function getDepartments(): Promise<string[]> {
  // Check cache first
  if (isCacheValid(cache.departments)) {
    return cache.departments!.data;
  }

  // Query distinct departments from database
  const result = await db
    .selectDistinct({ department: faculty.department })
    .from(faculty)
    .where(isNull(faculty.deleted_at));

  // Filter out null/empty values and sort alphabetically
  const departments = result
    .map(row => row.department)
    .filter((dept): dept is string => !!dept && dept.trim() !== '')
    .sort((a, b) => a.localeCompare(b));

  // Update cache
  cache.departments = {
    data: departments,
    timestamp: Date.now(),
  };

  return departments;
}

/**
 * Get distinct event types from events table
 * 
 * @returns Array of event type names ordered alphabetically
 * 
 */
export async function getEventTypes(): Promise<string[]> {
  // Check cache first
  if (isCacheValid(cache.eventTypes)) {
    return cache.eventTypes!.data;
  }

  // Query distinct event types from database
  const result = await db
    .selectDistinct({ event_type: events.event_type })
    .from(events)
    .where(isNull(events.deleted_at));

  // Filter out null/empty values and sort alphabetically
  const eventTypes = result
    .map(row => row.event_type)
    .filter((type): type is string => !!type && type.trim() !== '')
    .sort((a, b) => a.localeCompare(b));

  // Update cache
  cache.eventTypes = {
    data: eventTypes,
    timestamp: Date.now(),
  };

  return eventTypes;
}

/**
 * Clear all filter caches
 * Useful for testing or when data changes significantly
 */
export function clearFilterCache(): void {
  cache.programs = undefined;
  cache.departments = undefined;
  cache.eventTypes = undefined;
}
