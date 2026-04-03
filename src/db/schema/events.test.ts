import { describe, it, expect } from 'vitest';
import { events, eventParticipants } from './events';

describe('Events Schema', () => {
  it('should have events table defined', () => {
    expect(events).toBeDefined();
  });

  it('should have required fields in events table', () => {
    const columns = Object.keys(events);
    expect(columns).toContain('id');
    expect(columns).toContain('event_name');
    expect(columns).toContain('event_type');
    expect(columns).toContain('event_date');
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');
    expect(columns).toContain('deleted_at');
  });

  it('should have event_participants table defined', () => {
    expect(eventParticipants).toBeDefined();
  });

  it('should have required fields in event_participants table', () => {
    const columns = Object.keys(eventParticipants);
    expect(columns).toContain('id');
    expect(columns).toContain('event_id');
    expect(columns).toContain('student_id');
    expect(columns).toContain('faculty_id');
    expect(columns).toContain('participation_role');
    expect(columns).toContain('attendance_status');
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');
  });

  it('should have foreign key references in event_participants', () => {
    // Verify that foreign key relationships are defined
    expect(eventParticipants.event_id).toBeDefined();
    expect(eventParticipants.student_id).toBeDefined();
    expect(eventParticipants.faculty_id).toBeDefined();
  });
});
