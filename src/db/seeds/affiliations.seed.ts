import { Database } from '../index';
import { affiliations } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface AffiliationSeed {
  studentIndex: number;
  organizationName: string;
  role?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

/**
 * Affiliations seeds for students
 * 
 * Student distribution:
 * - Student 0 (Alice): 3 affiliations (2 active, 1 ended)
 * - Student 1 (Bob): 2 affiliations (1 active, 1 ended)
 * - Student 2 (Charlie): 1 active affiliation
 * - Student 3 (Diana): 2 active affiliations
 * - Student 4 (Edward): 2 affiliations (1 active, 1 ended)
 */
const affiliationSeeds: AffiliationSeed[] = [
  // Alice (Student 0) - Year 4 Student
  {
    studentIndex: 0,
    organizationName: 'Computer Science Society',
    role: 'President',
    startDate: '2025-08-01',
    isActive: true,
  },
  {
    studentIndex: 0,
    organizationName: 'ACM Student Chapter',
    role: 'Vice President',
    startDate: '2024-08-01',
    isActive: true,
  },
  {
    studentIndex: 0,
    organizationName: 'Debate Club',
    role: 'Member',
    startDate: '2023-08-01',
    endDate: '2024-05-31',
    isActive: false,
  },

  // Bob (Student 1) - Year 3 Student
  {
    studentIndex: 1,
    organizationName: 'Programming Club',
    role: 'Secretary',
    startDate: '2024-08-01',
    isActive: true,
  },
  {
    studentIndex: 1,
    organizationName: 'Chess Club',
    role: 'Member',
    startDate: '2023-08-01',
    endDate: '2024-05-31',
    isActive: false,
  },

  // Charlie (Student 2) - Year 2 Student
  {
    studentIndex: 2,
    organizationName: 'Robotics Club',
    role: 'Member',
    startDate: '2025-08-01',
    isActive: true,
  },

  // Diana (Student 3) - Year 1 Student
  {
    studentIndex: 3,
    organizationName: 'Computer Science Society',
    role: 'Member',
    startDate: '2025-08-01',
    isActive: true,
  },
  {
    studentIndex: 3,
    organizationName: 'Women in Tech',
    role: 'Member',
    startDate: '2025-08-01',
    isActive: true,
  },

  // Edward (Student 4) - Year 4 Student
  {
    studentIndex: 4,
    organizationName: 'Game Development Club',
    role: 'Lead Developer',
    startDate: '2024-08-01',
    isActive: true,
  },
  {
    studentIndex: 4,
    organizationName: 'Math Club',
    role: 'Member',
    startDate: '2023-08-01',
    endDate: '2024-05-31',
    isActive: false,
  },
];

export async function seedAffiliations(
  db: Database,
  studentIds: string[]
) {
  const createdRecords: string[] = [];

  console.log('  Creating affiliation records...');

  for (const seed of affiliationSeeds) {
    if (seed.studentIndex >= studentIds.length) {
      console.warn(`  ⚠️  Skipping affiliation: student index ${seed.studentIndex} out of range`);
      continue;
    }

    const studentId = studentIds[seed.studentIndex];
    const id = generateUUIDv7();

    try {
      const [record] = await db
        .insert(affiliations)
        .values({
          id,
          student_id: studentId,
          organization_name: seed.organizationName,
          role: seed.role,
          start_date: seed.startDate,
          end_date: seed.endDate,
          is_active: seed.isActive,
        })
        .returning({ id: affiliations.id });

      createdRecords.push(record.id);
      console.log(
        `  - Created: Student ${seed.studentIndex} → ${seed.organizationName} ` +
        `(${seed.role || 'Member'}, ${seed.isActive ? 'Active' : 'Ended'})`
      );
    } catch (error: any) {
      console.error(
        `  ❌ Error creating affiliation for Student ${seed.studentIndex} → ${seed.organizationName}:`,
        error.message
      );
      throw error;
    }
  }

  return createdRecords;
}
