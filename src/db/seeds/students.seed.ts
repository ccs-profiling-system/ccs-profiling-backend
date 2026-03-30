import { Database } from '../index';
import { students } from '../schema';

interface StudentSeed {
  studentId: string;
  firstName: string;
  lastName: string;
}

const studentSeeds: StudentSeed[] = [
  {
    studentId: '2021-00001',
    firstName: 'Alice',
    lastName: 'Williams',
  },
  {
    studentId: '2021-00002',
    firstName: 'Bob',
    lastName: 'Brown',
  },
  {
    studentId: '2022-00001',
    firstName: 'Charlie',
    lastName: 'Davis',
  },
  {
    studentId: '2022-00002',
    firstName: 'Diana',
    lastName: 'Miller',
  },
  {
    studentId: '2023-00001',
    firstName: 'Edward',
    lastName: 'Wilson',
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
        userId,
        studentId: studentSeed.studentId,
        firstName: studentSeed.firstName,
        lastName: studentSeed.lastName,
      })
      .returning({ id: students.id });

    createdStudents.push(student.id);
    console.log(`  - Created student: ${studentSeed.firstName} ${studentSeed.lastName} (${studentSeed.studentId})`);
  }

  return createdStudents;
}
