import { Database } from '../index';
import { instructions } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface InstructionSeed {
  subjectCode: string;
  subjectName: string;
  description: string;
  credits: number;
  curriculumYear: string;
}

const instructionSeeds: InstructionSeed[] = [
  // First Year - 2025-2026
  {
    subjectCode: 'CS101',
    subjectName: 'Introduction to Computer Science',
    description: 'Fundamentals of computer science, problem-solving, and programming basics',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  {
    subjectCode: 'CS102',
    subjectName: 'Computer Programming 1',
    description: 'Introduction to programming using Python',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  {
    subjectCode: 'MATH101',
    subjectName: 'Calculus 1',
    description: 'Differential calculus and applications',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  {
    subjectCode: 'ENG101',
    subjectName: 'English Communication',
    description: 'Academic writing and communication skills',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  
  // Second Year - 2025-2026
  {
    subjectCode: 'CS201',
    subjectName: 'Data Structures and Algorithms',
    description: 'Study of fundamental data structures and algorithm design',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  {
    subjectCode: 'CS202',
    subjectName: 'Object-Oriented Programming',
    description: 'OOP principles using Java',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  {
    subjectCode: 'CS203',
    subjectName: 'Database Management Systems',
    description: 'Relational database design and SQL',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  {
    subjectCode: 'MATH201',
    subjectName: 'Discrete Mathematics',
    description: 'Logic, sets, relations, and graph theory',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  
  // Third Year - 2025-2026
  {
    subjectCode: 'CS301',
    subjectName: 'Software Engineering',
    description: 'Software development lifecycle and methodologies',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  {
    subjectCode: 'CS302',
    subjectName: 'Web Development',
    description: 'Full-stack web application development',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  {
    subjectCode: 'CS303',
    subjectName: 'Operating Systems',
    description: 'OS concepts, processes, memory management',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  {
    subjectCode: 'CS304',
    subjectName: 'Computer Networks',
    description: 'Network protocols, architecture, and security',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  
  // Fourth Year - 2025-2026
  {
    subjectCode: 'CS401',
    subjectName: 'Artificial Intelligence',
    description: 'AI fundamentals, machine learning, and neural networks',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  {
    subjectCode: 'CS402',
    subjectName: 'Capstone Project 1',
    description: 'Research and design phase of capstone project',
    credits: 3,
    curriculumYear: '2025-2026',
  },
  {
    subjectCode: 'CS403',
    subjectName: 'Capstone Project 2',
    description: 'Implementation and deployment of capstone project',
    credits: 3,
    curriculumYear: '2025-2026',
  },
];

export async function seedInstructions(db: Database) {
  const createdInstructions: string[] = [];

  console.log('  Creating instructions...');

  for (const seed of instructionSeeds) {
    const id = generateUUIDv7();

    const [instruction] = await db
      .insert(instructions)
      .values({
        id,
        subject_code: seed.subjectCode,
        subject_name: seed.subjectName,
        description: seed.description,
        credits: seed.credits,
        curriculum_year: seed.curriculumYear,
      })
      .returning({ id: instructions.id, subject_code: instructions.subject_code });

    createdInstructions.push(instruction.id);
    console.log(`  - Created instruction: ${seed.subjectCode} - ${seed.subjectName}`);
  }

  return createdInstructions;
}
