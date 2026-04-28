import { Database } from '../index';
import { notifications } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface NotificationSeed {
  title: string;
  message: string;
  type: 'academic' | 'financial' | 'event' | 'system';
  is_read?: boolean;
  read_at?: Date | null;
  daysAgo: number; // How many days ago the notification was created
}

const notificationTemplates: NotificationSeed[] = [
  {
    title: 'Enrollment Period Open',
    message: 'The enrollment period for the next semester is now open. Please visit the registrar\'s office or use the online portal to enroll in your courses.',
    type: 'academic',
    is_read: false,
    daysAgo: 2,
  },
  {
    title: 'Midterm Grades Posted',
    message: 'Your midterm grades for the current semester have been posted. You can view them in your student portal under the Grades section.',
    type: 'academic',
    is_read: true,
    read_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    daysAgo: 5,
  },
  {
    title: 'Payment Reminder',
    message: 'This is a reminder that your tuition payment for the current semester is due in 7 days. Please settle your account to avoid late fees.',
    type: 'financial',
    is_read: false,
    daysAgo: 1,
  },
  {
    title: 'Research Opportunity Available',
    message: 'A new research opportunity in Machine Learning has been posted. The application deadline is in 2 weeks. Check the Research Opportunities section for more details.',
    type: 'academic',
    is_read: false,
    daysAgo: 3,
  },
  {
    title: 'Event Registration Confirmed',
    message: 'Your registration for "Introduction to Machine Learning Workshop" has been confirmed. The event will be held on April 15, 2026 at 9:00 AM in Computer Lab 1.',
    type: 'event',
    is_read: true,
    read_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    daysAgo: 7,
  },
  {
    title: 'System Maintenance Notice',
    message: 'The student portal will undergo scheduled maintenance on Saturday, April 25, 2026 from 2:00 AM to 6:00 AM. Services may be temporarily unavailable during this time.',
    type: 'system',
    is_read: false,
    daysAgo: 1,
  },
  {
    title: 'Scholarship Application Open',
    message: 'Applications for academic scholarships for the next academic year are now being accepted. Visit the scholarship office for requirements and application forms.',
    type: 'financial',
    is_read: false,
    daysAgo: 4,
  },
  {
    title: 'Class Schedule Updated',
    message: 'Your class schedule for CS301 (Software Engineering) has been updated. The new schedule is Monday and Wednesday, 1:00 PM - 2:30 PM in Room 305.',
    type: 'academic',
    is_read: true,
    read_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    daysAgo: 10,
  },
  {
    title: 'Upcoming Event: Hackathon 2026',
    message: 'Don\'t miss Hackathon 2026! Registration closes in 5 days. This is a great opportunity to showcase your skills and win prizes.',
    type: 'event',
    is_read: false,
    daysAgo: 2,
  },
  {
    title: 'Academic Advising Appointment',
    message: 'Your academic advising appointment with Prof. John Doe is scheduled for April 23, 2026 at 10:00 AM. Please prepare your questions about course selection.',
    type: 'academic',
    is_read: false,
    daysAgo: 1,
  },
];

export async function seedNotifications(db: Database, studentIds: string[]) {
  console.log('  Creating notifications...');

  const notificationsToInsert = [];

  // Create notifications for each student
  for (const studentId of studentIds) {
    // Each student gets 3-5 random notifications
    const notificationCount = Math.floor(Math.random() * 3) + 3; // 3-5 notifications
    const selectedTemplates = [...notificationTemplates]
      .sort(() => Math.random() - 0.5)
      .slice(0, notificationCount);

    for (const template of selectedTemplates) {
      const id = generateUUIDv7();
      const createdAt = new Date(Date.now() - template.daysAgo * 24 * 60 * 60 * 1000);

      notificationsToInsert.push({
        id,
        student_id: studentId,
        title: template.title,
        message: template.message,
        type: template.type,
        is_read: template.is_read || false,
        read_at: template.read_at || null,
        created_at: createdAt,
        updated_at: template.read_at || createdAt,
      });
    }
  }

  // Batch insert in chunks of 500 to avoid query size limits
  const chunkSize = 500;
  const createdNotifications: string[] = [];
  
  for (let i = 0; i < notificationsToInsert.length; i += chunkSize) {
    const chunk = notificationsToInsert.slice(i, i + chunkSize);
    const inserted = await db.insert(notifications).values(chunk).returning({ id: notifications.id });
    createdNotifications.push(...inserted.map(n => n.id));
    console.log(`  - Inserted ${inserted.length} notifications (${i + inserted.length}/${notificationsToInsert.length})`);
  }

  console.log(`  ✅ Created ${createdNotifications.length} notifications for ${studentIds.length} students`);

  return createdNotifications;
}
