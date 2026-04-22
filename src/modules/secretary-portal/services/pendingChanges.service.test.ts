/**
 * Pending Changes Service Tests
 * 
 * Requirements: 9.1-9.13, 17.8
 */

import { describe, it, expect } from 'vitest';
import { getAllPendingChanges, withdrawPendingChange } from './pendingChanges.service';
import { ValidationError } from '../../../shared/errors';

describe('Pending Changes Service', () => {
  describe('getAllPendingChanges', () => {
    it('should return empty paginated results (table does not exist yet)', async () => {
      const result = await getAllPendingChanges({ page: 1, limit: 10 });

      // Verify structure
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');

      // Verify data is empty array
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(0);

      // Verify pagination metadata
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('totalPages');
      expect(result.meta.total).toBe(0);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should handle custom pagination parameters', async () => {
      const result = await getAllPendingChanges({ page: 2, limit: 20 });

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.total).toBe(0);
    });

    it('should accept filter parameters without errors', async () => {
      const result = await getAllPendingChanges(
        { page: 1, limit: 10 },
        { entity_type: 'student', status: 'pending_approval' }
      );

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });
  });

  describe('withdrawPendingChange', () => {
    it('should throw ValidationError when pending change not found (table does not exist yet)', async () => {
      await expect(
        withdrawPendingChange('non-existent-id', 'user-id')
      ).rejects.toThrow(ValidationError);

      await expect(
        withdrawPendingChange('non-existent-id', 'user-id')
      ).rejects.toThrow('Pending change not found');
    });
  });
});
