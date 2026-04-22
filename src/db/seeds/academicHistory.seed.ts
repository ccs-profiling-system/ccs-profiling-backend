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

const courses = [
  // First Year
  { code: 'CS101', name: 'Introduction to Programming', credits: 3, semester: '1st' as const },
  { code: 'CS102', name: 'Data Structures', credits: 3, semester: '1st' as const },
  { code: 'MATH101', name: 'Calculus I', credits: 3, semester: '1st' as const },
  { code: 'ENG101', name: 'Technical Writing', credits: 3, semester: '2nd' as const },
  { code: 'PHYS101', name: 'Physics I', credits: 3, semester: '2nd' as const },
  // Second Year
  { code: 'CS201', name: 'Object-Oriented Programming', credits: 3, semester: '1st' as const },
  { code: 'CS202', name: 'Database Systems', credits: 3, semester: '1st' as const },
  { code: 'CS203', name: 'Web Development', credits: 3, semester: '2nd' as const },
  { code: 'MATH201', name: 'Discrete Mathematics', credits: 3, semester: '2nd' as const },
  // Third Year
  { code: 'CS301', name: 'Software Engineering', credits: 3, semester: '1st' as const },
  { code: 'CS302', name: 'Computer Networks', credits: 3, semester: '1st' as const },
  { code: 'CS303', name: 'Operating Systems', credits: 3, semester: '2nd' as const },
  { code: 'CS304', name: 'Algorithm Design', credits: 3, semester: '2nd' as const },
  // Fourth Year
  { code: 'CS401', name: 'Machine Learning', credits: 3, semester: '1st' as const },
  { code: 'CS402', name: 'Capstone Project', credits: 3, semester: '2nd' as const },
];

function generateGrade(): number {
  const rand = Math.random();
  if (rand < 0.3) return 1.0 + Math.floor(Math.random() * 3) * 0.25; // 1.0-1.75 (30%)
  if (rand < 0.6) return 2.0 + Math.floor(Math.random() * 4) * 0.25; // 2.0-2.75 (30%)
  if (rand < 0.9) return 3.0; // 3.0 (30%)
  return 5.0; // Failed (10%)
}

export async function seedAcademicHistory(
  db: Database,
  studentIds: string[]
) {
  console.log('  Creating academic history records...');

  const historyToInsert = [];

  for (const studentId of studentIds) {
    // Generate random year level (1-4)
    const yearLevel = Math.floor(Math.random() * 4) + 1;
    
    // Generate history based on year level
    const coursesToTake = courses.filter((_, idx) => {
      if (yearLevel === 1) return idx < 5; // First year courses
      if (yearLevel === 2) return idx < 9; // First + Second year
      if (yearLevel === 3) return idx < 13; // First + Second + Third year
      return true; // All courses for 4th year
    });

    for (const course of coursesToTake) {
      const id = generateUUIDv7();
      const grade = generateGrade();
      
      // Calculate academic year based on course
      const courseYear = Math.floor(courses.indexOf(course) / 5) + 1;
      const academicYear = `${2022 + courseYear}-${2023 + courseYear}`;

      historyToInsert.push({
        id,
        student_id: studentId,
        subject_code: course.code,
        subject_name: course.name,
        grade: grade.toString(),
        semester: course.semester,
        academic_year: academicYear,
        credits: course.credits,
        remarks: grade === 5.0 ? 'Failed' : undefined,
      });
    }
  }

  // Batch insert in chunks of 500
  const chunkSize = 500;
  const createdRecords: string[] = [];
  
  for (let i = 0; i < historyToInsert.length; i += chunkSize) {
    const chunk = historyToInsert.slice(i, i + chunkSize);
    const inserted = await db.insert(academicHistory).values(chunk).returning({ id: academicHistory.id });
    createdRecords.push(...inserted.map(h => h.id));
    console.log(`  - Inserted ${inserted.length} academic history records (${i + inserted.length}/${historyToInsert.length})`);
  }

  console.log(`  ✅ Created ${createdRecords.length} academic history records for ${studentIds.length} students`);

  return createdRecords;
}
