import { Database } from '../index';
import { attendance } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface AttendanceSeed {
  instructionIndex: number;
  studentIndex: number;
  date: string; // YYYY-MM-DD format
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  recordedByFacultyIndex: number;
}

/**
 * Attendance seeds
 * 
 * Creates sample attendance records for students in various courses.
 * Dates are set for the current academic year (2025-2026).
 */
const attendanceSeeds: AttendanceSeed[] = [
  // Week 1 - CS101 (Instruction 0)
  {
    instructionIndex: 0,
    studentIndex: 0,
    date: '2026-01-05',
    status: 'present',
    recordedByFacultyIndex: 0,
  },
  {
    instructionIndex: 0,
    studentIndex: 1,
    date: '2026-01-05',
    status: 'present',
    recordedByFacultyIndex: 0,
  },
  {
    instructionIndex: 0,
    studentIndex: 2,
    date: '2026-01-05',
    status: 'late',
    remarks: 'Arrived 15 minutes late',
    recordedByFacultyIndex: 0,
  },
  {
    instructionIndex: 0,
    studentIndex: 3,
    date: '2026-01-05',
    status: 'absent',
    remarks: 'Unexcused absence',
    recordedByFacultyIndex: 0,
  },

  // Week 1 - CS102 (Instruction 1)
  {
    instructionIndex: 1,
    studentIndex: 0,
    date: '2026-01-06',
    status: 'present',
    recordedByFacultyIndex: 1,
  },
  {
    instructionIndex: 1,
    studentIndex: 1,
    date: '2026-01-06',
    status: 'present',
    recordedByFacultyIndex: 1,
  },
  {
    instructionIndex: 1,
    studentIndex: 2,
    date: '2026-01-06',
    status: 'present',
    recordedByFacultyIndex: 1,
  },
  {
    instructionIndex: 1,
    studentIndex: 3,
    date: '2026-01-06',
    status: 'excused',
    remarks: 'Medical appointment',
    recordedByFacultyIndex: 1,
  },

  // Week 2 - CS101 (Instruction 0)
  {
    instructionIndex: 0,
    studentIndex: 0,
    date: '2026-01-12',
    status: 'present',
    recordedByFacultyIndex: 0,
  },
  {
    instructionIndex: 0,
    studentIndex: 1,
    date: '2026-01-12',
    status: 'late',
    remarks: 'Traffic delay',
    recordedByFacultyIndex: 0,
  },
  {
    instructionIndex: 0,
    studentIndex: 2,
    date: '2026-01-12',
    status: 'present',
    recordedByFacultyIndex: 0,
  },
  {
    instructionIndex: 0,
    studentIndex: 3,
    date: '2026-01-12',
    status: 'present',
    recordedByFacultyIndex: 0,
  },

  // Week 2 - CS201 (Instruction 4)
  {
    instructionIndex: 4,
    studentIndex: 0,
    date: '2026-01-13',
    status: 'present',
    recordedByFacultyIndex: 2,
  },
  {
    instructionIndex: 4,
    studentIndex: 1,
    date: '2026-01-13',
    status: 'present',
    recordedByFacultyIndex: 2,
  },
  {
    instructionIndex: 4,
    studentIndex: 2,
    date: '2026-01-13',
    status: 'absent',
    remarks: 'Sick',
    recordedByFacultyIndex: 2,
  },

  // Week 3 - CS301 (Instruction 8)
  {
    instructionIndex: 8,
    studentIndex: 0,
    date: '2026-01-20',
    status: 'present',
    recordedByFacultyIndex: 3,
  },
  {
    instructionIndex: 8,
    studentIndex: 1,
    date: '2026-01-20',
    status: 'present',
    recordedByFacultyIndex: 3,
  },
  {
    instructionIndex: 8,
    studentIndex: 4,
    date: '2026-01-20',
    status: 'late',
    remarks: 'Came from another class',
    recordedByFacultyIndex: 3,
  },

  // Week 3 - CS302 (Instruction 9)
  {
    instructionIndex: 9,
    studentIndex: 0,
    date: '2026-01-21',
    status: 'present',
    recordedByFacultyIndex: 2,
  },
  {
    instructionIndex: 9,
    studentIndex: 1,
    date: '2026-01-21',
    status: 'present',
    recordedByFacultyIndex: 2,
  },
  {
    instructionIndex: 9,
    studentIndex: 4,
    date: '2026-01-21',
    status: 'present',
    recordedByFacultyIndex: 2,
  },

  // Week 4 - CS401 (Instruction 12)
  {
    instructionIndex: 12,
    studentIndex: 0,
    date: '2026-01-27',
    status: 'present',
    recordedByFacultyIndex: 0,
  },
  {
    instructionIndex: 12,
    studentIndex: 4,
    date: '2026-01-27',
    status: 'present',
    recordedByFacultyIndex: 0,
  },

  // Additional records for better coverage
  {
    instructionIndex: 5,
    studentIndex: 1,
    date: '2026-02-03',
    status: 'present',
    recordedByFacultyIndex: 2,
  },
  {
    instructionIndex: 5,
    studentIndex: 2,
    date: '2026-02-03',
    status: 'present',
    recordedByFacultyIndex: 2,
  },
  {
    instructionIndex: 6,
    studentIndex: 1,
    date: '2026-02-04',
    status: 'excused',
    remarks: 'School event participation',
    recordedByFacultyIndex: 1,
  },
];

export async function seedAttendance(
  db: Database,
  instructionIds: string[],
  studentIds: string[],
  facultyIds: string[]
) {
  const createdRecords: string[] = [];

  console.log('  Creating attendance records...');

  for (const seed of attendanceSeeds) {
    if (seed.instructionIndex >= instructionIds.length) {
      console.warn(`  ⚠️  Skipping attendance: instruction index ${seed.instructionIndex} out of range`);
      continue;
    }

    if (seed.studentIndex >= studentIds.length) {
      console.warn(`  ⚠️  Skipping attendance: student index ${seed.studentIndex} out of range`);
      continue;
    }

    if (seed.recordedByFacultyIndex >= facultyIds.length) {
      console.warn(`  ⚠️  Skipping attendance: faculty index ${seed.recordedByFacultyIndex} out of range`);
      continue;
    }

    const instructionId = instructionIds[seed.instructionIndex];
    const studentId = studentIds[seed.studentIndex];
    const recordedBy = facultyIds[seed.recordedByFacultyIndex];
    const id = generateUUIDv7();

    try {
      const [record] = await db
        .insert(attendance)
        .values({
          id,
          instruction_id: instructionId,
          student_id: studentId,
          date: seed.date,
          status: seed.status,
          remarks: seed.remarks,
          recorded_by: recordedBy,
        })
        .returning({ id: attendance.id });

      createdRecords.push(record.id);
      console.log(
        `  - Created: Student ${seed.studentIndex} → Instruction ${seed.instructionIndex} ` +
        `(${seed.date}, ${seed.status})`
      );
    } catch (error: any) {
      console.error(
        `  ❌ Error creating attendance for Student ${seed.studentIndex}:`,
        error.message
      );
      throw error;
    }
  }

  return createdRecords;
}
