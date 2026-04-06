/**
 * Schedule Service
 * Business logic layer for schedule operations
 * 
 * Requirements: 13.1, 13.3, 13.4, 13.5, 13.6
 */

import { ScheduleRepository } from '../repositories/schedule.repository';
import { InstructionRepository } from '../../instructions/repositories/instruction.repository';
import { FacultyRepository } from '../../faculty/repositories/faculty.repository';
import { NotFoundError, ConflictError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import {
  CreateScheduleDTO,
  UpdateScheduleDTO,
  ScheduleResponseDTO,
  ScheduleListResponseDTO,
  ScheduleFilters,
  ConflictCheckParams,
} from '../types';

export class ScheduleService {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private instructionRepository: InstructionRepository,
    private facultyRepository: FacultyRepository
  ) {}

  /**
   * Get schedule by ID
   * Requirement: 13.1
   */
  async getSchedule(id: string): Promise<ScheduleResponseDTO> {
    const result = await this.scheduleRepository.findById(id);
    if (!result) {
      throw new NotFoundError('Schedule not found');
    }
    return this.toResponseDTO(result);
  }

  /**
   * List schedules with pagination and filters
   * Requirement: 13.1
   */
  async listSchedules(filters?: ScheduleFilters): Promise<ScheduleListResponseDTO> {
    const result = await this.scheduleRepository.findAll(filters);
    return {
      data: result.data.map((item) => this.toResponseDTO(item)),
      meta: result.meta,
    };
  }

  /**
   * Get schedules by room
   * Requirement: 13.5
   */
  async getSchedulesByRoom(room: string): Promise<ScheduleResponseDTO[]> {
    const results = await this.scheduleRepository.findByRoom(room);
    return results.map((item) => this.toResponseDTO(item));
  }

  /**
   * Get schedules by faculty ID
   * Requirement: 13.6
   */
  async getSchedulesByFaculty(facultyId: string): Promise<ScheduleResponseDTO[]> {
    // Verify faculty exists
    const facultyMember = await this.facultyRepository.findById(facultyId);
    if (!facultyMember) {
      throw new NotFoundError('Faculty not found');
    }

    const results = await this.scheduleRepository.findByFacultyId(facultyId);
    return results.map((item) => this.toResponseDTO(item));
  }

  /**
   * Check for schedule conflicts
   * Requirements: 13.3, 13.4
   */
  async checkConflicts(params: ConflictCheckParams): Promise<ScheduleResponseDTO[]> {
    const conflicts = await this.scheduleRepository.findConflicts(params);
    return conflicts.map((item) => this.toResponseDTO(item));
  }

  /**
   * Create a new schedule with conflict detection
   * Requirements: 13.1, 13.3, 13.4
   */
  async createSchedule(data: CreateScheduleDTO): Promise<ScheduleResponseDTO> {
    // Verify instruction exists if provided
    if (data.instruction_id) {
      const instruction = await this.instructionRepository.findById(data.instruction_id);
      if (!instruction) {
        throw new NotFoundError('Instruction not found');
      }
    }

    // Verify faculty exists if provided
    if (data.faculty_id) {
      const facultyMember = await this.facultyRepository.findById(data.faculty_id);
      if (!facultyMember) {
        throw new NotFoundError('Faculty not found');
      }
    }

    // Check for conflicts (Requirement 13.3, 13.4)
    const conflicts = await this.scheduleRepository.findConflicts({
      room: data.room,
      day: data.day,
      start_time: data.start_time,
      end_time: data.end_time,
      semester: data.semester,
      academic_year: data.academic_year,
    });

    if (conflicts.length > 0) {
      const conflictDetails = conflicts.map((c) => {
        const schedule = c.schedule;
        const instruction = c.instruction;
        const subjectInfo = instruction?.subject_code || 'Event';
        return `${subjectInfo} (${schedule.start_time}-${schedule.end_time})`;
      }).join(', ');

      throw new ConflictError(
        `Schedule conflict detected for room ${data.room} on ${data.day} ` +
        `between ${data.start_time} and ${data.end_time}. ` +
        `Conflicts with: ${conflictDetails}`
      );
    }

    // Generate UUID v7 for primary key
    const id = generateUUIDv7();

    // Create schedule
    const schedule = await this.scheduleRepository.create({
      id,
      schedule_type: data.schedule_type,
      instruction_id: data.instruction_id,
      faculty_id: data.faculty_id,
      room: data.room,
      day: data.day,
      start_time: data.start_time,
      end_time: data.end_time,
      semester: data.semester,
      academic_year: data.academic_year,
    });

    // Fetch with instruction and faculty details for response
    const result = await this.scheduleRepository.findById(schedule.id);
    if (!result) {
      throw new NotFoundError('Schedule not found after creation');
    }

    return this.toResponseDTO(result);
  }

  /**
   * Update schedule by ID with conflict detection
   * Requirements: 13.1, 13.3, 13.4
   */
  async updateSchedule(id: string, data: UpdateScheduleDTO): Promise<ScheduleResponseDTO> {
    // Check if schedule exists
    const existing = await this.scheduleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Schedule not found');
    }

    // Verify instruction exists if being updated
    if (data.instruction_id) {
      const instruction = await this.instructionRepository.findById(data.instruction_id);
      if (!instruction) {
        throw new NotFoundError('Instruction not found');
      }
    }

    // Verify faculty exists if being updated
    if (data.faculty_id) {
      const facultyMember = await this.facultyRepository.findById(data.faculty_id);
      if (!facultyMember) {
        throw new NotFoundError('Faculty not found');
      }
    }

    // If time/room/day changed, check for conflicts
    if (data.room || data.day || data.start_time || data.end_time || data.semester || data.academic_year) {
      const existingSchedule = existing.schedule;
      const conflicts = await this.scheduleRepository.findConflicts({
        room: data.room || existingSchedule.room,
        day: data.day || existingSchedule.day,
        start_time: data.start_time || existingSchedule.start_time,
        end_time: data.end_time || existingSchedule.end_time,
        semester: data.semester || existingSchedule.semester,
        academic_year: data.academic_year || existingSchedule.academic_year,
        excludeId: id, // Exclude current schedule from conflict check
      });

      if (conflicts.length > 0) {
        const conflictDetails = conflicts.map((c) => {
          const schedule = c.schedule;
          const instruction = c.instruction;
          const subjectInfo = instruction?.subject_code || 'Event';
          return `${subjectInfo} (${schedule.start_time}-${schedule.end_time})`;
        }).join(', ');

        throw new ConflictError(
          `Schedule conflict detected for room ${data.room || existingSchedule.room} on ${data.day || existingSchedule.day}. ` +
          `Conflicts with: ${conflictDetails}`
        );
      }
    }

    // Update schedule
    await this.scheduleRepository.update(id, data);

    // Fetch updated schedule with instruction and faculty details
    const result = await this.scheduleRepository.findById(id);
    if (!result) {
      throw new NotFoundError('Schedule not found after update');
    }

    return this.toResponseDTO(result);
  }

  /**
   * Delete schedule by ID (soft delete)
   * Requirement: 13.1
   */
  async deleteSchedule(id: string): Promise<void> {
    const existing = await this.scheduleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Schedule not found');
    }

    await this.scheduleRepository.softDelete(id);
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(result: any): ScheduleResponseDTO {
    const schedule = result.schedule;
    const instruction = result.instruction;
    const facultyMember = result.faculty;

    return {
      id: schedule.id,
      schedule_type: schedule.schedule_type,
      instruction_id: schedule.instruction_id || undefined,
      subject_code: instruction?.subject_code || undefined,
      subject_name: instruction?.subject_name || undefined,
      faculty_id: schedule.faculty_id || undefined,
      faculty_name: facultyMember 
        ? `${facultyMember.first_name} ${facultyMember.last_name}`.trim()
        : undefined,
      room: schedule.room,
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      semester: schedule.semester,
      academic_year: schedule.academic_year,
      created_at: schedule.created_at.toISOString(),
      updated_at: schedule.updated_at.toISOString(),
    };
  }

  /**
   * Get soft-deleted schedules (admin only)
   * Requirements: 28.5
   */
  async getDeletedSchedules(filters?: ScheduleFilters): Promise<ScheduleListResponseDTO> {
    const result = await this.scheduleRepository.findDeleted(filters);

    return {
      data: result.data.map((item) => this.toResponseDTO(item)),
      meta: result.meta,
    };
  }

  /**
   * Restore soft-deleted schedule
   * Requirements: 28.7
   */
  async restoreSchedule(id: string): Promise<ScheduleResponseDTO> {
    // Find schedule including deleted
    const schedule = await this.scheduleRepository.findByIdIncludingDeleted(id);
    if (!schedule) {
      throw new NotFoundError('Schedule not found');
    }

    if (!schedule.deleted_at) {
      throw new ConflictError('Schedule is not deleted');
    }

    // Restore schedule
    await this.scheduleRepository.restore(id);

    // Fetch and return restored schedule
    const restored = await this.scheduleRepository.findById(id);
    return this.toResponseDTO(restored!);
  }

  /**
   * Permanently delete schedule (hard delete)
   * Requirements: 28.6
   */
  async permanentDeleteSchedule(id: string): Promise<void> {
    // Find schedule including deleted
    const schedule = await this.scheduleRepository.findByIdIncludingDeleted(id);
    if (!schedule) {
      throw new NotFoundError('Schedule not found');
    }

    // Permanently delete
    await this.scheduleRepository.permanentDelete(id);
  }
}
