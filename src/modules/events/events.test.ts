/**
 * Events Module Tests
 * Integration tests for event operations
 * 
 * Requirements: 11.1, 11.3, 11.4, 11.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import { events, eventParticipants, students, faculty, users } from '../../db/schema';
import { EventRepository } from './repositories/event.repository';
import { EventService } from './services/event.service';
import { generateUUIDv7 } from '../../shared/utils/uuid';

describe('Events Module', () => {
  const eventRepository = new EventRepository(db);
  const eventService = new EventService(eventRepository);

  let testStudentId: string;
  let testFacultyId: string;

  beforeEach(async () => {
    // Clean up test data
    await db.delete(eventParticipants);
    await db.delete(events);
    await db.delete(students);
    await db.delete(faculty);
    await db.delete(users);

    // Create test student
    const studentUserId = generateUUIDv7();
    await db.insert(users).values({
      id: studentUserId,
      email: 'test.student@example.com',
      password_hash: 'hashed_password',
      role: 'student',
    });

    const studentId = generateUUIDv7();
    await db.insert(students).values({
      id: studentId,
      student_id: 'S-2024-0001',
      user_id: studentUserId,
      first_name: 'Test',
      last_name: 'Student',
      email: 'test.student@example.com',
    });

    testStudentId = studentId;

    // Create test faculty
    const facultyUserId = generateUUIDv7();
    await db.insert(users).values({
      id: facultyUserId,
      email: 'test.faculty@example.com',
      password_hash: 'hashed_password',
      role: 'faculty',
    });

    const facultyId = generateUUIDv7();
    await db.insert(faculty).values({
      id: facultyId,
      faculty_id: 'F-2024-0001',
      user_id: facultyUserId,
      first_name: 'Test',
      last_name: 'Faculty',
      email: 'test.faculty@example.com',
      department: 'Computer Science',
    });

    testFacultyId = facultyId;
  });

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

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
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

      expect(result.data).toHaveLength(1);
      expect(result.data[0].event_name).toBe('Seminar Event');
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
      const event = await eventService.createEvent({
        event_name: 'Student Event',
        event_type: 'seminar',
        event_date: '2024-12-01',
      });

      const participant = await eventService.addParticipant(event.id, {
        student_id: testStudentId,
        participation_role: 'attendee',
      });

      expect(participant).toBeDefined();
      expect(participant.student_id).toBe(testStudentId);
      expect(participant.participant_type).toBe('student');
      expect(participant.attendance_status).toBe('registered');
    });

    it('should add faculty participant to event', async () => {
      const event = await eventService.createEvent({
        event_name: 'Faculty Event',
        event_type: 'workshop',
        event_date: '2024-12-01',
      });

      const participant = await eventService.addParticipant(event.id, {
        faculty_id: testFacultyId,
        participation_role: 'speaker',
      });

      expect(participant).toBeDefined();
      expect(participant.faculty_id).toBe(testFacultyId);
      expect(participant.participant_type).toBe('faculty');
    });

    it('should prevent duplicate participant registration', async () => {
      const event = await eventService.createEvent({
        event_name: 'Test Event',
        event_type: 'seminar',
        event_date: '2024-12-01',
      });

      await eventService.addParticipant(event.id, {
        student_id: testStudentId,
      });

      await expect(
        eventService.addParticipant(event.id, {
          student_id: testStudentId,
        })
      ).rejects.toThrow('Participant is already registered for this event');
    });

    it('should enforce max participants limit', async () => {
      const event = await eventService.createEvent({
        event_name: 'Limited Event',
        event_type: 'workshop',
        event_date: '2024-12-01',
        max_participants: 1,
      });

      await eventService.addParticipant(event.id, {
        student_id: testStudentId,
      });

      // Create another student
      const userId2 = generateUUIDv7();
      await db.insert(users).values({
        id: userId2,
        email: 'student2@example.com',
        password_hash: 'hashed_password',
        role: 'student',
      });

      const studentId2 = generateUUIDv7();
      await db.insert(students).values({
        id: studentId2,
        student_id: 'S-2024-0002',
        user_id: userId2,
        first_name: 'Student',
        last_name: 'Two',
        email: 'student2@example.com',
      });

      await expect(
        eventService.addParticipant(event.id, {
          student_id: studentId2,
        })
      ).rejects.toThrow('Event has reached maximum participant capacity');
    });

    it('should get all participants for an event', async () => {
      const event = await eventService.createEvent({
        event_name: 'Multi Participant Event',
        event_type: 'seminar',
        event_date: '2024-12-01',
      });

      await eventService.addParticipant(event.id, {
        student_id: testStudentId,
      });

      await eventService.addParticipant(event.id, {
        faculty_id: testFacultyId,
      });

      const participants = await eventService.getParticipants(event.id);

      expect(participants).toHaveLength(2);
      expect(participants.some(p => p.student_id === testStudentId)).toBe(true);
      expect(participants.some(p => p.faculty_id === testFacultyId)).toBe(true);
    });

    it('should remove participant from event', async () => {
      const event = await eventService.createEvent({
        event_name: 'Test Event',
        event_type: 'workshop',
        event_date: '2024-12-01',
      });

      const participant = await eventService.addParticipant(event.id, {
        student_id: testStudentId,
      });

      await eventService.removeParticipant(event.id, participant.id);

      const participants = await eventService.getParticipants(event.id);
      expect(participants).toHaveLength(0);
    });
  });

  describe('Participant Count', () => {
    it('should track participant count correctly', async () => {
      const event = await eventService.createEvent({
        event_name: 'Count Test Event',
        event_type: 'seminar',
        event_date: '2024-12-01',
      });

      let eventData = await eventService.getEvent(event.id);
      expect(eventData.participant_count).toBe(0);

      await eventService.addParticipant(event.id, {
        student_id: testStudentId,
      });

      eventData = await eventService.getEvent(event.id);
      expect(eventData.participant_count).toBe(1);

      await eventService.addParticipant(event.id, {
        faculty_id: testFacultyId,
      });

      eventData = await eventService.getEvent(event.id);
      expect(eventData.participant_count).toBe(2);
    });
  });
});
