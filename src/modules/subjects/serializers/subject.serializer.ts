/**
 * Subject Serializer
 * Transforms database subject records to API response format
 */

interface DatabaseSubject {
  id: string;
  code: string;
  name: string;
  units: number;
  semester: number;
  year_level: number;
  description?: string | null;
  prerequisites?: string[] | null;
  corequisites?: string[] | null;
  type: string;
  lecture_hours: number;
  laboratory_hours: number;
  objectives?: string[] | null;
  topics?: string[] | null;
  curriculum_id: string;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at?: Date | null;
  syllabus?: any;
  lessons?: any[];
}

interface ApiSubject {
  id: string;
  code: string;
  name: string;
  units: number;
  semester: number;
  yearLevel: number;
  description?: string;
  prerequisites?: string[];
  corequisites?: string[];
  type: string;
  hours: {
    lecture: number;
    laboratory: number;
  };
  objectives?: string[];
  topics?: string[];
  curriculum_id?: string;
  created_at: string;
  updated_at: string;
  syllabus?: any;
  lessons?: any[];
}

/**
 * Serialize a single subject from database format to API format
 */
export function serializeSubject(subject: DatabaseSubject): ApiSubject {
  return {
    id: subject.id,
    code: subject.code,
    name: subject.name,
    units: subject.units,
    semester: subject.semester,
    yearLevel: subject.year_level,
    description: subject.description || undefined,
    prerequisites: subject.prerequisites || undefined,
    corequisites: subject.corequisites || undefined,
    type: subject.type,
    hours: {
      lecture: subject.lecture_hours ?? 0,
      laboratory: subject.laboratory_hours ?? 0,
    },
    objectives: subject.objectives || undefined,
    topics: subject.topics || undefined,
    curriculum_id: subject.curriculum_id,
    created_at: typeof subject.created_at === 'string' ? subject.created_at : subject.created_at.toISOString(),
    updated_at: typeof subject.updated_at === 'string' ? subject.updated_at : subject.updated_at.toISOString(),
    ...(subject.syllabus && { syllabus: subject.syllabus }),
    ...(subject.lessons && { lessons: subject.lessons }),
  };
}

/**
 * Serialize multiple subjects
 */
export function serializeSubjects(subjects: DatabaseSubject[]): ApiSubject[] {
  return subjects.map(serializeSubject);
}
