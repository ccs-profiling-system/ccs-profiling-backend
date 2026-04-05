/**
 * Research Module Tests
 * Integration tests for research operations
 * 
 * Requirements: 12.1, 12.6, 12.7, 26.6, 26.7
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import { research, researchAuthors, researchAdvisers, students, faculty, users } from '../../db/schema';
import { ResearchRepository } from './repositories/research.repository';
import { ResearchService } from './services/research.service';
import { generateUUIDv7 } from '../../shared/utils/uuid';

describe('Research Module', () => {
  const researchRepository = new ResearchRepository(db);
  const researchService = new ResearchService(researchRepository);

  let testStudentId: string;
  let testFacultyId: string;

  beforeEach(async () => {
    // Clean up test data
    await db.delete(researchAuthors);
    await db.delete(researchAdvisers);
    await db.delete(research);
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

  describe('Research Creation', () => {
    it('should create research with authors and advisers in transaction', async () => {
      const researchData = {
        title: 'Machine Learning in Healthcare',
        abstract: 'A comprehensive study on ML applications',
        research_type: 'thesis' as const,
        status: 'ongoing' as const,
        start_date: '2024-01-01',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      };

      const result = await researchService.createResearch(researchData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe('Machine Learning in Healthcare');
      expect(result.research_type).toBe('thesis');
      expect(result.status).toBe('ongoing');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].student_id).toBe('S-2024-0001');
      expect(result.advisers).toHaveLength(1);
      expect(result.advisers[0].faculty_id).toBe('F-2024-0001');
    });

    it('should create research without optional fields', async () => {
      const researchData = {
        title: 'Simple Research',
        research_type: 'capstone' as const,
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      };

      const result = await researchService.createResearch(researchData);

      expect(result.title).toBe('Simple Research');
      expect(result.abstract).toBeUndefined();
      expect(result.status).toBe('ongoing');
      expect(result.start_date).toBeUndefined();
    });
  });

  describe('Research Retrieval', () => {
    it('should get research by ID with authors and advisers', async () => {
      const created = await researchService.createResearch({
        title: 'Test Research',
        research_type: 'publication',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      const result = await researchService.getResearch(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.title).toBe('Test Research');
      expect(result.authors).toHaveLength(1);
      expect(result.advisers).toHaveLength(1);
    });

    it('should list research with pagination', async () => {
      await researchService.createResearch({
        title: 'Research 1',
        research_type: 'thesis',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      await researchService.createResearch({
        title: 'Research 2',
        research_type: 'capstone',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      const result = await researchService.listResearch({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should filter research by type', async () => {
      await researchService.createResearch({
        title: 'Thesis Research',
        research_type: 'thesis',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      await researchService.createResearch({
        title: 'Capstone Research',
        research_type: 'capstone',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      const result = await researchService.listResearch({ research_type: 'thesis' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Thesis Research');
    });

    it('should filter research by status', async () => {
      await researchService.createResearch({
        title: 'Ongoing Research',
        research_type: 'thesis',
        status: 'ongoing',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      await researchService.createResearch({
        title: 'Completed Research',
        research_type: 'thesis',
        status: 'completed',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      const result = await researchService.listResearch({ status: 'completed' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Completed Research');
    });
  });

  describe('Research Update', () => {
    it('should update research successfully', async () => {
      const created = await researchService.createResearch({
        title: 'Original Title',
        research_type: 'thesis',
        status: 'ongoing',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      const updated = await researchService.updateResearch(created.id, {
        title: 'Updated Title',
        status: 'completed',
        completion_date: '2024-12-31',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.status).toBe('completed');
      expect(updated.completion_date).toBe('2024-12-31');
      expect(updated.research_type).toBe('thesis');
    });

    it('should throw error when updating non-existent research', async () => {
      await expect(
        researchService.updateResearch(generateUUIDv7(), { title: 'Test' })
      ).rejects.toThrow('Research not found');
    });
  });

  describe('Research Deletion', () => {
    it('should soft delete research', async () => {
      const created = await researchService.createResearch({
        title: 'Temporary Research',
        research_type: 'capstone',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      await researchService.deleteResearch(created.id);

      await expect(researchService.getResearch(created.id)).rejects.toThrow('Research not found');
    });
  });

  describe('Research Authors', () => {
    it('should add author to research', async () => {
      const researchRecord = await researchService.createResearch({
        title: 'Test Research',
        research_type: 'thesis',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
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

      await researchService.addAuthor(researchRecord.id, {
        student_id: studentId2,
        author_order: 2,
      });

      const updated = await researchService.getResearch(researchRecord.id);
      expect(updated.authors).toHaveLength(2);
    });

    it('should prevent duplicate author', async () => {
      const researchRecord = await researchService.createResearch({
        title: 'Test Research',
        research_type: 'thesis',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      await expect(
        researchService.addAuthor(researchRecord.id, {
          student_id: testStudentId,
          author_order: 2,
        })
      ).rejects.toThrow('Author is already linked to this research');
    });

    it('should remove author from research', async () => {
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

      const researchRecord = await researchService.createResearch({
        title: 'Test Research',
        research_type: 'thesis',
        author_ids: [testStudentId, studentId2],
        adviser_ids: [testFacultyId],
      });

      await researchService.removeAuthor(researchRecord.id, studentId2);

      const updated = await researchService.getResearch(researchRecord.id);
      expect(updated.authors).toHaveLength(1);
      expect(updated.authors[0].student_id).toBe('S-2024-0001');
    });
  });

  describe('Research Advisers', () => {
    it('should add adviser to research', async () => {
      const researchRecord = await researchService.createResearch({
        title: 'Test Research',
        research_type: 'thesis',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      // Create another faculty
      const userId2 = generateUUIDv7();
      await db.insert(users).values({
        id: userId2,
        email: 'faculty2@example.com',
        password_hash: 'hashed_password',
        role: 'faculty',
      });

      const facultyId2 = generateUUIDv7();
      await db.insert(faculty).values({
        id: facultyId2,
        faculty_id: 'F-2024-0002',
        user_id: userId2,
        first_name: 'Faculty',
        last_name: 'Two',
        email: 'faculty2@example.com',
        department: 'Computer Science',
      });

      await researchService.addAdviser(researchRecord.id, {
        faculty_id: facultyId2,
        adviser_role: 'co-adviser',
      });

      const updated = await researchService.getResearch(researchRecord.id);
      expect(updated.advisers).toHaveLength(2);
    });

    it('should prevent duplicate adviser', async () => {
      const researchRecord = await researchService.createResearch({
        title: 'Test Research',
        research_type: 'thesis',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      await expect(
        researchService.addAdviser(researchRecord.id, {
          faculty_id: testFacultyId,
          adviser_role: 'co-adviser',
        })
      ).rejects.toThrow('Adviser is already linked to this research');
    });

    it('should remove adviser from research', async () => {
      // Create another faculty
      const userId2 = generateUUIDv7();
      await db.insert(users).values({
        id: userId2,
        email: 'faculty2@example.com',
        password_hash: 'hashed_password',
        role: 'faculty',
      });

      const facultyId2 = generateUUIDv7();
      await db.insert(faculty).values({
        id: facultyId2,
        faculty_id: 'F-2024-0002',
        user_id: userId2,
        first_name: 'Faculty',
        last_name: 'Two',
        email: 'faculty2@example.com',
        department: 'Computer Science',
      });

      const researchRecord = await researchService.createResearch({
        title: 'Test Research',
        research_type: 'thesis',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId, facultyId2],
      });

      await researchService.removeAdviser(researchRecord.id, facultyId2);

      const updated = await researchService.getResearch(researchRecord.id);
      expect(updated.advisers).toHaveLength(1);
      expect(updated.advisers[0].faculty_id).toBe('F-2024-0001');
    });
  });

  describe('Batch Query Optimization', () => {
    it('should efficiently fetch authors and advisers for multiple research', async () => {
      await researchService.createResearch({
        title: 'Research 1',
        research_type: 'thesis',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      await researchService.createResearch({
        title: 'Research 2',
        research_type: 'capstone',
        author_ids: [testStudentId],
        adviser_ids: [testFacultyId],
      });

      const result = await researchService.listResearch({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].authors).toHaveLength(1);
      expect(result.data[0].advisers).toHaveLength(1);
      expect(result.data[1].authors).toHaveLength(1);
      expect(result.data[1].advisers).toHaveLength(1);
    });
  });
});
