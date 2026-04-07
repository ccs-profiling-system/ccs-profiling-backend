/**
 * Events Module Tests
 * Integration tests for event operations
 * 
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import { events, eventParticipants, students, faculty, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { EventRepository } from './repositories/event.repository';
import { EventService } from './services/event.service';
import { generateUUIDv7 } from '../../shared/utils/uuid';

describe('Events Module', () => {
  const eventRepository = new EventRepository(db);
  const eventService = new EventService(eventRepository);

  // Helper to create unique test data for each test
  async function createTestData() {
    const uniqueId = generateUUIDv7();
    
    // Create test student with unique email
    const studentUserId = generateUUIDv7();
    const [insertedUser] = await db.insert(users).values({
      id: studentUserId,
      email: `student-${uniqueId}@example.com`,
      password_hash: 'hashed_password',
      role: 'student',
    }).returning();

    const studentId = generateUUIDv7();
    const [insertedStudent] = await db.insert(students).values({
      id: studentId,
      student_id: `S-${uniqueId}`,
      user_id: studentUserId,
      first_name: 'Test',
      last_name: 'Student',
      email: `student-${uniqueId}@example.com`,
    }).returning();

    // Create test faculty with unique email
    const facultyUserId = generateUUIDv7();
    const [insertedFacultyUser] = await db.insert(users).values({
      id: facultyUserId,
      email: `faculty-${uniqueId}@example.com`,
      password_hash: 'hashed_password',
      role: 'faculty',
    }).returning();

    const facultyId = generateUUIDv7();
    const [insertedFaculty] = await db.insert(faculty).values({
      id: facultyId,
      faculty_id: `F-${uniqueId}`,
      user_id: facultyUserId,
      first_name: 'Test',
      last_name: 'Faculty',
      email: `faculty-${uniqueId}@example.com`,
      department: 'Computer Science',
    }).returning();
    
    if (!insertedStudent || !insertedFaculty) {
      throw new Error('Failed to create test data');
    }

    return { studentId, facultyId };
  }

  describe('Event Creation', () => {
    it('should create an event successfully', async () => {
      const eventData = {
        event_name: 'Tech Conference 2024',
        event_type: 'seminar' as const,
        description: 'Annual technology conference',
        event_date: '2024-12-15',
        start_time: '09:00:00',
        end_time: '17:00:00',
        location: 'Main Auditorium',
        max_participants: 100,
      };

      const result = await eventService.createEvent(eventData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.event_name).toBe('Tech Conference 2024');
      expect(result.event_type).toBe('seminar');
      expect(result.event_date).toBe('2024-12-15');
      expect(result.max_participants).toBe(100);
      expect(result.participant_count).toBe(0);
    });

    it('should create an event without optional fields', async () => {
      const eventData = {
        event_name: 'Simple Workshop',
        event_type: 'workshop' as const,
        event_date: '2024-12-20',
      };

      const result = await eventService.createEvent(eventData);

      expect(result.event_name).toBe('Simple Workshop');
      expect(result.description).toBeUndefined();
      expect(result.location).toBeUndefined();
      expect(result.max_participants).toBeUndefined();
    });
  });

  describe('Event Retrieval', () => {
    it('should get event by ID', async () => {
      const created = await eventService.createEvent({
        event_name: 'Coding Competition',
        event_type: 'competition',
        event_date: '2024-12-25',
      });

      const result = await eventService.getEvent(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.event_name).toBe('Coding Competition');
    });

    it('should list events with pagination', async () => {
      await eventService.createEvent({
        event_name: 'Event 1',
        event_type: 'seminar',
        event_date: '2024-12-01',
      });

      await eventService.createEvent({
        event_name: 'Event 2',
        event_type: 'workshop',
        event_date: '2024-12-02',
      });

      const result = await eventService.listEvents({ page: 1, limit: 10 });

      expect(result.data.length).toBeGreaterThanOrEqual(2);
      expect(result.meta.page).toBe(1);
    });

    it('should filter events by type', async () => {
      await eventService.createEvent({
        event_name: 'Seminar Event',
        event_type: 'seminar',
        event_date: '2024-12-01',
      });

      await eventService.createEvent({
        event_name: 'Workshop Event',
        event_type: 'workshop',
        event_date: '2024-12-02',
      });

      const result = await eventService.listEvents({ event_type: 'seminar' });

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.some(e => e.event_name === 'Seminar Event')).toBe(true);
    });
  });

  describe('Event Update', () => {
    it('should update event successfully', async () => {
      const created = await eventService.createEvent({
        event_name: 'Original Event',
        event_type: 'seminar',
        event_date: '2024-12-01',
      });

      const updated = await eventService.updateEvent(created.id, {
        event_name: 'Updated Event',
        location: 'New Location',
      });

      expect(updated.event_name).toBe('Updated Event');
      expect(updated.location).toBe('New Location');
      expect(updated.event_type).toBe('seminar');
    });

    it('should throw error when updating non-existent event', async () => {
      await expect(
        eventService.updateEvent(generateUUIDv7(), { event_name: 'Test' })
      ).rejects.toThrow('Event not found');
    });
  });

  describe('Event Deletion', () => {
    it('should soft delete event', async () => {
      const created = await eventService.createEvent({
        event_name: 'Temporary Event',
        event_type: 'workshop',
        event_date: '2024-12-01',
      });

      await eventService.deleteEvent(created.id);

      await expect(eventService.getEvent(created.id)).rejects.toThrow('Event not found');
    });
  });

  describe('Event Participants', () => {
    it('should add student participant to event', async () => {
      const { studentId } = await createTestData();
      
      const event = await eventService.createEvent({
        event_name: 'Student Event',
        event_type: 'seminar',
        event_date: '2024-12-01',
      });

      const participant = await eventService.addParticipant(event.id, {
        student_id: studentId,
        participation_role: 'attendee',
      });

      expect(participant).toBeDefined();
      expect(participant.student_id).toBe(studentId);
      expect(participant.participant_type).toBe('student');
      expect(participant.attendance_status).toBe('registered');
    });

    it('should add faculty participant to event', async () => {
      const { facultyId } = await createTestData();
      
      const event = await eventService.createEvent({
        event_name: 'Faculty Event',
        event_type: 'workshop',
        event_date: '2024-12-01',
      });

      const participant = await eventService.addParticipant(event.id, {
        faculty_id: facultyId,
        participation_role: 'speaker',
      });

      expect(participant).toBeDefined();
      expect(participant.faculty_id).toBe(facultyId);
      expect(participant.participant_type).toBe('faculty');
    });

    it('should prevent duplicate participant registration', async () => {
      const { studentId } = await createTestData();
      
      const event = await eventService.createEvent({
        event_name: 'Test Event',
        event_type: 'seminar',
        event_date: '2024-12-01',
      });

      await eventService.addParticipant(event.id, {
        student_id: studentId,
      });

      await expect(
        eventService.addParticipant(event.id, {
          student_id: studentId,
        })
      ).rejects.toThrow('Participant is already registered for this event');
    });

    it('should enforce max participants limit', async () => {
      const { studentId } = await createTestData();
      
      const event = await eventService.createEvent({
        event_name: 'Limited Event',
        event_type: 'workshop',
        event_date: '2024-12-01',
        max_participants: 1,
      });

      await eventService.addParticipant(event.id, {
        student_id: studentId,
      });

      // Create another student with unique data
      const uniqueId = generateUUIDv7();
      const userId2 = generateUUIDv7();
      await db.insert(users).values({
        id: userId2,
        email: `student2-${uniqueId}@example.com`,
        password_hash: 'hashed_password',
        role: 'student',
      });

      const studentId2 = generateUUIDv7();
      await db.insert(students).values({
        id: studentId2,
        student_id: `S-2-${uniqueId}`,
        user_id: userId2,
        first_name: 'Student',
        last_name: 'Two',
        email: `student2-${uniqueId}@example.com`,
      });

      await expect(
        eventService.addParticipant(event.id, {
          student_id: studentId2,
        })
      ).rejects.toThrow('Event has reached maximum participant capacity');
    });

    it('should get all participants for an event', async () => {
      const { studentId, facultyId } = await createTestData();
      
      const event = await eventService.createEvent({
        event_name: 'Multi Participant Event',
        event_type: 'seminar',
        event_date: '2024-12-01',
      });

      await eventService.addParticipant(event.id, {
        student_id: studentId,
      });

      await eventService.addParticipant(event.id, {
        faculty_id: facultyId,
      });

      const participants = await eventService.getParticipants(event.id);

      expect(participants).toHaveLength(2);
      expect(participants.some(p => p.student_id === studentId)).toBe(true);
      expect(participants.some(p => p.faculty_id === facultyId)).toBe(true);
    });

    it('should remove participant from event', async () => {
      const { studentId } = await createTestData();
      
      const event = await eventService.createEvent({
        event_name: 'Test Event',
        event_type: 'workshop',
        event_date: '2024-12-01',
      });

      const participant = await eventService.addParticipant(event.id, {
        student_id: studentId,
      });

      await eventService.removeParticipant(event.id, participant.id);

      const participants = await eventService.getParticipants(event.id);
      expect(participants).toHaveLength(0);
    });
  });

  describe('Participant Count', () => {
    it('should track participant count correctly', async () => {
      const { studentId, facultyId } = await createTestData();
      
      const event = await eventService.createEvent({
        event_name: 'Count Test Event',
        event_type: 'seminar',
        event_date: '2024-12-01',
      });

      let eventData = await eventService.getEvent(event.id);
      expect(eventData.participant_count).toBe(0);

      await eventService.addParticipant(event.id, {
        student_id: studentId,
      });

      eventData = await eventService.getEvent(event.id);
      expect(eventData.participant_count).toBe(1);

      await eventService.addParticipant(event.id, {
        faculty_id: facultyId,
      });

      eventData = await eventService.getEvent(event.id);
      expect(eventData.participant_count).toBe(2);
    });
  });
});
