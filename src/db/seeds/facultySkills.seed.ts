import { Database } from '../index';
import { facultySkills } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface FacultySkillSeed {
  facultyIndex: number;
  skillName: string;
  category: 'technical' | 'soft' | 'language' | 'sports' | 'other';
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

/**
 * Faculty Skills seeds
 * 
 * Faculty distribution:
 * - Faculty 0 (John Doe): Professor - AI Specialization
 * - Faculty 1 (Jane Smith): Associate Professor - Network Security
 * - Faculty 2 (Robert Johnson): Assistant Professor - Software Engineering
 * - Faculty 3 (Maria Garcia): Department Chair - CS Education
 */
const facultySkillSeeds: FacultySkillSeed[] = [
  // John Doe (Faculty 0) - AI Professor
  {
    facultyIndex: 0,
    skillName: 'Python',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 15,
  },
  {
    facultyIndex: 0,
    skillName: 'Machine Learning',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 12,
  },
  {
    facultyIndex: 0,
    skillName: 'TensorFlow',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 8,
  },
  {
    facultyIndex: 0,
    skillName: 'PyTorch',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 6,
  },
  {
    facultyIndex: 0,
    skillName: 'Deep Learning',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 10,
  },
  {
    facultyIndex: 0,
    skillName: 'Research Methodology',
    category: 'soft',
    proficiencyLevel: 'expert',
    yearsOfExperience: 15,
  },
  {
    facultyIndex: 0,
    skillName: 'English',
    category: 'language',
    proficiencyLevel: 'expert',
    yearsOfExperience: 20,
  },

  // Jane Smith (Faculty 1) - Network Security Associate Professor
  {
    facultyIndex: 1,
    skillName: 'Network Security',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 12,
  },
  {
    facultyIndex: 1,
    skillName: 'Cybersecurity',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 10,
  },
  {
    facultyIndex: 1,
    skillName: 'Penetration Testing',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 8,
  },
  {
    facultyIndex: 1,
    skillName: 'Cryptography',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 10,
  },
  {
    facultyIndex: 1,
    skillName: 'Linux Administration',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 12,
  },
  {
    facultyIndex: 1,
    skillName: 'Firewall Configuration',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 10,
  },
  {
    facultyIndex: 1,
    skillName: 'Team Leadership',
    category: 'soft',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 8,
  },
  {
    facultyIndex: 1,
    skillName: 'English',
    category: 'language',
    proficiencyLevel: 'expert',
    yearsOfExperience: 15,
  },

  // Robert Johnson (Faculty 2) - Software Engineering Assistant Professor
  {
    facultyIndex: 2,
    skillName: 'Java',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 10,
  },
  {
    facultyIndex: 2,
    skillName: 'JavaScript',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 8,
  },
  {
    facultyIndex: 2,
    skillName: 'TypeScript',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 5,
  },
  {
    facultyIndex: 2,
    skillName: 'Software Architecture',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 10,
  },
  {
    facultyIndex: 2,
    skillName: 'Agile Methodologies',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 8,
  },
  {
    facultyIndex: 2,
    skillName: 'React',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 6,
  },
  {
    facultyIndex: 2,
    skillName: 'Node.js',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 7,
  },
  {
    facultyIndex: 2,
    skillName: 'Docker',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 5,
  },
  {
    facultyIndex: 2,
    skillName: 'Communication',
    category: 'soft',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 10,
  },
  {
    facultyIndex: 2,
    skillName: 'English',
    category: 'language',
    proficiencyLevel: 'expert',
    yearsOfExperience: 12,
  },
  {
    facultyIndex: 2,
    skillName: 'Filipino',
    category: 'language',
    proficiencyLevel: 'expert',
    yearsOfExperience: 12,
  },

  // Maria Garcia (Faculty 3) - Department Chair, CS Education
  {
    facultyIndex: 3,
    skillName: 'Curriculum Development',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 15,
  },
  {
    facultyIndex: 3,
    skillName: 'Educational Technology',
    category: 'technical',
    proficiencyLevel: 'expert',
    yearsOfExperience: 12,
  },
  {
    facultyIndex: 3,
    skillName: 'Python',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 10,
  },
  {
    facultyIndex: 3,
    skillName: 'Java',
    category: 'technical',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 12,
  },
  {
    facultyIndex: 3,
    skillName: 'Leadership',
    category: 'soft',
    proficiencyLevel: 'expert',
    yearsOfExperience: 15,
  },
  {
    facultyIndex: 3,
    skillName: 'Public Speaking',
    category: 'soft',
    proficiencyLevel: 'expert',
    yearsOfExperience: 15,
  },
  {
    facultyIndex: 3,
    skillName: 'Mentoring',
    category: 'soft',
    proficiencyLevel: 'expert',
    yearsOfExperience: 15,
  },
  {
    facultyIndex: 3,
    skillName: 'Strategic Planning',
    category: 'soft',
    proficiencyLevel: 'expert',
    yearsOfExperience: 10,
  },
  {
    facultyIndex: 3,
    skillName: 'English',
    category: 'language',
    proficiencyLevel: 'expert',
    yearsOfExperience: 20,
  },
  {
    facultyIndex: 3,
    skillName: 'Spanish',
    category: 'language',
    proficiencyLevel: 'advanced',
    yearsOfExperience: 15,
  },
];

export async function seedFacultySkills(
  db: Database,
  facultyIds: string[]
) {
  const createdRecords: string[] = [];

  console.log('  Creating faculty skill records...');

  for (const seed of facultySkillSeeds) {
    if (seed.facultyIndex >= facultyIds.length) {
      console.warn(`  ⚠️  Skipping faculty skill: faculty index ${seed.facultyIndex} out of range`);
      continue;
    }

    const facultyId = facultyIds[seed.facultyIndex];
    const id = generateUUIDv7();

    try {
      const [record] = await db
        .insert(facultySkills)
        .values({
          id,
          faculty_id: facultyId,
          skill_name: seed.skillName,
          category: seed.category,
          proficiency_level: seed.proficiencyLevel,
          years_of_experience: seed.yearsOfExperience,
        })
        .returning({ id: facultySkills.id });

      createdRecords.push(record.id);
      console.log(
        `  - Created: Faculty ${seed.facultyIndex} → ${seed.skillName} ` +
        `(${seed.proficiencyLevel || 'N/A'}, ${seed.yearsOfExperience || 0} years)`
      );
    } catch (error: any) {
      console.error(
        `  ❌ Error creating faculty skill for Faculty ${seed.facultyIndex} → ${seed.skillName}:`,
        error.message
      );
      throw error;
    }
  }

  return createdRecords;
}
