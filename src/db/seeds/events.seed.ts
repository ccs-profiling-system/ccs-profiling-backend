import { Database } from '../index';
import { events, eventParticipants } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface EventSeed {
  eventName: string;
  eventType: 'seminar' | 'workshop' | 'defense' | 'competition';
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants?: number;
}

const eventSeeds: EventSeed[] = [
  {
    eventName: 'Introduction to Machine Learning Workshop',
    eventType: 'workshop',
    description: 'Hands-on workshop covering the basics of machine learning and neural networks',
    eventDate: '2026-04-15',
    startTime: '09:00:00',
    endTime: '12:00:00',
    location: 'Computer Lab 1',
    maxParticipants: 30,
  },
  {
    eventName: 'Web Development Bootcamp',
    eventType: 'workshop',
    description: 'Intensive workshop on modern web development with React and Node.js',
    eventDate: '2026-04-20',
    startTime: '13:00:00',
    endTime: '17:00:00',
    location: 'Computer Lab 2',
    maxParticipants: 25,
  },
  {
    eventName: 'Cybersecurity Awareness Seminar',
    eventType: 'seminar',
    description: 'Understanding modern cybersecurity threats and best practices',
    eventDate: '2026-04-22',
    startTime: '14:00:00',
    endTime: '16:00:00',
    location: 'Auditorium',
    maxParticipants: 100,
  },
  {
    eventName: 'Annual Programming Competition',
    eventType: 'competition',
    description: 'Inter-department programming competition with prizes',
    eventDate: '2026-05-05',
    startTime: '08:00:00',
    endTime: '18:00:00',
    location: 'Main Hall',
    maxParticipants: 50,
  },
  {
    eventName: 'Capstone Project Defense - Batch 2026',
    eventType: 'defense',
    description: 'Final year students presenting their capstone projects',
    eventDate: '2026-05-10',
    startTime: '09:00:00',
    endTime: '17:00:00',
    location: 'Conference Room A',
  },
  {
    eventName: 'Cloud Computing Seminar',
    eventType: 'seminar',
    description: 'Introduction to cloud platforms and serverless architecture',
    eventDate: '2026-05-15',
    startTime: '10:00:00',
    endTime: '12:00:00',
    location: 'Room 301',
    maxParticipants: 40,
  },
  {
    eventName: 'Mobile App Development Workshop',
    eventType: 'workshop',
    description: 'Building cross-platform mobile apps with React Native',
    eventDate: '2026-05-20',
    startTime: '13:00:00',
    endTime: '16:00:00',
    location: 'Computer Lab 3',
    maxParticipants: 20,
  },
  {
    eventName: 'Hackathon 2026',
    eventType: 'competition',
    description: '24-hour hackathon for innovative software solutions',
    eventDate: '2026-06-01',
    startTime: '08:00:00',
    endTime: '08:00:00',
    location: 'Innovation Hub',
    maxParticipants: 60,
  },
  {
    eventName: 'AI Ethics and Society Seminar',
    eventType: 'seminar',
    description: 'Discussing ethical implications of artificial intelligence',
    eventDate: '2026-06-10',
    startTime: '15:00:00',
    endTime: '17:00:00',
    location: 'Auditorium',
    maxParticipants: 80,
  },
  {
    eventName: 'Database Optimization Workshop',
    eventType: 'workshop',
    description: 'Advanced techniques for database performance tuning',
    eventDate: '2026-06-15',
    startTime: '09:00:00',
    endTime: '12:00:00',
    location: 'Computer Lab 1',
    maxParticipants: 25,
  },
];

export async function seedEvents(db: Database, studentIds: string[], facultyIds: string[]) {
  const createdEventIds: string[] = [];

  console.log('  Creating events...');

  for (const seed of eventSeeds) {
    const id = generateUUIDv7();

    const [event] = await db
      .insert(events)
      .values({
        id,
        event_name: seed.eventName,
        event_type: seed.eventType,
        description: seed.description,
        event_date: seed.eventDate,
        start_time: seed.startTime,
        end_time: seed.endTime,
        location: seed.location,
        max_participants: seed.maxParticipants,
      })
      .returning({ id: events.id, event_name: events.event_name });

    createdEventIds.push(event.id);
    console.log(`  - Created event: ${seed.eventName}`);

    // Add some participants to each event
    const participantCount = Math.min(
      Math.floor(Math.random() * 10) + 5, // 5-15 participants
      seed.maxParticipants || 100
    );

    for (let i = 0; i < participantCount; i++) {
      const isStudent = Math.random() > 0.2; // 80% students, 20% faculty
      const participantId = generateUUIDv7();
      
      const roles = ['participant', 'organizer', 'speaker', 'facilitator'];
      const statuses = ['registered', 'attended', 'absent'];
      
      await db.insert(eventParticipants).values({
        id: participantId,
        event_id: event.id,
        student_id: isStudent && studentIds.length > 0 
          ? studentIds[Math.floor(Math.random() * studentIds.length)] 
          : null,
        faculty_id: !isStudent && facultyIds.length > 0 
          ? facultyIds[Math.floor(Math.random() * facultyIds.length)] 
          : null,
        participation_role: i === 0 ? 'organizer' : roles[Math.floor(Math.random() * roles.length)],
        attendance_status: statuses[Math.floor(Math.random() * statuses.length)],
      });
    }
  }

  console.log(`  - Created participants for ${createdEventIds.length} events`);

  return createdEventIds;
}
