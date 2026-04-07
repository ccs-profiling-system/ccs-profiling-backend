import { Database } from '../index';
import { enrollments } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface EnrollmentSeed {
  studentIndex: number; // Index in the students array
  instructionIndex: number; // Index in the instructions array
  semester: '1st' | '2nd' | 'summer';
  academicYear: string;
  enrollmentStatus?: 'enrolled' | 'dropped' | 'completed';
}

/**
 * Enrollment seeds mapping students to instructions
 * 
 * Student distribution by year level:
 * - Student 0 (Alice): Year 4 - Takes 4th year courses
 * - Student 1 (Bob): Year 3 - Takes 3rd year courses
 * - Student 2 (Charlie): Year 2 - Takes 2nd year courses
 * - Student 3 (Diana): Year 1 - Takes 1st year courses
 * - Student 4 (Edward): Year 4 - Takes 4th year courses
 * 
 * Instruction indices (from instructions.seed.ts):
 * 0-3: First Year courses (CS101, CS102, MATH101, ENG101)
 * 4-7: Second Year courses (CS201, CS202, CS203, MATH201)
 * 8-11: Third Year courses (CS301, CS302, CS303, CS304)
 * 12-14: Fourth Year courses (CS401, CS402, CS403)
 */
const enrollmentSeeds: EnrollmentSeed[] = [
  // Diana (Student 3) - Year 1 - First Semester
  {
    studentIndex: 3,
    instructionIndex: 0, // CS101
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },
  {
    studentIndex: 3,
    instructionIndex: 1, // CS102
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },
  {
    studentIndex: 3,
    instructionIndex: 2, // MATH101
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },
  {
    studentIndex: 3,
    instructionIndex: 3, // ENG101
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },

  // Charlie (Student 2) - Year 2 - First Semester
  {
    studentIndex: 2,
    instructionIndex: 4, // CS201
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },
  {
    studentIndex: 2,
    instructionIndex: 5, // CS202
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },
  {
    studentIndex: 2,
    instructionIndex: 6, // CS203
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },
  {
    studentIndex: 2,
    instructionIndex: 7, // MATH201
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },

  // Bob (Student 1) - Year 3 - First Semester
  {
    studentIndex: 1,
    instructionIndex: 8, // CS301
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },
  {
    studentIndex: 1,
    instructionIndex: 9, // CS302
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },
  {
    studentIndex: 1,
    instructionIndex: 10, // CS303
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },
  {
    studentIndex: 1,
    instructionIndex: 11, // CS304
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },

  // Alice (Student 0) - Year 4 - First Semester
  {
    studentIndex: 0,
    instructionIndex: 12, // CS401
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },
  {
    studentIndex: 0,
    instructionIndex: 13, // CS402
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },

  // Edward (Student 4) - Year 4 - First Semester
  {
    studentIndex: 4,
    instructionIndex: 12, // CS401
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },
  {
    studentIndex: 4,
    instructionIndex: 13, // CS402
    semester: '1st',
    academicYear: '2025-2026',
    enrollmentStatus: 'enrolled',
  },

  // Some completed enrollments from previous semester (2nd semester 2024-2025)
  {
    studentIndex: 0,
    instructionIndex: 8, // CS301
    semester: '2nd',
    academicYear: '2024-2025',
    enrollmentStatus: 'completed',
  },
  {
    studentIndex: 0,
    instructionIndex: 9, // CS302
    semester: '2nd',
    academicYear: '2024-2025',
    enrollmentStatus: 'completed',
  },
  {
    studentIndex: 1,
    instructionIndex: 4, // CS201
    semester: '2nd',
    academicYear: '2024-2025',
    enrollmentStatus: 'completed',
  },
  {
    studentIndex: 1,
    instructionIndex: 5, // CS202
    semester: '2nd',
    academicYear: '2024-2025',
    enrollmentStatus: 'completed',
  },

  // One dropped enrollment example
  {
    studentIndex: 2,
    instructionIndex: 4, // CS201
    semester: '2nd',
    academicYear: '2024-2025',
    enrollmentStatus: 'dropped',
  },
];

export async function seedEnrollments(
  db: Database,
  studentIds: string[],
  instructionIds: string[]
) {
  const createdEnrollments: string[] = [];

  console.log('  Creating enrollments...');

  for (const seed of enrollmentSeeds) {
    // Validate indices
    if (seed.studentIndex >= studentIds.length) {
      console.warn(`  ⚠️  Skipping enrollment: student index ${seed.studentIndex} out of range`);
      continue;
    }
    if (seed.instructionIndex >= instructionIds.length) {
      console.warn(`  ⚠️  Skipping enrollment: instruction index ${seed.instructionIndex} out of range`);
      continue;
    }

    const studentId = studentIds[seed.studentIndex];
    const instructionId = instructionIds[seed.instructionIndex];
    const id = generateUUIDv7();

    try {
      const [enrollment] = await db
        .insert(enrollments)
        .values({
          id,
          student_id: studentId,
          instruction_id: instructionId,
          semester: seed.semester,
          academic_year: seed.academicYear,
          enrollment_status: seed.enrollmentStatus || 'enrolled',
          enrolled_at: new Date(),
        })
        .returning({ id: enrollments.id });

      createdEnrollments.push(enrollment.id);
      console.log(
        `  - Created enrollment: Student ${seed.studentIndex} → Instruction ${seed.instructionIndex} ` +
        `(${seed.semester} ${seed.academicYear}, ${seed.enrollmentStatus || 'enrolled'})`
      );
    } catch (error: any) {
      // Handle duplicate enrollment constraint
      if (error.code === '23505') {
        console.warn(
          `  ⚠️  Duplicate enrollment skipped: Student ${seed.studentIndex} → Instruction ${seed.instructionIndex} ` +
          `(${seed.semester} ${seed.academicYear})`
        );
      } else {
        throw error;
      }
    }
  }

  return createdEnrollments;
}
