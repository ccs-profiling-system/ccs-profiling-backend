import { Database } from '../index';
import { students } from '../schema';

interface StudentSeed {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
}

const studentSeeds: StudentSeed[] = [
  {
    studentId: '2021-00001',
    firstName: 'Alice',
    lastName: 'Williams',
    email: 'alice.williams@example.com',
  },
  {
    studentId: '2021-00002',
    firstName: 'Bob',
    lastName: 'Brown',
    email: 'bob.brown@example.com',
  },
  {
    studentId: '2022-00001',
    firstName: 'Charlie',
    lastName: 'Davis',
    email: 'charlie.davis@example.com',
  },
  {
    studentId: '2022-00002',
    firstName: 'Diana',
    lastName: 'Miller',
    email: 'diana.miller@example.com',
  },
  {
    studentId: '2023-00001',
    firstName: 'Edward',
    lastName: 'Wilson',
    email: 'edward.wilson@example.com',
  },
];

export async function seedStudents(
  db: Database,
  userIds: Array<{ id: string; role: string }>
) {
  const createdStudents: string[] = [];

  for (let i = 0; i < studentSeeds.length && i < userIds.length; i++) {
    const studentSeed = studentSeeds[i];
    const userId = userIds[i].id;

    const [student] = await db
      .insert(students)
      .values({
        user_id: userId,
        student_id: studentSeed.studentId,
        first_name: studentSeed.firstName,
        last_name: studentSeed.lastName,
        email: studentSeed.email,
      })
      .returning({ id: students.id });

    createdStudents.push(student.id);
    console.log(`  - Created student: ${studentSeed.firstName} ${studentSeed.lastName} (${studentSeed.studentId})`);
  }

  return createdStudents;
}
