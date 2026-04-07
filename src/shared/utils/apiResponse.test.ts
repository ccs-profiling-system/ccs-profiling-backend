/**
 * Unit tests for API response utilities
 * Tests Requirements 24.1, 24.2, 24.5-24.12
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatSuccessResponse,
  formatErrorResponse,
  formatPaginatedResponse,
  createPaginationMeta,
  type SuccessResponse,
  type ErrorResponse,
  type PaginationMeta,
} from './apiResponse';

describe('API Response Utilities', () => {
  describe('formatSuccessResponse', () => {
    it('should format a simple success response with data', () => {
      const data = { id: '123', name: 'John Doe' };
      const response = formatSuccessResponse(data);

      expect(response).toEqual({
        success: true,
        data: { id: '123', name: 'John Doe' },
      });
      expect(response.success).toBe(true);
    });

    it('should include data field in success response', () => {
      const data = { message: 'Operation successful' };
      const response = formatSuccessResponse(data);

      expect(response).toHaveProperty('data');
      expect(response.data).toEqual(data);
    });

    it('should format success response with array data', () => {
      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      const response = formatSuccessResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should format success response with null data', () => {
      const response = formatSuccessResponse(null);

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });

    it('should format success response with empty object', () => {
      const response = formatSuccessResponse({});

      expect(response.success).toBe(true);
      expect(response.data).toEqual({});
    });

    it('should include meta field when provided', () => {
      const data = [{ id: '1' }];
      const meta: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5,
      };
      const response = formatSuccessResponse(data, meta);

      expect(response.meta).toEqual(meta);
      expect(response.meta?.page).toBe(1);
      expect(response.meta?.limit).toBe(10);
      expect(response.meta?.total).toBe(50);
      expect(response.meta?.totalPages).toBe(5);
    });

    it('should not include meta field when not provided', () => {
      const data = { id: '123' };
      const response = formatSuccessResponse(data);

      expect(response.meta).toBeUndefined();
    });

    it('should handle complex nested data structures', () => {
      const data = {
        user: {
          id: '123',
          profile: {
            name: 'John',
            skills: ['JavaScript', 'TypeScript'],
          },
        },
      };
      const response = formatSuccessResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
    });
  });

  describe('formatErrorResponse', () => {
    beforeEach(() => {
      // Mock Date to ensure consistent timestamps in tests
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    });

    it('should format error response with success false', () => {
      const response = formatErrorResponse('Error occurred', 'INTERNAL_ERROR');

      expect(response.success).toBe(false);
    });

    it('should include error object with message, code, and timestamp', () => {
      const response = formatErrorResponse('Not found', 'NOT_FOUND');

      expect(response.error).toBeDefined();
      expect(response.error.message).toBe('Not found');
      expect(response.error.code).toBe('NOT_FOUND');
      expect(response.error.timestamp).toBeDefined();
    });

    it('should format validation error response', () => {
      const response = formatErrorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        { field: 'email', message: 'Invalid email format' }
      );

      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.message).toBe('Validation failed');
      expect(response.error.details).toEqual({
        field: 'email',
        message: 'Invalid email format',
      });
    });

    it('should format not found error response', () => {
      const response = formatErrorResponse('Student not found', 'NOT_FOUND');

      expect(response.error.code).toBe('NOT_FOUND');
      expect(response.error.message).toBe('Student not found');
    });

    it('should format unauthorized error response', () => {
      const response = formatErrorResponse(
        'Invalid credentials',
        'UNAUTHORIZED'
      );

      expect(response.error.code).toBe('UNAUTHORIZED');
      expect(response.error.message).toBe('Invalid credentials');
    });

    it('should format forbidden error response', () => {
      const response = formatErrorResponse(
        'Insufficient permissions',
        'FORBIDDEN'
      );

      expect(response.error.code).toBe('FORBIDDEN');
      expect(response.error.message).toBe('Insufficient permissions');
    });

    it('should format internal error response', () => {
      const response = formatErrorResponse(
        'Internal server error',
        'INTERNAL_ERROR'
      );

      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.message).toBe('Internal server error');
    });

    it('should format conflict error response', () => {
      const response = formatErrorResponse(
        'Resource already exists',
        'CONFLICT'
      );

      expect(response.error.code).toBe('CONFLICT');
      expect(response.error.message).toBe('Resource already exists');
    });

    it('should format timestamp in ISO 8601 format', () => {
      const response = formatErrorResponse('Error', 'INTERNAL_ERROR');

      expect(response.error.timestamp).toBe('2024-01-01T00:00:00.000Z');
      expect(response.error.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should include details when provided', () => {
      const details = {
        fields: ['email', 'password'],
        errors: ['Email is required', 'Password too short'],
      };
      const response = formatErrorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        details
      );

      expect(response.error.details).toEqual(details);
    });

    it('should not include details field when not provided', () => {
      const response = formatErrorResponse('Error', 'INTERNAL_ERROR');

      expect(response.error.details).toBeUndefined();
    });

    it('should handle complex error details', () => {
      const details = {
        validationErrors: [
          { field: 'email', message: 'Invalid format' },
          { field: 'age', message: 'Must be positive' },
        ],
        metadata: {
          requestId: 'req-123',
          timestamp: '2024-01-01',
        },
      };
      const response = formatErrorResponse(
        'Multiple validation errors',
        'VALIDATION_ERROR',
        details
      );

      expect(response.error.details).toEqual(details);
    });
  });

  describe('formatPaginatedResponse', () => {
    it('should format paginated response with data and meta', () => {
      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      const response = formatPaginatedResponse(data, 1, 10, 50);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta).toBeDefined();
    });

    it('should include correct pagination metadata', () => {
      const data = [{ id: '1' }];
      const response = formatPaginatedResponse(data, 2, 10, 50);

      expect(response.meta?.page).toBe(2);
      expect(response.meta?.limit).toBe(10);
      expect(response.meta?.total).toBe(50);
      expect(response.meta?.totalPages).toBe(5);
    });

    it('should calculate totalPages correctly', () => {
      const data: any[] = [];

      // 50 items, 10 per page = 5 pages
      let response = formatPaginatedResponse(data, 1, 10, 50);
      expect(response.meta?.totalPages).toBe(5);

      // 51 items, 10 per page = 6 pages (ceiling)
      response = formatPaginatedResponse(data, 1, 10, 51);
      expect(response.meta?.totalPages).toBe(6);

      // 10 items, 10 per page = 1 page
      response = formatPaginatedResponse(data, 1, 10, 10);
      expect(response.meta?.totalPages).toBe(1);

      // 0 items, 10 per page = 0 pages
      response = formatPaginatedResponse(data, 1, 10, 0);
      expect(response.meta?.totalPages).toBe(0);
    });

    it('should handle empty data array', () => {
      const response = formatPaginatedResponse([], 1, 10, 0);

      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
      expect(response.meta?.total).toBe(0);
      expect(response.meta?.totalPages).toBe(0);
    });

    it('should handle first page', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const response = formatPaginatedResponse(data, 1, 10, 100);

      expect(response.meta?.page).toBe(1);
    });

    it('should handle last page', () => {
      const data = [{ id: '91' }, { id: '92' }];
      const response = formatPaginatedResponse(data, 10, 10, 92);

      expect(response.meta?.page).toBe(10);
      expect(response.meta?.totalPages).toBe(10);
    });

    it('should handle different page sizes', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: String(i) }));

      // 25 items per page
      let response = formatPaginatedResponse(data, 1, 25, 100);
      expect(response.meta?.totalPages).toBe(4);

      // 50 items per page
      response = formatPaginatedResponse(data, 1, 50, 100);
      expect(response.meta?.totalPages).toBe(2);

      // 100 items per page
      response = formatPaginatedResponse(data, 1, 100, 100);
      expect(response.meta?.totalPages).toBe(1);
    });
  });

  describe('createPaginationMeta', () => {
    it('should create pagination metadata object', () => {
      const meta = createPaginationMeta(1, 10, 50);

      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
    });

    it('should calculate totalPages correctly', () => {
      expect(createPaginationMeta(1, 10, 50).totalPages).toBe(5);
      expect(createPaginationMeta(1, 10, 51).totalPages).toBe(6);
      expect(createPaginationMeta(1, 10, 0).totalPages).toBe(0);
      expect(createPaginationMeta(1, 25, 100).totalPages).toBe(4);
    });

    it('should handle edge cases', () => {
      // Exactly divisible
      let meta = createPaginationMeta(1, 10, 100);
      expect(meta.totalPages).toBe(10);

      // One extra item
      meta = createPaginationMeta(1, 10, 101);
      expect(meta.totalPages).toBe(11);

      // Single item
      meta = createPaginationMeta(1, 10, 1);
      expect(meta.totalPages).toBe(1);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for success response data', () => {
      interface User {
        id: string;
        name: string;
      }

      const user: User = { id: '123', name: 'John' };
      const response: SuccessResponse<User> = formatSuccessResponse(user);

      // TypeScript should enforce that response.data is of type User
      expect(response.data.id).toBe('123');
      expect(response.data.name).toBe('John');
    });

    it('should maintain type safety for array responses', () => {
      interface Student {
        id: string;
        studentId: string;
      }

      const students: Student[] = [
        { id: '1', studentId: 'S001' },
        { id: '2', studentId: 'S002' },
      ];
      const response: SuccessResponse<Student[]> =
        formatSuccessResponse(students);

      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data[0].studentId).toBe('S001');
    });

    it('should enforce error code types', () => {
      // These should compile without errors
      formatErrorResponse('Error', 'VALIDATION_ERROR');
      formatErrorResponse('Error', 'NOT_FOUND');
      formatErrorResponse('Error', 'UNAUTHORIZED');
      formatErrorResponse('Error', 'FORBIDDEN');
      formatErrorResponse('Error', 'INTERNAL_ERROR');
      formatErrorResponse('Error', 'CONFLICT');

      // TypeScript would prevent invalid error codes at compile time
      // formatErrorResponse('Error', 'INVALID_CODE'); // Would not compile
    });
  });

  describe('Integration Scenarios', () => {
    it('should format a typical GET single resource response', () => {
      const student = {
        id: '123',
        studentId: 'S001',
        firstName: 'John',
        lastName: 'Doe',
      };
      const response = formatSuccessResponse(student);

      expect(response).toEqual({
        success: true,
        data: student,
      });
    });

    it('should format a typical GET list response with pagination', () => {
      const students = [
        { id: '1', studentId: 'S001' },
        { id: '2', studentId: 'S002' },
      ];
      const response = formatPaginatedResponse(students, 1, 10, 50);

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.meta).toBeDefined();
    });

    it('should format a typical POST create response', () => {
      const newStudent = {
        id: '123',
        studentId: 'S001',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      const response = formatSuccessResponse(newStudent);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(newStudent);
    });

    it('should format a typical validation error response', () => {
      const response = formatErrorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        {
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password must be at least 8 characters' },
          ],
        }
      );

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.details.errors).toHaveLength(2);
    });

    it('should format a typical not found error response', () => {
      const response = formatErrorResponse(
        'Student with ID 123 not found',
        'NOT_FOUND'
      );

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('NOT_FOUND');
      expect(response.error.message).toContain('123');
    });

    it('should format a typical conflict error response', () => {
      const response = formatErrorResponse(
        'Student ID S001 already exists',
        'CONFLICT',
        { existingId: '123', attemptedId: 'S001' }
      );

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('CONFLICT');
      expect(response.error.details).toBeDefined();
    });
  });
});
