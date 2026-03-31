import { db } from './src/db';
import { students, faculty, entityCounters } from './src/db/schema';

async function verifySeedData() {
  console.log('🔍 Verifying seeded data...\n');

  // Check students
  const studentData = await db.select().from(students);
  console.log('📚 Students:');
  studentData.forEach(s => {
    console.log(`  - ${s.student_id}: ${s.first_name} ${s.last_name} (${s.email})`);
  });
  console.log(`  Total: ${studentData.length}\n`);

  // Check faculty
  const facultyData = await db.select().from(faculty);
  console.log('👨‍🏫 Faculty:');
  facultyData.forEach(f => {
    console.log(`  - ${f.faculty_id}: ${f.first_name} ${f.last_name} (${f.department})`);
  });
  console.log(`  Total: ${facultyData.length}\n`);

  // Check entity counters
  const counters = await db.select().from(entityCounters);
  console.log('🔢 Entity Counters:');
  counters.forEach(c => {
    console.log(`  - ${c.entity_type} (${c.year}): last_sequence = ${c.last_sequence}`);
  });
  console.log(`  Total: ${counters.length}\n`);

  console.log('✅ Verification complete!');
  process.exit(0);
}

verifySeedData().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
