/**
 * Affiliations Module Tests
 * Integration tests for affiliation operations
 * 
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import { affiliations, students, users } from '../../db/schema';
import { AffiliationRepository } from './repositories/affiliation.repository';
import { AffiliationService } from './services/affiliation.service';
import { StudentRepository } from '../students/repositories/student.repository';
import { generateUUIDv7 } from '../../shared/utils/uuid';
import { eq } from 'drizzle-orm';

describe('Affiliations Module', () => {
  const affiliationRepository = new AffiliationRepository(db);
  const studentRepository = new StudentRepository(db);
  const affiliationService = new AffiliationService(affiliationRepository, studentRepository);

  let testStudentId: string;

  beforeEach(async () => {
    // Clean up test data
    await db.delete(affiliations);
    await db.delete(students);
    await db.delete(users);

    // Create test student
    const userId = generateUUIDv7();
    await db.insert(users).values({
      id: userId,
      email: 'test.student@example.com',
      password_hash: 'hashed_password',
      role: 'student',
    });

    const studentId = generateUUIDv7();
    await db.insert(students).values({
      id: studentId,
      student_id: 'S-2024-0001',
      user_id: userId,
      first_name: 'Test',
      last_name: 'Student',
      email: 'test.student@example.com',
    });

    testStudentId = studentId;
  });

  describe('Affiliation Creation', () => {
    it('should create an affiliation successfully', async () => {
      const affiliationData = {
        student_id: testStudentId,
        organization_name: 'Computer Science Society',
        role: 'President',
        start_date: '2024-01-01',
      };

      const result = await affiliationService.createAffiliation(affiliationData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.student_id).toBe(testStudentId);
      expect(result.organization_name).toBe('Computer Science Society');
      expect(result.role).toBe('President');
      expect(result.start_date).toBe('2024-01-01');
      expect(result.is_active).toBe(true);
      expect(result.end_date).toBeUndefined();
    });

    it('should create an affiliation with end_date', async () => {
      const affiliationData = {
        student_id: testStudentId,
        organization_name: 'Debate Club',
        role: 'Member',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
      };

      const result = await affiliationService.createAffiliation(affiliationData);

      expect(result.end_date).toBe('2023-12-31');
    });

    it('should throw error when student does not exist', async () => {
      const affiliationData = {
        student_id: generateUUIDv7(),
        organization_name: 'Test Org',
        start_date: '2024-01-01',
      };

      await expect(affiliationService.createAffiliation(affiliationData)).rejects.toThrow('Student not found');
    });
  });

  describe('Affiliation Retrieval', () => {
    it('should get affiliation by ID', async () => {
      const created = await affiliationService.createAffiliation({
        student_id: testStudentId,
        organization_name: 'Chess Club',
        start_date: '2024-01-01',
      });

      const result = await affiliationService.getAffiliation(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.organization_name).toBe('Chess Club');
    });

    it('should get affiliations by student ID', async () => {
      await affiliationService.createAffiliation({
        student_id: testStudentId,
        organization_name: 'Math Club',
        start_date: '2024-01-01',
      });

      await affiliationService.createAffiliation({
        student_id: testStudentId,
        organization_name: 'Science Club',
        start_date: '2024-02-01',
      });

      const results = await affiliationService.getAffiliationsByStudent(testStudentId);

      expect(results).toHaveLength(2);
      expect(results[0].organization_name).toBe('Math Club');
      expect(results[1].organization_name).toBe('Science Club');
    });

    it('should list affiliations with pagination', async () => {
      await affiliationService.createAffiliation({
        student_id: testStudentId,
        organization_name: 'Club 1',
        start_date: '2024-01-01',
      });

      await affiliationService.createAffiliation({
        student_id: testStudentId,
        organization_name: 'Club 2',
        start_date: '2024-02-01',
      });

      const result = await affiliationService.listAffiliations({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('Affiliation Update', () => {
    it('should update affiliation successfully', async () => {
      const created = await affiliationService.createAffiliation({
        student_id: testStudentId,
        organization_name: 'Original Club',
        role: 'Member',
        start_date: '2024-01-01',
      });

      const updated = await affiliationService.updateAffiliation(created.id, {
        role: 'Vice President',
      });

      expect(updated.role).toBe('Vice President');
      expect(updated.organization_name).toBe('Original Club');
    });

    it('should throw error when updating non-existent affiliation', async () => {
      await expect(
        affiliationService.updateAffiliation(generateUUIDv7(), { role: 'President' })
      ).rejects.toThrow('Affiliation record not found');
    });
  });

  describe('Affiliation Deletion', () => {
    it('should delete affiliation', async () => {
      const created = await affiliationService.createAffiliation({
        student_id: testStudentId,
        organization_name: 'Temporary Club',
        start_date: '2024-01-01',
      });

      await affiliationService.deleteAffiliation(created.id);

      await expect(affiliationService.getAffiliation(created.id)).rejects.toThrow('Affiliation record not found');
    });
  });

  describe('End Affiliation', () => {
    it('should end affiliation by setting end_date and is_active=false', async () => {
      const created = await affiliationService.createAffiliation({
        student_id: testStudentId,
        organization_name: 'Active Club',
        start_date: '2024-01-01',
      });

      expect(created.is_active).toBe(true);
      expect(created.end_date).toBeUndefined();

      const ended = await affiliationService.endAffiliation(created.id, '2024-12-31');

      expect(ended.end_date).toBe('2024-12-31');
      expect(ended.is_active).toBe(false);
    });

    it('should throw error when ending non-existent affiliation', async () => {
      await expect(
        affiliationService.endAffiliation(generateUUIDv7(), '2024-12-31')
      ).rejects.toThrow('Affiliation record not found');
    });
  });

  describe('Batch Query Prevention (N+1)', () => {
    it('should fetch affiliations for multiple students efficiently', async () => {
      // Create second student
      const userId2 = generateUUIDv7();
      await db.insert(users).values({
        id: userId2,
        email: 'test.student2@example.com',
        password_hash: 'hashed_password',
        role: 'student',
      });

      const studentId2 = generateUUIDv7();
      await db.insert(students).values({
        id: studentId2,
        student_id: 'S-2024-0002',
        user_id: userId2,
        first_name: 'Test2',
        last_name: 'Student2',
        email: 'test.student2@example.com',
      });

      // Create affiliations for both students
      await affiliationService.createAffiliation({
        student_id: testStudentId,
        organization_name: 'Club A',
        start_date: '2024-01-01',
      });

      await affiliationService.createAffiliation({
        student_id: studentId2,
        organization_name: 'Club B',
        start_date: '2024-01-01',
      });

      // Use batch query
      const results = await affiliationRepository.findByStudentIds([testStudentId, studentId2]);

      expect(results).toHaveLength(2);
      expect(results.some(a => a.organization_name === 'Club A')).toBe(true);
      expect(results.some(a => a.organization_name === 'Club B')).toBe(true);
    });
  });
});
