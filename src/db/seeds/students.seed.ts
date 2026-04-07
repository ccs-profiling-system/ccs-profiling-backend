import { Database } from '../index';
import { students } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';
import { IDGenerator } from '../../shared/utils/idGenerator';
import { EntityCounterRepository } from '../repositories/entityCounter.repository';

interface StudentSeed {
  firstName: string;
  lastName: string;
  email: string;
  program?: string;
  yearLevel?: number;
}

const studentSeeds: StudentSeed[] = [
  {
    firstName: 'Alice',
    lastName: 'Williams',
    email: 'alice.williams@example.com',
    program: 'BS Computer Science',
    yearLevel: 4,
  },
  {
    firstName: 'Bob',
    lastName: 'Brown',
    email: 'bob.brown@example.com',
    program: 'BS Computer Science',
    yearLevel: 3,
  },
  {
    firstName: 'Charlie',
    lastName: 'Davis',
    email: 'charlie.davis@example.com',
    program: 'BS Information Technology',
    yearLevel: 2,
  },
  {
    firstName: 'Diana',
    lastName: 'Miller',
    email: 'diana.miller@example.com',
    program: 'BS Information Technology',
    yearLevel: 1,
  },
  {
    firstName: 'Edward',
    lastName: 'Wilson',
    email: 'edward.wilson@example.com',
    program: 'BS Computer Science',
    yearLevel: 4,
  },
];

export async function seedStudents(
  db: Database,
  userIds: Array<{ id: string; role: string }>
) {
  const createdStudents: string[] = [];
  const entityCounterRepo = new EntityCounterRepository(db);
  const currentYear = IDGenerator.getCurrentYear();

  // Use transaction to ensure ID generation is atomic
  await db.transaction(async (tx) => {
    // Ensure counter exists for current year
    await entityCounterRepo.getOrCreateCounter('student', currentYear, tx);

    for (let i = 0; i < studentSeeds.length && i < userIds.length; i++) {
      const studentSeed = studentSeeds[i];
      const userId = userIds[i].id;

      // Generate UUID v7 for primary key
      const id = generateUUIDv7();

      // Generate human-readable student_id
      const sequence = await entityCounterRepo.incrementCounter('student', currentYear, tx);
      const studentId = IDGenerator.generate('student', sequence, currentYear);

      const [student] = await tx
        .insert(students)
        .values({
          id,
          user_id: userId,
          student_id: studentId,
          first_name: studentSeed.firstName,
          last_name: studentSeed.lastName,
          email: studentSeed.email,
          program: studentSeed.program,
          year_level: studentSeed.yearLevel,
        })
        .returning({ id: students.id, student_id: students.student_id });

      createdStudents.push(student.id);
      console.log(`  - Created student: ${studentSeed.firstName} ${studentSeed.lastName} (${student.student_id})`);
    }
  });

  return createdStudents;
}
