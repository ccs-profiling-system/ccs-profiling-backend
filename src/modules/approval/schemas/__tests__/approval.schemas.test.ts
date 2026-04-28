/**
 * Unit Tests for Approval System Validation Schemas
 * 
 * Tests all validation schemas for the approval system API.
 * Covers success cases, validation errors, edge cases, and boundary conditions.
 * 
 */

import { describe, it, expect } from 'vitest';
import {
  entityTypeEnum,
  categoryEnum,
  approvalStatusEnum,
  submitChangeRequestSchema,
  approveRequestSchema,
  rejectRequestSchema,
  withdrawRequestSchema,
  bulkApproveSchema,
  bulkRejectSchema,
  paginationSchema,
  filterSchema,
  listQuerySchema,
  idParamSchema,
  calculatePaginationMeta,
  calculateOffset,
} from '../approval.schemas';

// ============================================================================
// Enum Validators Tests
// ============================================================================

describe('entityTypeEnum', () => {
  it('should accept valid entity types', () => {
    expect(entityTypeEnum.parse('student')).toBe('student');
    expect(entityTypeEnum.parse('faculty')).toBe('faculty');
    expect(entityTypeEnum.parse('event')).toBe('event');
    expect(entityTypeEnum.parse('research')).toBe('research');
  });

  it('should reject invalid entity types', () => {
    expect(() => entityTypeEnum.parse('invalid')).toThrow();
    expect(() => entityTypeEnum.parse('STUDENT')).toThrow();
    expect(() => entityTypeEnum.parse('')).toThrow();
    expect(() => entityTypeEnum.parse(null)).toThrow();
  });
});

describe('categoryEnum', () => {
  it('should accept valid categories', () => {
    expect(categoryEnum.parse('research')).toBe('research');
    expect(categoryEnum.parse('event')).toBe('event');
    expect(categoryEnum.parse('profile')).toBe('profile');
    expect(categoryEnum.parse('general')).toBe('general');
  });

  it('should reject invalid categories', () => {
    expect(() => categoryEnum.parse('invalid')).toThrow();
    expect(() => categoryEnum.parse('RESEARCH')).toThrow();
    expect(() => categoryEnum.parse('')).toThrow();
  });
});

describe('approvalStatusEnum', () => {
  it('should accept valid approval statuses', () => {
    expect(approvalStatusEnum.parse('draft')).toBe('draft');
    expect(approvalStatusEnum.parse('pending')).toBe('pending');
    expect(approvalStatusEnum.parse('approved')).toBe('approved');
    expect(approvalStatusEnum.parse('rejected')).toBe('rejected');
    expect(approvalStatusEnum.parse('withdrawn')).toBe('withdrawn');
    expect(approvalStatusEnum.parse('failed')).toBe('failed');
    expect(approvalStatusEnum.parse('conflicted')).toBe('conflicted');
  });

  it('should reject invalid approval statuses', () => {
    expect(() => approvalStatusEnum.parse('invalid')).toThrow();
    expect(() => approvalStatusEnum.parse('PENDING')).toThrow();
    expect(() => approvalStatusEnum.parse('')).toThrow();
  });
});

// ============================================================================
// Submit Change Request Schema Tests
// ============================================================================

describe('submitChangeRequestSchema', () => {
  const validInput = {
    entity_type: 'student',
    entity_id: '123e4567-e89b-12d3-a456-426614174000',
    category: 'profile',
    change_details: { name: 'John Doe', email: 'john@example.com' },
  };

  it('should accept valid change request submission', () => {
    const result = submitChangeRequestSchema.parse(validInput);
    expect(result).toEqual(validInput);
  });

  it('should accept valid submission with idempotency key', () => {
    const inputWithKey = {
      ...validInput,
      idempotency_key: 'unique-key-12345',
    };
    const result = submitChangeRequestSchema.parse(inputWithKey);
    expect(result).toEqual(inputWithKey);
  });

  it('should reject missing required fields', () => {
    expect(() => submitChangeRequestSchema.parse({})).toThrow();
    expect(() => submitChangeRequestSchema.parse({ entity_type: 'student' })).toThrow();
    expect(() =>
      submitChangeRequestSchema.parse({
        entity_type: 'student',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
      })
    ).toThrow();
  });

  it('should reject invalid entity_type', () => {
    const invalidInput = { ...validInput, entity_type: 'invalid' };
    expect(() => submitChangeRequestSchema.parse(invalidInput)).toThrow();
  });

  it('should reject invalid entity_id format', () => {
    const invalidInput = { ...validInput, entity_id: 'not-a-uuid' };
    expect(() => submitChangeRequestSchema.parse(invalidInput)).toThrow();
  });

  it('should reject invalid category', () => {
    const invalidInput = { ...validInput, category: 'invalid' };
    expect(() => submitChangeRequestSchema.parse(invalidInput)).toThrow();
  });

  it('should reject empty change_details', () => {
    const invalidInput = { ...validInput, change_details: {} };
    expect(() => submitChangeRequestSchema.parse(invalidInput)).toThrow();
  });

  it('should accept complex change_details', () => {
    const complexInput = {
      ...validInput,
      change_details: {
        name: 'John Doe',
        email: 'john@example.com',
        nested: { field: 'value' },
        array: [1, 2, 3],
      },
    };
    const result = submitChangeRequestSchema.parse(complexInput);
    expect(result).toEqual(complexInput);
  });

  it('should reject idempotency_key exceeding max length', () => {
    const invalidInput = {
      ...validInput,
      idempotency_key: 'a'.repeat(256),
    };
    expect(() => submitChangeRequestSchema.parse(invalidInput)).toThrow();
  });
});

