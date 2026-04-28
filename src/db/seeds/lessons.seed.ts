import { Database } from '../index';
import { lessons, subjects } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface LessonSeed {
  subjectCode: string;
  week: number;
  title: string;
  description: string;
  type: string;
  contentType: 'file' | 'link';
  externalLink?: string;
}

const lessonSeeds: LessonSeed[] = [
  // CS101 Lessons
  {
    subjectCode: 'CS101',
    week: 1,
    title: 'Introduction to Computer Science',
    description: 'Overview of computer science, history, and career paths',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs101-week1',
  },
  {
    subjectCode: 'CS101',
    week: 2,
    title: 'Problem Solving Fundamentals',
    description: 'Algorithmic thinking and problem decomposition',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs101-week2',
  },
  {
    subjectCode: 'CS101',
    week: 3,
    title: 'Introduction to Programming',
    description: 'Basic programming concepts and syntax',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs101-week3',
  },

  // CS102 Lessons
  {
    subjectCode: 'CS102',
    week: 1,
    title: 'Python Basics',
    description: 'Variables, data types, and basic operations',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs102-week1',
  },
  {
    subjectCode: 'CS102',
    week: 2,
    title: 'Control Structures',
    description: 'If statements, loops, and conditional logic',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs102-week2',
  },
  {
    subjectCode: 'CS102',
    week: 3,
    title: 'Functions and Modules',
    description: 'Creating and using functions, importing modules',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs102-week3',
  },
  {
    subjectCode: 'CS102',
    week: 4,
    title: 'Lab: Basic Python Programs',
    description: 'Hands-on practice with Python programming',
    type: 'laboratory',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs102-lab1',
  },

  // CS201 Lessons
  {
    subjectCode: 'CS201',
    week: 1,
    title: 'Introduction to Data Structures',
    description: 'Overview of data structures and their importance',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs201-week1',
  },
  {
    subjectCode: 'CS201',
    week: 2,
    title: 'Arrays and Linked Lists',
    description: 'Implementation and analysis of arrays and linked lists',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs201-week2',
  },
  {
    subjectCode: 'CS201',
    week: 3,
    title: 'Stacks and Queues',
    description: 'Stack and queue operations and applications',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs201-week3',
  },
  {
    subjectCode: 'CS201',
    week: 4,
    title: 'Trees and Binary Search Trees',
    description: 'Tree structures and BST operations',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs201-week4',
  },

  // CS202 Lessons
  {
    subjectCode: 'CS202',
    week: 1,
    title: 'Introduction to OOP',
    description: 'Object-oriented programming concepts and principles',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs202-week1',
  },
  {
    subjectCode: 'CS202',
    week: 2,
    title: 'Classes and Objects',
    description: 'Creating classes, objects, and methods in Java',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs202-week2',
  },
  {
    subjectCode: 'CS202',
    week: 3,
    title: 'Inheritance and Polymorphism',
    description: 'Implementing inheritance hierarchies and polymorphic behavior',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs202-week3',
  },

  // CS203 Lessons
  {
    subjectCode: 'CS203',
    week: 1,
    title: 'Introduction to Databases',
    description: 'Database concepts and relational model',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs203-week1',
  },
  {
    subjectCode: 'CS203',
    week: 2,
    title: 'SQL Fundamentals',
    description: 'Basic SQL queries and data manipulation',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs203-week2',
  },
  {
    subjectCode: 'CS203',
    week: 3,
    title: 'Database Design and Normalization',
    description: 'ER diagrams and normalization techniques',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs203-week3',
  },
  {
    subjectCode: 'CS203',
    week: 4,
    title: 'Lab: SQL Practice',
    description: 'Hands-on SQL query writing and database design',
    type: 'laboratory',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs203-lab1',
  },

  // CS301 Lessons
  {
    subjectCode: 'CS301',
    week: 1,
    title: 'Software Development Lifecycle',
    description: 'SDLC phases and methodologies',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs301-week1',
  },
  {
    subjectCode: 'CS301',
    week: 2,
    title: 'Requirements Engineering',
    description: 'Gathering and documenting requirements',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs301-week2',
  },
  {
    subjectCode: 'CS301',
    week: 3,
    title: 'Agile Methodologies',
    description: 'Scrum, Kanban, and agile practices',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs301-week3',
  },

  // CS302 Lessons
  {
    subjectCode: 'CS302',
    week: 1,
    title: 'HTML and CSS Fundamentals',
    description: 'Building web pages with HTML and CSS',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs302-week1',
  },
  {
    subjectCode: 'CS302',
    week: 2,
    title: 'JavaScript Basics',
    description: 'Client-side scripting with JavaScript',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs302-week2',
  },
  {
    subjectCode: 'CS302',
    week: 3,
    title: 'Frontend Frameworks',
    description: 'Introduction to React and Vue.js',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs302-week3',
  },
  {
    subjectCode: 'CS302',
    week: 4,
    title: 'Backend Development',
    description: 'Node.js and Express.js for server-side development',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs302-week4',
  },

  // CS401 Lessons
  {
    subjectCode: 'CS401',
    week: 1,
    title: 'Introduction to AI',
    description: 'History and fundamentals of artificial intelligence',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs401-week1',
  },
  {
    subjectCode: 'CS401',
    week: 2,
    title: 'Machine Learning Basics',
    description: 'Supervised and unsupervised learning',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs401-week2',
  },
  {
    subjectCode: 'CS401',
    week: 3,
    title: 'Neural Networks',
    description: 'Introduction to neural networks and deep learning',
    type: 'lecture',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs401-week3',
  },
  {
    subjectCode: 'CS401',
    week: 4,
    title: 'Lab: ML Model Training',
    description: 'Hands-on practice with machine learning frameworks',
    type: 'laboratory',
    contentType: 'link',
    externalLink: 'https://example.com/lessons/cs401-lab1',
  },
];

export async function seedLessons(db: Database) {
  const createdLessons: { id: string; title: string }[] = [];

  console.log('  Creating lessons...');

  // Get subject IDs
  const subjectRecords = await db.select().from(subjects);
  const subjectMap = new Map(subjectRecords.map(s => [s.code, s.id]));

  for (const seed of lessonSeeds) {
    const subjectId = subjectMap.get(seed.subjectCode);
    
    if (!subjectId) {
      console.log(`  - Skipping lesson for ${seed.subjectCode}: subject not found`);
      continue;
    }

    const id = generateUUIDv7();

    const [lesson] = await db
      .insert(lessons)
      .values({
        id,
        subject_id: subjectId,
        week: seed.week,
        title: seed.title,
        description: seed.description,
        type: seed.type,
        content_type: seed.contentType,
        external_link: seed.externalLink,
      })
      .returning({ id: lessons.id, title: lessons.title });

    createdLessons.push(lesson);
    console.log(`  - Created lesson: ${seed.subjectCode} Week ${seed.week} - ${seed.title}`);
  }

  return createdLessons;
}
