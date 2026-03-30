/**
 * Student Service Unit Tests
 * Tests for student business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudentService } from './student.service';
import { StudentRepository } from '../repositories/student.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { NotFoundError, ConflictError } from '../../../shared/errors';
import { CreateStudentDTO, UpdateStudentDTO } from '../types';

// Mock repositories
const mockStudentRepository = {
  findById: vi.fn(),
  findByStudentId: vi.fn(),
  findByEmail: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  restore: vi.fn(),
} as unknown as StudentRepository;

const mockUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
} as unknown as UserRepository;

const mockDb = {
  transaction: vi.fn((callback) => callback(mockDb)),
} as any;

describe('StudentService', () => {
  let studentService: StudentService;

  beforeEach(() => {
    vi.clearAllMocks();
    studentService = new StudentService(mockStudentRepository, mockUserRepository, mockDb);
  });

  describe('getStudent', () => {
    it('should return student when found', async () => {
      const mockStudent = {
        id: '123',
        student_id: '2021-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockStudentRepository.findById).mockResolvedValue(mockStudent);

      const result = await studentService.getStudent('123');

      expect(result).toMatchObject({
        id: '123',
        student_id: '2021-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        status: 'active',
      });
      expect(mockStudentRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundError when student not found', async () => {
      vi.mocked(mockStudentRepository.findById).mockResolvedValue(null);

      await expect(studentService.getStudent('123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createStudent', () => {
    it('should create student without user account', async () => {
      const createDTO: CreateStudentDTO = {
        student_id: '2021-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      const mockCreatedStudent = {
        id: '123',
        ...createDTO,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockStudentRepository.findByStudentId).mockResolvedValue(null);
      vi.mocked(mockStudentRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockStudentRepository.create).mockResolvedValue(mockCreatedStudent);

      const result = await studentService.createStudent(createDTO);

      expect(result.student_id).toBe('2021-00001');
      expect(mockStudentRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError when student_id already exists', async () => {
      const createDTO: CreateStudentDTO = {
        student_id: '2021-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      vi.mocked(mockStudentRepository.findByStudentId).mockResolvedValue({
        id: '456',
        student_id: '2021-00001',
      } as any);

      await expect(studentService.createStudent(createDTO)).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError when email already exists', async () => {
      const createDTO: CreateStudentDTO = {
        student_id: '2021-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      vi.mocked(mockStudentRepository.findByStudentId).mockResolvedValue(null);
      vi.mocked(mockStudentRepository.findByEmail).mockResolvedValue({
        id: '456',
        email: 'john@example.com',
      } as any);

      await expect(studentService.createStudent(createDTO)).rejects.toThrow(ConflictError);
    });
  });

  describe('createStudentWithUser', () => {
    it('should create student with linked user account in transaction', async () => {
      const createDTO: CreateStudentDTO = {
        student_id: '2021-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        create_user_account: true,
      };

      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockCreatedStudent = {
        id: '123',
        student_id: '2021-00001',
        user_id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockStudentRepository.findByStudentId).mockResolvedValue(null);
      vi.mocked(mockStudentRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.create).mockResolvedValue(mockUser);
      vi.mocked(mockStudentRepository.create).mockResolvedValue(mockCreatedStudent);

      const result = await studentService.createStudentWithUser(createDTO);

      expect(result.student_id).toBe('2021-00001');
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockStudentRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError when user with email already exists', async () => {
      const createDTO: CreateStudentDTO = {
        student_id: '2021-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      vi.mocked(mockStudentRepository.findByStudentId).mockResolvedValue(null);
      vi.mocked(mockStudentRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        id: 'user-456',
        email: 'john@example.com',
      } as any);

      await expect(studentService.createStudentWithUser(createDTO)).rejects.toThrow(ConflictError);
    });
  });

  describe('updateStudent', () => {
    it('should update student successfully', async () => {
      const updateDTO: UpdateStudentDTO = {
        first_name: 'Jane',
        status: 'inactive',
      };

      const existingStudent = {
        id: '123',
        student_id: '2021-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedStudent = {
        ...existingStudent,
        first_name: 'Jane',
        status: 'inactive',
      };

      vi.mocked(mockStudentRepository.findById).mockResolvedValue(existingStudent);
      vi.mocked(mockStudentRepository.update).mockResolvedValue(updatedStudent);

      const result = await studentService.updateStudent('123', updateDTO);

      expect(result.first_name).toBe('Jane');
      expect(result.status).toBe('inactive');
    });

    it('should throw NotFoundError when student not found', async () => {
      vi.mocked(mockStudentRepository.findById).mockResolvedValue(null);

      await expect(studentService.updateStudent('123', {})).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when updating to existing email', async () => {
      const updateDTO: UpdateStudentDTO = {
        email: 'existing@example.com',
      };

      const existingStudent = {
        id: '123',
        email: 'john@example.com',
      } as any;

      vi.mocked(mockStudentRepository.findById).mockResolvedValue(existingStudent);
      vi.mocked(mockStudentRepository.findByEmail).mockResolvedValue({
        id: '456',
        email: 'existing@example.com',
      } as any);

      await expect(studentService.updateStudent('123', updateDTO)).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteStudent', () => {
    it('should delete student successfully', async () => {
      const existingStudent = {
        id: '123',
        student_id: '2021-00001',
      } as any;

      vi.mocked(mockStudentRepository.findById).mockResolvedValue(existingStudent);
      vi.mocked(mockStudentRepository.softDelete).mockResolvedValue(undefined);

      await studentService.deleteStudent('123');

      expect(mockStudentRepository.softDelete).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundError when student not found', async () => {
      vi.mocked(mockStudentRepository.findById).mockResolvedValue(null);

      await expect(studentService.deleteStudent('123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listStudents', () => {
    it('should return paginated list of students', async () => {
      const mockStudents = [
        {
          id: '123',
          student_id: '2021-00001',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(mockStudentRepository.findAll).mockResolvedValue({
        data: mockStudents,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      const result = await studentService.listStudents({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
