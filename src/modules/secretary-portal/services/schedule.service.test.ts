/**
 * Schedule Service Tests
 * 
 * Tests for the schedule service functionality.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from './schedule.service';
import { db } from '../../../db';
import { schedules, faculty, instructions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

describe('Schedule Service', () => {
  let testFacultyId: string;
  let testInstructionId: string;
  let testScheduleId: string;

  beforeAll(async () => {
    // Create test faculty
    const [testFaculty] = await db
      .insert(faculty)
      .values({
        faculty_id: 'TEST-FAC-001',
        first_name: 'Test',
        last_name: 'Faculty',
        email: 'test.faculty@test.com',
        department: 'Computer Science',
        status: 'active',
      })
      .returning();
    testFacultyId = testFaculty.id;

    // Create test instruction
    const [testInstruction] = await db
      .insert(instructions)
      .values({
        subject_code: 'CS101',
        subject_name: 'Introduction to Computer Science',
        credits: 3,
        curriculum_year: '2023-2024',
      })
      .returning();
    testInstructionId = testInstruction.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testScheduleId) {
      await db.delete(schedules).where(eq(schedules.id, testScheduleId));
    }
    if (testInstructionId) {
      await db.delete(instructions).where(eq(instructions.id, testInstructionId));
    }
    if (testFacultyId) {
      await db.delete(faculty).where(eq(faculty.id, testFacultyId));
    }
  });

  describe('createSchedule', () => {
    it('should create a new schedule with valid data', async () => {
      const scheduleData = {
        instruction_id: testInstructionId,
        faculty_id: testFacultyId,
        room: 'Room 101',
        day: 'monday',
        start_time: '08:00',
        end_time: '10:00',
        semester: '1st',
        academic_year: '2023-2024',
      };

      const result = await createSchedule(scheduleData);
      testScheduleId = result.id;

      expect(result).toHaveProperty('id');
      expect(result.instruction_id).toBe(testInstructionId);
      expect(result.faculty_id).toBe(testFacultyId);
      expect(result.room).toBe('Room 101');
      expect(result.day).toBe('monday');
      expect(result.start_time).toBe('08:00:00');
      expect(result.end_time).toBe('10:00:00');
      expect(result.semester).toBe('1st');
      expect(result.academic_year).toBe('2023-2024');
    });

    it('should reject schedule with start_time after end_time', async () => {
      const scheduleData = {
        instruction_id: testInstructionId,
        faculty_id: testFacultyId,
        room: 'Room 102',
        day: 'tuesday',
        start_time: '10:00',
        end_time: '08:00',
        semester: '1st',
        academic_year: '2023-2024',
      };

      await expect(createSchedule(scheduleData)).rejects.toThrow(
        'Start time must be before end time'
      );
    });
  });

  describe('getScheduleById', () => {
    it('should retrieve schedule by ID', async () => {
      const result = await getScheduleById(testScheduleId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(testScheduleId);
      expect(result?.room).toBe('Room 101');
    });

    it('should return null for non-existent schedule', async () => {
      const result = await getScheduleById('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });
  });

  describe('getAllSchedules', () => {
    it('should return paginated schedules', async () => {
      const result = await getAllSchedules({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
      expect(result.meta).toHaveProperty('totalPages');
    });

    it('should filter schedules by semester', async () => {
      const result = await getAllSchedules(
        { page: 1, limit: 10 },
        { semester: '1st' }
      );

      expect(result.data.every((s) => s.semester === '1st')).toBe(true);
    });

    it('should filter schedules by faculty_id', async () => {
      const result = await getAllSchedules(
        { page: 1, limit: 10 },
        { faculty_id: testFacultyId }
      );

      expect(result.data.every((s) => s.faculty_id === testFacultyId)).toBe(true);
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule with valid data', async () => {
      const updateData = {
        room: 'Room 201',
        start_time: '09:00',
        end_time: '11:00',
      };

      const result = await updateSchedule(testScheduleId, updateData);

      expect(result.room).toBe('Room 201');
      expect(result.start_time).toBe('09:00:00');
      expect(result.end_time).toBe('11:00:00');
    });

    it('should reject update with invalid time range', async () => {
      const updateData = {
        start_time: '14:00',
        end_time: '12:00',
      };

      await expect(updateSchedule(testScheduleId, updateData)).rejects.toThrow(
        'Start time must be before end time'
      );
    });

    it('should reject update for non-existent schedule', async () => {
      await expect(
        updateSchedule('00000000-0000-0000-0000-000000000000', { room: 'Room 999' })
      ).rejects.toThrow('Schedule not found');
    });
  });

  describe('deleteSchedule', () => {
    it('should soft delete schedule', async () => {
      const result = await deleteSchedule(testScheduleId);

      expect(result.deleted_at).not.toBeNull();

      // Verify schedule is not returned by getScheduleById
      const deletedSchedule = await getScheduleById(testScheduleId);
      expect(deletedSchedule).toBeNull();
    });

    it('should reject delete for non-existent schedule', async () => {
      await expect(
        deleteSchedule('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Schedule not found');
    });
  });
});
