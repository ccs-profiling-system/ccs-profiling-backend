import { Database } from '../index';
import { academicHistory } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface AcademicHistorySeed {
  studentIndex: number; // Index in the students array
  subjectCode: string;
  subjectName: string;
  grade: number; // Numeric grade (1.0 - 5.0)
  semester: '1st' | '2nd' | 'summer';
  academicYear: string;
  credits: number;
  remarks?: string;
}

/**
 * Academic history seeds for students
 * 
 * Grade scale:
 * - 1.0: Excellent
 * - 1.25-1.75: Very Good
 * - 2.0-2.75: Good
 * - 3.0: Passing
 * - 5.0: Failed
 * 
 * Student distribution:
 * - Student 0 (Alice): Year 4 - Has 3 years of history
 * - Student 1 (Bob): Year 3 - Has 2 years of history
 * - Student 2 (Charlie): Year 2 - Has 1 year of history
 * - Student 3 (Diana): Year 1 - No history yet (just started)
 * - Student 4 (Edward): Year 4 - Has 3 years of history
 */
const academicHistorySeeds: AcademicHistorySeed[] = [
  // Alice (Student 0) - Year 4 Student
  // First Year (2022-2023)
  {
    studentIndex: 0,
    subjectCode: 'CS101',
    subjectName: 'Introduction to Programming',
    grade: 1.25,
    semester: '1st',
    academicYear: '2022-2023',
    credits: 3,
  },
  {
    studentIndex: 0,
    subjectCode: 'CS102',
    subjectName: 'Data Structures',
    grade: 1.5,
    semester: '1st',
    academicYear: '2022-2023',
    credits: 3,
  },
  {
    studentIndex: 0,
    subjectCode: 'MATH101',
    subjectName: 'Calculus I',
    grade: 1.75,
    semester: '1st',
    academicYear: '2022-2023',
    credits: 3,
  },
  {
    studentIndex: 0,
    subjectCode: 'ENG101',
    subjectName: 'Technical Writing',
    grade: 1.5,
    semester: '2nd',
    academicYear: '2022-2023',
    credits: 3,
  },

  // Second Year (2023-2024)
  {
    studentIndex: 0,
    subjectCode: 'CS201',
    subjectName: 'Object-Oriented Programming',
    grade: 1.0,
    semester: '1st',
    academicYear: '2023-2024',
    credits: 3,
  },
  {
    studentIndex: 0,
    subjectCode: 'CS202',
    subjectName: 'Database Systems',
    grade: 1.25,
    semester: '1st',
    academicYear: '2023-2024',
    credits: 3,
  },
  {
    studentIndex: 0,
    subjectCode: 'CS203',
    subjectName: 'Web Development',
    grade: 1.0,
    semester: '2nd',
    academicYear: '2023-2024',
    credits: 3,
  },
  {
    studentIndex: 0,
    subjectCode: 'MATH201',
    subjectName: 'Discrete Mathematics',
    grade: 1.5,
    semester: '2nd',
    academicYear: '2023-2024',
    credits: 3,
  },

  // Third Year (2024-2025)
  {
    studentIndex: 0,
    subjectCode: 'CS301',
    subjectName: 'Software Engineering',
    grade: 1.25,
    semester: '1st',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 0,
    subjectCode: 'CS302',
    subjectName: 'Computer Networks',
    grade: 1.5,
    semester: '1st',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 0,
    subjectCode: 'CS303',
    subjectName: 'Operating Systems',
    grade: 1.25,
    semester: '2nd',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 0,
    subjectCode: 'CS304',
    subjectName: 'Algorithm Design',
    grade: 1.0,
    semester: '2nd',
    academicYear: '2024-2025',
    credits: 3,
  },

  // Bob (Student 1) - Year 3 Student
  // First Year (2023-2024)
  {
    studentIndex: 1,
    subjectCode: 'CS101',
    subjectName: 'Introduction to Programming',
    grade: 1.5,
    semester: '1st',
    academicYear: '2023-2024',
    credits: 3,
  },
  {
    studentIndex: 1,
    subjectCode: 'CS102',
    subjectName: 'Data Structures',
    grade: 1.75,
    semester: '1st',
    academicYear: '2023-2024',
    credits: 3,
  },
  {
    studentIndex: 1,
    subjectCode: 'MATH101',
    subjectName: 'Calculus I',
    grade: 2.0,
    semester: '1st',
    academicYear: '2023-2024',
    credits: 3,
  },
  {
    studentIndex: 1,
    subjectCode: 'ENG101',
    subjectName: 'Technical Writing',
    grade: 1.75,
    semester: '2nd',
    academicYear: '2023-2024',
    credits: 3,
  },

  // Second Year (2024-2025)
  {
    studentIndex: 1,
    subjectCode: 'CS201',
    subjectName: 'Object-Oriented Programming',
    grade: 1.5,
    semester: '1st',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 1,
    subjectCode: 'CS202',
    subjectName: 'Database Systems',
    grade: 1.75,
    semester: '1st',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 1,
    subjectCode: 'CS203',
    subjectName: 'Web Development',
    grade: 1.5,
    semester: '2nd',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 1,
    subjectCode: 'MATH201',
    subjectName: 'Discrete Mathematics',
    grade: 2.0,
    semester: '2nd',
    academicYear: '2024-2025',
    credits: 3,
  },

  // Charlie (Student 2) - Year 2 Student
  // First Year (2024-2025)
  {
    studentIndex: 2,
    subjectCode: 'CS101',
    subjectName: 'Introduction to Programming',
    grade: 2.0,
    semester: '1st',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 2,
    subjectCode: 'CS102',
    subjectName: 'Data Structures',
    grade: 2.25,
    semester: '1st',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 2,
    subjectCode: 'MATH101',
    subjectName: 'Calculus I',
    grade: 2.5,
    semester: '1st',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 2,
    subjectCode: 'ENG101',
    subjectName: 'Technical Writing',
    grade: 2.0,
    semester: '2nd',
    academicYear: '2024-2025',
    credits: 3,
  },

  // Edward (Student 4) - Year 4 Student
  // First Year (2022-2023)
  {
    studentIndex: 4,
    subjectCode: 'CS101',
    subjectName: 'Introduction to Programming',
    grade: 1.75,
    semester: '1st',
    academicYear: '2022-2023',
    credits: 3,
  },
  {
    studentIndex: 4,
    subjectCode: 'CS102',
    subjectName: 'Data Structures',
    grade: 2.0,
    semester: '1st',
    academicYear: '2022-2023',
    credits: 3,
  },
  {
    studentIndex: 4,
    subjectCode: 'MATH101',
    subjectName: 'Calculus I',
    grade: 2.25,
    semester: '1st',
    academicYear: '2022-2023',
    credits: 3,
  },
  {
    studentIndex: 4,
    subjectCode: 'ENG101',
    subjectName: 'Technical Writing',
    grade: 1.75,
    semester: '2nd',
    academicYear: '2022-2023',
    credits: 3,
  },

  // Second Year (2023-2024)
  {
    studentIndex: 4,
    subjectCode: 'CS201',
    subjectName: 'Object-Oriented Programming',
    grade: 1.5,
    semester: '1st',
    academicYear: '2023-2024',
    credits: 3,
  },
  {
    studentIndex: 4,
    subjectCode: 'CS202',
    subjectName: 'Database Systems',
    grade: 1.75,
    semester: '1st',
    academicYear: '2023-2024',
    credits: 3,
  },
  {
    studentIndex: 4,
    subjectCode: 'CS203',
    subjectName: 'Web Development',
    grade: 1.5,
    semester: '2nd',
    academicYear: '2023-2024',
    credits: 3,
  },
  {
    studentIndex: 4,
    subjectCode: 'MATH201',
    subjectName: 'Discrete Mathematics',
    grade: 2.0,
    semester: '2nd',
    academicYear: '2023-2024',
    credits: 3,
  },

  // Third Year (2024-2025)
  {
    studentIndex: 4,
    subjectCode: 'CS301',
    subjectName: 'Software Engineering',
    grade: 1.75,
    semester: '1st',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 4,
    subjectCode: 'CS302',
    subjectName: 'Computer Networks',
    grade: 2.0,
    semester: '1st',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 4,
    subjectCode: 'CS303',
    subjectName: 'Operating Systems',
    grade: 1.75,
    semester: '2nd',
    academicYear: '2024-2025',
    credits: 3,
  },
  {
    studentIndex: 4,
    subjectCode: 'CS304',
    subjectName: 'Algorithm Design',
    grade: 1.5,
    semester: '2nd',
    academicYear: '2024-2025',
    credits: 3,
  },
];

