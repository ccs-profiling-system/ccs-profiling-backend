import { Database } from '../index';
import { subjects, curriculum } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';
import { eq } from 'drizzle-orm';

interface SubjectSeed {
  code: string;
  name: string;
  units: number;
  semester: number;
  yearLevel: number;
  description: string;
  prerequisites: string[];
  corequisites: string[];
  type: string;
  lectureHours: number;
  laboratoryHours: number;
  objectives: string[];
  topics: string[];
  curriculumCode: string;
}

const subjectSeeds: SubjectSeed[] = [
  // First Year - First Semester
  {
    code: 'CS101',
    name: 'Introduction to Computer Science',
    units: 3,
    semester: 1,
    yearLevel: 1,
    description: 'Fundamentals of computer science, problem-solving, and programming basics',
    prerequisites: [],
    corequisites: [],
    type: 'core',
    lectureHours: 2,
    laboratoryHours: 1,
    objectives: [
      'Understand basic computer science concepts',
      'Develop problem-solving skills',
      'Learn fundamental programming concepts',
    ],
    topics: [
      'Computer systems overview',
      'Problem-solving techniques',
      'Algorithm basics',
      'Introduction to programming',
    ],
    curriculumCode: 'BSCS-2025',
  },
  {
    code: 'CS102',
    name: 'Computer Programming 1',
    units: 3,
    semester: 1,
    yearLevel: 1,
    description: 'Introduction to programming using Python',
    prerequisites: [],
    corequisites: ['CS101'],
    type: 'core',
    lectureHours: 2,
    laboratoryHours: 1,
    objectives: [
      'Master Python programming fundamentals',
      'Implement basic algorithms',
      'Develop debugging skills',
    ],
    topics: [
      'Variables and data types',
      'Control structures',
      'Functions and modules',
      'File handling',
    ],
    curriculumCode: 'BSCS-2025',
  },
  {
    code: 'MATH101',
    name: 'Calculus 1',
    units: 3,
    semester: 1,
    yearLevel: 1,
    description: 'Differential calculus and applications',
    prerequisites: [],
    corequisites: [],
    type: 'general_education',
    lectureHours: 3,
    laboratoryHours: 0,
    objectives: [
      'Understand limits and continuity',
      'Master differentiation techniques',
      'Apply calculus to real-world problems',
    ],
    topics: [
      'Limits and continuity',
      'Derivatives',
      'Applications of derivatives',
      'Optimization problems',
    ],
    curriculumCode: 'BSCS-2025',
  },
  {
    code: 'ENG101',
    name: 'English Communication',
    units: 3,
    semester: 1,
    yearLevel: 1,
    description: 'Academic writing and communication skills',
    prerequisites: [],
    corequisites: [],
    type: 'general_education',
    lectureHours: 3,
    laboratoryHours: 0,
    objectives: [
      'Develop academic writing skills',
      'Improve oral communication',
      'Enhance critical thinking',
    ],
    topics: [
      'Essay writing',
      'Research methods',
      'Presentation skills',
      'Critical analysis',
    ],
    curriculumCode: 'BSCS-2025',
  },

  // First Year - Second Semester
  {
    code: 'CS103',
    name: 'Computer Programming 2',
    units: 3,
    semester: 2,
    yearLevel: 1,
    description: 'Advanced programming concepts and data structures',
    prerequisites: ['CS102'],
    corequisites: [],
    type: 'core',
    lectureHours: 2,
    laboratoryHours: 1,
    objectives: [
      'Master advanced programming concepts',
      'Implement complex data structures',
      'Develop efficient algorithms',
    ],
    topics: [
      'Object-oriented programming',
      'Arrays and lists',
      'Stacks and queues',
      'Recursion',
    ],
    curriculumCode: 'BSCS-2025',
  },

  // Second Year - First Semester
  {
    code: 'CS201',
    name: 'Data Structures and Algorithms',
    units: 3,
    semester: 1,
    yearLevel: 2,
    description: 'Study of fundamental data structures and algorithm design',
    prerequisites: ['CS103'],
    corequisites: [],
    type: 'core',
    lectureHours: 2,
    laboratoryHours: 1,
    objectives: [
      'Understand advanced data structures',
      'Analyze algorithm complexity',
      'Implement efficient solutions',
    ],
    topics: [
      'Trees and graphs',
      'Sorting algorithms',
      'Searching algorithms',
      'Algorithm analysis',
    ],
    curriculumCode: 'BSCS-2025',
  },
  {
    code: 'CS202',
    name: 'Object-Oriented Programming',
    units: 3,
    semester: 1,
    yearLevel: 2,
    description: 'OOP principles using Java',
    prerequisites: ['CS103'],
    corequisites: [],
    type: 'core',
    lectureHours: 2,
    laboratoryHours: 1,
    objectives: [
      'Master OOP concepts',
      'Design class hierarchies',
      'Implement design patterns',
    ],
    topics: [
      'Classes and objects',
      'Inheritance and polymorphism',
      'Interfaces and abstract classes',
      'Design patterns',
    ],
    curriculumCode: 'BSCS-2025',
  },
  {
    code: 'CS203',
    name: 'Database Management Systems',
    units: 3,
    semester: 1,
    yearLevel: 2,
    description: 'Relational database design and SQL',
    prerequisites: ['CS103'],
    corequisites: [],
    type: 'core',
    lectureHours: 2,
    laboratoryHours: 1,
    objectives: [
      'Design normalized databases',
      'Write complex SQL queries',
      'Understand transaction management',
    ],
    topics: [
      'Relational model',
      'SQL fundamentals',
      'Database normalization',
      'Transactions and concurrency',
    ],
    curriculumCode: 'BSCS-2025',
  },
  {
    code: 'MATH201',
    name: 'Discrete Mathematics',
    units: 3,
    semester: 1,
    yearLevel: 2,
    description: 'Logic, sets, relations, and graph theory',
    prerequisites: ['MATH101'],
    corequisites: [],
    type: 'major',
    lectureHours: 3,
    laboratoryHours: 0,
    objectives: [
      'Understand mathematical logic',
      'Apply set theory',
      'Analyze graph problems',
    ],
    topics: [
      'Propositional logic',
      'Set theory',
      'Relations and functions',
      'Graph theory',
    ],
    curriculumCode: 'BSCS-2025',
  },

  // Third Year - First Semester
  {
    code: 'CS301',
    name: 'Software Engineering',
    units: 3,
    semester: 1,
    yearLevel: 3,
    description: 'Software development lifecycle and methodologies',
    prerequisites: ['CS202'],
    corequisites: [],
    type: 'core',
    lectureHours: 2,
    laboratoryHours: 1,
    objectives: [
      'Understand SDLC phases',
      'Apply agile methodologies',
      'Manage software projects',
    ],
    topics: [
      'Requirements engineering',
      'Software design',
      'Testing strategies',
      'Project management',
    ],
    curriculumCode: 'BSCS-2025',
  },
  {
    code: 'CS302',
    name: 'Web Development',
    units: 3,
    semester: 1,
    yearLevel: 3,
    description: 'Full-stack web application development',
    prerequisites: ['CS203'],
    corequisites: [],
    type: 'core',
    lectureHours: 2,
    laboratoryHours: 1,
    objectives: [
      'Build responsive web interfaces',
      'Develop RESTful APIs',
      'Deploy web applications',
    ],
    topics: [
      'HTML, CSS, JavaScript',
      'Frontend frameworks',
      'Backend development',
      'Database integration',
    ],
    curriculumCode: 'BSCS-2025',
  },
  {
    code: 'CS303',
    name: 'Operating Systems',
    units: 3,
    semester: 1,
    yearLevel: 3,
    description: 'OS concepts, processes, memory management',
    prerequisites: ['CS201'],
    corequisites: [],
    type: 'core',
    lectureHours: 2,
    laboratoryHours: 1,
    objectives: [
      'Understand OS architecture',
      'Implement process scheduling',
      'Manage memory allocation',
    ],
    topics: [
      'Process management',
      'Memory management',
      'File systems',
      'Concurrency',
    ],
    curriculumCode: 'BSCS-2025',
  },
  {
    code: 'CS304',
    name: 'Computer Networks',
    units: 3,
    semester: 1,
    yearLevel: 3,
    description: 'Network protocols, architecture, and security',
    prerequisites: ['CS201'],
    corequisites: [],
    type: 'core',
    lectureHours: 2,
    laboratoryHours: 1,
    objectives: [
      'Understand network layers',
      'Configure network devices',
      'Implement security measures',
    ],
    topics: [
      'OSI model',
      'TCP/IP protocols',
      'Network security',
      'Wireless networks',
    ],
    curriculumCode: 'BSCS-2025',
  },

  // Fourth Year - First Semester
  {
    code: 'CS401',
    name: 'Artificial Intelligence',
    units: 3,
    semester: 1,
    yearLevel: 4,
    description: 'AI fundamentals, machine learning, and neural networks',
    prerequisites: ['CS201', 'MATH201'],
    corequisites: [],
    type: 'major',
    lectureHours: 2,
    laboratoryHours: 1,
    objectives: [
      'Understand AI concepts',
      'Implement ML algorithms',
      'Build neural networks',
    ],
    topics: [
      'Search algorithms',
      'Machine learning basics',
      'Neural networks',
      'Deep learning',
    ],
    curriculumCode: 'BSCS-2025',
  },
  {
    code: 'CS402',
    name: 'Capstone Project 1',
    units: 3,
    semester: 1,
    yearLevel: 4,
    description: 'Research and design phase of capstone project',
    prerequisites: ['CS301'],
    corequisites: [],
    type: 'core',
    lectureHours: 1,
    laboratoryHours: 2,
    objectives: [
      'Conduct research',
      'Design system architecture',
      'Create project proposal',
    ],
    topics: [
      'Research methodology',
      'System design',
      'Project planning',
      'Documentation',
    ],
    curriculumCode: 'BSCS-2025',
  },

  // Fourth Year - Second Semester
  {
    code: 'CS403',
    name: 'Capstone Project 2',
    units: 3,
    semester: 2,
    yearLevel: 4,
    description: 'Implementation and deployment of capstone project',
    prerequisites: ['CS402'],
    corequisites: [],
    type: 'core',
    lectureHours: 1,
    laboratoryHours: 2,
    objectives: [
      'Implement project solution',
      'Test and deploy system',
      'Present final project',
    ],
    topics: [
      'System implementation',
      'Testing and debugging',
      'Deployment strategies',
      'Project presentation',
    ],
    curriculumCode: 'BSCS-2025',
  },
];

