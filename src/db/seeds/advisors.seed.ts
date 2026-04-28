import { Database } from '../index';
import { studentAdvisors, advisorMessages, advisorSlots, advisorAppointments } from '../schema/advisors';
import { generateUUIDv7 } from '../../shared/utils/uuid';

const studentMessages = [
  'Good day Professor! I would like to schedule a meeting to discuss my academic progress and course selection for next semester.',
  'Hello Sir/Ma\'am, I need guidance on choosing my elective courses. When would be a good time to meet?',
  'Professor, I\'m having difficulty with one of my courses. Could we schedule a consultation?',
  'Hi Professor, I would like to discuss potential research opportunities and internship options.',
  'Good afternoon! I need advice on my thesis topic. Are you available for a meeting this week?',
];

const facultyMessages = [
  'Hello! I\'ve reviewed your request. I have available slots this week. Please check my schedule and book an appointment.',
  'Good day! Let\'s discuss your concerns. I\'m available on Tuesday and Thursday afternoons.',
  'Hi! I\'d be happy to help you with course selection. Please book a slot through the appointment system.',
  'Thank you for reaching out. I have some time slots available next week. Looking forward to our discussion.',
  'Hello! I\'ve noted your concerns. Let\'s schedule a meeting to address them properly.',
];

function generateTimeSlots(baseDate: Date, _facultyId: string): Array<{
  slot_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_booked: boolean;
}> {
  const slots = [];
  const daysToGenerate = [1, 2, 3, 5, 8, 9, 10]; // Days from now

  for (const daysFromNow of daysToGenerate) {
    const slotDate = new Date(baseDate.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
    const formattedDate = slotDate.toISOString().split('T')[0];

    // Morning slots (9:00 AM - 11:00 AM)
    slots.push({
      slot_date: formattedDate,
      start_time: '09:00:00',
      end_time: '10:00:00',
      duration_minutes: 60,
      is_booked: Math.random() < 0.3, // 30% chance of being booked
    });

    slots.push({
      slot_date: formattedDate,
      start_time: '10:00:00',
      end_time: '11:00:00',
      duration_minutes: 60,
      is_booked: Math.random() < 0.3,
    });

    // Afternoon slots (2:00 PM - 4:00 PM)
    slots.push({
      slot_date: formattedDate,
      start_time: '14:00:00',
      end_time: '15:00:00',
      duration_minutes: 60,
      is_booked: Math.random() < 0.3,
    });

    slots.push({
      slot_date: formattedDate,
      start_time: '15:00:00',
      end_time: '16:00:00',
      duration_minutes: 60,
      is_booked: Math.random() < 0.3,
    });
  }

  return slots;
}

export async function seedAdvisors(
  db: Database,
  studentIds: string[],
  facultyIds: string[],
  userIds: Array<{ id: string; role: string }>
) {
  const createdAdvisors: string[] = [];
  const createdMessages: string[] = [];
  const createdSlots: string[] = [];
  const createdAppointments: string[] = [];

  console.log('  Creating student-advisor assignments...');

  // Assign each student to a random faculty advisor
  for (const studentId of studentIds) {
    const facultyId = facultyIds[Math.floor(Math.random() * facultyIds.length)];
    const id = generateUUIDv7();

    // Assignment date (30-180 days ago)
    const daysAgo = Math.floor(Math.random() * 151) + 30;
    const assignedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const formattedDate = assignedDate.toISOString().split('T')[0];

    await db.insert(studentAdvisors).values({
      id,
      student_id: studentId,
      faculty_id: facultyId,
      assigned_date: formattedDate,
    });

    createdAdvisors.push(id);

    // Create 0-3 messages between student and advisor
    const messageCount = Math.floor(Math.random() * 4); // 0-3 messages

    if (messageCount > 0) {
      const studentUser = userIds.find(u => u.role === 'student');
      const facultyUser = userIds.find(u => u.role === 'faculty');

      for (let i = 0; i < messageCount; i++) {
        const messageId = generateUUIDv7();
        const isStudentSender = i % 2 === 0; // Alternate between student and faculty
        const sender_role = isStudentSender ? 'student' : 'faculty';
        const sender_id = isStudentSender ? studentUser?.id : facultyUser?.id;
        const message_content = isStudentSender
          ? studentMessages[Math.floor(Math.random() * studentMessages.length)]
          : facultyMessages[Math.floor(Math.random() * facultyMessages.length)];

        const messageDaysAgo = 20 - (i * 5); // Spread messages over time
        const sentAt = new Date(Date.now() - messageDaysAgo * 24 * 60 * 60 * 1000);

        if (sender_id) {
          await db.insert(advisorMessages).values({
            id: messageId,
            student_id: studentId,
            faculty_id: facultyId,
            sender_id,
            sender_role,
            message_content,
            is_read: Math.random() < 0.7, // 70% chance of being read
            sent_at: sentAt,
          });

          createdMessages.push(messageId);
        }
      }
    }
  }

  console.log(`  - Created ${createdAdvisors.length} student-advisor assignments`);
  console.log(`  - Created ${createdMessages.length} advisor messages`);

  // Create advisor slots for each faculty member
  console.log('  Creating advisor appointment slots...');

  for (const facultyId of facultyIds) {
    const slots = generateTimeSlots(new Date(), facultyId);

    for (const slotData of slots) {
      const slotId = generateUUIDv7();

      await db.insert(advisorSlots).values({
        id: slotId,
        faculty_id: facultyId,
        slot_date: slotData.slot_date,
        start_time: slotData.start_time,
        end_time: slotData.end_time,
        duration_minutes: slotData.duration_minutes,
        is_booked: slotData.is_booked,
      });

      createdSlots.push(slotId);

      // If slot is booked, create an appointment
      if (slotData.is_booked) {
        const appointmentId = generateUUIDv7();
        // Find a student assigned to this faculty (unused for now, using random selection)
        // const assignedStudents = createdAdvisors.filter(async (advisorId) => {
        //   const advisor = await db.query.studentAdvisors.findFirst({
        //     where: (advisors, { eq }) => eq(advisors.faculty_id, facultyId),
        //   });
        //   return advisor !== undefined;
        // });

        const randomStudentId = studentIds[Math.floor(Math.random() * studentIds.length)];

        const purposes = [
          'Discuss course selection for next semester',
          'Academic progress review and guidance',
          'Thesis topic consultation',
          'Career planning and internship opportunities',
          'Course difficulty and study strategies',
        ];

        const purpose = purposes[Math.floor(Math.random() * purposes.length)];
        const status = Math.random() < 0.7 ? 'scheduled' : 'completed';

        await db.insert(advisorAppointments).values({
          id: appointmentId,
          student_id: randomStudentId,
          faculty_id: facultyId,
          slot_id: slotId,
          appointment_date: slotData.slot_date,
          start_time: slotData.start_time,
          end_time: slotData.end_time,
          purpose,
          status,
          advisor_notes: status === 'completed' 
            ? 'Meeting completed. Discussed student concerns and provided guidance.'
            : null,
        });

        createdAppointments.push(appointmentId);
      }
    }
  }

  console.log(`  - Created ${createdSlots.length} advisor appointment slots`);
  console.log(`  - Created ${createdAppointments.length} booked appointments`);

  return {
    advisorIds: createdAdvisors,
    messageIds: createdMessages,
    slotIds: createdSlots,
    appointmentIds: createdAppointments,
  };
}
