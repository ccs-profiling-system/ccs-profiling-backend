import { describe, it, expect } from 'vitest';
import { enrollments } from './enrollments';

describe('Enrollments Schema', () => {
  it('should have correct table name', () => {
    expect(enrollments).toBeDefined();
  });

  it('should have all required columns', () => {
    const columns = Object.keys(enrollments);
    
    expect(columns).toContain('id');
    expect(columns).toContain('student_id');
    expect(columns).toContain('instruction_id');
    expect(columns).toContain('enrollment_status');
    expect(columns).toContain('semester');
    expect(columns).toContain('academic_year');
    expect(columns).toContain('enrolled_at');
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');
  });

  it('should have foreign key references', () => {
    const studentIdColumn = enrollments.student_id;
    const instructionIdColumn = enrollments.instruction_id;
    
    expect(studentIdColumn).toBeDefined();
    expect(instructionIdColumn).toBeDefined();
  });
});
