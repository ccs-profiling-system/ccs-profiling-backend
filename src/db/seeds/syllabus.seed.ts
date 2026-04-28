import { Database } from '../index';
import { syllabus, subjects } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface SyllabusSeed {
  subjectCode: string;
  title: string;
  description: string;
  contentType: 'file' | 'link';
  externalLink?: string;
}

const syllabusSeeds: SyllabusSeed[] = [
  {
    subjectCode: 'CS101',
    title: 'CS101 - Introduction to Computer Science Syllabus',
    description: 'Course syllabus covering objectives, topics, grading criteria, and schedule',
    contentType: 'link',
    externalLink: 'https://example.com/syllabus/cs101',
  },
  {
    subjectCode: 'CS102',
    title: 'CS102 - Computer Programming 1 Syllabus',
    description: 'Comprehensive syllabus for Python programming course',
    contentType: 'link',
    externalLink: 'https://example.com/syllabus/cs102',
  },
  {
    subjectCode: 'CS201',
    title: 'CS201 - Data Structures and Algorithms Syllabus',
    description: 'Detailed course outline for data structures and algorithms',
    contentType: 'link',
    externalLink: 'https://example.com/syllabus/cs201',
  },
  {
    subjectCode: 'CS202',
    title: 'CS202 - Object-Oriented Programming Syllabus',
    description: 'Java OOP course syllabus with project requirements',
    contentType: 'link',
    externalLink: 'https://example.com/syllabus/cs202',
  },
  {
    subjectCode: 'CS203',
    title: 'CS203 - Database Management Systems Syllabus',
    description: 'Database course syllabus covering SQL and database design',
    contentType: 'link',
    externalLink: 'https://example.com/syllabus/cs203',
  },
  {
    subjectCode: 'CS301',
    title: 'CS301 - Software Engineering Syllabus',
    description: 'Software engineering methodologies and practices syllabus',
    contentType: 'link',
    externalLink: 'https://example.com/syllabus/cs301',
  },
  {
    subjectCode: 'CS302',
    title: 'CS302 - Web Development Syllabus',
    description: 'Full-stack web development course syllabus',
    contentType: 'link',
    externalLink: 'https://example.com/syllabus/cs302',
  },
  {
    subjectCode: 'CS401',
    title: 'CS401 - Artificial Intelligence Syllabus',
    description: 'AI and machine learning course syllabus',
    contentType: 'link',
    externalLink: 'https://example.com/syllabus/cs401',
  },
];

export async function seedSyllabus(db: Database) {
  const createdSyllabus: { id: string; title: string }[] = [];

  console.log('  Creating syllabus...');

  // Get subject IDs
  const subjectRecords = await db.select().from(subjects);
  const subjectMap = new Map(subjectRecords.map(s => [s.code, s.id]));

  for (const seed of syllabusSeeds) {
    const subjectId = subjectMap.get(seed.subjectCode);
    
    if (!subjectId) {
      console.log(`  - Skipping syllabus for ${seed.subjectCode}: subject not found`);
      continue;
    }

    const id = generateUUIDv7();

    const [syl] = await db
      .insert(syllabus)
      .values({
        id,
        subject_id: subjectId,
        title: seed.title,
        description: seed.description,
        content_type: seed.contentType,
        external_link: seed.externalLink,
      })
      .returning({ id: syllabus.id, title: syllabus.title });

    createdSyllabus.push(syl);
    console.log(`  - Created syllabus: ${seed.title}`);
  }

  return createdSyllabus;
}
