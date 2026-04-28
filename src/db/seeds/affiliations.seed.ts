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

const organizationTemplates = [
  'Computer Science Society',
  'ACM Student Chapter',
  'Programming Club',
  'Robotics Club',
  'Game Development Club',
  'Women in Tech',
  'Debate Club',
  'Chess Club',
  'Math Club',
  'Cybersecurity Club',
  'AI Research Group',
  'Mobile App Developers',
];

const roles = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Member', 'Lead Developer', 'Project Manager'];

export async function seedAffiliations(
  db: Database,
  studentIds: string[]
) {
  console.log('  Creating affiliation records...');

  const affiliationsToInsert = [];

  for (const studentId of studentIds) {
    // 60% of students have 1-3 affiliations, 40% have none
    if (Math.random() < 0.6) {
      const affiliationCount = Math.floor(Math.random() * 3) + 1;
      const selectedOrgs = [...organizationTemplates]
        .sort(() => Math.random() - 0.5)
        .slice(0, affiliationCount);

      for (const org of selectedOrgs) {
        const id = generateUUIDv7();
        const role = roles[Math.floor(Math.random() * roles.length)];
        const isActive = Math.random() > 0.3; // 70% active
        const startYear = 2023 + Math.floor(Math.random() * 3);
        const startDate = `${startYear}-08-01`;
        const endDate = isActive ? undefined : `${startYear + 1}-05-31`;

        affiliationsToInsert.push({
          id,
          student_id: studentId,
          organization_name: org,
          role,
          start_date: startDate,
          end_date: endDate,
          is_active: isActive,
        });
      }
    }
  }

  // Batch insert in chunks of 500
  const chunkSize = 500;
  const createdRecords: string[] = [];
  
  for (let i = 0; i < affiliationsToInsert.length; i += chunkSize) {
    const chunk = affiliationsToInsert.slice(i, i + chunkSize);
    const inserted = await db.insert(affiliations).values(chunk).returning({ id: affiliations.id });
    createdRecords.push(...inserted.map(a => a.id));
    console.log(`  - Inserted ${inserted.length} affiliations (${i + inserted.length}/${affiliationsToInsert.length})`);
  }

  console.log(`  ✅ Created ${createdRecords.length} affiliation records for ${studentIds.length} students`);

  return createdRecords;
}
