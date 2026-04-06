/**
 * Student Service Unit Tests
 * Tests for student business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudentService } from './student.service';
import { StudentRepository } from '../repositories/student.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { EntityCounterRepository } from '../../../db/repositories/entityCounter.repository';
import { SkillRepository } from '../../skills/repositories/skill.repository';
import { ViolationRepository } from '../../violations/repositories/violation.repository';
import { AffiliationRepository } from '../../affiliations/repositories/affiliation.repository';
import { AcademicHistoryRepository } from '../../academic-history/repositories/academicHistory.repository';
import { EnrollmentRepository } from '../../enrollments/repositories/enrollment.repository';
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

const mockEntityCounterRepository = {
  getOrCreateCounter: vi.fn(),
  incrementCounter: vi.fn(),
  getCurrentSequence: vi.fn(),
} as unknown as EntityCounterRepository;

const mockSkillRepository = {
  findByStudentIds: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as SkillRepository;

const mockViolationRepository = {
  findByStudentIds: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as ViolationRepository;

const mockAffiliationRepository = {
  findByStudentIds: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as AffiliationRepository;

const mockAcademicHistoryRepository = {
  findByStudentIds: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as AcademicHistoryRepository;

const mockEnrollmentRepository = {
  findByStudentIds: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as EnrollmentRepository;

const mockAuditLogger = {
  logCreate: vi.fn(),
  logUpdate: vi.fn(),
  logDelete: vi.fn(),
  log: vi.fn(),
} as any;

const mockDb = {
  transaction: vi.fn((callback) => callback(mockDb)),
} as any;

describe('StudentService', () => {
  let studentService: StudentService;

  beforeEach(() => {
    vi.clearAllMocks();
    studentService = new StudentService(
      mockStudentRepository,
      mockUserRepository,
      mockEntityCounterRepository,
      mockSkillRepository,
      mockViolationRepository,
      mockAffiliationRepository,
      mockAcademicHistoryRepository,
      mockEnrollmentRepository,
      mockAuditLogger,
      mockDb
    );
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
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      const mockCreatedStudent = {
        id: '123',
        student_id: 'S-2026-0001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockStudentRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockEntityCounterRepository.getOrCreateCounter).mockResolvedValue({} as any);
      vi.mocked(mockEntityCounterRepository.incrementCounter).mockResolvedValue(1);
      vi.mocked(mockStudentRepository.create).mockResolvedValue(mockCreatedStudent);

      const result = await studentService.createStudent(createDTO);

      expect(result.student_id).toBe('S-2026-0001');
      expect(mockStudentRepository.create).toHaveBeenCalled();
      expect(mockEntityCounterRepository.incrementCounter).toHaveBeenCalled();
    });

    it('should throw ConflictError when student_id already exists', async () => {
      const createDTO: CreateStudentDTO = {
        student_id: '2021-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      vi.mocked(mockStudentRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockStudentRepository.findByStudentId).mockResolvedValue({
        id: '456',
        student_id: '2021-00001',
      } as any);

      await expect(studentService.createStudent(createDTO)).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError when email already exists', async () => {
      const createDTO: CreateStudentDTO = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

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
        student_id: 'S-2026-0001',
        user_id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockStudentRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockEntityCounterRepository.getOrCreateCounter).mockResolvedValue({} as any);
      vi.mocked(mockEntityCounterRepository.incrementCounter).mockResolvedValue(1);
      vi.mocked(mockUserRepository.create).mockResolvedValue(mockUser);
      vi.mocked(mockStudentRepository.create).mockResolvedValue(mockCreatedStudent);

      const result = await studentService.createStudentWithUser(createDTO);

      expect(result.student_id).toBe('S-2026-0001');
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockStudentRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError when user with email already exists', async () => {
      const createDTO: CreateStudentDTO = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

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

  describe('getStudentProfile', () => {
    const mockStudent = {
      id: '123',
      student_id: 'S-2024-0001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      status: 'active',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    };

    it('should return complete profile with all related data', async () => {
      const mockSkills = [
        {
          id: 'skill-1',
          student_id: '123',
          skill_name: 'JavaScript',
          proficiency_level: 'advanced',
          years_of_experience: 3,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
        {
          id: 'skill-2',
          student_id: '123',
          skill_name: 'TypeScript',
          proficiency_level: 'intermediate',
          years_of_experience: 2,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      const mockViolations = [
        {
          id: 'violation-1',
          student_id: '123',
          violation_type: 'Late Submission',
          description: 'Assignment submitted 2 days late',
          violation_date: '2024-01-15',
          resolution_status: 'resolved',
          resolution_notes: 'Warning issued',
          resolved_at: new Date('2024-01-20'),
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-20'),
        },
      ];

      const mockAffiliations = [
        {
          id: 'affiliation-1',
          student_id: '123',
          organization_name: 'Computer Science Society',
          role: 'Member',
          start_date: '2024-01-01',
          end_date: null,
          is_active: true,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      const mockAcademicHistory = [
        {
          id: 'history-1',
          student_id: '123',
          subject_code: 'CS101',
          subject_name: 'Introduction to Programming',
          grade: '1.5',
          semester: '1st',
          academic_year: '2023-2024',
          credits: 3,
          remarks: 'passed',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      const mockEnrollments = [
        {
          id: 'enrollment-1',
          student_id: '123',
          instruction_id: 'instruction-1',
          subject_code: 'CS201',
          subject_name: 'Data Structures',
          enrollment_status: 'enrolled',
          semester: '2nd',
          academic_year: '2023-2024',
          enrolled_at: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      vi.mocked(mockStudentRepository.findById).mockResolvedValue(mockStudent);
      vi.mocked(mockSkillRepository.findByStudentIds).mockResolvedValue(mockSkills);
      vi.mocked(mockViolationRepository.findByStudentIds).mockResolvedValue(mockViolations);
      vi.mocked(mockAffiliationRepository.findByStudentIds).mockResolvedValue(mockAffiliations);
      vi.mocked(mockAcademicHistoryRepository.findByStudentIds).mockResolvedValue(mockAcademicHistory);
      vi.mocked(mockEnrollmentRepository.findByStudentIds).mockResolvedValue(mockEnrollments);

      const result = await studentService.getStudentProfile('123');

      // Verify student data
      expect(result.id).toBe('123');
      expect(result.student_id).toBe('S-2024-0001');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');

      // Verify skills
      expect(result.skills).toHaveLength(2);
      expect(result.skills[0].skill_name).toBe('JavaScript');
      expect(result.skills[0].proficiency_level).toBe('advanced');
      expect(result.skills[1].skill_name).toBe('TypeScript');

      // Verify violations
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].violation_type).toBe('Late Submission');
      expect(result.violations[0].resolution_status).toBe('resolved');

      // Verify affiliations
      expect(result.affiliations).toHaveLength(1);
      expect(result.affiliations[0].organization_name).toBe('Computer Science Society');
      expect(result.affiliations[0].is_active).toBe(true);

      // Verify academic history
      expect(result.academic_history).toHaveLength(1);
      expect(result.academic_history[0].subject_code).toBe('CS101');
      expect(result.academic_history[0].grade).toBe(1.5);

      // Verify enrollments
      expect(result.enrollments).toHaveLength(1);
      expect(result.enrollments[0].subject_code).toBe('CS201');
      expect(result.enrollments[0].enrollment_status).toBe('enrolled');
    });

    it('should return profile with empty arrays when no related data exists', async () => {
      vi.mocked(mockStudentRepository.findById).mockResolvedValue(mockStudent);
      vi.mocked(mockSkillRepository.findByStudentIds).mockResolvedValue([]);
      vi.mocked(mockViolationRepository.findByStudentIds).mockResolvedValue([]);
      vi.mocked(mockAffiliationRepository.findByStudentIds).mockResolvedValue([]);
      vi.mocked(mockAcademicHistoryRepository.findByStudentIds).mockResolvedValue([]);
      vi.mocked(mockEnrollmentRepository.findByStudentIds).mockResolvedValue([]);

      const result = await studentService.getStudentProfile('123');

      expect(result.id).toBe('123');
      expect(result.skills).toEqual([]);
      expect(result.violations).toEqual([]);
      expect(result.affiliations).toEqual([]);
      expect(result.academic_history).toEqual([]);
      expect(result.enrollments).toEqual([]);
    });

    it('should throw NotFoundError when student not found', async () => {
      vi.mocked(mockStudentRepository.findById).mockResolvedValue(null);

      await expect(studentService.getStudentProfile('123')).rejects.toThrow(NotFoundError);
      await expect(studentService.getStudentProfile('123')).rejects.toThrow('Student not found');
    });

    it('should use batch queries to prevent N+1 queries', async () => {
      vi.mocked(mockStudentRepository.findById).mockResolvedValue(mockStudent);
      vi.mocked(mockSkillRepository.findByStudentIds).mockResolvedValue([]);
      vi.mocked(mockViolationRepository.findByStudentIds).mockResolvedValue([]);
      vi.mocked(mockAffiliationRepository.findByStudentIds).mockResolvedValue([]);
      vi.mocked(mockAcademicHistoryRepository.findByStudentIds).mockResolvedValue([]);
      vi.mocked(mockEnrollmentRepository.findByStudentIds).mockResolvedValue([]);

      await studentService.getStudentProfile('123');

      // Verify batch queries are called with student ID array
      expect(mockSkillRepository.findByStudentIds).toHaveBeenCalledWith(['123']);
      expect(mockViolationRepository.findByStudentIds).toHaveBeenCalledWith(['123']);
      expect(mockAffiliationRepository.findByStudentIds).toHaveBeenCalledWith(['123']);
      expect(mockAcademicHistoryRepository.findByStudentIds).toHaveBeenCalledWith(['123']);
      expect(mockEnrollmentRepository.findByStudentIds).toHaveBeenCalledWith(['123']);

      // Verify each repository method is called exactly once (no N+1)
      expect(mockSkillRepository.findByStudentIds).toHaveBeenCalledTimes(1);
      expect(mockViolationRepository.findByStudentIds).toHaveBeenCalledTimes(1);
      expect(mockAffiliationRepository.findByStudentIds).toHaveBeenCalledTimes(1);
      expect(mockAcademicHistoryRepository.findByStudentIds).toHaveBeenCalledTimes(1);
      expect(mockEnrollmentRepository.findByStudentIds).toHaveBeenCalledTimes(1);
    });

    it('should handle optional fields correctly', async () => {
      const mockSkillWithOptionals = [
        {
          id: 'skill-1',
          student_id: '123',
          skill_name: 'Python',
          proficiency_level: null,
          years_of_experience: null,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      const mockViolationWithOptionals = [
        {
          id: 'violation-1',
          student_id: '123',
          violation_type: 'Absence',
          description: 'Missed class',
          violation_date: '2024-01-15',
          resolution_status: 'pending',
          resolution_notes: null,
          resolved_at: null,
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15'),
        },
      ];

      vi.mocked(mockStudentRepository.findById).mockResolvedValue(mockStudent);
      vi.mocked(mockSkillRepository.findByStudentIds).mockResolvedValue(mockSkillWithOptionals);
      vi.mocked(mockViolationRepository.findByStudentIds).mockResolvedValue(mockViolationWithOptionals);
      vi.mocked(mockAffiliationRepository.findByStudentIds).mockResolvedValue([]);
      vi.mocked(mockAcademicHistoryRepository.findByStudentIds).mockResolvedValue([]);
      vi.mocked(mockEnrollmentRepository.findByStudentIds).mockResolvedValue([]);

      const result = await studentService.getStudentProfile('123');

      // Verify optional fields are undefined when null
      expect(result.skills[0].proficiency_level).toBeUndefined();
      expect(result.skills[0].years_of_experience).toBeUndefined();
      expect(result.violations[0].resolution_notes).toBeUndefined();
      expect(result.violations[0].resolved_at).toBeUndefined();
    });
  });
});
