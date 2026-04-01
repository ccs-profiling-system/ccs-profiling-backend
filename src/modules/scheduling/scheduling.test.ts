/**
 * Scheduling Module Integration Tests
 * Tests for schedule CRUD operations and conflict detection
 * 
 * Requirements: 13.1, 13.3, 13.4, 13.5, 13.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import { schedules, instructions, faculty, users } from '../../db/schema';
import { ScheduleRepository } from './repositories/schedule.repository';
import { ScheduleService } from './services/schedule.service';
import { InstructionRepository } from '../instructions/repositories/instruction.repository';
import { FacultyRepository } from '../faculty/repositories/faculty.repository';
import { generateUUIDv7 } from '../../shared/utils/uuid';
import { eq } from 'drizzle-orm';

describe('Scheduling Module', () => {
  const scheduleRepository = new ScheduleRepository(db);
  const instructionRepository = new InstructionRepository(db);
  const facultyRepository = new FacultyRepository(db);
  const scheduleService = new ScheduleService(
    scheduleRepository,
    instructionRepository,
    facultyRepository
  );

  const testYear = new Date().getFullYear();
  let testInstructionId: string;
  let testFacultyId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Clean up test data - only delete test-specific data
    await db.delete(schedules);
    await db.delete(instructions);
    await db.delete(faculty);
    // Only delete test users, not all users
    await db.delete(users).where(eq(users.email, 'test.faculty@ccs.edu'));

    // Create test user for faculty
    const user = await db.insert(users).values({
      id: generateUUIDv7(),
      email: 'test.faculty@ccs.edu',
      password_hash: 'hashed_password',
      role: 'faculty',
    }).returning();
    testUserId = user[0].id;

    // Create test instruction
    const instruction = await db.insert(instructions).values({
      id: generateUUIDv7(),
      subject_code: 'CS101',
      subject_name: 'Introduction to Computer Science',
      credits: 3,
      curriculum_year: '2024',
    }).returning();
    testInstructionId = instruction[0].id;

    // Create test faculty
    const facultyMember = await db.insert(faculty).values({
      id: generateUUIDv7(),
      faculty_id: 'F-2024-0001',
      user_id: testUserId,
      first_name: 'John',
      last_name: 'Doe',
      email: 'test.faculty@ccs.edu',
      department: 'Computer Science',
    }).returning();
    testFacultyId = facultyMember[0].id;
  });

  describe('Schedule Creation', () => {
    it('should create a schedule successfully', async () => {
      const scheduleData = {
        schedule_type: 'class' as const,
        instruction_id: testInstructionId,
        faculty_id: testFacultyId,
        room: 'A101',
        day: 'monday' as const,
        start_time: '08:00:00',
        end_time: '10:00:00',
        semester: '1st' as const,
        academic_year: '2024-2025',
      };

      const result = await scheduleService.createSchedule(scheduleData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.room).toBe('A101');
      expect(result.day).toBe('monday');
      expect(result.start_time).toBe('08:00:00');
      expect(result.end_time).toBe('10:00:00');
      expect(result.subject_code).toBe('CS101');
      expect(result.faculty_name).toBe('John Doe');
    });

    it('should detect conflicts with overlapping schedules', async () => {
      // Create first schedule
      await scheduleService.createSchedule({
        schedule_type: 'class',
        instruction_id: testInstructionId,
        faculty_id: testFacultyId,
        room: 'A101',
        day: 'monday',
        start_time: '08:00:00',
        end_time: '10:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      // Try to create overlapping schedule
      await expect(
        scheduleService.createSchedule({
          schedule_type: 'exam',
          room: 'A101',
          day: 'monday',
          start_time: '09:00:00',
          end_time: '11:00:00',
          semester: '1st',
          academic_year: '2024-2025',
        })
      ).rejects.toThrow('Schedule conflict detected');
    });

    it('should allow non-overlapping schedules in the same room', async () => {
      // Create first schedule
      await scheduleService.createSchedule({
        schedule_type: 'class',
        room: 'A101',
        day: 'monday',
        start_time: '08:00:00',
        end_time: '10:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      // Create non-overlapping schedule
      const result = await scheduleService.createSchedule({
        schedule_type: 'class',
        room: 'A101',
        day: 'monday',
        start_time: '10:00:00',
        end_time: '12:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      expect(result).toBeDefined();
      expect(result.room).toBe('A101');
    });
  });

  describe('Schedule Retrieval', () => {
    it('should get schedule by ID', async () => {
      const created = await scheduleService.createSchedule({
        schedule_type: 'class',
        instruction_id: testInstructionId,
        faculty_id: testFacultyId,
        room: 'A101',
        day: 'monday',
        start_time: '08:00:00',
        end_time: '10:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      const result = await scheduleService.getSchedule(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.subject_code).toBe('CS101');
    });

    it('should get schedules by room', async () => {
      await scheduleService.createSchedule({
        schedule_type: 'class',
        room: 'A101',
        day: 'monday',
        start_time: '08:00:00',
        end_time: '10:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      await scheduleService.createSchedule({
        schedule_type: 'exam',
        room: 'A101',
        day: 'tuesday',
        start_time: '14:00:00',
        end_time: '16:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      const results = await scheduleService.getSchedulesByRoom('A101');

      expect(results).toHaveLength(2);
      expect(results.every(s => s.room === 'A101')).toBe(true);
    });

    it('should get schedules by faculty ID', async () => {
      await scheduleService.createSchedule({
        schedule_type: 'class',
        instruction_id: testInstructionId,
        faculty_id: testFacultyId,
        room: 'A101',
        day: 'monday',
        start_time: '08:00:00',
        end_time: '10:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      const results = await scheduleService.getSchedulesByFaculty(testFacultyId);

      expect(results).toHaveLength(1);
      expect(results[0].faculty_id).toBe(testFacultyId);
      expect(results[0].faculty_name).toBe('John Doe');
    });
  });

  describe('Schedule Update', () => {
    it('should update schedule successfully', async () => {
      const created = await scheduleService.createSchedule({
        schedule_type: 'class',
        room: 'A101',
        day: 'monday',
        start_time: '08:00:00',
        end_time: '10:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      const updated = await scheduleService.updateSchedule(created.id, {
        room: 'B202',
      });

      expect(updated.room).toBe('B202');
      expect(updated.day).toBe('monday');
    });

    it('should detect conflicts when updating schedule', async () => {
      // Create two schedules
      const schedule1 = await scheduleService.createSchedule({
        schedule_type: 'class',
        room: 'A101',
        day: 'monday',
        start_time: '08:00:00',
        end_time: '10:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      await scheduleService.createSchedule({
        schedule_type: 'exam',
        room: 'A101',
        day: 'monday',
        start_time: '10:00:00',
        end_time: '12:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      // Try to update first schedule to overlap with second
      await expect(
        scheduleService.updateSchedule(schedule1.id, {
          start_time: '09:00:00',
          end_time: '11:00:00',
        })
      ).rejects.toThrow('Schedule conflict detected');
    });
  });

  describe('Schedule Deletion', () => {
    it('should soft delete schedule', async () => {
      const created = await scheduleService.createSchedule({
        schedule_type: 'class',
        room: 'A101',
        day: 'monday',
        start_time: '08:00:00',
        end_time: '10:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      await scheduleService.deleteSchedule(created.id);

      // Should not be found after soft delete
      await expect(
        scheduleService.getSchedule(created.id)
      ).rejects.toThrow('Schedule not found');
    });
  });

  describe('Conflict Detection', () => {
    it('should check for conflicts correctly', async () => {
      await scheduleService.createSchedule({
        schedule_type: 'class',
        room: 'A101',
        day: 'monday',
        start_time: '08:00:00',
        end_time: '10:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      const conflicts = await scheduleService.checkConflicts({
        room: 'A101',
        day: 'monday',
        start_time: '09:00:00',
        end_time: '11:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      expect(conflicts).toHaveLength(1);
    });

    it('should return no conflicts for non-overlapping times', async () => {
      await scheduleService.createSchedule({
        schedule_type: 'class',
        room: 'A101',
        day: 'monday',
        start_time: '08:00:00',
        end_time: '10:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      const conflicts = await scheduleService.checkConflicts({
        room: 'A101',
        day: 'monday',
        start_time: '10:00:00',
        end_time: '12:00:00',
        semester: '1st',
        academic_year: '2024-2025',
      });

      expect(conflicts).toHaveLength(0);
    });
  });
});
