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

const firstNames = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah',
  'Ian', 'Julia', 'Kevin', 'Laura', 'Michael', 'Nina', 'Oscar', 'Patricia',
  'Quinn', 'Rachel', 'Samuel', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier',
  'Yara', 'Zachary', 'Amber', 'Brian', 'Chloe', 'Daniel', 'Emma', 'Frank',
  'Grace', 'Henry', 'Iris', 'Jack', 'Karen', 'Leo', 'Mia', 'Nathan',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
];

const programs = [
  'BS Computer Science',
  'BS Information Technology',
  'BS Information Systems',
  'BS Computer Engineering',
];

function generateStudentSeeds(count: number): StudentSeed[] {
  const seeds: StudentSeed[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const program = programs[Math.floor(Math.random() * programs.length)];
    const yearLevel = Math.floor(Math.random() * 4) + 1;
    
    seeds.push({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      program,
      yearLevel,
    });
  }
  return seeds;
}

const studentSeeds: StudentSeed[] = generateStudentSeeds(1000);

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
