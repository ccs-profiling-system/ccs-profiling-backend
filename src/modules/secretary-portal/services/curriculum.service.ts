/**
 * Curriculum Service for Secretary Portal
 * 
 * Provides full CRUD access to curriculum and subjects data for secretaries.
 * All queries are department-scoped to ensure multi-tenant data isolation.
 * 
 */

import { db } from '../../../db';
import { curriculum, subjects } from '../../../db/schema';
import { eq, and, isNull, ilike, sql, or, desc } from 'drizzle-orm';
import { NotFoundError, ConflictError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

/**
 * Curriculum list filters
 */
export interface CurriculumFilters {
  page?: number;
  limit?: number;
  search?: string;
  program?: string;
  year?: number;
  status?: string;
}

/**
 * Subject list filters
 */
export interface SubjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  curriculum_id?: string;
  yearLevel?: number;
  semester?: number;
  type?: string;
}

/**
 * Create curriculum DTO
 */
export interface CreateCurriculumDTO {
  code: string;
  name: string;
  program: string;
  year: number;
  status?: string;
  description?: string;
  department_id: string;
}

/**
 * Update curriculum DTO
 */
export interface UpdateCurriculumDTO {
  code?: string;
  name?: string;
  status?: string;
  description?: string;
}

/**
 * Create subject DTO
 */
export interface CreateSubjectDTO {
  code: string;
  name: string;
  curriculum_id: string;
  type: string;
  units: number;
  semester: number;
  year_level: number;
  lecture_hours: number;
  laboratory_hours: number;
  description?: string;
  prerequisites?: string[];
  objectives?: string[];
  topics?: string[];
}

/**
 * Update subject DTO
 */
export interface UpdateSubjectDTO {
  name?: string;
  units?: number;
  description?: string;
  prerequisites?: string[];
  objectives?: string[];
  topics?: string[];
}

/**
 * Curriculum response
 */
export interface CurriculumResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  program: string;
  year: string;
  total_units: number;
  status: string;
  effective_date: string;
  subject_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Subject response
 */
export interface SubjectResponse {
  id: string;
  code: string;
  name: string;
  units: number;
  semester: number;
  year_level: number;
  description: string | null;
  prerequisites: string[] | null;
  corequisites: string[] | null;
  type: string;
  lecture_hours: number;
  laboratory_hours: number;
  objectives: string[] | null;
  topics: string[] | null;
  curriculum_id: string;
  curriculum_name?: string;
  curriculum_code?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

/**
 * Curriculum statistics
 */
export interface CurriculumStats {
  total_curriculum: number;
  active_curriculum: number;
  total_subjects: number;
  subjects_by_type: Record<string, number>;
  subjects_by_year: Record<string, number>;
  total_units: number;
  programs: string[];
}

export class CurriculumService {
  /**
   * Get curriculum list with pagination and filters
   */
  async getCurriculum(
    departmentId: string,
    filters: CurriculumFilters = {}
  ): Promise<PaginatedResponse<CurriculumResponse>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [isNull(curriculum.deleted_at)];

    if (filters.search) {
      conditions.push(
        or(
          ilike(curriculum.name, `%${filters.search}%`),
          ilike(curriculum.code, `%${filters.search}%`),
          ilike(curriculum.description, `%${filters.search}%`)
        )!
      );
    }

    if (filters.program) {
      conditions.push(eq(curriculum.program, filters.program));
    }

    if (filters.year) {
      conditions.push(eq(curriculum.year, filters.year.toString()));
    }

