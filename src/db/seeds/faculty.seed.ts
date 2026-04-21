import { Database } from '../index';
import { faculty } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';
import { IDGenerator } from '../../shared/utils/idGenerator';
import { EntityCounterRepository } from '../repositories/entityCounter.repository';

interface FacultySeed {
  firstName: string;
  lastName: string;
  department: string;
  position?: string;
  specialization?: string;
}

const facultySeeds: FacultySeed[] = [
  {
    firstName: 'John',
    lastName: 'Doe',
    department: 'Computer Science',
    position: 'Professor',
    specialization: 'Artificial Intelligence',
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    department: 'Information Technology',
    position: 'Associate Professor',
    specialization: 'Network Security',
  },
  {
    firstName: 'Robert',
    lastName: 'Johnson',
    department: 'Computer Science',
    position: 'Assistant Professor',
    specialization: 'Software Engineering',
  },
];

export async function seedFaculty(
  db: Database,
  userIds: Array<{ id: string; role: string }>
) {
  const createdFaculty: string[] = [];
  const entityCounterRepo = new EntityCounterRepository(db);
  const currentYear = IDGenerator.getCurrentYear();

  // Use transaction to ensure ID generation is atomic
  await db.transaction(async (tx) => {
    // Ensure counter exists for current year
    await entityCounterRepo.getOrCreateCounter('faculty', currentYear, tx);

    for (let i = 0; i < facultySeeds.length && i < userIds.length; i++) {
      const facultySeed = facultySeeds[i];
      const userId = userIds[i].id;

      // Generate UUID v7 for primary key
      const id = generateUUIDv7();

      // Generate human-readable faculty_id
      const sequence = await entityCounterRepo.incrementCounter('faculty', currentYear, tx);
      const facultyId = IDGenerator.generate('faculty', sequence, currentYear);

      const [facultyMember] = await tx
        .insert(faculty)
        .values({
          id,
          user_id: userId,
          faculty_id: facultyId,
          first_name: facultySeed.firstName,
          last_name: facultySeed.lastName,
          email: `${facultySeed.firstName.toLowerCase()}.${facultySeed.lastName.toLowerCase()}@ccs.edu`,
          department: facultySeed.department,
          position: facultySeed.position,
          specialization: facultySeed.specialization,
        })
        .returning({ id: faculty.id, faculty_id: faculty.faculty_id });

      createdFaculty.push(facultyMember.id);
      console.log(`  - Created faculty: ${facultySeed.firstName} ${facultySeed.lastName} (${facultyMember.faculty_id})`);
    }
  });

  return createdFaculty;
}