// ============================================================================
// Approval Decision Schemas Tests
// ============================================================================

describe('approveRequestSchema', () => {
  it('should accept empty body', () => {
    const result = approveRequestSchema.parse({});
    expect(result).toEqual({});
  });

  it('should accept optional comments', () => {
    const input = { comments: 'Looks good!' };
    const result = approveRequestSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should reject comments exceeding max length', () => {
    const input = { comments: 'a'.repeat(2001) };
    expect(() => approveRequestSchema.parse(input)).toThrow();
  });

  it('should accept comments at max length', () => {
    const input = { comments: 'a'.repeat(2000) };
    const result = approveRequestSchema.parse(input);
    expect(result).toEqual(input);
  });
});

describe('rejectRequestSchema', () => {
  it('should accept valid rejection with comments', () => {
    const input = { comments: 'Does not meet requirements' };
    const result = rejectRequestSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should reject empty comments', () => {
    expect(() => rejectRequestSchema.parse({ comments: '' })).toThrow();
  });

  it('should reject missing comments', () => {
    expect(() => rejectRequestSchema.parse({})).toThrow();
  });

  it('should reject comments exceeding max length', () => {
    const input = { comments: 'a'.repeat(2001) };
    expect(() => rejectRequestSchema.parse(input)).toThrow();
  });

  it('should accept comments at max length', () => {
    const input = { comments: 'a'.repeat(2000) };
    const result = rejectRequestSchema.parse(input);
    expect(result).toEqual(input);
  });
});

describe('withdrawRequestSchema', () => {
  it('should accept empty body', () => {
    const result = withdrawRequestSchema.parse({});
    expect(result).toEqual({});
  });

  it('should ignore extra fields', () => {
    const result = withdrawRequestSchema.parse({ extra: 'field' });
    expect(result).toEqual({});
  });
});

// ============================================================================
// Bulk Operation Schemas Tests
// ============================================================================

describe('bulkApproveSchema', () => {
  const validUUIDs = [
    '123e4567-e89b-12d3-a456-426614174000',
    '223e4567-e89b-12d3-a456-426614174001',
    '323e4567-e89b-12d3-a456-426614174002',
  ];

  it('should accept valid bulk approve request', () => {
    const input = { approvalIds: validUUIDs };
    const result = bulkApproveSchema.parse(input);
    expect(result.approvalIds).toEqual(validUUIDs);
    expect(result.atomic).toBe(false); // default value
  });

  it('should accept atomic mode', () => {
    const input = { approvalIds: validUUIDs, atomic: true };
    const result = bulkApproveSchema.parse(input);
    expect(result.atomic).toBe(true);
  });

  it('should accept optional comments', () => {
    const input = { approvalIds: validUUIDs, comments: 'Bulk approval' };
    const result = bulkApproveSchema.parse(input);
    expect(result.comments).toBe('Bulk approval');
  });

  it('should reject empty approvalIds array', () => {
    expect(() => bulkApproveSchema.parse({ approvalIds: [] })).toThrow();
  });

  it('should reject missing approvalIds', () => {
    expect(() => bulkApproveSchema.parse({})).toThrow();
  });

  it('should reject invalid UUID format', () => {
    const input = { approvalIds: ['not-a-uuid'] };
    expect(() => bulkApproveSchema.parse(input)).toThrow();
  });

  it('should reject more than 100 approvalIds', () => {
    const tooManyIds = Array(101).fill('123e4567-e89b-12d3-a456-426614174000');
    expect(() => bulkApproveSchema.parse({ approvalIds: tooManyIds })).toThrow();
  });

  it('should accept exactly 100 approvalIds', () => {
    const maxIds = Array(100).fill('123e4567-e89b-12d3-a456-426614174000');
    const result = bulkApproveSchema.parse({ approvalIds: maxIds });
    expect(result.approvalIds).toHaveLength(100);
  });

  it('should reject comments exceeding max length', () => {
    const input = {
      approvalIds: validUUIDs,
      comments: 'a'.repeat(2001),
    };
    expect(() => bulkApproveSchema.parse(input)).toThrow();
  });
});