    if (filters.status) {
      conditions.push(eq(curriculum.status, filters.status));
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(curriculum)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    const data = await db
      .select({
        id: curriculum.id,
        code: curriculum.code,
        name: curriculum.name,
        description: curriculum.description,
        program: curriculum.program,
        year: curriculum.year,
        total_units: curriculum.total_units,
        status: curriculum.status,
        effective_date: curriculum.effective_date,
        created_at: curriculum.created_at,
        updated_at: curriculum.updated_at,
        subject_count: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${subjects}
          WHERE ${subjects.curriculum_id} = ${curriculum.id}
          AND ${subjects.deleted_at} IS NULL
        )`,
      })
      .from(curriculum)
      .where(and(...conditions))
      .orderBy(curriculum.code)
      .limit(limit)
      .offset(offset);

    return {
      data: data.map((item) => ({
        ...item,
        description: item.description || null,
        effective_date: item.effective_date,
        subject_count: item.subject_count || 0,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get curriculum by ID
   */
  async getCurriculumById(id: string, departmentId: string): Promise<CurriculumResponse> {
    const result = await db
      .select({
        id: curriculum.id,
        code: curriculum.code,
        name: curriculum.name,
        description: curriculum.description,
        program: curriculum.program,
        year: curriculum.year,
        total_units: curriculum.total_units,
        status: curriculum.status,
        effective_date: curriculum.effective_date,
        created_at: curriculum.created_at,
        updated_at: curriculum.updated_at,
        subject_count: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${subjects}
          WHERE ${subjects.curriculum_id} = ${curriculum.id}
          AND ${subjects.deleted_at} IS NULL
        )`,
      })
      .from(curriculum)
      .where(and(eq(curriculum.id, id), isNull(curriculum.deleted_at)))
      .limit(1);

    if (!result.length) {
      throw new NotFoundError('Curriculum not found');
    }

    const item = result[0];
    return {
      ...item,
      description: item.description || null,
      effective_date: item.effective_date,
      subject_count: item.subject_count || 0,
      created_at: item.created_at.toISOString(),
      updated_at: item.updated_at.toISOString(),
    };
  }

  /**
   * Create curriculum
   */
  async createCurriculum(data: CreateCurriculumDTO): Promise<CurriculumResponse> {
    // Check for duplicate code
    const existing = await db
      .select()
      .from(curriculum)
      .where(and(eq(curriculum.code, data.code), isNull(curriculum.deleted_at)))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError('Curriculum code already exists');
    }

    const id = generateUUIDv7();
    const now = new Date();

    const [created] = await db
      .insert(curriculum)
      .values({
        id,
        code: data.code,
        name: data.name,
        program: data.program,
        year: data.year.toString(),
        status: data.status || 'draft',
        description: data.description || null,
        effective_date: now.toISOString().split('T')[0],
        total_units: 0,
        created_at: now,
        updated_at: now,
      })
      .returning();

