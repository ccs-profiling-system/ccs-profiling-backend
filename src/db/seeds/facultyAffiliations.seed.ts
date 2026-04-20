import { Database } from '../index';
import { facultyAffiliations } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface FacultyAffiliationSeed {
  facultyIndex: number;
  organizationName: string;
  type: 'professional' | 'academic' | 'community' | 'other';
  role?: string;
  startDate: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  isActive: boolean;
}

/**
 * Faculty Affiliations seeds
 * 
 * Faculty distribution:
 * - Faculty 0 (John Doe): Professor - AI Specialization
 * - Faculty 1 (Jane Smith): Associate Professor - Network Security
 * - Faculty 2 (Robert Johnson): Assistant Professor - Software Engineering
 * - Faculty 3 (Maria Garcia): Department Chair - CS Education
 */
const facultyAffiliationSeeds: FacultyAffiliationSeed[] = [
  // John Doe (Faculty 0) - AI Professor
  {
    facultyIndex: 0,
    organizationName: 'Association for Computing Machinery (ACM)',
    type: 'professional',
    role: 'Senior Member',
    startDate: '2010-01-15',
    isActive: true,
  },
  {
    facultyIndex: 0,
    organizationName: 'IEEE Computer Society',
    type: 'professional',
    role: 'Member',
    startDate: '2008-03-20',
    isActive: true,
  },
  {
    facultyIndex: 0,
    organizationName: 'International Neural Network Society',
    type: 'academic',
    role: 'Research Fellow',
    startDate: '2015-06-01',
    isActive: true,
  },
  {
    facultyIndex: 0,
    organizationName: 'AI Research Consortium',
    type: 'academic',
    role: 'Principal Investigator',
    startDate: '2018-01-10',
    isActive: true,
  },

  // Jane Smith (Faculty 1) - Network Security Associate Professor
  {
    facultyIndex: 1,
    organizationName: 'Information Systems Security Association (ISSA)',
    type: 'professional',
    role: 'Chapter President',
    startDate: '2012-05-01',
    isActive: true,
  },
  {
    facultyIndex: 1,
    organizationName: 'International Information System Security Certification Consortium (ISC)²',
    type: 'professional',
    role: 'Certified Member',
    startDate: '2011-08-15',
    isActive: true,
  },
  {
    facultyIndex: 1,
    organizationName: 'Cybersecurity Education Consortium',
    type: 'academic',
    role: 'Advisory Board Member',
    startDate: '2016-02-20',
    isActive: true,
  },
  {
    facultyIndex: 1,
    organizationName: 'Women in Cybersecurity',
    type: 'community',
    role: 'Mentor',
    startDate: '2014-09-10',
    isActive: true,
  },
  {
    facultyIndex: 1,
    organizationName: 'SANS Institute',
    type: 'professional',
    role: 'Instructor',
    startDate: '2013-01-05',
    endDate: '2020-12-31',
    isActive: false,
  },

  // Robert Johnson (Faculty 2) - Software Engineering Assistant Professor
  {
    facultyIndex: 2,
    organizationName: 'Philippine Society of IT Educators (PSITE)',
    type: 'professional',
    role: 'Active Member',
    startDate: '2015-03-01',
    isActive: true,
  },
  {
    facultyIndex: 2,
    organizationName: 'Agile Alliance',
    type: 'professional',
    role: 'Member',
    startDate: '2016-07-15',
    isActive: true,
  },
  {
    facultyIndex: 2,
    organizationName: 'Software Engineering Institute',
    type: 'academic',
    role: 'Research Collaborator',
    startDate: '2017-01-20',
    isActive: true,
  },
  {
    facultyIndex: 2,
    organizationName: 'Code for Good Philippines',
    type: 'community',
    role: 'Volunteer Developer',
    startDate: '2018-05-10',
    isActive: true,
  },
  {
    facultyIndex: 2,
    organizationName: 'Tech Mentorship Program',
    type: 'community',
    role: 'Senior Mentor',
    startDate: '2019-08-01',
    isActive: true,
  },

  // Maria Garcia (Faculty 3) - Department Chair, CS Education
  {
    facultyIndex: 3,
    organizationName: 'Association for Computing Machinery (ACM)',
    type: 'professional',
    role: 'Distinguished Member',
    startDate: '2005-02-01',
    isActive: true,
  },
  {
    facultyIndex: 3,
    organizationName: 'Philippine Society of IT Educators (PSITE)',
    type: 'professional',
    role: 'Board of Directors',
    startDate: '2008-06-15',
    isActive: true,
  },
  {
    facultyIndex: 3,
    organizationName: 'Computing Accreditation Commission',
    type: 'academic',
    role: 'Program Evaluator',
    startDate: '2010-09-01',
    isActive: true,
  },
  {
    facultyIndex: 3,
    organizationName: 'International Society for Technology in Education',
    type: 'academic',
    role: 'Senior Fellow',
    startDate: '2012-01-10',
    isActive: true,
  },
  {
    facultyIndex: 3,
    organizationName: 'Women in Technology Philippines',
    type: 'community',
    role: 'Founding Member',
    startDate: '2007-03-08',
    isActive: true,
  },
  {
    facultyIndex: 3,
    organizationName: 'STEM Education Alliance',
    type: 'community',
    role: 'Advisory Council',
    startDate: '2015-11-20',
    isActive: true,
  },
  {
    facultyIndex: 3,
    organizationName: 'National Computer Science Teachers Association',
    type: 'professional',
    role: 'International Representative',
    startDate: '2013-04-15',
    endDate: '2022-12-31',
    isActive: false,
  },
];

export async function seedFacultyAffiliations(
  db: Database,
  facultyIds: string[]
) {
  const createdRecords: string[] = [];

  console.log('  Creating faculty affiliation records...');

  for (const seed of facultyAffiliationSeeds) {
    if (seed.facultyIndex >= facultyIds.length) {
      console.warn(`  ⚠️  Skipping faculty affiliation: faculty index ${seed.facultyIndex} out of range`);
      continue;
    }

    const facultyId = facultyIds[seed.facultyIndex];
    const id = generateUUIDv7();

    try {
      const [record] = await db
        .insert(facultyAffiliations)
        .values({
          id,
          faculty_id: facultyId,
          organization_name: seed.organizationName,
          type: seed.type,
          role: seed.role,
          start_date: seed.startDate,
          end_date: seed.endDate,
          is_active: seed.isActive,
        })
        .returning({ id: facultyAffiliations.id });

      createdRecords.push(record.id);
      console.log(
        `  - Created: Faculty ${seed.facultyIndex} → ${seed.organizationName} ` +
        `(${seed.type}, ${seed.isActive ? 'Active' : 'Inactive'})`
      );
    } catch (error: any) {
      console.error(
        `  ❌ Error creating faculty affiliation for Faculty ${seed.facultyIndex} → ${seed.organizationName}:`,
        error.message
      );
      throw error;
    }
  }

  return createdRecords;
}
