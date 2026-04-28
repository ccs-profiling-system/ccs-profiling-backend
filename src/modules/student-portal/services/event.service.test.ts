/**
 * Student Portal - Event Service Tests
 * Unit tests for event management service
 * 
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventService } from './event.service';
import { NotFoundError, ConflictError, ValidationError, UnprocessableEntityError } from '../../../shared/errors';

// Mock database
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
} as any;

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EventService(mockDb);
  });

  describe('listUpcomingEvents', () => {
    it('should return paginated list of upcoming events', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          event_name: 'Tech Conference 2024',
          description: 'Annual tech conference',
          event_type: 'seminar',
          event_date: '2024-06-01',
          location: 'Main Hall',
          organizer: 'CS Department',
          registration_deadline: '2024-05-25',
          max_participants: 100,
        },
      ];

      // Mock count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      // Mock events query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockEvents),
              }),
            }),
          }),
        }),
      });

      // Mock participant count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([
              { event_id: 'event-1', count: 50 },
            ]),
          }),
        }),
      });

      const result = await service.listUpcomingEvents({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'event-1',
        title: 'Tech Conference 2024',
        event_type: 'seminar',
        available_slots: 50, // 100 max - 50 registered
      });
      expect(result.meta).toMatchObject({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle events with no max_participants', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          event_name: 'Open Workshop',
          description: 'Workshop with unlimited capacity',
          event_type: 'workshop',
          event_date: '2024-06-01',
          location: 'Room 101',
          organizer: 'Faculty',
          registration_deadline: '2024-05-25',
          max_participants: null,
        },
      ];

      // Mock count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      // Mock events query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockEvents),
              }),
            }),
          }),
        }),
      });

      // Mock participant count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.listUpcomingEvents({ page: 1, limit: 10 });

      expect(result.data[0].available_slots).toBeNull();
    });
  });

  describe('listRegisteredEvents', () => {
    it('should return list of events student has registered for', async () => {
      const studentId = 'student-123';
      const mockRegisteredEvents = [
        {
          id: 'event-1',
          event_name: 'Tech Conference 2024',
          description: 'Annual tech conference',
          event_type: 'seminar',
          event_date: '2024-06-01',
          location: 'Main Hall',
          organizer: 'CS Department',
          registration_deadline: '2024-05-25',
          max_participants: 100,
          registration_date: new Date('2024-01-15'),
          attendance_status: 'registered',
        },
      ];

      // Mock registered events query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockRegisteredEvents),
            }),
          }),
        }),
      });

      // Mock participant count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([
              { event_id: 'event-1', count: 50 },
            ]),
          }),
        }),
      });

      const result = await service.listRegisteredEvents(studentId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'event-1',
        title: 'Tech Conference 2024',
        registration_date: '2024-01-15',
        attendance_status: 'registered',
        available_slots: 50,
      });
    });
  });

  describe('registerForEvent', () => {
    it('should successfully register student for event', async () => {
      const eventId = 'event-1';
      const studentId = 'student-123';

      const mockEvent = {
        id: eventId,
        event_name: 'Tech Conference 2024',
        registration_deadline: null, // No deadline
        max_participants: 100,
      };

      // Mock event check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEvent]),
          }),
        }),
      });

      // Mock duplicate check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock participant count check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 50 }]),
        }),
      });

      // Mock insert
      mockDb.insert.mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await service.registerForEvent(eventId, studentId);

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw ValidationError if registration deadline has passed', async () => {
      const eventId = 'event-1';
      const studentId = 'student-123';

      const mockEvent = {
        id: eventId,
        event_name: 'Tech Conference 2024',
        registration_deadline: '2020-01-01', // Past date
        max_participants: 100,
      };

      // Mock event check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEvent]),
          }),
        }),
      });

      await expect(service.registerForEvent(eventId, studentId)).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if student already registered', async () => {
      const eventId = 'event-1';
      const studentId = 'student-123';

      const mockEvent = {
        id: eventId,
        event_name: 'Tech Conference 2024',
        registration_deadline: null,
        max_participants: 100,
      };

      const mockExistingRegistration = {
        id: 'reg-1',
        event_id: eventId,
        student_id: studentId,
      };

      // Mock event check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEvent]),
          }),
        }),
      });

      // Mock duplicate check - registration exists
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockExistingRegistration]),
          }),
        }),
      });

      await expect(service.registerForEvent(eventId, studentId)).rejects.toThrow(ConflictError);
    });

    it('should throw UnprocessableEntityError if event is at maximum capacity', async () => {
      const eventId = 'event-1';
      const studentId = 'student-123';

      const mockEvent = {
        id: eventId,
        event_name: 'Tech Conference 2024',
        registration_deadline: null,
        max_participants: 100,
      };

      // Mock event check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEvent]),
          }),
        }),
      });

      // Mock duplicate check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock participant count check - at capacity
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 100 }]),
        }),
      });

      await expect(service.registerForEvent(eventId, studentId)).rejects.toThrow(
        UnprocessableEntityError
      );
    });

    it('should throw NotFoundError if event does not exist', async () => {
      const eventId = 'non-existent';
      const studentId = 'student-123';

      // Mock event not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.registerForEvent(eventId, studentId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('unregisterFromEvent', () => {
    it('should successfully unregister student from event', async () => {
      const eventId = 'event-1';
      const studentId = 'student-123';

      // Use a far future date to ensure it's always in the future
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      const futureDateString = futureDate.toISOString().split('T')[0];

      const mockEvent = {
        id: eventId,
        event_date: futureDateString,
      };

      const mockExistingRegistration = {
        id: 'reg-1',
        event_id: eventId,
        student_id: studentId,
      };

      // Mock event check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEvent]),
          }),
        }),
      });

      // Mock registration check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockExistingRegistration]),
          }),
        }),
      });

      // Mock delete
      mockDb.delete.mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(undefined),
      });

      await service.unregisterFromEvent(eventId, studentId);

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw ValidationError if event date has passed', async () => {
      const eventId = 'event-1';
      const studentId = 'student-123';

      const mockEvent = {
        id: eventId,
        event_date: '2020-01-01', // Past date
      };

      // Mock event check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEvent]),
          }),
        }),
      });

      await expect(service.unregisterFromEvent(eventId, studentId)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError if student is not registered', async () => {
      const eventId = 'event-1';
      const studentId = 'student-123';

      // Use a far future date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      const futureDateString = futureDate.toISOString().split('T')[0];

      const mockEvent = {
        id: eventId,
        event_date: futureDateString,
      };

      // Mock event check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEvent]),
          }),
        }),
      });

      // Mock registration check - not registered
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.unregisterFromEvent(eventId, studentId)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw NotFoundError if event does not exist', async () => {
      const eventId = 'non-existent';
      const studentId = 'student-123';

      // Mock event not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.unregisterFromEvent(eventId, studentId)).rejects.toThrow(NotFoundError);
    });
  });
});
