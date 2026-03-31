import { Database } from '../index';
import { faculty } from '../schema';

interface FacultySeed {
  facultyId: string;
  firstName: string;
  lastName: string;
  department: string;
}

const facultySeeds: FacultySeed[] = [
  {
    facultyId: 'FAC-001',
    firstName: 'John',
    lastName: 'Doe',
    department: 'Computer Science',
  },
  {
    facultyId: 'FAC-002',
    firstName: 'Jane',
    lastName: 'Smith',
    department: 'Information Technology',
  },
  {
    facultyId: 'FAC-003',
    firstName: 'Robert',
    lastName: 'Johnson',
    department: 'Computer Science',
  },
];

export async function seedFaculty(
  db: Database,
  userIds: Array<{ id: string; role: string }>
) {
  const createdFaculty: string[] = [];

  for (let i = 0; i < facultySeeds.length && i < userIds.length; i++) {
    const facultySeed = facultySeeds[i];
    const userId = userIds[i].id;

    const [facultyMember] = await db
      .insert(faculty)
      .values({
        user_id: userId,
        faculty_id: facultySeed.facultyId,
        first_name: facultySeed.firstName,
        last_name: facultySeed.lastName,
        email: `${facultySeed.firstName.toLowerCase()}.${facultySeed.lastName.toLowerCase()}@ccs.edu`,
        department: facultySeed.department,
      })
      .returning({ id: faculty.id });

    createdFaculty.push(facultyMember.id);
    console.log(`  - Created faculty: ${facultySeed.firstName} ${facultySeed.lastName} (${facultySeed.department})`);
  }

  return createdFaculty;
}
