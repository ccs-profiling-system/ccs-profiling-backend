/**
 * Student Portal - Dashboard Service Tests
 * Unit tests for student dashboard summary service
 * 
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from './dashboard.service';

// Mock database
const mockDb = {
  select: vi.fn(),
} as any;

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DashboardService(mockDb);
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary with all data', async () => {
      const studentId = 'student-123';

      // Mock current semester courses query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([
                {
                  id: 'enrollment-1',
                  course_code: 'CS101',
                  course_name: 'Introduction to Computer Science',
                  section: 'N/A',
                  instructor_name: 'TBA',
                  schedule: null,
                  room: null,
                  units: 3,
                  enrollment_status: 'enrolled',
                },
              ]),
            }),
          }),
        }),
      });

      // Mock GPA calculation query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalGradePoints: 12.0,
              totalCredits: 4,
            },
          ]),
        }),
      });

      // Mock unread notification count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              count: 5,
            },
          ]),
        }),
      });

      // Mock upcoming events query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    id: 'event-1',
                    title: 'Tech Conference',
                    description: 'Annual tech conference',
                    event_type: 'conference',
                    event_date: '2024-12-15',
                    location: 'Main Hall',
                    organizer: 'CS Department',
                    registration_deadline: '2024-12-10',
                    max_participants: 100,
                    current_participants: 50,
                  },
                ]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getDashboardSummary(studentId);

      expect(result).toMatchObject({
        current_semester_courses: expect.arrayContaining([
          expect.objectContaining({
            course_code: 'CS101',
            course_name: 'Introduction to Computer Science',
          }),
        ]),
        current_gpa: 3.0,
        unread_notification_count: 5,
        upcoming_events: expect.arrayContaining([
          expect.objectContaining({
            title: 'Tech Conference',
            event_type: 'conference',
          }),
        ]),
      });
    });

    it('should return null GPA when no grades exist', async () => {
      const studentId = 'student-123';

      // Mock current semester courses query (empty)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Mock GPA calculation query (no grades)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalGradePoints: 0,
              totalCredits: 0,
            },
          ]),
        }),
      });

      // Mock unread notification count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              count: 0,
            },
          ]),
        }),
      });

      // Mock upcoming events query (empty)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getDashboardSummary(studentId);

      expect(result.current_gpa).toBeNull();
      expect(result.current_semester_courses).toHaveLength(0);
      expect(result.unread_notification_count).toBe(0);
      expect(result.upcoming_events).toHaveLength(0);
    });

    it('should limit upcoming events to 5', async () => {
      const studentId = 'student-123';

      // Mock current semester courses query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Mock GPA calculation query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalGradePoints: 12.0,
              totalCredits: 4,
            },
          ]),
        }),
      });

      // Mock unread notification count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              count: 0,
            },
          ]),
        }),
      });

      // Mock upcoming events query with limit
      const mockLimit = vi.fn().mockResolvedValue([
        { id: '1', title: 'Event 1', event_type: 'seminar', event_date: '2024-12-15', max_participants: 100, current_participants: 50 },
        { id: '2', title: 'Event 2', event_type: 'workshop', event_date: '2024-12-16', max_participants: 50, current_participants: 25 },
        { id: '3', title: 'Event 3', event_type: 'conference', event_date: '2024-12-17', max_participants: 200, current_participants: 100 },
        { id: '4', title: 'Event 4', event_type: 'seminar', event_date: '2024-12-18', max_participants: 75, current_participants: 30 },
        { id: '5', title: 'Event 5', event_type: 'workshop', event_date: '2024-12-19', max_participants: 60, current_participants: 40 },
      ]);

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: mockLimit,
              }),
            }),
          }),
        }),
      });

      const result = await service.getDashboardSummary(studentId);

      expect(result.upcoming_events).toHaveLength(5);
      expect(mockLimit).toHaveBeenCalledWith(5);
    });
  });
});
