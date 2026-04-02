import { db } from '../index';
import { users, students, faculty, instructions, enrollments, academicHistory, skills, violations, affiliations } from '../schema';
import { seedUsers } from './users.seed';
import { seedStudents } from './students.seed';
import { seedFaculty } from './faculty.seed';
import { seedInstructions } from './instructions.seed';
import { seedEnrollments } from './enrollments.seed';
import { seedAcademicHistory } from './academicHistory.seed';
import { seedSkills } from './skills.seed';
import { seedViolations } from './violations.seed';
import { seedAffiliations } from './affiliations.seed';
import { sql } from 'drizzle-orm';

/**
 * Check if a table has any data
 */
async function hasData(tableName: string): Promise<boolean> {
  const result = await db.execute(sql`SELECT EXISTS (SELECT 1 FROM ${sql.identifier(tableName)} LIMIT 1) as has_data`);
  // Handle different result formats from drizzle
  const rows = Array.isArray(result) ? result : (result as any).rows || [];
  return rows[0]?.has_data === true;
}

/**
 * Main seeder function that runs all seed files in order
 * Skips seeding if tables already have data
 */
export async function runSeeders() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Check if users table has data
    const usersHasData = await hasData('users');
    let userIds: Array<{ id: string; role: string }> = [];

    if (usersHasData) {
      console.log('ℹ️  Users table already has data, skipping user seeding...');
      // Get existing user IDs for reference
      const existingUsers = await db.select({ id: users.id, role: users.role }).from(users);
      userIds = existingUsers;
      console.log(`📊 Found ${userIds.length} existing users\n`);
    } else {
      console.log('📝 Seeding users...');
      userIds = await seedUsers(db);
      console.log(`✅ Created ${userIds.length} users\n`);
    }

    // Check if students table has data
    const studentsHasData = await hasData('students');
    let studentIds: string[] = [];

    if (studentsHasData) {
      console.log('ℹ️  Students table already has data, skipping student seeding...');
      const existingStudents = await db.select({ id: students.id }).from(students);
      studentIds = existingStudents.map(s => s.id);
      console.log(`📊 Found ${studentIds.length} existing students\n`);
    } else {
      console.log('📝 Seeding students...');
      studentIds = await seedStudents(db, userIds.filter(u => u.role === 'student'));
      console.log(`✅ Created ${studentIds.length} students\n`);
    }

    // Check if faculty table has data
    const facultyHasData = await hasData('faculty');
    let facultyIds: string[] = [];

    if (facultyHasData) {
      console.log('ℹ️  Faculty table already has data, skipping faculty seeding...');
      const existingFaculty = await db.select({ id: faculty.id }).from(faculty);
      facultyIds = existingFaculty.map(f => f.id);
      console.log(`📊 Found ${facultyIds.length} existing faculty members\n`);
    } else {
      console.log('📝 Seeding faculty...');
      facultyIds = await seedFaculty(db, userIds.filter(u => u.role === 'faculty'));
      console.log(`✅ Created ${facultyIds.length} faculty members\n`);
    }

    // Check if instructions table has data
    const instructionsHasData = await hasData('instructions');
    let instructionIds: string[] = [];

    if (instructionsHasData) {
      console.log('ℹ️  Instructions table already has data, skipping instruction seeding...');
      const existingInstructions = await db.select({ id: instructions.id }).from(instructions);
      instructionIds = existingInstructions.map(i => i.id);
      console.log(`📊 Found ${instructionIds.length} existing instructions\n`);
    } else {
      console.log('📝 Seeding instructions...');
      instructionIds = await seedInstructions(db);
      console.log(`✅ Created ${instructionIds.length} instructions\n`);
    }

    // Check if enrollments table has data
    const enrollmentsHasData = await hasData('enrollments');
    let enrollmentIds: string[] = [];

    if (enrollmentsHasData) {
      console.log('ℹ️  Enrollments table already has data, skipping enrollment seeding...');
      const existingEnrollments = await db.select({ id: enrollments.id }).from(enrollments);
      enrollmentIds = existingEnrollments.map(e => e.id);
      console.log(`📊 Found ${enrollmentIds.length} existing enrollments\n`);
    } else {
      console.log('📝 Seeding enrollments...');
      enrollmentIds = await seedEnrollments(db, studentIds, instructionIds);
      console.log(`✅ Created ${enrollmentIds.length} enrollments\n`);
    }

    // Check if academic_history table has data
    const academicHistoryHasData = await hasData('academic_history');
    let academicHistoryIds: string[] = [];

    if (academicHistoryHasData) {
      console.log('ℹ️  Academic history table already has data, skipping academic history seeding...');
      const existingRecords = await db.select({ id: academicHistory.id }).from(academicHistory);
      academicHistoryIds = existingRecords.map(r => r.id);
      console.log(`📊 Found ${academicHistoryIds.length} existing academic history records\n`);
    } else {
      console.log('📝 Seeding academic history...');
      academicHistoryIds = await seedAcademicHistory(db, studentIds);
      console.log(`✅ Created ${academicHistoryIds.length} academic history records\n`);
    }

    // Check if skills table has data
    const skillsHasData = await hasData('skills');
    let skillIds: string[] = [];

    if (skillsHasData) {
      console.log('ℹ️  Skills table already has data, skipping skills seeding...');
      const existingSkills = await db.select({ id: skills.id }).from(skills);
      skillIds = existingSkills.map(s => s.id);
      console.log(`📊 Found ${skillIds.length} existing skill records\n`);
    } else {
      console.log('📝 Seeding skills...');
      skillIds = await seedSkills(db, studentIds);
      console.log(`✅ Created ${skillIds.length} skill records\n`);
    }

    // Check if violations table has data
    const violationsHasData = await hasData('violations');
    let violationIds: string[] = [];

    if (violationsHasData) {
      console.log('ℹ️  Violations table already has data, skipping violations seeding...');
      const existingViolations = await db.select({ id: violations.id }).from(violations);
      violationIds = existingViolations.map(v => v.id);
      console.log(`📊 Found ${violationIds.length} existing violation records\n`);
    } else {
      console.log('📝 Seeding violations...');
      violationIds = await seedViolations(db, studentIds);
      console.log(`✅ Created ${violationIds.length} violation records\n`);
    }

    // Check if affiliations table has data
    const affiliationsHasData = await hasData('affiliations');
    let affiliationIds: string[] = [];

    if (affiliationsHasData) {
      console.log('ℹ️  Affiliations table already has data, skipping affiliations seeding...');
      const existingAffiliations = await db.select({ id: affiliations.id }).from(affiliations);
      affiliationIds = existingAffiliations.map(a => a.id);
      console.log(`📊 Found ${affiliationIds.length} existing affiliation records\n`);
    } else {
      console.log('📝 Seeding affiliations...');
      affiliationIds = await seedAffiliations(db, studentIds);
      console.log(`✅ Created ${affiliationIds.length} affiliation records\n`);
    }

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
