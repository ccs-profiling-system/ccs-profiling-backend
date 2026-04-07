import { describe, it, expect } from 'vitest';
import { research, researchAuthors, researchAdvisers } from './research';

/**
 * Research Schema Tests
 * 
 * Validates the research database schema structure.
 */
describe('Research Schema', () => {
  describe('research table', () => {
    it('should have research table defined', () => {
      expect(research).toBeDefined();
    });

    it('should have all required columns', () => {
      const columns = Object.keys(research);
      
      expect(columns).toContain('id');
      expect(columns).toContain('title');
      expect(columns).toContain('abstract');
      expect(columns).toContain('research_type');
      expect(columns).toContain('status');
      expect(columns).toContain('start_date');
      expect(columns).toContain('completion_date');
      expect(columns).toContain('publication_url');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
      expect(columns).toContain('deleted_at');
    });

    it('should have soft delete support', () => {
      expect(research.deleted_at).toBeDefined();
    });

    it('should have timestamps', () => {
      expect(research.created_at).toBeDefined();
      expect(research.updated_at).toBeDefined();
    });

    it('should have required fields defined', () => {
      expect(research.title).toBeDefined();
      expect(research.research_type).toBeDefined();
    });

    it('should have default status value', () => {
      expect(research.status.default).toBeDefined();
    });
  });

  describe('research_authors junction table', () => {
    it('should have research_authors table defined', () => {
      expect(researchAuthors).toBeDefined();
    });

    it('should have all required columns', () => {
      const columns = Object.keys(researchAuthors);
      
      expect(columns).toContain('id');
      expect(columns).toContain('research_id');
      expect(columns).toContain('student_id');
      expect(columns).toContain('author_order');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should have foreign key references', () => {
      expect(researchAuthors.research_id).toBeDefined();
      expect(researchAuthors.student_id).toBeDefined();
    });

    it('should have author_order field', () => {
      expect(researchAuthors.author_order).toBeDefined();
    });

    it('should have timestamps', () => {
      expect(researchAuthors.created_at).toBeDefined();
      expect(researchAuthors.updated_at).toBeDefined();
    });
  });

  describe('research_advisers junction table', () => {
    it('should have research_advisers table defined', () => {
      expect(researchAdvisers).toBeDefined();
    });

    it('should have all required columns', () => {
      const columns = Object.keys(researchAdvisers);
      
      expect(columns).toContain('id');
      expect(columns).toContain('research_id');
      expect(columns).toContain('faculty_id');
      expect(columns).toContain('adviser_role');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should have foreign key references', () => {
      expect(researchAdvisers.research_id).toBeDefined();
      expect(researchAdvisers.faculty_id).toBeDefined();
    });

    it('should have adviser_role field with default', () => {
      expect(researchAdvisers.adviser_role).toBeDefined();
      expect(researchAdvisers.adviser_role.default).toBeDefined();
    });

    it('should have timestamps', () => {
      expect(researchAdvisers.created_at).toBeDefined();
      expect(researchAdvisers.updated_at).toBeDefined();
    });
  });
});