describe('bulkRejectSchema', () => {
  const validUUIDs = [
    '123e4567-e89b-12d3-a456-426614174000',
    '223e4567-e89b-12d3-a456-426614174001',
  ];

  it('should accept valid bulk reject request', () => {
    const input = {
      approvalIds: validUUIDs,
      comments: 'Bulk rejection reason',
    };
    const result = bulkRejectSchema.parse(input);
    expect(result.approvalIds).toEqual(validUUIDs);
    expect(result.comments).toBe('Bulk rejection reason');
    expect(result.atomic).toBe(false); // default value
  });

  it('should accept atomic mode', () => {
    const input = {
      approvalIds: validUUIDs,
      comments: 'Bulk rejection',
      atomic: true,
    };
    const result = bulkRejectSchema.parse(input);
    expect(result.atomic).toBe(true);
  });

  it('should reject missing comments', () => {
    expect(() => bulkRejectSchema.parse({ approvalIds: validUUIDs })).toThrow();
  });

  it('should reject empty comments', () => {
    const input = { approvalIds: validUUIDs, comments: '' };
    expect(() => bulkRejectSchema.parse(input)).toThrow();
  });

  it('should reject empty approvalIds array', () => {
    const input = { approvalIds: [], comments: 'Reason' };
    expect(() => bulkRejectSchema.parse(input)).toThrow();
  });

  it('should reject more than 100 approvalIds', () => {
    const tooManyIds = Array(101).fill('123e4567-e89b-12d3-a456-426614174000');
    const input = { approvalIds: tooManyIds, comments: 'Reason' };
    expect(() => bulkRejectSchema.parse(input)).toThrow();
  });

  it('should accept exactly 100 approvalIds', () => {
    const maxIds = Array(100).fill('123e4567-e89b-12d3-a456-426614174000');
    const input = { approvalIds: maxIds, comments: 'Reason' };
    const result = bulkRejectSchema.parse(input);
    expect(result.approvalIds).toHaveLength(100);
  });

  it('should reject comments exceeding max length', () => {
    const input = {
      approvalIds: validUUIDs,
      comments: 'a'.repeat(2001),
    };
    expect(() => bulkRejectSchema.parse(input)).toThrow();
  });
});

// ============================================================================
// Pagination Schema Tests
// ============================================================================

describe('paginationSchema', () => {
  it('should use default values when not provided', () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it('should accept valid pagination parameters', () => {
    const input = { page: 5, pageSize: 50 };
    const result = paginationSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should coerce string numbers to integers', () => {
    const input = { page: '3', pageSize: '25' };
    const result = paginationSchema.parse(input);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(25);
  });

  it('should reject page less than 1', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
    expect(() => paginationSchema.parse({ page: -1 })).toThrow();
  });

  it('should reject pageSize less than 1', () => {
    expect(() => paginationSchema.parse({ pageSize: 0 })).toThrow();
    expect(() => paginationSchema.parse({ pageSize: -1 })).toThrow();
  });

  it('should reject pageSize greater than 100', () => {
    expect(() => paginationSchema.parse({ pageSize: 101 })).toThrow();
  });

  it('should accept pageSize of exactly 100', () => {
    const result = paginationSchema.parse({ pageSize: 100 });
    expect(result.pageSize).toBe(100);
  });

  it('should reject non-integer values', () => {
    expect(() => paginationSchema.parse({ page: 1.5 })).toThrow();
    expect(() => paginationSchema.parse({ pageSize: 20.7 })).toThrow();
  });
});

// ============================================================================
// Filter Schema Tests
// ============================================================================

