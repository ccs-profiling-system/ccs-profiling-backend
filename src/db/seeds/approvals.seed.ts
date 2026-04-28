import { Database } from '../index';
import { approvals, ApprovalStatus, Category } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface ApprovalSeedInput {
  entity_type: 'student' | 'faculty' | 'event' | 'research';
  entity_id: string;
  category: string;
  status: string;
  department_id: string;
  change_details: Record<string, unknown>;
  original_data: Record<string, unknown>;
  comments?: string;
  daysAgoSubmitted: number;
  daysAgoDecided?: number;
}

export async function seedApprovals(
  db: Database,
  studentIds: string[],
  facultyIds: string[],
  eventIds: string[],
  researchIds: string[],
  userIds: Array<{ id: string; role: string; email: string }>
) {
  const createdApprovalIds: string[] = [];
  const secretaryUser =
    userIds.find((user) => user.role === 'secretary' && user.email === 'secretary@ccs.edu') ||
    userIds.find((user) => user.role === 'secretary');

  if (!secretaryUser) {
    console.warn('⚠️  No secretary user found, skipping approvals seeding');
    return createdApprovalIds;
  }

  console.log('  Creating approval workflow records...');

  const daysAgo = (count: number) => {
    const date = new Date();
    date.setDate(date.getDate() - count);
    return date;
  };

  const seeds: ApprovalSeedInput[] = [
    {
      entity_type: 'student',
      entity_id: studentIds[0] || generateUUIDv7(),
      category: Category.PROFILE,
      status: ApprovalStatus.PENDING,
      department_id: 'BS Computer Science',
      change_details: {
        email: 'alice.updated@example.com',
        year_level: 3,
      },
      original_data: {
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@example.com',
        year_level: 2,
      },
      daysAgoSubmitted: 2,
    },
    {
      entity_type: 'student',
      entity_id: studentIds[1] || generateUUIDv7(),
      category: Category.PROFILE,
      status: ApprovalStatus.PENDING,
      department_id: 'BS Computer Science',
      change_details: {
        phone: '09181234567',
        address: 'Updated Quezon City Address',
      },
      original_data: {
        first_name: 'Bob',
        last_name: 'Johnson',
        phone: '09170000000',
        address: 'Old Manila Address',
      },
      daysAgoSubmitted: 1,
    },
    {
      entity_type: 'faculty',
      entity_id: facultyIds[0] || generateUUIDv7(),
      category: Category.PROFILE,
      status: ApprovalStatus.APPROVED,
      department_id: 'Computer Science',
      change_details: {
        position: 'Senior Professor',
        specialization: 'Artificial Intelligence and Data Science',
      },
      original_data: {
        first_name: 'John',
        last_name: 'Doe',
        position: 'Professor',
        specialization: 'Artificial Intelligence',
      },
      comments: 'Credentials verified and approved.',
      daysAgoSubmitted: 5,
      daysAgoDecided: 3,
    },
    {
      entity_type: 'event',
      entity_id: eventIds[0] || generateUUIDv7(),
      category: Category.EVENT,
      status: ApprovalStatus.REJECTED,
      department_id: 'Computer Science',
      change_details: {
        event_name: 'AI Colloquium 2026',
        location: 'Main Auditorium',
      },
      original_data: {
        event_name: 'AI Colloquium',
        location: 'Room 204',
      },
      comments: 'Please attach the updated program flow before resubmitting.',
      daysAgoSubmitted: 6,
      daysAgoDecided: 4,
    },
    {
      entity_type: 'research',
      entity_id: researchIds[0] || generateUUIDv7(),
      category: Category.RESEARCH,
      status: ApprovalStatus.PENDING,
      department_id: 'BS Computer Science',
      change_details: {
        title: 'AI Assisted Learning Platform',
        status: 'ongoing',
      },
      original_data: {
        title: 'Adaptive Learning Platform',
        status: 'draft',
      },
      daysAgoSubmitted: 3,
    },
    {
      entity_type: 'faculty',
      entity_id: facultyIds[1] || generateUUIDv7(),
      category: Category.PROFILE,
      status: ApprovalStatus.PENDING,
      department_id: 'Information Technology',
      change_details: {
        office_location: 'Room 305',
      },
      original_data: {
        first_name: 'Jane',
        last_name: 'Smith',
        office_location: 'Room 301',
      },
      daysAgoSubmitted: 2,
    },
  ];

  for (const seed of seeds) {
    const id = generateUUIDv7();
    const submissionDate = daysAgo(seed.daysAgoSubmitted);
    const decisionDate =
      typeof seed.daysAgoDecided === 'number' ? daysAgo(seed.daysAgoDecided) : null;

    const [approval] = await db
      .insert(approvals)
      .values({
        id,
        entity_type: seed.entity_type,
        entity_id: seed.entity_id,
        category: seed.category,
        change_details: seed.change_details,
        original_data: seed.original_data,
        status: seed.status,
        submitter_id: secretaryUser.id,
        submission_timestamp: submissionDate,
        decision_timestamp: decisionDate,
        comments: seed.comments ?? null,
        department_id: seed.department_id,
        entity_version: 1,
        retry_count: 0,
      })
      .returning({ id: approvals.id });

    createdApprovalIds.push(approval.id);
  }

  return createdApprovalIds;
}
