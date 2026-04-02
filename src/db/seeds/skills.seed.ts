import { Database } from '../index';
import { skills } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface SkillSeed {
  studentIndex: number;
  skillName: string;
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

/**
 * Skills seeds for students
 * 
 * Student distribution:
 * - Student 0 (Alice): Year 4 - Advanced skills
 * - Student 1 (Bob): Year 3 - Intermediate to advanced skills
 * - Student 2 (Charlie): Year 2 - Beginner to intermediate skills
 * - Student 3 (Diana): Year 1 - Beginner skills
 * - Student 4 (Edward): Year 4 - Advanced skills
 */
const skillSeeds: SkillSeed[] = [
  // Alice (Student 0) - Year 4 Student
  {
    studentIndex: 0,
    skillName: 'JavaScript',
    proficiencyLevel: 'expert',
    yearsOfExperience: 4,
  },
  {
    studentIndex: 0,
    skillName: 'TypeScript',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },
  {
    studentIndex: 0,
    skillName: 'React',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },
  {
    studentIndex: 0,
    skillName: 'Node.js',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },
  {
    studentIndex: 0,
    skillName: 'Python',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },

  // Bob (Student 1) - Year 3 Student
  {
    studentIndex: 1,
    skillName: 'Java',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },
  {
    studentIndex: 1,
    skillName: 'Python',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },
  {
    studentIndex: 1,
    skillName: 'SQL',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },
  {
    studentIndex: 1,
    skillName: 'Git',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },

  // Charlie (Student 2) - Year 2 Student
  {
    studentIndex: 2,
    skillName: 'C++',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },
  {
    studentIndex: 2,
    skillName: 'Python',
    proficiencyLevel: 'beginner',
    yearsOfExperience: 1,
  },
  {
    studentIndex: 2,
    skillName: 'HTML/CSS',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },

  // Diana (Student 3) - Year 1 Student
  {
    studentIndex: 3,
    skillName: 'Python',
    proficiencyLevel: 'beginner',
    yearsOfExperience: 1,
  },
  {
    studentIndex: 3,
    skillName: 'HTML/CSS',
    proficiencyLevel: 'beginner',
    yearsOfExperience: 1,
  },

  // Edward (Student 4) - Year 4 Student
  {
    studentIndex: 4,
    skillName: 'C#',
    proficiencyLevel: 'expert',
    yearsOfExperience: 4,
  },
  {
    studentIndex: 4,
    skillName: '.NET',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },
  {
    studentIndex: 4,
    skillName: 'Azure',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },
  {
    studentIndex: 4,
    skillName: 'Docker',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 2,
  },
];

export async function seedSkills(
  db: Database,
  studentIds: string[]
) {
  const createdRecords: string[] = [];

  console.log('  Creating skill records...');

  for (const seed of skillSeeds) {
    if (seed.studentIndex >= studentIds.length) {
      console.warn(`  ⚠️  Skipping skill: student index ${seed.studentIndex} out of range`);
      continue;
    }

    const studentId = studentIds[seed.studentIndex];
    const id = generateUUIDv7();

    try {
      const [record] = await db
        .insert(skills)
        .values({
          id,
          student_id: studentId,
          skill_name: seed.skillName,
          proficiency_level: seed.proficiencyLevel,
          years_of_experience: seed.yearsOfExperience,
        })
        .returning({ id: skills.id });

      createdRecords.push(record.id);
      console.log(
        `  - Created: Student ${seed.studentIndex} → ${seed.skillName} ` +
        `(${seed.proficiencyLevel || 'N/A'}, ${seed.yearsOfExperience || 0} years)`
      );
    } catch (error: any) {
      console.error(
        `  ❌ Error creating skill for Student ${seed.studentIndex} → ${seed.skillName}:`,
        error.message
      );
      throw error;
    }
  }

  return createdRecords;
}
