import { Database } from '../index';
import { pendingChanges } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface PendingChangeSeed {
  entity_type: 'student' | 'faculty' | 'event' | 'research';
  entity_id: string;
  change_type: 'create' | 'update' | 'delete';
  old_values: any;
  new_values: any;
  status: 'pending_approval' | 'approved' | 'rejected' | 'withdrawn';
  created_by?: string;
}

/**
 * Seed pending changes
 * Creates sample pending changes for different entity types and statuses
 * 
 * @param db - Database instance
 * @param studentIds - Array of student IDs
 * @param facultyIds - Array of faculty IDs
 * @param eventIds - Array of event IDs
 * @param researchIds - Array of research IDs
 * @param userIds - Array of user IDs (for created_by)
 * @returns Array of created pending change IDs
 */
export async function seedPendingChanges(
  db: Database,
  studentIds: string[],
  facultyIds: string[],
  eventIds: string[],
  researchIds: string[],
  userIds: string[]
) {
  const createdIds: string[] = [];

  console.log('  Creating pending changes...');

  // Helper to get random item from array
  const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  
  // Get the first user ID (secretary user) - ensure it's a string
  const secretaryUserId = typeof userIds[0] === 'string' ? userIds[0] : (userIds[0] as any)?.id || null;

  // Create pending changes with different statuses
  const seeds: PendingChangeSeed[] = [
    // Pending approval - Student updates (3)
    {
      entity_type: 'student',
      entity_id: studentIds[0] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        year_level: 1,
        program: 'BS Computer Science',
        status: 'active',
      },
      new_values: {
        year_level: 2,
        program: 'BS Computer Science',
        status: 'active',
      },
      status: 'pending_approval',
      created_by: secretaryUserId,
    },
    {
      entity_type: 'student',
      entity_id: studentIds[1] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        email: 'old.email@student.ccs.edu',
        phone: '09171234567',
      },
      new_values: {
        email: 'new.email@student.ccs.edu',
        phone: '09187654321',
      },
      status: 'pending_approval',
      created_by: secretaryUserId,
    },
    {
      entity_type: 'student',
      entity_id: studentIds[2] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        address: '123 Old Street, Manila',
      },
      new_values: {
        address: '456 New Avenue, Quezon City',
      },
      status: 'pending_approval',
      created_by: secretaryUserId,
    },

    // Pending approval - Faculty updates (2)
    {
      entity_type: 'faculty',
      entity_id: facultyIds[0] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        position: 'Assistant Professor',
        specialization: 'Software Engineering',
      },
      new_values: {
        position: 'Associate Professor',
        specialization: 'Software Engineering & AI',
      },
      status: 'pending_approval',
      created_by: secretaryUserId,
    },
    {
      entity_type: 'faculty',
      entity_id: facultyIds[1] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        office_location: 'Room 301',
        consultation_hours: 'MWF 2-4 PM',
      },
      new_values: {
        office_location: 'Room 305',
        consultation_hours: 'TTH 1-3 PM',
      },
      status: 'pending_approval',
      created_by: secretaryUserId,
    },

    // Pending approval - Event updates (2)
    {
      entity_type: 'event',
      entity_id: eventIds[0] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        event_name: 'CS Seminar',
        location: 'Room 101',
        max_participants: 50,
      },
      new_values: {
        event_name: 'CS Seminar - Updated',
        location: 'Auditorium',
        max_participants: 100,
      },
      status: 'pending_approval',
      created_by: secretaryUserId,
    },
    {
      entity_type: 'event',
      entity_id: eventIds[1] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        event_date: '2026-05-15',
        start_time: '09:00:00',
      },
      new_values: {
        event_date: '2026-05-20',
        start_time: '10:00:00',
      },
      status: 'pending_approval',
      created_by: secretaryUserId,
    },

    // Approved changes (3)
    {
      entity_type: 'student',
      entity_id: studentIds[3] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        year_level: 2,
      },
      new_values: {
        year_level: 3,
      },
      status: 'approved',
      created_by: secretaryUserId,
    },
    {
      entity_type: 'faculty',
      entity_id: facultyIds[2] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        department: 'Computer Science',
      },
      new_values: {
        department: 'Information Technology',
      },
      status: 'approved',
      created_by: secretaryUserId,
    },
    {
      entity_type: 'event',
      entity_id: eventIds[2] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        status: 'draft',
      },
      new_values: {
        status: 'approved',
      },
      status: 'approved',
      created_by: secretaryUserId,
    },

    // Rejected changes (2)
    {
      entity_type: 'student',
      entity_id: studentIds[4] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        status: 'active',
      },
      new_values: {
        status: 'inactive',
      },
      status: 'rejected',
      created_by: secretaryUserId,
    },
    {
      entity_type: 'research',
      entity_id: researchIds[0] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        status: 'ongoing',
      },
      new_values: {
        status: 'completed',
      },
      status: 'rejected',
      created_by: secretaryUserId,
    },

    // Withdrawn changes (2)
    {
      entity_type: 'faculty',
      entity_id: facultyIds[3] || generateUUIDv7(),
      change_type: 'update',
      old_values: {
        email: 'old@ccs.edu',
      },
      new_values: {
        email: 'new@ccs.edu',
      },
      status: 'withdrawn',
      created_by: secretaryUserId,
    },
    {
      entity_type: 'event',
      entity_id: eventIds[3] || generateUUIDv7(),
      change_type: 'delete',
      old_values: {
        event_name: 'Cancelled Event',
        status: 'draft',
      },
      new_values: {}, // Empty object for delete operations
      status: 'withdrawn',
      created_by: secretaryUserId,
    },
  ];

  for (const seed of seeds) {
    const id = generateUUIDv7();

    await db.insert(pendingChanges).values({
      id,
      entity_type: seed.entity_type,
      entity_id: seed.entity_id,
      change_type: seed.change_type,
      old_values: seed.old_values,
      new_values: seed.new_values,
      status: seed.status,
      created_by: seed.created_by,
    });

    createdIds.push(id);
    console.log(`  - Created ${seed.status} ${seed.change_type} for ${seed.entity_type}`);
  }

  console.log(`  ✓ Created ${createdIds.length} pending changes`);
  console.log(`    - Pending approval: 7`);
  console.log(`    - Approved: 3`);
  console.log(`    - Rejected: 2`);
  console.log(`    - Withdrawn: 2`);

  return createdIds;
}
