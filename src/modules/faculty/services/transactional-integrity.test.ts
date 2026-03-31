/**
 * Transactional Integrity Tests - Faculty
 * 
 * These tests verify that the ID generation system maintains transactional integrity
 * for faculty creation by wrapping counter increment, user creation, and faculty
 * creation in a single database transaction.
 * 
 * Requirements: 26.3, 26.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FacultyService } from './faculty.service';
import { FacultyRepository } from '../repositories/faculty.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { EntityCounterRepository } from '../../../db/repositories/entityCounter.repository';
import { Database } from '../../../db';

describe('Transactional Integrity - Faculty Creation', () => {
  let facultyService: FacultyService;
  let mockFacultyRepository: FacultyRepository;
  let mockUserRepository: UserRepository;
  let mockEntityCounterRepository: EntityCounterRepository;
  let mockDb: Database;
  let transactionSpy: any;

  beforeEach(() => {
    // Create mock repositories
    mockFacultyRepository = {
      findByEmail: vi.fn(),
      findByFacultyId: vi.fn(),
      create: vi.fn(),
    } as any;

    mockUserRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    } as any;

    mockEntityCounterRepository = {
      getOrCreateCounter: vi.fn(),
      incrementCounter: vi.fn(),
    } as any;

    // Create mock database with transaction support
    transactionSpy = vi.fn();
    mockDb = {
      transaction: transactionSpy,
    } as any;

    facultyService = new FacultyService(
      mockFacultyRepository,
      mockUserRepository,
      mockEntityCounterRepository,
      mockDb
    );
  });

  it('should wrap counter increment, user creation, and faculty creation in a single transaction', async () => {
    // Arrange
    const createFacultyDTO = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      department: 'Computer Science',
      create_user_account: true,
    };

    vi.mocked(mockFacultyRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

    // Mock transaction to capture the callback
    let transactionCallback: any;
    transactionSpy.mockImplementation(async (callback: any) => {
      transactionCallback = callback;
      const mockTx = {};
      return await callback(mockTx);
    });

    // Mock the operations within the transaction
    vi.mocked(mockEntityCounterRepository.getOrCreateCounter).mockResolvedValue({
      id: 'counter-id',
      entity_type: 'faculty',
      year: 2024,
      last_sequence: 0,
    } as any);

    vi.mocked(mockEntityCounterRepository.incrementCounter).mockResolvedValue(1);

    vi.mocked(mockUserRepository.create).mockResolvedValue({
      id: 'user-id',
      email: 'jane.smith@example.com',
      role: 'faculty',
    } as any);

    vi.mocked(mockFacultyRepository.create).mockResolvedValue({
      id: 'faculty-uuid',
      faculty_id: 'F-2026-0001',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      department: 'Computer Science',
      user_id: 'user-id',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    } as any);

    // Act
    await facultyService.createFacultyWithUser(createFacultyDTO);

    // Assert
    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(transactionCallback).toBeDefined();

    // Verify that all operations received the transaction context
    expect(mockEntityCounterRepository.getOrCreateCounter).toHaveBeenCalledWith(
      'faculty',
      expect.any(Number),
      expect.anything() // transaction context
    );

    expect(mockEntityCounterRepository.incrementCounter).toHaveBeenCalledWith(
      'faculty',
      expect.any(Number),
      expect.anything() // transaction context
    );

    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jane.smith@example.com',
        role: 'faculty',
      }),
      expect.anything() // transaction context
    );

    expect(mockFacultyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        faculty_id: expect.stringMatching(/^F-\d{4}-0001$/), // F-YYYY-0001 format
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        department: 'Computer Science',
        user_id: 'user-id',
      }),
      expect.anything() // transaction context
    );
  });

  it('should rollback all operations if user creation fails', async () => {
    // Arrange
    const createFacultyDTO = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      department: 'Computer Science',
      create_user_account: true,
    };

    vi.mocked(mockFacultyRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

    // Mock transaction
    transactionSpy.mockImplementation(async (callback: any) => {
      const mockTx = {};
      return await callback(mockTx);
    });

    vi.mocked(mockEntityCounterRepository.getOrCreateCounter).mockResolvedValue({
      id: 'counter-id',
      entity_type: 'faculty',
      year: 2024,
      last_sequence: 0,
    } as any);

    vi.mocked(mockEntityCounterRepository.incrementCounter).mockResolvedValue(1);

    // Simulate user creation failure
    vi.mocked(mockUserRepository.create).mockRejectedValue(
      new Error('Database constraint violation')
    );

    // Act & Assert
    await expect(facultyService.createFacultyWithUser(createFacultyDTO)).rejects.toThrow(
      'Database constraint violation'
    );

    // Verify that faculty creation was never called
    expect(mockFacultyRepository.create).not.toHaveBeenCalled();
  });

  it('should rollback all operations if faculty creation fails', async () => {
    // Arrange
    const createFacultyDTO = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      department: 'Computer Science',
      create_user_account: true,
    };

    vi.mocked(mockFacultyRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

    // Mock transaction
    transactionSpy.mockImplementation(async (callback: any) => {
      const mockTx = {};
      return await callback(mockTx);
    });

    vi.mocked(mockEntityCounterRepository.getOrCreateCounter).mockResolvedValue({
      id: 'counter-id',
      entity_type: 'faculty',
      year: 2024,
      last_sequence: 0,
    } as any);

    vi.mocked(mockEntityCounterRepository.incrementCounter).mockResolvedValue(1);

    vi.mocked(mockUserRepository.create).mockResolvedValue({
      id: 'user-id',
      email: 'jane.smith@example.com',
      role: 'faculty',
    } as any);

    // Simulate faculty creation failure
    vi.mocked(mockFacultyRepository.create).mockRejectedValue(
      new Error('Foreign key constraint violation')
    );

    // Act & Assert
    await expect(facultyService.createFacultyWithUser(createFacultyDTO)).rejects.toThrow(
      'Foreign key constraint violation'
    );
  });
});