export async function seedAcademicHistory(
  db: Database,
  studentIds: string[]
) {
  const createdRecords: string[] = [];

  console.log('  Creating academic history records...');

  for (const seed of academicHistorySeeds) {
    // Validate student index
    if (seed.studentIndex >= studentIds.length) {
      console.warn(`  ⚠️  Skipping academic history: student index ${seed.studentIndex} out of range`);
      continue;
    }

    const studentId = studentIds[seed.studentIndex];
    const id = generateUUIDv7();

    try {
      const [record] = await db
        .insert(academicHistory)
        .values({
          id,
          student_id: studentId,
          subject_code: seed.subjectCode,
          subject_name: seed.subjectName,
          grade: seed.grade.toString(),
          semester: seed.semester,
          academic_year: seed.academicYear,
          credits: seed.credits,
          remarks: seed.remarks,
        })
        .returning({ id: academicHistory.id });

      createdRecords.push(record.id);
      console.log(
        `  - Created: Student ${seed.studentIndex} → ${seed.subjectCode} ` +
        `(Grade: ${seed.grade}, ${seed.semester} ${seed.academicYear})`
      );
    } catch (error: any) {
      console.error(
        `  ❌ Error creating academic history for Student ${seed.studentIndex} → ${seed.subjectCode}:`,
        error.message
      );
      throw error;
    }
  }

  return createdRecords;
}
