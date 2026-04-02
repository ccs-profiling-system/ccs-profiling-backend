import { Database } from '../index';
import { violations } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface ViolationSeed {
  studentIndex: number;
  violationType: string;
  description: string;
  violationDate: string;
  resolutionStatus?: 'pending' | 'resolved' | 'dismissed';
  resolutionNotes?: string;
  resolvedAt?: Date;
}

/**
 * Violations seeds for students
 * 
 * Student distribution:
 * - Student 0 (Alice): No violations (clean record)
 * - Student 1 (Bob): 1 resolved violation
 * - Student 2 (Charlie): 2 violations (1 pending, 1 resolved)
 * - Student 3 (Diana): 1 pending violation
 * - Student 4 (Edward): No violations (clean record)
 */
const violationSeeds: ViolationSeed[] = [
  // Bob (Student 1) - 1 resolved violation
  {
    studentIndex: 1,
    violationType: 'Late Submission',
    description: 'Submitted final project 3 days after deadline without prior notice',
    violationDate: '2025-12-15',
    resolutionStatus: 'resolved',
    resolutionNotes: 'Student provided valid medical certificate. Grade penalty waived.',
    resolvedAt: new Date('2025-12-20'),
  },

  // Charlie (Student 2) - 2 violations
  {
    studentIndex: 2,
    violationType: 'Academic Dishonesty',
    description: 'Caught using unauthorized materials during midterm examination',
    violationDate: '2026-03-10',
    resolutionStatus: 'resolved',
    resolutionNotes: 'Student admitted fault, completed academic integrity workshop, and received zero on exam.',
    resolvedAt: new Date('2026-03-25'),
  },
  {
    studentIndex: 2,
    violationType: 'Attendance Violation',
    description: 'Exceeded maximum allowed absences in CS201 course (8 absences out of 6 allowed)',
    violationDate: '2026-04-01',
    resolutionStatus: 'pending',
  },

  // Diana (Student 3) - 1 pending violation
  {
    studentIndex: 3,
    violationType: 'Disruptive Behavior',
    description: 'Repeatedly disrupted class by using mobile phone and talking during lectures',
    violationDate: '2026-03-28',
    resolutionStatus: 'pending',
  },
];

export async function seedViolations(
  db: Database,
  studentIds: string[]
) {
  const createdRecords: string[] = [];

  console.log('  Creating violation records...');

  for (const seed of violationSeeds) {
    if (seed.studentIndex >= studentIds.length) {
      console.warn(`  ⚠️  Skipping violation: student index ${seed.studentIndex} out of range`);
      continue;
    }

    const studentId = studentIds[seed.studentIndex];
    const id = generateUUIDv7();

    try {
      const [record] = await db
        .insert(violations)
        .values({
          id,
          student_id: studentId,
          violation_type: seed.violationType,
          description: seed.description,
          violation_date: seed.violationDate,
          resolution_status: seed.resolutionStatus || 'pending',
          resolution_notes: seed.resolutionNotes,
          resolved_at: seed.resolvedAt,
        })
        .returning({ id: violations.id });

      createdRecords.push(record.id);
      console.log(
        `  - Created: Student ${seed.studentIndex} → ${seed.violationType} ` +
        `(${seed.resolutionStatus || 'pending'})`
      );
    } catch (error: any) {
      console.error(
        `  ❌ Error creating violation for Student ${seed.studentIndex} → ${seed.violationType}:`,
        error.message
      );
      throw error;
    }
  }

  return createdRecords;
}
