/**
 * Search Service Tests
 * Tests for search functionality
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../../db';
import { StudentRepository } from '../../students/repositories/student.repository';
import { FacultyRepository } from '../../faculty/repositories/faculty.repository';
import { EventRepository } from '../../events/repositories/event.repository';
import { ResearchRepository } from '../../research/repositories/research.repository';
import { SearchService } from './search.service';
import { students, faculty, events, research } from '../../../db/schema';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import { eq } from 'drizzle-orm';

describe('SearchService', () => {
  let searchService: SearchService;
  let testStudentId: string;
  let testFacultyId: string;
  let testEventId: string;
  let testResearchId: string;

  beforeAll(async () => {
    // Clean up any existing test data first
    await db.delete(students).where(eq(students.student_id, 'TEST-SEARCH-001'));
    await db.delete(faculty).where(eq(faculty.faculty_id, 'TEST-FACULTY-001'));
    await db.delete(events).where(eq(events.event_name, 'SearchTest Event'));
    await db.delete(research).where(eq(research.title, 'SearchTest Research Project'));

    // Initialize repositories
    const studentRepository = new StudentRepository(db);
    const facultyRepository = new FacultyRepository(db);
    const eventRepository = new EventRepository(db);
    const researchRepository = new ResearchRepository(db);

    // Initialize service
    searchService = new SearchService(
      studentRepository,
      facultyRepository,
      eventRepository,
      researchRepository
    );

    // Create test data
    testStudentId = generateUUIDv7();
    const studentResult = await db.insert(students).values({
      id: testStudentId,
      student_id: 'TEST-SEARCH-001',
      first_name: 'SearchTest',
      last_name: 'Student',
      email: 'searchtest@example.com',
      status: 'active',
    }).returning();

    testFacultyId = generateUUIDv7();
    const facultyResult = await db.insert(faculty).values({
      id: testFacultyId,
      faculty_id: 'TEST-FACULTY-001',
      first_name: 'SearchTest',
      last_name: 'Faculty',
      email: 'searchfaculty@example.com',
      department: 'Computer Science',
      status: 'active',
    }).returning();

    testEventId = generateUUIDv7();
    const eventResult = await db.insert(events).values({
      id: testEventId,
      event_name: 'SearchTest Event',
      event_type: 'seminar',
      event_date: '2024-12-01',
    }).returning();

    testResearchId = generateUUIDv7();
    const researchResult = await db.insert(research).values({
      id: testResearchId,
      title: 'SearchTest Research Project',
      research_type: 'thesis',
      status: 'ongoing',
    }).returning();
  });

  afterAll(async () => {
    // Clean up test data
    if (testStudentId) {
      await db.delete(students).where(eq(students.id, testStudentId));
    }
    if (testFacultyId) {
      await db.delete(faculty).where(eq(faculty.id, testFacultyId));
    }
    if (testEventId) {
      await db.delete(events).where(eq(events.id, testEventId));
    }
    if (testResearchId) {
      await db.delete(research).where(eq(research.id, testResearchId));
    }
  });

  describe('searchStudents', () => {
    it('should search students by name', async () => {
      const result = await searchService.searchStudents('SearchTest');

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some(s => s.first_name === 'SearchTest')).toBe(true);
      expect(result.meta.query).toBe('SearchTest');
    });

    it('should search students by student_id', async () => {
      const result = await searchService.searchStudents('TEST-SEARCH');

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some(s => s.student_id.includes('TEST-SEARCH'))).toBe(true);
    });
  });

  describe('searchFaculty', () => {
    it('should search faculty by name', async () => {
      const result = await searchService.searchFaculty('SearchTest');

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some(f => f.first_name === 'SearchTest')).toBe(true);
      expect(result.meta.query).toBe('SearchTest');
    });

    it('should search faculty by faculty_id', async () => {
      const result = await searchService.searchFaculty('TEST-FACULTY');

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some(f => f.faculty_id.includes('TEST-FACULTY'))).toBe(true);
    });
  });

  describe('searchEvents', () => {
    it('should search events by name', async () => {
      const result = await searchService.searchEvents('SearchTest');

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some(e => e.event_name.includes('SearchTest'))).toBe(true);
      expect(result.meta.query).toBe('SearchTest');
    });
  });

  describe('searchResearch', () => {
    it('should search research by title', async () => {
      const result = await searchService.searchResearch('SearchTest');

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some(r => r.title.includes('SearchTest'))).toBe(true);
      expect(result.meta.query).toBe('SearchTest');
    });
  });

  describe('globalSearch', () => {
    it('should search across all entities', async () => {
      const result = await searchService.globalSearch('SearchTest');

      expect(result.students).toBeDefined();
      expect(result.faculty).toBeDefined();
      expect(result.events).toBeDefined();
      expect(result.research).toBeDefined();
      expect(result.meta.total).toBeGreaterThan(0);
      expect(result.meta.query).toBe('SearchTest');
    });

    it('should search specific entity type when type is provided', async () => {
      const result = await searchService.globalSearch('SearchTest', 'students');

      expect(result.students).toBeDefined();
      expect(result.faculty).toBeUndefined();
      expect(result.events).toBeUndefined();
      expect(result.research).toBeUndefined();
      expect(result.meta.type).toBe('students');
    });
  });
});
