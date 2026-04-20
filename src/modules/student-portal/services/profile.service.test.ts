/**
 * Student Portal - Profile Service Tests
 * Unit tests for student profile management service
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileService } from './profile.service';
import { NotFoundError } from '../../../shared/errors';

// Mock database
const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
} as any;

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProfileService(mockDb);
  });

  describe('getProfileById', () => {
    it('should return profile for a valid student', async () => {
      const studentId = 'student-123';
      const mockStudent = {
        id: studentId,
        student_id: 'STU-2024-001',
        first_name: 'John',
        last_name: 'Doe',
        middle_name: 'Smith',
        email: 'john.doe@example.com',
        phone: '1234567890',
        program: 'Computer Science',
        year_level: 3,
        status: 'active',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        deleted_at: null,
      };

      // Mock student query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockStudent]),
          }),
        }),
      });

      const result = await service.getProfileById(studentId);

      expect(result).toMatchObject({
        id: studentId,
        student_id: 'STU-2024-001',
        student_number: 'STU-2024-001',
        first_name: 'John',
        last_name: 'Doe',
        middle_name: 'Smith',
        email: 'john.doe@example.com',
        phone: '1234567890',
        program: 'Computer Science',
        year_level: 3,
        enrollment_status: 'active',
      });
    });

    it('should throw NotFoundError if student does not exist', async () => {
      const studentId = 'non-existent';

      // Mock student not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.getProfileById(studentId)).rejects.toThrow(NotFoundError);
    });

    it('should handle null optional fields', async () => {
      const studentId = 'student-123';
      const mockStudent = {
        id: studentId,
        student_id: 'STU-2024-001',
        first_name: 'John',
        last_name: 'Doe',
        middle_name: null,
        email: 'john.doe@example.com',
        phone: null,
        program: null,
        year_level: null,
        status: 'active',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        deleted_at: null,
      };

      // Mock student query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockStudent]),
          }),
        }),
      });

      const result = await service.getProfileById(studentId);

      expect(result.middle_name).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.program).toBe('Not specified');
      expect(result.year_level).toBe(1);
    });
  });

  describe('updateProfile', () => {
    it('should update student profile with valid data', async () => {
      const studentId = 'student-123';
      const updateData = {
        email: 'newemail@example.com',
        phone: '9876543210',
      };

      const mockExisting = {
        id: studentId,
        student_id: 'STU-2024-001',
        first_name: 'John',
        last_name: 'Doe',
        deleted_at: null,
      };

      const mockUpdated = {
        ...mockExisting,
        email: 'newemail@example.com',
        phone: '9876543210',
        program: 'Computer Science',
        year_level: 3,
        status: 'active',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      // Mock existing student check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockExisting]),
          }),
        }),
      });

      // Mock update
      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      const result = await service.updateProfile(studentId, updateData);

      expect(result.email).toBe('newemail@example.com');
      expect(result.phone).toBe('9876543210');
    });

    it('should throw NotFoundError if student does not exist', async () => {
      const studentId = 'non-existent';
      const updateData = {
        email: 'newemail@example.com',
      };

      // Mock student not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.updateProfile(studentId, updateData)).rejects.toThrow(NotFoundError);
    });

    it('should update only provided fields', async () => {
      const studentId = 'student-123';
      const updateData = {
        email: 'newemail@example.com',
      };

      const mockExisting = {
        id: studentId,
        student_id: 'STU-2024-001',
        first_name: 'John',
        last_name: 'Doe',
        phone: '1234567890',
        deleted_at: null,
      };

      const mockUpdated = {
        ...mockExisting,
        email: 'newemail@example.com',
        program: 'Computer Science',
        year_level: 3,
        status: 'active',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      // Mock existing student check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockExisting]),
          }),
        }),
      });

      // Mock update
      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      const result = await service.updateProfile(studentId, updateData);

      expect(result.email).toBe('newemail@example.com');
      expect(result.phone).toBe('1234567890'); // Original phone unchanged
    });
  });
});