export async function seedSubjects(db: Database) {
  const createdSubjects: { id: string; code: string }[] = [];

  console.log('  Creating subjects...');

  // Get curriculum IDs
  const curriculumRecords = await db.select().from(curriculum);
  const curriculumMap = new Map(curriculumRecords.map(c => [c.code, c.id]));

  for (const seed of subjectSeeds) {
    const curriculumId = curriculumMap.get(seed.curriculumCode);
    
    if (!curriculumId) {
      console.log(`  - Skipping subject ${seed.code}: curriculum ${seed.curriculumCode} not found`);
      continue;
    }

    const id = generateUUIDv7();

    const [subject] = await db
      .insert(subjects)
      .values({
        id,
        code: seed.code,
        name: seed.name,
        units: seed.units,
        semester: seed.semester,
        year_level: seed.yearLevel,
        description: seed.description,
        prerequisites: seed.prerequisites,
        corequisites: seed.corequisites,
        type: seed.type,
        lecture_hours: seed.lectureHours,
        laboratory_hours: seed.laboratoryHours,
        objectives: seed.objectives,
        topics: seed.topics,
        curriculum_id: curriculumId,
      })
      .returning({ id: subjects.id, code: subjects.code });

    createdSubjects.push(subject);
    console.log(`  - Created subject: ${seed.code} - ${seed.name}`);
  }

  return createdSubjects;
}
