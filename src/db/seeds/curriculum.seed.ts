import { Database } from '../index';
import { curriculum } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface CurriculumSeed {
  code: string;
  name: string;
  description: string;
  program: string;
  year: string;
  totalUnits: number;
  status: string;
  effectiveDate: string;
}

const curriculumSeeds: CurriculumSeed[] = [
  {
    code: 'BSCS-2024',
    name: 'Bachelor of Science in Computer Science 2024',
    description: 'Computer Science curriculum effective 2024, focusing on software development, algorithms, and emerging technologies',
    program: 'Computer Science',
    year: '2024',
    totalUnits: 120,
    status: 'active',
    effectiveDate: '2024-08-01',
  },
  {
    code: 'BSCS-2025',
    name: 'Bachelor of Science in Computer Science 2025',
    description: 'Updated Computer Science curriculum with enhanced AI and cybersecurity courses',
    program: 'Computer Science',
    year: '2025',
    totalUnits: 126,
    status: 'active',
    effectiveDate: '2025-08-01',
  },
  {
    code: 'BSIT-2024',
    name: 'Bachelor of Science in Information Technology 2024',
    description: 'Information Technology curriculum focusing on network administration and systems management',
    program: 'Information Technology',
    year: '2024',
    totalUnits: 120,
    status: 'active',
    effectiveDate: '2024-08-01',
  },
  {
    code: 'BSIS-2024',
    name: 'Bachelor of Science in Information Systems 2024',
    description: 'Information Systems curriculum emphasizing business processes and enterprise systems',
    program: 'Information Systems',
    year: '2024',
    totalUnits: 120,
    status: 'active',
    effectiveDate: '2024-08-01',
  },
];

export async function seedCurriculum(db: Database) {
  const createdCurriculum: { id: string; code: string }[] = [];

  console.log('  Creating curriculum...');

  for (const seed of curriculumSeeds) {
    const id = generateUUIDv7();

    const [curr] = await db
      .insert(curriculum)
      .values({
        id,
        code: seed.code,
        name: seed.name,
        description: seed.description,
        program: seed.program,
        year: seed.year,
        total_units: seed.totalUnits,
        status: seed.status,
        effective_date: seed.effectiveDate,
      })
      .returning({ id: curriculum.id, code: curriculum.code });

    createdCurriculum.push(curr);
    console.log(`  - Created curriculum: ${seed.code} - ${seed.name}`);
  }

  return createdCurriculum;
}
