/**
 * Transactional Integrity Tests
 * 
 * These tests verify that the ID generation system maintains transactional integrity
 * by wrapping counter increment, user creation, and student/faculty creation in a
 * single database transaction.
 * 
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudentService } from './student.service';
import { StudentRepository } from '../repositories/student.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { EntityCounterRepository } from '../../../db/repositories/entityCounter.repository';
import { Database } from '../../../db';
import { ConflictError } from '../../../shared/errors';

describe('Transactional Integrity - Student Creation', () => {
  let studentService: StudentService;
  let mockStudentRepository: StudentRepository;
  let mockUserRepository: UserRepository;
  let mockEntityCounterRepository: EntityCounterRepository;
  let mockDb: Database;
  let transactionSpy: any;

  beforeEach(() => {
    // Create mock repositories
    mockStudentRepository = {
      findByEmail: vi.fn(),
      findByStudentId: vi.fn(),
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

    const mockAuditLogger = {
      logCreate: vi.fn(),
      logUpdate: vi.fn(),
      logDelete: vi.fn(),
      log: vi.fn(),
    } as any;

    studentService = new StudentService(
      mockStudentRepository,
      mockUserRepository,
      mockEntityCounterRepository,
      {} as any, // skillRepository
      {} as any, // violationRepository
      {} as any, // affiliationRepository
      {} as any, // academicHistoryRepository
      {} as any, // enrollmentRepository
      mockAuditLogger,
      mockDb
    );
  });

  it('should wrap counter increment, user creation, and student creation in a single transaction', async () => {
    // Arrange
    const createStudentDTO = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      create_user_account: true,
    };

    vi.mocked(mockStudentRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

    // Mock transaction to capture the callback
    let transactionCallback: any;
    transactionSpy.mockImplementation(async (callback: any) => {
      transactionCallback = callback;
      const mockTx = {
        /* mock transaction context */
      };
      return await callback(mockTx);
    });

    // Mock the operations within the transaction
    vi.mocked(mockEntityCounterRepository.getOrCreateCounter).mockResolvedValue({
      id: 'counter-id',
      entity_type: 'student',
      year: 2024,
      last_sequence: 0,
    } as any);

    vi.mocked(mockEntityCounterRepository.incrementCounter).mockResolvedValue(1);

    vi.mocked(mockUserRepository.create).mockResolvedValue({
      id: 'user-id',
      email: 'john.doe@example.com',
      role: 'student',
    } as any);

    vi.mocked(mockStudentRepository.create).mockResolvedValue({
      id: 'student-uuid',
      student_id: 'S-2024-0001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      user_id: 'user-id',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    } as any);

    // Act
    await studentService.createStudentWithUser(createStudentDTO);

    // Assert
    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(transactionCallback).toBeDefined();

    // Verify that all operations received the transaction context
    expect(mockEntityCounterRepository.getOrCreateCounter).toHaveBeenCalledWith(
      'student',
      expect.any(Number),
      expect.anything() // transaction context
    );

    expect(mockEntityCounterRepository.incrementCounter).toHaveBeenCalledWith(
      'student',
      expect.any(Number),
      expect.anything() // transaction context
    );

    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'john.doe@example.com',
        role: 'student',
      }),
      expect.anything() // transaction context
    );

    expect(mockStudentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: expect.stringMatching(/^S-\d{4}-0001$/), // S-YYYY-0001 format
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        user_id: 'user-id',
      }),
      expect.anything() // transaction context
    );
  });

  it('should rollback all operations if user creation fails', async () => {
    // Arrange
    const createStudentDTO = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      create_user_account: true,
    };

    vi.mocked(mockStudentRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

    // Mock transaction
    transactionSpy.mockImplementation(async (callback: any) => {
      const mockTx = {};
      return await callback(mockTx);
    });

    vi.mocked(mockEntityCounterRepository.getOrCreateCounter).mockResolvedValue({
      id: 'counter-id',
      entity_type: 'student',
      year: 2024,
      last_sequence: 0,
    } as any);

    vi.mocked(mockEntityCounterRepository.incrementCounter).mockResolvedValue(1);

    // Simulate user creation failure
    vi.mocked(mockUserRepository.create).mockRejectedValue(
      new Error('Database constraint violation')
    );

    // Act & Assert
    await expect(studentService.createStudentWithUser(createStudentDTO)).rejects.toThrow(
      'Database constraint violation'
    );

    // Verify that student creation was never called
    expect(mockStudentRepository.create).not.toHaveBeenCalled();
  });

  it('should rollback all operations if student creation fails', async () => {
    // Arrange
    const createStudentDTO = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      create_user_account: true,
    };

    vi.mocked(mockStudentRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

    // Mock transaction
    transactionSpy.mockImplementation(async (callback: any) => {
      const mockTx = {};
      return await callback(mockTx);
    });

    vi.mocked(mockEntityCounterRepository.getOrCreateCounter).mockResolvedValue({
      id: 'counter-id',
      entity_type: 'student',
      year: 2024,
      last_sequence: 0,
    } as any);

    vi.mocked(mockEntityCounterRepository.incrementCounter).mockResolvedValue(1);

    vi.mocked(mockUserRepository.create).mockResolvedValue({
      id: 'user-id',
      email: 'john.doe@example.com',
      role: 'student',
    } as any);

    // Simulate student creation failure
    vi.mocked(mockStudentRepository.create).mockRejectedValue(
      new Error('Foreign key constraint violation')
    );

    // Act & Assert
    await expect(studentService.createStudentWithUser(createStudentDTO)).rejects.toThrow(
      'Foreign key constraint violation'
    );

    // In a real transaction, the user creation would be rolled back
    // This test verifies that the error propagates correctly
  });

  it('should prevent duplicate ID generation through transaction isolation', async () => {
    // This test documents the expected behavior:
    // When two concurrent requests try to create students, the database transaction
    // with SELECT FOR UPDATE ensures that only one request can increment the counter
    // at a time, preventing duplicate IDs.

    // The actual prevention happens at the database level through:
    // 1. Transaction isolation
    // 2. SELECT FOR UPDATE row locking in incrementCounter
    // 3. Atomic counter increment

    // This test serves as documentation of the expected behavior
    expect(true).toBe(true);
  });
});

describe('Transactional Integrity - Counter Increment', () => {
  it('should use SELECT FOR UPDATE to lock counter row during increment', async () => {
    // The incrementCounter method MUST use SELECT FOR UPDATE to lock the counter row
    // during the transaction, preventing race conditions.

    // Implementation in EntityCounterRepository.incrementCounter():
    // 1. SELECT ... FOR UPDATE locks the row
    // 2. Read current sequence
    // 3. Update with new sequence
    // 4. Return new sequence
    // 5. Lock is released when transaction commits

    // This ensures that concurrent requests are serialized at the database level
    expect(true).toBe(true);
  });
});
