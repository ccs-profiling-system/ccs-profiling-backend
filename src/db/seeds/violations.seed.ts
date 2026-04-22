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

const violationTypes = [
  'Late Submission',
  'Academic Dishonesty',
  'Attendance Violation',
  'Disruptive Behavior',
  'Plagiarism',
  'Unauthorized Collaboration',
  'Dress Code Violation',
  'Laboratory Safety Violation',
];

const resolutionStatuses: Array<'pending' | 'resolved' | 'dismissed'> = ['pending', 'resolved', 'dismissed'];

export async function seedViolations(
  db: Database,
  studentIds: string[]
) {
  console.log('  Creating violation records...');

  const violationsToInsert = [];

  for (const studentId of studentIds) {
    // 20% of students have 1-2 violations, 80% have none
    if (Math.random() < 0.2) {
      const violationCount = Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < violationCount; i++) {
        const id = generateUUIDv7();
        const violationType = violationTypes[Math.floor(Math.random() * violationTypes.length)];
        const resolutionStatus = resolutionStatuses[Math.floor(Math.random() * resolutionStatuses.length)];
        const daysAgo = Math.floor(Math.random() * 180) + 1; // 1-180 days ago
        const violationDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        const resolvedAt = resolutionStatus === 'resolved' 
          ? new Date(violationDate.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
          : null;

        const resolutionNotes = resolutionStatus === 'resolved'
          ? 'Student completed required actions and violation was resolved.'
          : resolutionStatus === 'dismissed'
          ? 'Violation was dismissed after review.'
          : null;

        violationsToInsert.push({
          id,
          student_id: studentId,
          violation_type: violationType,
          description: `${violationType} incident recorded on ${violationDate.toISOString().split('T')[0]}`,
          violation_date: violationDate.toISOString().split('T')[0],
          resolution_status: resolutionStatus,
          resolution_notes: resolutionNotes,
          resolved_at: resolvedAt,
        });
      }
    }
  }

  // Batch insert in chunks of 500
  const chunkSize = 500;
  const createdRecords: string[] = [];
  
  for (let i = 0; i < violationsToInsert.length; i += chunkSize) {
    const chunk = violationsToInsert.slice(i, i + chunkSize);
    const inserted = await db.insert(violations).values(chunk).returning({ id: violations.id });
    createdRecords.push(...inserted.map(v => v.id));
    console.log(`  - Inserted ${inserted.length} violations (${i + inserted.length}/${violationsToInsert.length})`);
  }

  console.log(`  ✅ Created ${createdRecords.length} violation records for ${studentIds.length} students`);

  return createdRecords;
}
