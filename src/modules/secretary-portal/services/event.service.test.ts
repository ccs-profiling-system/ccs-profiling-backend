/**
 * Event Service Tests
 * Unit tests for event management operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventService from './event.service';
import { db } from '../../../db';
import { events } from '../../../db/schema';
import { ValidationError } from '../../../shared/errors';

// Mock the database
vi.mock('../../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

// Mock audit logger
vi.mock('../utils/auditLogger', () => ({
  logCreate: vi.fn(),
  logUpdate: vi.fn(),
  logDelete: vi.fn(),
  logSubmit: vi.fn(),
}));

describe('Event Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create an event with draft status', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const mockEvent = {
        id: '123',
        event_name: 'Test Event',
        event_type: 'seminar',
        event_date: futureDateStr,
        location: 'Room 101',
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock transaction
      (db.transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockEvent]),
            }),
          }),
        });
      });

      const result = await eventService.createEvent({
        event_name: 'Test Event',
        event_type: 'seminar',
        event_date: futureDateStr,
        location: 'Room 101',
      });

      expect(result.status).toBe('draft');
      expect(result.event_name).toBe('Test Event');
    });

    it('should reject event with past date', async () => {
      await expect(
        eventService.createEvent({
          event_name: 'Test Event',
          event_type: 'seminar',
          event_date: '2020-01-01',
          location: 'Room 101',
        })
      ).rejects.toThrow('Event date cannot be in the past');
    });

    it('should reject invalid registration deadline', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const laterDate = new Date(futureDate);
      laterDate.setDate(laterDate.getDate() + 1);
      const laterDateStr = laterDate.toISOString().split('T')[0];

      await expect(
        eventService.createEvent({
          event_name: 'Test Event',
          event_type: 'seminar',
          event_date: futureDateStr,
          location: 'Room 101',
          registration_deadline: laterDateStr,
        })
      ).rejects.toThrow('Registration deadline must be before event date');
    });

    it('should reject negative max_participants', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      await expect(
        eventService.createEvent({
          event_name: 'Test Event',
          event_type: 'seminar',
          event_date: futureDateStr,
          location: 'Room 101',
          max_participants: -5,
        })
      ).rejects.toThrow('Max participants must be a positive integer');
    });
  });

  describe('updateEvent', () => {
    it('should prevent updates to approved events', async () => {
      const mockEvent = {
        id: '123',
        status: 'approved',
        event_name: 'Test Event',
      };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockEvent]),
              }),
            }),
          }),
        });
      });

      await expect(
        eventService.updateEvent('123', { event_name: 'Updated Event' })
      ).rejects.toThrow("Cannot update event with status 'approved'");
    });

    it('should prevent updates to rejected events', async () => {
      const mockEvent = {
        id: '123',
        status: 'rejected',
        event_name: 'Test Event',
      };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockEvent]),
              }),
            }),
          }),
        });
      });

      await expect(
        eventService.updateEvent('123', { event_name: 'Updated Event' })
      ).rejects.toThrow("Cannot update event with status 'rejected'");
    });
  });

  describe('deleteEvent', () => {
    it('should prevent deletion of approved events', async () => {
      const mockEvent = {
        id: '123',
        status: 'approved',
        event_name: 'Test Event',
      };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockEvent]),
              }),
            }),
          }),
        });
      });

      await expect(eventService.deleteEvent('123')).rejects.toThrow(
        "Cannot delete event with status 'approved'"
      );
    });

    it('should prevent deletion of pending_approval events', async () => {
      const mockEvent = {
        id: '123',
        status: 'pending_approval',
        event_name: 'Test Event',
      };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockEvent]),
              }),
            }),
          }),
        });
      });

      await expect(eventService.deleteEvent('123')).rejects.toThrow(
        "Cannot delete event with status 'pending_approval'"
      );
    });
  });

  describe('submitEvent', () => {
    it('should change status from draft to pending_approval', async () => {
      const mockEvent = {
        id: '123',
        status: 'draft',
        event_name: 'Test Event',
      };

      const mockUpdated = {
        ...mockEvent,
        status: 'pending_approval',
      };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockEvent]),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockUpdated]),
              }),
            }),
          }),
        });
      });

      const result = await eventService.submitEvent('123');
      expect(result.status).toBe('pending_approval');
    });

    it('should reject submission of non-draft events', async () => {
      const mockEvent = {
        id: '123',
        status: 'approved',
        event_name: 'Test Event',
      };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockEvent]),
              }),
            }),
          }),
        });
      });

      await expect(eventService.submitEvent('123')).rejects.toThrow(
        "Cannot submit event with status 'approved'"
      );
    });
  });
});
