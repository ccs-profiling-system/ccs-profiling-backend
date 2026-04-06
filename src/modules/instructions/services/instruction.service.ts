/**
 * Instruction Service
 * Business logic layer for instruction operations
 * 
 * Requirements: 14.1, 14.2, 14.4, 14.5
 */

import { InstructionRepository } from '../repositories/instruction.repository';
import { Database } from '../../../db';
import { NotFoundError, ConflictError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import {
  CreateInstructionDTO,
  UpdateInstructionDTO,
  InstructionResponseDTO,
  InstructionListResponseDTO,
  InstructionFilters,
} from '../types';

export class InstructionService {
  constructor(
    private instructionRepository: InstructionRepository,
    private db: Database
  ) {}

  /**
   * Get instruction by ID
   * Requirement: 14.2
   */
  async getInstruction(id: string): Promise<InstructionResponseDTO> {
    const instruction = await this.instructionRepository.findById(id);
    if (!instruction) {
      throw new NotFoundError('Instruction not found');
    }
    return this.toResponseDTO(instruction);
  }

  /**
   * List instructions with pagination and filters
   * Requirement: 14.2
   */
  async listInstructions(filters?: InstructionFilters): Promise<InstructionListResponseDTO> {
    const result = await this.instructionRepository.findAll(filters);
    return {
      data: result.data.map((instruction) => this.toResponseDTO(instruction)),
      meta: result.meta,
    };
  }

  /**
   * Create a new instruction
   * Validates duplicate subject_code within curriculum_year
   * Requirements: 14.1, 14.2, 14.5
   */
  async createInstruction(data: CreateInstructionDTO): Promise<InstructionResponseDTO> {
    // Check for duplicate subject_code within the same curriculum_year (Requirement 14.5)
    const existing = await this.instructionRepository.findBySubjectCode(
      data.subject_code,
      data.curriculum_year
    );
    if (existing) {
      throw new ConflictError(
        `Subject code '${data.subject_code}' already exists for curriculum year '${data.curriculum_year}'`
      );
    }

    // Create instruction within a transaction
    return await this.db.transaction(async (tx) => {
      // Generate UUID v7 for primary key
      const id = generateUUIDv7();

      // Create instruction
      const instruction = await this.instructionRepository.create(
        {
          id,
          subject_code: data.subject_code,
          subject_name: data.subject_name,
          description: data.description,
          credits: data.credits,
          curriculum_year: data.curriculum_year,
        },
        tx
      );

      return this.toResponseDTO(instruction);
    });
  }

  /**
   * Update instruction by ID
   * Validates duplicate subject_code within curriculum_year
   * Requirements: 14.2, 14.5
   */
  async updateInstruction(id: string, data: UpdateInstructionDTO): Promise<InstructionResponseDTO> {
    // Check if instruction exists
    const existing = await this.instructionRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Instruction not found');
    }

    // Check for duplicate subject_code within curriculum_year if either is being updated
    const newSubjectCode = data.subject_code || existing.subject_code;
    const newCurriculumYear = data.curriculum_year || existing.curriculum_year;

    // Only check for duplicates if subject_code or curriculum_year is changing
    if (
      (data.subject_code && data.subject_code !== existing.subject_code) ||
      (data.curriculum_year && data.curriculum_year !== existing.curriculum_year)
    ) {
      const duplicate = await this.instructionRepository.findBySubjectCode(
        newSubjectCode,
        newCurriculumYear
      );
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(
          `Subject code '${newSubjectCode}' already exists for curriculum year '${newCurriculumYear}'`
        );
      }
    }

    const updated = await this.instructionRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Instruction not found');
    }

    return this.toResponseDTO(updated);
  }

  /**
   * Delete instruction by ID (soft delete)
   * Requirement: 14.4
   */
  async deleteInstruction(id: string): Promise<void> {
    const existing = await this.instructionRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Instruction not found');
    }

    await this.instructionRepository.softDelete(id);
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(instruction: any): InstructionResponseDTO {
    return {
      id: instruction.id,
      subject_code: instruction.subject_code,
      subject_name: instruction.subject_name,
      description: instruction.description || undefined,
      credits: instruction.credits,
      curriculum_year: instruction.curriculum_year,
      created_at: instruction.created_at.toISOString(),
      updated_at: instruction.updated_at.toISOString(),
    };
  }

  /**
   * Get soft-deleted instructions (admin only)
   * Requirements: 28.5
   */
  async getDeletedInstructions(filters?: InstructionFilters): Promise<InstructionListResponseDTO> {
    const result = await this.instructionRepository.findDeleted(filters);

    return {
      data: result.data.map((instruction) => this.toResponseDTO(instruction)),
      meta: result.meta,
    };
  }

  /**
   * Restore soft-deleted instruction
   * Requirements: 28.7
   */
  async restoreInstruction(id: string): Promise<InstructionResponseDTO> {
    // Find instruction including deleted
    const instruction = await this.instructionRepository.findByIdIncludingDeleted(id);
    if (!instruction) {
      throw new NotFoundError('Instruction not found');
    }

    if (!instruction.deleted_at) {
      throw new ConflictError('Instruction is not deleted');
    }

    // Restore instruction
    await this.instructionRepository.restore(id);

    // Fetch and return restored instruction
    const restored = await this.instructionRepository.findById(id);
    return this.toResponseDTO(restored!);
  }

  /**
   * Permanently delete instruction (hard delete)
   * Requirements: 28.6
   */
  async permanentDeleteInstruction(id: string): Promise<void> {
    // Find instruction including deleted
    const instruction = await this.instructionRepository.findByIdIncludingDeleted(id);
    if (!instruction) {
      throw new NotFoundError('Instruction not found');
    }

    // Permanently delete
    await this.instructionRepository.permanentDelete(id);
  }
}
