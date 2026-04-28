/**
 * Diagnostic script to check faculty-course assignments
 * Run with: tsx src/db/seeds/check-faculty-schedules.ts
 */

import { db } from '../index';
import { users, faculty, schedules, instructions } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';

async function checkFacultySchedules() {
  console.log('🔍 Checking Faculty-Course Assignments\n');

  try {
    // Get all faculty members with their user info
    const facultyMembers = await db
      .select({
        facultyId: faculty.id,
        facultyName: faculty.first_name,
        facultyLastName: faculty.last_name,
        userId: faculty.user_id,
        userEmail: users.email,
        userRole: users.role,
      })
      .from(faculty)
      .innerJoin(users, eq(faculty.user_id, users.id));

    console.log(`📊 Found ${facultyMembers.length} faculty members:\n`);

    for (const member of facultyMembers) {
      console.log(`\n👤 ${member.facultyName} ${member.facultyLastName}`);
      console.log(`   Email: ${member.userEmail}`);
      console.log(`   User ID: ${member.userId}`);
      console.log(`   Faculty ID: ${member.facultyId}`);
      console.log(`   Role: ${member.userRole}`);

      // Get schedules for this faculty member
      const facultySchedules = await db
        .select({
          scheduleId: schedules.id,
          scheduleType: schedules.schedule_type,
          instructionId: schedules.instruction_id,
          subjectCode: instructions.subject_code,
          subjectName: instructions.subject_name,
          room: schedules.room,
          day: schedules.day,
          startTime: schedules.start_time,
          endTime: schedules.end_time,
        })
        .from(schedules)
        .leftJoin(instructions, eq(schedules.instruction_id, instructions.id))
        .where(
          and(
            eq(schedules.faculty_id, member.facultyId),
            isNull(schedules.deleted_at)
          )
        );

      console.log(`   📅 Schedules: ${facultySchedules.length}`);

      // Group by schedule type
      const classSchedules = facultySchedules.filter(s => s.scheduleType === 'class');
      const examSchedules = facultySchedules.filter(s => s.scheduleType === 'exam');
      const consultationSchedules = facultySchedules.filter(s => s.scheduleType === 'consultation');

      console.log(`      - Classes: ${classSchedules.length}`);
      console.log(`      - Exams: ${examSchedules.length}`);
      console.log(`      - Consultations: ${consultationSchedules.length}`);

      if (classSchedules.length > 0) {
        console.log(`\n   📚 Assigned Courses:`);
        classSchedules.forEach(schedule => {
          console.log(`      - ${schedule.subjectCode}: ${schedule.subjectName}`);
          console.log(`        Instruction ID: ${schedule.instructionId}`);
          console.log(`        ${schedule.day} ${schedule.startTime}-${schedule.endTime} @ ${schedule.room}`);
        });
      }
    }

    console.log('\n\n✅ Diagnostic complete!');
    console.log('\n💡 To test the API:');
    console.log('   1. Login with a faculty email from above');
    console.log('   2. Use the returned JWT token');
    console.log('   3. Use one of the Instruction IDs shown above as courseId');
    console.log('   4. Call: GET /api/faculty/courses/:courseId/attendance\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

checkFacultySchedules();