describe('filterSchema', () => {
  it('should accept empty filters', () => {
    const result = filterSchema.parse({});
    expect(result).toEqual({});
  });

  it('should accept valid status filter', () => {
    const input = { status: 'pending' };
    const result = filterSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should accept valid entity_type filter', () => {
    const input = { entity_type: 'student' };
    const result = filterSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should accept valid category filter', () => {
    const input = { category: 'research' };
    const result = filterSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should accept valid submitter_id filter', () => {
    const input = { submitter_id: '123e4567-e89b-12d3-a456-426614174000' };
    const result = filterSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should accept valid reviewer_id filter', () => {
    const input = { reviewer_id: '123e4567-e89b-12d3-a456-426614174000' };
    const result = filterSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should accept valid date range', () => {
    const input = {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    };
    const result = filterSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should accept all filters combined', () => {
    const input = {
      status: 'approved',
      entity_type: 'faculty',
      category: 'profile',
      submitter_id: '123e4567-e89b-12d3-a456-426614174000',
      reviewer_id: '223e4567-e89b-12d3-a456-426614174001',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    };
    const result = filterSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should reject invalid status', () => {
    expect(() => filterSchema.parse({ status: 'invalid' })).toThrow();
  });

  it('should reject invalid entity_type', () => {
    expect(() => filterSchema.parse({ entity_type: 'invalid' })).toThrow();
  });

  it('should reject invalid category', () => {
    expect(() => filterSchema.parse({ category: 'invalid' })).toThrow();
  });

  it('should reject invalid submitter_id format', () => {
    expect(() => filterSchema.parse({ submitter_id: 'not-a-uuid' })).toThrow();
  });

  it('should reject invalid reviewer_id format', () => {
    expect(() => filterSchema.parse({ reviewer_id: 'not-a-uuid' })).toThrow();
  });

  it('should reject invalid date format', () => {
    expect(() => filterSchema.parse({ start_date: '01-01-2024' })).toThrow();
    expect(() => filterSchema.parse({ end_date: '2024/12/31' })).toThrow();
    expect(() => filterSchema.parse({ start_date: 'invalid' })).toThrow();
  });

  it('should accept valid date format YYYY-MM-DD', () => {
    const input = { start_date: '2024-01-15' };
    const result = filterSchema.parse(input);
    expect(result).toEqual(input);
  });
});

// ============================================================================
// List Query Schema Tests
// ============================================================================

describe('listQuerySchema', () => {
  it('should accept pagination and filters combined', () => {
    const input = {
      page: 2,
      pageSize: 50,
      status: 'pending',
      entity_type: 'student',
    };
    const result = listQuerySchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should use default pagination values', () => {
    const input = { status: 'approved' };
    const result = listQuerySchema.parse(input);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.status).toBe('approved');
  });

  it('should validate both pagination and filter constraints', () => {
    expect(() =>
      listQuerySchema.parse({
        page: 0, // invalid
        status: 'pending',
      })
    ).toThrow();

    expect(() =>
      listQuerySchema.parse({
        page: 1,
        status: 'invalid', // invalid
      })
    ).toThrow();
  });
});

// ============================================================================
// ID Parameter Schema Tests
// ============================================================================

describe('idParamSchema', () => {
  it('should accept valid UUID', () => {
    const input = { id: '123e4567-e89b-12d3-a456-426614174000' };
    const result = idParamSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should reject invalid UUID format', () => {
    expect(() => idParamSchema.parse({ id: 'not-a-uuid' })).toThrow();
    expect(() => idParamSchema.parse({ id: '12345' })).toThrow();
    expect(() => idParamSchema.parse({ id: '' })).toThrow();
  });

  it('should reject missing id', () => {
    expect(() => idParamSchema.parse({})).toThrow();
  });
});

// ============================================================================
// Helper Functions Tests
// ============================================================================

describe('calculatePaginationMeta', () => {
  it('should calculate correct pagination metadata', () => {
    const result = calculatePaginationMeta(100, 1, 20);
    expect(result).toEqual({
      total: 100,
      page: 1,
      pageSize: 20,
      totalPages: 5,
    });
  });

  it('should handle partial last page', () => {
    const result = calculatePaginationMeta(95, 5, 20);
    expect(result).toEqual({
      total: 95,
      page: 5,
      pageSize: 20,
      totalPages: 5,
    });
  });

  it('should handle zero total', () => {
    const result = calculatePaginationMeta(0, 1, 20);
    expect(result).toEqual({
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
  });

  it('should handle single page', () => {
    const result = calculatePaginationMeta(10, 1, 20);
    expect(result).toEqual({
      total: 10,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
  });

  it('should handle exact page boundary', () => {
    const result = calculatePaginationMeta(100, 3, 20);
    expect(result).toEqual({
      total: 100,
      page: 3,
      pageSize: 20,
      totalPages: 5,
    });
  });
});

describe('calculateOffset', () => {
  it('should calculate correct offset for first page', () => {
    expect(calculateOffset(1, 20)).toBe(0);
  });

  it('should calculate correct offset for second page', () => {
    expect(calculateOffset(2, 20)).toBe(20);
  });

  it('should calculate correct offset for arbitrary page', () => {
    expect(calculateOffset(5, 25)).toBe(100);
  });

  it('should handle page size of 1', () => {
    expect(calculateOffset(10, 1)).toBe(9);
  });

  it('should handle large page numbers', () => {
    expect(calculateOffset(100, 50)).toBe(4950);
  });
});
