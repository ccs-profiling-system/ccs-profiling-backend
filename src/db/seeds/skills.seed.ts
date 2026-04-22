import { Database } from '../index';
import { skills } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface SkillSeed {
  studentIndex: number;
  skillName: string;
  category: 'technical' | 'soft' | 'sports' | 'other';
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
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 4,
  },
  {
    studentIndex: 0,
    skillName: 'TypeScript',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },
  {
    studentIndex: 0,
    skillName: 'React',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },
  {
    studentIndex: 0,
    skillName: 'Node.js',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },
  {
    studentIndex: 0,
    skillName: 'Python',
    category: 'technical',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },

  // Bob (Student 1) - Year 3 Student
  {
    studentIndex: 1,
    skillName: 'Java',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },
  {
    studentIndex: 1,
    skillName: 'Python',
    category: 'technical',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },
  {
    studentIndex: 1,
    skillName: 'SQL',
    category: 'technical',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },
  {
    studentIndex: 1,
    skillName: 'Git',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },

  // Charlie (Student 2) - Year 2 Student
  {
    studentIndex: 2,
    skillName: 'C++',
    category: 'technical',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },
  {
    studentIndex: 2,
    skillName: 'Python',
    category: 'technical',
    proficiencyLevel: 'beginner',
    yearsOfExperience: 1,
  },
  {
    studentIndex: 2,
    skillName: 'HTML/CSS',
    category: 'technical',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },

  // Diana (Student 3) - Year 1 Student
  {
    studentIndex: 3,
    skillName: 'Python',
    category: 'technical',
    proficiencyLevel: 'beginner',
    yearsOfExperience: 1,
  },
  {
    studentIndex: 3,
    skillName: 'HTML/CSS',
    category: 'technical',
    proficiencyLevel: 'beginner',
    yearsOfExperience: 1,
  },

  // Edward (Student 4) - Year 4 Student
  {
    studentIndex: 4,
    skillName: 'C#',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 4,
  },
  {
    studentIndex: 4,
    skillName: '.NET',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 3,
  },
  {
    studentIndex: 4,
    skillName: 'Azure',
    category: 'technical',
    proficiencyLevel: 'intermediate',
    yearsOfExperience: 2,
  },
  {
    studentIndex: 4,
    skillName: 'Docker',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 2,
  },
];

const skillTemplates = [
  { name: 'JavaScript', category: 'technical' as const },
  { name: 'TypeScript', category: 'technical' as const },
  { name: 'Python', category: 'technical' as const },
  { name: 'Java', category: 'technical' as const },
  { name: 'C++', category: 'technical' as const },
  { name: 'C#', category: 'technical' as const },
  { name: 'React', category: 'technical' as const },
  { name: 'Node.js', category: 'technical' as const },
  { name: 'SQL', category: 'technical' as const },
  { name: 'Git', category: 'technical' as const },
  { name: 'Docker', category: 'technical' as const },
  { name: 'HTML/CSS', category: 'technical' as const },
  { name: 'Leadership', category: 'soft' as const },
  { name: 'Communication', category: 'soft' as const },
  { name: 'Teamwork', category: 'soft' as const },
  { name: 'Problem Solving', category: 'soft' as const },
];

const proficiencyLevels: Array<'beginner' | 'intermediate' | 'advanced' | 'expert'> = [
  'beginner', 'intermediate', 'advanced', 'expert'
];

export async function seedSkills(
  db: Database,
  studentIds: string[]
) {
  console.log('  Creating skill records...');

  const skillsToInsert = [];

  for (const studentId of studentIds) {
    // Each student gets 3-7 random skills
    const skillCount = Math.floor(Math.random() * 5) + 3;
    const selectedSkills = [...skillTemplates]
      .sort(() => Math.random() - 0.5)
      .slice(0, skillCount);

    for (const skill of selectedSkills) {
      const id = generateUUIDv7();
      const proficiencyLevel = proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)];
      const yearsOfExperience = Math.floor(Math.random() * 5) + 1;

      skillsToInsert.push({
        id,
        student_id: studentId,
        skill_name: skill.name,
        category: skill.category,
        proficiency_level: proficiencyLevel,
        years_of_experience: yearsOfExperience,
      });
    }
  }

  // Batch insert in chunks of 500
  const chunkSize = 500;
  const createdRecords: string[] = [];
  
  for (let i = 0; i < skillsToInsert.length; i += chunkSize) {
    const chunk = skillsToInsert.slice(i, i + chunkSize);
    const inserted = await db.insert(skills).values(chunk).returning({ id: skills.id });
    createdRecords.push(...inserted.map(s => s.id));
    console.log(`  - Inserted ${inserted.length} skills (${i + inserted.length}/${skillsToInsert.length})`);
  }

  console.log(`  ✅ Created ${createdRecords.length} skill records for ${studentIds.length} students`);

  return createdRecords;
}
