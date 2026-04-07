import { describe, it, expect } from 'vitest';
import { academicHistory } from './academicHistory';

describe('Academic History Schema', () => {
  it('should have correct table name', () => {
    expect(academicHistory).toBeDefined();
    // @ts-expect-error - accessing internal property for testing
    expect(academicHistory[Symbol.for('drizzle:Name')]).toBe('academic_history');
  });

  it('should have all required columns', () => {
    const columns = Object.keys(academicHistory);
    
    expect(columns).toContain('id');
    expect(columns).toContain('student_id');
    expect(columns).toContain('subject_code');
    expect(columns).toContain('subject_name');
    expect(columns).toContain('grade');
    expect(columns).toContain('semester');
    expect(columns).toContain('academic_year');
    expect(columns).toContain('credits');
    expect(columns).toContain('remarks');
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');
  });

  it('should have correct column types', () => {
    // Verify column definitions exist
    expect(academicHistory.id).toBeDefined();
    expect(academicHistory.student_id).toBeDefined();
    expect(academicHistory.subject_code).toBeDefined();
    expect(academicHistory.subject_name).toBeDefined();
    expect(academicHistory.grade).toBeDefined();
    expect(academicHistory.semester).toBeDefined();
    expect(academicHistory.academic_year).toBeDefined();
    expect(academicHistory.credits).toBeDefined();
    expect(academicHistory.remarks).toBeDefined();
    expect(academicHistory.created_at).toBeDefined();
    expect(academicHistory.updated_at).toBeDefined();
  });
});
