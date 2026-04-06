/**
 * Audit Logs Seed Data
 * Generates sample audit log entries for testing
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4
 */

import { db } from '../index';
import { auditLogs } from '../schema/auditLogs';
import { users } from '../schema/users';
import { students } from '../schema/students';
import { faculty } from '../schema/faculty';
import { generateUUIDv7 } from '../../shared/utils/uuid';

export async function seedAuditLogs() {
  console.log('🌱 Seeding audit logs...');

  try {
    // Get existing users, students, and faculty for realistic audit logs
    const existingUsers = await db.select().from(users).limit(3);
    const existingStudents = await db.select().from(students).limit(2);
    const existingFaculty = await db.select().from(faculty).limit(1);

    if (existingUsers.length === 0) {
      console.log('⚠️  No users found. Please seed users first.');
      return;
    }

    const adminUser = existingUsers.find(u => u.role === 'admin') || existingUsers[0];

    // Sample audit log entries
    const auditLogData = [];

    // Student creation audit logs
    if (existingStudents.length > 0) {
      auditLogData.push({
        id: generateUUIDv7(),
        user_id: adminUser.id,
        action_type: 'create' as const,
        entity_type: 'student',
        entity_id: existingStudents[0].id,
        before_state: null,
        after_state: {
          id: existingStudents[0].id,
          student_id: existingStudents[0].student_id,
          first_name: existingStudents[0].first_name,
          last_name: existingStudents[0].last_name,
          email: existingStudents[0].email,
          status: 'active',
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      });

      // Student update audit log
      auditLogData.push({
        id: generateUUIDv7(),
        user_id: adminUser.id,
        action_type: 'update' as const,
        entity_type: 'student',
        entity_id: existingStudents[0].id,
        before_state: {
          id: existingStudents[0].id,
          student_id: existingStudents[0].student_id,
          first_name: existingStudents[0].first_name,
          last_name: existingStudents[0].last_name,
          email: existingStudents[0].email,
          year_level: 1,
          status: 'active',
        },
        after_state: {
          id: existingStudents[0].id,
          student_id: existingStudents[0].student_id,
          first_name: existingStudents[0].first_name,
          last_name: existingStudents[0].last_name,
          email: existingStudents[0].email,
          year_level: 2,
          status: 'active',
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      });
    }

    // Faculty creation audit log
    if (existingFaculty.length > 0) {
      auditLogData.push({
        id: generateUUIDv7(),
        user_id: adminUser.id,
        action_type: 'create' as const,
        entity_type: 'faculty',
        entity_id: existingFaculty[0].id,
        before_state: null,
        after_state: {
          id: existingFaculty[0].id,
          faculty_id: existingFaculty[0].faculty_id,
          first_name: existingFaculty[0].first_name,
          last_name: existingFaculty[0].last_name,
          email: existingFaculty[0].email,
          department: existingFaculty[0].department,
          status: 'active',
        },
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      });
    }

    // Generic system audit logs
    auditLogData.push({
      id: generateUUIDv7(),
      user_id: adminUser.id,
      action_type: 'create' as const,
      entity_type: 'instruction',
      entity_id: generateUUIDv7(),
      before_state: null,
      after_state: {
        subject_code: 'CS101',
        subject_name: 'Introduction to Computer Science',
        credits: 3,
        curriculum_year: '2025-2026',
      },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    });

    auditLogData.push({
      id: generateUUIDv7(),
      user_id: adminUser.id,
      action_type: 'delete' as const,
      entity_type: 'enrollment',
      entity_id: generateUUIDv7(),
      before_state: {
        student_id: existingStudents[0]?.id || generateUUIDv7(),
        instruction_id: generateUUIDv7(),
        semester: '1st',
        academic_year: '2025-2026',
        enrollment_status: 'dropped',
      },
      after_state: null,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    });

    // Recent audit logs
    auditLogData.push({
      id: generateUUIDv7(),
      user_id: adminUser.id,
      action_type: 'update' as const,
      entity_type: 'event',
      entity_id: generateUUIDv7(),
      before_state: {
        event_name: 'Tech Conference 2026',
        event_type: 'seminar',
        event_date: '2026-04-15',
        max_participants: 100,
      },
      after_state: {
        event_name: 'Tech Conference 2026',
        event_type: 'seminar',
        event_date: '2026-04-15',
        max_participants: 150,
      },
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    });

    auditLogData.push({
      id: generateUUIDv7(),
      user_id: adminUser.id,
      action_type: 'create' as const,
      entity_type: 'research',
      entity_id: generateUUIDv7(),
      before_state: null,
      after_state: {
        title: 'Machine Learning Applications in Healthcare',
        research_type: 'thesis',
        status: 'ongoing',
        start_date: '2026-01-15',
      },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    });

    // Insert audit logs
    if (auditLogData.length > 0) {
      await db.insert(auditLogs).values(auditLogData);
      console.log(`✅ Seeded ${auditLogData.length} audit log entries`);
    } else {
      console.log('⚠️  No audit log data to seed');
    }

    console.log('✅ Audit logs seeding completed');
  } catch (error) {
    console.error('❌ Error seeding audit logs:', error);
    throw error;
  }
}

// Run seeder if executed directly
if (require.main === module) {
  seedAuditLogs()
    .then(() => {
      console.log('✅ Audit logs seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Audit logs seeding failed:', error);
      process.exit(1);
    });
}