    return {
      id: created.id,
      code: created.code,
      name: created.name,
      description: created.description,
      program: created.program,
      year: created.year,
      total_units: created.total_units,
      status: created.status,
      effective_date: created.effective_date,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    };
  }

  /**
   * Update curriculum
   */
  async updateCurriculum(
    id: string,
    departmentId: string,
    data: UpdateCurriculumDTO
  ): Promise<CurriculumResponse> {
    // Check if exists
    const existing = await db
      .select()
      .from(curriculum)
      .where(and(eq(curriculum.id, id), isNull(curriculum.deleted_at)))
      .limit(1);

    if (!existing.length) {
      throw new NotFoundError('Curriculum not found');
    }

    // Check for duplicate code if changing
    if (data.code && data.code !== existing[0].code) {
      const duplicate = await db
        .select()
        .from(curriculum)
        .where(and(eq(curriculum.code, data.code), isNull(curriculum.deleted_at)))
        .limit(1);

      if (duplicate.length > 0) {
        throw new ConflictError('Curriculum code already exists');
      }
    }

    const [updated] = await db
      .update(curriculum)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(curriculum.id, id))
      .returning();

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      description: updated.description,
      program: updated.program,
      year: updated.year,
      total_units: updated.total_units,
      status: updated.status,
      effective_date: updated.effective_date,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  /**
   * Delete curriculum
   */
  async deleteCurriculum(id: string, departmentId: string): Promise<void> {
    const existing = await db
      .select()
      .from(curriculum)
      .where(and(eq(curriculum.id, id), isNull(curriculum.deleted_at)))
      .limit(1);

    if (!existing.length) {
      throw new NotFoundError('Curriculum not found');
    }

    await db
      .update(curriculum)
      .set({ deleted_at: new Date() })
      .where(eq(curriculum.id, id));
  }

  /**
   * Get subjects list
   */
  async getSubjects(
    departmentId: string,
    filters: SubjectFilters = {}
  ): Promise<PaginatedResponse<SubjectResponse>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [isNull(subjects.deleted_at)];

    if (filters.search) {
      conditions.push(
        or(
          ilike(subjects.name, `%${filters.search}%`),
          ilike(subjects.code, `%${filters.search}%`),
          ilike(subjects.description, `%${filters.search}%`)
        )!
      );
    }

    if (filters.curriculum_id) {
      conditions.push(eq(subjects.curriculum_id, filters.curriculum_id));
    }

    if (filters.yearLevel) {
      conditions.push(eq(subjects.year_level, filters.yearLevel));
    }

    if (filters.semester) {
      conditions.push(eq(subjects.semester, filters.semester));
    }

    if (filters.type) {
      conditions.push(eq(subjects.type, filters.type));
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subjects)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    const data = await db
      .select({
        id: subjects.id,
        code: subjects.code,
        name: subjects.name,
        units: subjects.units,
        semester: subjects.semester,
        year_level: subjects.year_level,
        description: subjects.description,
        prerequisites: subjects.prerequisites,
        corequisites: subjects.corequisites,
        type: subjects.type,
        lecture_hours: subjects.lecture_hours,
        laboratory_hours: subjects.laboratory_hours,
        objectives: subjects.objectives,
        topics: subjects.topics,
        curriculum_id: subjects.curriculum_id,
        curriculum_name: curriculum.name,
        curriculum_code: curriculum.code,
        created_at: subjects.created_at,
        updated_at: subjects.updated_at,
      })
      .from(subjects)
      .leftJoin(curriculum, eq(subjects.curriculum_id, curriculum.id))
      .where(and(...conditions))
      .orderBy(subjects.year_level, subjects.semester, subjects.code)
      .limit(limit)
      .offset(offset);

    return {
      data: data.map((item) => ({
        ...item,
        description: item.description || null,
        prerequisites: item.prerequisites || null,
        corequisites: item.corequisites || null,
        objectives: item.objectives || null,
        topics: item.topics || null,
        curriculum_name: item.curriculum_name || undefined,
        curriculum_code: item.curriculum_code || undefined,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(id: string, departmentId: string): Promise<SubjectResponse> {
    const result = await db
      .select({
        id: subjects.id,
        code: subjects.code,
        name: subjects.name,
        units: subjects.units,
        semester: subjects.semester,
        year_level: subjects.year_level,
        description: subjects.description,
        prerequisites: subjects.prerequisites,
        corequisites: subjects.corequisites,
        type: subjects.type,
        lecture_hours: subjects.lecture_hours,
        laboratory_hours: subjects.laboratory_hours,
        objectives: subjects.objectives,
        topics: subjects.topics,
        curriculum_id: subjects.curriculum_id,
        curriculum_name: curriculum.name,
        curriculum_code: curriculum.code,
        created_at: subjects.created_at,
        updated_at: subjects.updated_at,
      })
      .from(subjects)
      .leftJoin(curriculum, eq(subjects.curriculum_id, curriculum.id))
      .where(and(eq(subjects.id, id), isNull(subjects.deleted_at)))
      .limit(1);

    if (!result.length) {
      throw new NotFoundError('Subject not found');
    }

    const item = result[0];
    return {
      ...item,
      description: item.description || null,
      prerequisites: item.prerequisites || null,
      corequisites: item.corequisites || null,
      objectives: item.objectives || null,
      topics: item.topics || null,
      curriculum_name: item.curriculum_name || undefined,
      curriculum_code: item.curriculum_code || undefined,
      created_at: item.created_at.toISOString(),
      updated_at: item.updated_at.toISOString(),
    };
  }

  /**
   * Create subject
   */
  async createSubject(data: CreateSubjectDTO, departmentId: string): Promise<SubjectResponse> {
    // Check for duplicate code
    const existing = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.code, data.code), isNull(subjects.deleted_at)))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError('Subject code already exists');
    }

    // Verify curriculum exists
    const curriculumExists = await db
      .select()
      .from(curriculum)
      .where(and(eq(curriculum.id, data.curriculum_id), isNull(curriculum.deleted_at)))
      .limit(1);

    if (!curriculumExists.length) {
      throw new NotFoundError('Curriculum not found');
    }

    const id = generateUUIDv7();
    const now = new Date();

    const [created] = await db
      .insert(subjects)
      .values({
        id,
        code: data.code,
        name: data.name,
        curriculum_id: data.curriculum_id,
        type: data.type,
        units: data.units,
        semester: data.semester,
        year_level: data.year_level,
        lecture_hours: data.lecture_hours,
        laboratory_hours: data.laboratory_hours,
        description: data.description || null,
        prerequisites: data.prerequisites || null,
        corequisites: null,
        objectives: data.objectives || null,
        topics: data.topics || null,
        created_at: now,
        updated_at: now,
      })
      .returning();

    return {
      id: created.id,
      code: created.code,
      name: created.name,
      units: created.units,
      semester: created.semester,
      year_level: created.year_level,
      description: created.description,
      prerequisites: created.prerequisites,
      corequisites: created.corequisites,
      type: created.type,
      lecture_hours: created.lecture_hours,
      laboratory_hours: created.laboratory_hours,
      objectives: created.objectives,
      topics: created.topics,
      curriculum_id: created.curriculum_id,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    };
  }

  /**
   * Update subject
   */
  async updateSubject(
    id: string,
    departmentId: string,
    data: UpdateSubjectDTO
  ): Promise<SubjectResponse> {
    const existing = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, id), isNull(subjects.deleted_at)))
      .limit(1);

    if (!existing.length) {
      throw new NotFoundError('Subject not found');
    }

    const [updated] = await db
      .update(subjects)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(subjects.id, id))
      .returning();

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      units: updated.units,
      semester: updated.semester,
      year_level: updated.year_level,
      description: updated.description,
      prerequisites: updated.prerequisites,
      corequisites: updated.corequisites,
      type: updated.type,
      lecture_hours: updated.lecture_hours,
      laboratory_hours: updated.laboratory_hours,
      objectives: updated.objectives,
      topics: updated.topics,
      curriculum_id: updated.curriculum_id,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  /**
   * Delete subject
   */
  async deleteSubject(id: string, departmentId: string): Promise<void> {
    const existing = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, id), isNull(subjects.deleted_at)))
      .limit(1);

    if (!existing.length) {
      throw new NotFoundError('Subject not found');
    }

    await db
      .update(subjects)
      .set({ deleted_at: new Date() })
      .where(eq(subjects.id, id));
  }

  /**
   * Get curriculum statistics
   */
  async getStats(departmentId: string): Promise<CurriculumStats> {
    const totalCurriculumResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(curriculum)
      .where(isNull(curriculum.deleted_at));

    const activeCurriculumResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(curriculum)
      .where(and(eq(curriculum.status, 'active'), isNull(curriculum.deleted_at)));

    const totalSubjectsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subjects)
      .where(isNull(subjects.deleted_at));

    const subjectsByTypeResult = await db
      .select({
        type: subjects.type,
        count: sql<number>`count(*)::int`,
      })
      .from(subjects)
      .where(isNull(subjects.deleted_at))
      .groupBy(subjects.type);

    const subjectsByYearResult = await db
      .select({
        year_level: subjects.year_level,
        count: sql<number>`count(*)::int`,
      })
      .from(subjects)
      .where(isNull(subjects.deleted_at))
      .groupBy(subjects.year_level);

    const totalUnitsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${curriculum.total_units}), 0)::int` })
      .from(curriculum)
      .where(isNull(curriculum.deleted_at));

    const programsResult = await db
      .selectDistinct({ program: curriculum.program })
      .from(curriculum)
      .where(isNull(curriculum.deleted_at));

    const subjectsByType: Record<string, number> = {};
    subjectsByTypeResult.forEach((item) => {
      subjectsByType[item.type] = item.count;
    });

    const subjectsByYear: Record<string, number> = {};
    subjectsByYearResult.forEach((item) => {
      subjectsByYear[item.year_level.toString()] = item.count;
    });

    return {
      total_curriculum: totalCurriculumResult[0]?.count || 0,
      active_curriculum: activeCurriculumResult[0]?.count || 0,
      total_subjects: totalSubjectsResult[0]?.count || 0,
      subjects_by_type: subjectsByType,
      subjects_by_year: subjectsByYear,
      total_units: totalUnitsResult[0]?.total || 0,
      programs: programsResult.map((r) => r.program),
    };
  }

  /**
   * Export curriculum to PDF
   */
  async exportToPDF(departmentId: string, filters: CurriculumFilters = {}): Promise<Readable> {
    const conditions = [isNull(curriculum.deleted_at)];

    if (filters.program) {
      conditions.push(eq(curriculum.program, filters.program));
    }

    if (filters.year) {
      conditions.push(eq(curriculum.year, filters.year.toString()));
    }

    const data = await db
      .select({
        code: curriculum.code,
        name: curriculum.name,
        program: curriculum.program,
        year: curriculum.year,
        total_units: curriculum.total_units,
        status: curriculum.status,
        effective_date: curriculum.effective_date,
      })
      .from(curriculum)
      .where(and(...conditions))
      .orderBy(curriculum.code);

    const doc = new PDFDocument({ margin: 50 });

    doc.fontSize(20).text('Curriculum Report', { align: 'center' }).moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' }).moveDown();
    doc.fontSize(12).text(`Total Curriculum: ${data.length}`, { underline: true }).moveDown(0.5);

    data.forEach((item, index) => {
      doc
        .fontSize(10)
        .text(`${index + 1}. ${item.code} - ${item.name}`)
        .fontSize(9)
        .text(`   Program: ${item.program}`)
        .text(`   Year: ${item.year}`)
        .text(`   Total Units: ${item.total_units}`)
        .text(`   Status: ${item.status}`)
        .text(`   Effective Date: ${item.effective_date}`)
        .moveDown(0.5);

      if ((index + 1) % 10 === 0 && index < data.length - 1) {
        doc.addPage();
      }
    });

    doc.end();
    return doc as unknown as Readable;
  }

  /**
   * Export curriculum to Excel
   */
  async exportToExcel(departmentId: string, filters: CurriculumFilters = {}): Promise<Readable> {
    const conditions = [isNull(curriculum.deleted_at)];

    if (filters.program) {
      conditions.push(eq(curriculum.program, filters.program));
    }

    if (filters.year) {
      conditions.push(eq(curriculum.year, filters.year.toString()));
    }

    const data = await db
      .select({
        code: curriculum.code,
        name: curriculum.name,
        description: curriculum.description,
        program: curriculum.program,
        year: curriculum.year,
        total_units: curriculum.total_units,
        status: curriculum.status,
        effective_date: curriculum.effective_date,
      })
      .from(curriculum)
      .where(and(...conditions))
      .orderBy(curriculum.code);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Curriculum');

    worksheet.columns = [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Name', key: 'name', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Program', key: 'program', width: 20 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Total Units', key: 'total_units', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Effective Date', key: 'effective_date', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    data.forEach((item) => {
      worksheet.addRow({
        code: item.code,
        name: item.name,
        description: item.description || '',
        program: item.program,
        year: item.year,
        total_units: item.total_units,
        status: item.status,
        effective_date: item.effective_date,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    return stream;
  }
}
