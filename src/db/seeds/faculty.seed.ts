import { Database } from '../index';
import { faculty } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';
import { IDGenerator } from '../../shared/utils/idGenerator';
import { EntityCounterRepository } from '../repositories/entityCounter.repository';

interface FacultySeed {
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  position?: string;
  specialization?: string;
}

const facultySeeds: FacultySeed[] = [
  {
    email: 'john.doe@ccs.edu',
    firstName: 'John',
    lastName: 'Doe',
    department: 'Computer Science',
    position: 'Professor',
    specialization: 'Artificial Intelligence',
  },
  {
    email: 'jane.smith@ccs.edu',
    firstName: 'Jane',
    lastName: 'Smith',
    department: 'Information Technology',
    position: 'Associate Professor',
    specialization: 'Network Security',
  },
  {
    email: 'robert.johnson@ccs.edu',
    firstName: 'Robert',
    lastName: 'Johnson',
    department: 'Computer Science',
    position: 'Assistant Professor',
    specialization: 'Software Engineering',
  },
  {
    email: 'chair.cs@ccs.edu',
    firstName: 'Maria',
    lastName: 'Garcia',
    department: 'Computer Science',
    position: 'Department Chair',
    specialization: 'Computer Science Education',
  },
];

export async function seedFaculty(
  db: Database,
  userIds: Array<{ id: string; role: string; email: string }>
) {
  const createdFaculty: string[] = [];
  const entityCounterRepo = new EntityCounterRepository(db);
  const currentYear = IDGenerator.getCurrentYear();
  const facultySeedsByEmail = new Map(
    facultySeeds.map((seed) => [seed.email, seed])
  );

  // Use transaction to ensure ID generation is atomic
  await db.transaction(async (tx) => {
    // Ensure counter exists for current year
    await entityCounterRepo.getOrCreateCounter('faculty', currentYear, tx);

    const existingFaculty = await tx
      .select({ user_id: faculty.user_id })
      .from(faculty);

    const existingUserIds = new Set(
      existingFaculty
        .map((row) => row.user_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    );

    for (const user of userIds) {
      const facultySeed = facultySeedsByEmail.get(user.email);
      if (!facultySeed || existingUserIds.has(user.id)) {
        continue;
      }

      // Generate UUID v7 for primary key
      const id = generateUUIDv7();

      // Generate human-readable faculty_id
      const sequence = await entityCounterRepo.incrementCounter('faculty', currentYear, tx);
      const facultyId = IDGenerator.generate('faculty', sequence, currentYear);

      const [facultyMember] = await tx
        .insert(faculty)
        .values({
          id,
          user_id: user.id,
          faculty_id: facultyId,
          first_name: facultySeed.firstName,
          last_name: facultySeed.lastName,
          email: facultySeed.email,
          department: facultySeed.department,
          position: facultySeed.position,
          specialization: facultySeed.specialization,
        })
        .returning({ id: faculty.id, faculty_id: faculty.faculty_id });

      createdFaculty.push(facultyMember.id);
      existingUserIds.add(user.id);
      console.log(`  - Created faculty: ${facultySeed.firstName} ${facultySeed.lastName} (${facultyMember.faculty_id})`);
    }
  });

  return createdFaculty;
}
