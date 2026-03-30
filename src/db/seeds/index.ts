import { db } from '../index';
import { seedUsers } from './users.seed';
import { seedStudents } from './students.seed';
import { seedFaculty } from './faculty.seed';

/**
 * Main seeder function that runs all seed files in order
 */
export async function runSeeders() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Seed in order of dependencies
    console.log('📝 Seeding users...');
    const userIds = await seedUsers(db);
    console.log(`✅ Created ${userIds.length} users\n`);

    console.log('📝 Seeding students...');
    const studentIds = await seedStudents(db, userIds.filter(u => u.role === 'student'));
    console.log(`✅ Created ${studentIds.length} students\n`);

    console.log('📝 Seeding faculty...');
    const facultyIds = await seedFaculty(db, userIds.filter(u => u.role === 'faculty'));
    console.log(`✅ Created ${facultyIds.length} faculty members\n`);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seeders if this file is executed directly
if (require.main === module) {
  runSeeders()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
