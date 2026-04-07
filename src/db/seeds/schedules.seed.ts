import { Database } from '../index';
import { schedules } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const rooms = ['Room 101', 'Room 102', 'Room 201', 'Room 202', 'Room 301', 'Computer Lab 1', 'Computer Lab 2', 'Computer Lab 3'];
const timeSlots = [
  { start: '07:00:00', end: '08:30:00' },
  { start: '08:30:00', end: '10:00:00' },
  { start: '10:00:00', end: '11:30:00' },
  { start: '11:30:00', end: '13:00:00' },
  { start: '13:00:00', end: '14:30:00' },
  { start: '14:30:00', end: '16:00:00' },
  { start: '16:00:00', end: '17:30:00' },
];

export async function seedSchedules(
  db: Database, 
  instructionIds: string[], 
  facultyIds: string[]
) {
  const createdScheduleIds: string[] = [];
  const currentAcademicYear = '2025-2026';
  const semesters = ['1st', '2nd'];

  console.log('  Creating schedules...');

  // Create class schedules for each instruction
  for (const instructionId of instructionIds) {
    const semester = semesters[Math.floor(Math.random() * semesters.length)];
    const facultyId = facultyIds[Math.floor(Math.random() * facultyIds.length)];
    const day = days[Math.floor(Math.random() * days.length)];
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

    const id = generateUUIDv7();

    const [schedule] = await db
      .insert(schedules)
      .values({
        id,
        schedule_type: 'class',
        instruction_id: instructionId,
        faculty_id: facultyId,
        room,
        day,
        start_time: timeSlot.start,
        end_time: timeSlot.end,
        semester,
        academic_year: currentAcademicYear,
      })
      .returning({ id: schedules.id });

    createdScheduleIds.push(schedule.id);
  }

  console.log(`  - Created ${instructionIds.length} class schedules`);

  // Create exam schedules
  const examCount = Math.min(10, instructionIds.length);
  for (let i = 0; i < examCount; i++) {
    const instructionId = instructionIds[Math.floor(Math.random() * instructionIds.length)];
    const facultyId = facultyIds[Math.floor(Math.random() * facultyIds.length)];
    const semester = semesters[Math.floor(Math.random() * semesters.length)];
    const day = days[Math.floor(Math.random() * days.length)];
    const room = rooms[Math.floor(Math.random() * rooms.length)];

    const id = generateUUIDv7();

    const [schedule] = await db
      .insert(schedules)
      .values({
        id,
        schedule_type: 'exam',
        instruction_id: instructionId,
        faculty_id: facultyId,
        room,
        day,
        start_time: '09:00:00',
        end_time: '12:00:00',
        semester,
        academic_year: currentAcademicYear,
      })
      .returning({ id: schedules.id });

    createdScheduleIds.push(schedule.id);
  }

  console.log(`  - Created ${examCount} exam schedules`);

  // Create consultation schedules for faculty
  for (const facultyId of facultyIds) {
    const consultationDays = Math.floor(Math.random() * 3) + 1; // 1-3 consultation days per faculty

    for (let i = 0; i < consultationDays; i++) {
      const day = days[Math.floor(Math.random() * days.length)];
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const semester = semesters[Math.floor(Math.random() * semesters.length)];

      const id = generateUUIDv7();

      const [schedule] = await db
        .insert(schedules)
        .values({
          id,
          schedule_type: 'consultation',
          instruction_id: null,
          faculty_id: facultyId,
          room,
          day,
          start_time: '14:00:00',
          end_time: '16:00:00',
          semester,
          academic_year: currentAcademicYear,
        })
        .returning({ id: schedules.id });

      createdScheduleIds.push(schedule.id);
    }
  }

  console.log(`  - Created consultation schedules for ${facultyIds.length} faculty members`);

  return createdScheduleIds;
}
