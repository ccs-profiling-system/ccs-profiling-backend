/**
 * Instruction Service Unit Tests
 * Tests for instruction business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstructionService } from './instruction.service';
import { InstructionRepository } from '../repositories/instruction.repository';
import { NotFoundError, ConflictError } from '../../../shared/errors';
import { CreateInstructionDTO, UpdateInstructionDTO } from '../types';

// Mock repository
const mockInstructionRepository = {
  findById: vi.fn(),
  findBySubjectCode: vi.fn(),
  findByCurriculumYear: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  restore: vi.fn(),
} as unknown as InstructionRepository;

const mockDb = {
  transaction: vi.fn((callback) => callback(mockDb)),
} as any;

describe('InstructionService', () => {
  let instructionService: InstructionService;

  beforeEach(() => {
    vi.clearAllMocks();
    instructionService = new InstructionService(
      mockInstructionRepository,
      mockDb
    );
  });

  describe('getInstruction', () => {
    it('should return instruction when found', async () => {
      const mockInstruction = {
        id: '123',
        subject_code: 'CS101',
        subject_name: 'Introduction to Programming',
        description: 'Basic programming concepts',
        credits: 3,
        curriculum_year: '2023-2024',
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockInstructionRepository.findById).mockResolvedValue(mockInstruction);

      const result = await instructionService.getInstruction('123');

      expect(result).toMatchObject({
        id: '123',
        subject_code: 'CS101',
        subject_name: 'Introduction to Programming',
        credits: 3,
        curriculum_year: '2023-2024',
      });
      expect(mockInstructionRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundError when instruction not found', async () => {
      vi.mocked(mockInstructionRepository.findById).mockResolvedValue(null);

      await expect(instructionService.getInstruction('123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createInstruction', () => {
    it('should create instruction successfully', async () => {
      const createDTO: CreateInstructionDTO = {
        subject_code: 'CS101',
        subject_name: 'Introduction to Programming',
        description: 'Basic programming concepts',
        credits: 3,
        curriculum_year: '2023-2024',
      };

      const mockCreatedInstruction = {
        id: '123',
        ...createDTO,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockInstructionRepository.findBySubjectCode).mockResolvedValue(null);
      vi.mocked(mockInstructionRepository.create).mockResolvedValue(mockCreatedInstruction);

      const result = await instructionService.createInstruction(createDTO);

      expect(result).toMatchObject({
        subject_code: 'CS101',
        subject_name: 'Introduction to Programming',
        credits: 3,
        curriculum_year: '2023-2024',
      });
      expect(mockInstructionRepository.findBySubjectCode).toHaveBeenCalledWith('CS101', '2023-2024');
      expect(mockInstructionRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError when duplicate subject_code exists for curriculum_year', async () => {
      const createDTO: CreateInstructionDTO = {
        subject_code: 'CS101',
        subject_name: 'Introduction to Programming',
        credits: 3,
        curriculum_year: '2023-2024',
      };

      const existingInstruction = {
        id: '456',
        subject_code: 'CS101',
        subject_name: 'Existing Course',
        credits: 3,
        curriculum_year: '2023-2024',
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockInstructionRepository.findBySubjectCode).mockResolvedValue(existingInstruction);

      await expect(instructionService.createInstruction(createDTO)).rejects.toThrow(ConflictError);
      await expect(instructionService.createInstruction(createDTO)).rejects.toThrow(
        "Subject code 'CS101' already exists for curriculum year '2023-2024'"
      );
    });
  });

  describe('updateInstruction', () => {
    it('should update instruction successfully', async () => {
      const updateDTO: UpdateInstructionDTO = {
        subject_name: 'Updated Course Name',
        credits: 4,
      };

      const existingInstruction = {
        id: '123',
        subject_code: 'CS101',
        subject_name: 'Old Course Name',
        credits: 3,
        curriculum_year: '2023-2024',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedInstruction = {
        ...existingInstruction,
        ...updateDTO,
        updated_at: new Date(),
      };

      vi.mocked(mockInstructionRepository.findById).mockResolvedValue(existingInstruction);
      vi.mocked(mockInstructionRepository.update).mockResolvedValue(updatedInstruction);

      const result = await instructionService.updateInstruction('123', updateDTO);

      expect(result.subject_name).toBe('Updated Course Name');
      expect(result.credits).toBe(4);
      expect(mockInstructionRepository.update).toHaveBeenCalledWith('123', updateDTO);
    });

    it('should throw NotFoundError when instruction not found', async () => {
      vi.mocked(mockInstructionRepository.findById).mockResolvedValue(null);

      await expect(
        instructionService.updateInstruction('123', { subject_name: 'New Name' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when updating to duplicate subject_code/curriculum_year', async () => {
      const existingInstruction = {
        id: '123',
        subject_code: 'CS101',
        subject_name: 'Course 1',
        credits: 3,
        curriculum_year: '2023-2024',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const duplicateInstruction = {
        id: '456',
        subject_code: 'CS102',
        subject_name: 'Course 2',
        credits: 3,
        curriculum_year: '2023-2024',
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockInstructionRepository.findById).mockResolvedValue(existingInstruction);
      vi.mocked(mockInstructionRepository.findBySubjectCode).mockResolvedValue(duplicateInstruction);

      await expect(
        instructionService.updateInstruction('123', { subject_code: 'CS102' })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteInstruction', () => {
    it('should soft delete instruction successfully', async () => {
      const existingInstruction = {
        id: '123',
        subject_code: 'CS101',
        subject_name: 'Course',
        credits: 3,
        curriculum_year: '2023-2024',
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockInstructionRepository.findById).mockResolvedValue(existingInstruction);
      vi.mocked(mockInstructionRepository.softDelete).mockResolvedValue(undefined);

      await instructionService.deleteInstruction('123');

      expect(mockInstructionRepository.softDelete).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundError when instruction not found', async () => {
      vi.mocked(mockInstructionRepository.findById).mockResolvedValue(null);

      await expect(instructionService.deleteInstruction('123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listInstructions', () => {
    it('should return paginated list of instructions', async () => {
      const mockInstructions = [
        {
          id: '123',
          subject_code: 'CS101',
          subject_name: 'Course 1',
          credits: 3,
          curriculum_year: '2023-2024',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '456',
          subject_code: 'CS102',
          subject_name: 'Course 2',
          credits: 3,
          curriculum_year: '2023-2024',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(mockInstructionRepository.findAll).mockResolvedValue({
        data: mockInstructions,
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });

      const result = await instructionService.listInstructions({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(mockInstructionRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });
});
