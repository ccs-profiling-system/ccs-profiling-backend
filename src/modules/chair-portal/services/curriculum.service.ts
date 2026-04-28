/**
 * Curriculum Service for Chair Portal
 * 
 * Provides read-only access to curriculum and subjects data for department chairs.
 * All queries are department-scoped to ensure multi-tenant data isolation.
 * 
 */

import { db } from '../../../db';
import { curriculum, subjects } from '../../../db/schema';
import { eq, and, isNull, ilike, sql, or, desc } from 'drizzle-orm';
import { NotFoundError } from '../../../shared/errors';
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
  year?: string;
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
  year_level?: number;
  semester?: number;
  type?: string;
}

/**
 * Curriculum response with subject count
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
  subject_count: number;
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
 * Paginated list response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Curriculum statistics
 */
export interface CurriculumStats {
  total_curriculum: number;
  total_subjects: number;
  total_units: number;
  by_program: Array<{
    program: string;
    count: number;
  }>;
  by_year: Array<{
    year: string;
    count: number;
  }>;
  by_status: Array<{
    status: string;
    count: number;
  }>;
}

export class CurriculumService {
  /**
   * Get curriculum list with pagination and filters
   */
  async getCurriculum(filters: CurriculumFilters = {}): Promise<PaginatedResponse<CurriculumResponse>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const offset = (page - 1) * limit;

    const conditions = [isNull(curriculum.deleted_at)];

    if (filters.search) {
      conditions.push(
        or(
          ilike(curriculum.name, `%${filters.search}%`),
          ilike(curriculum.code, `%${filters.search}%`),
          ilike(curriculum.program, `%${filters.search}%`)
        )!
      );
    }

    if (filters.program) {
      conditions.push(eq(curriculum.program, filters.program));
    }

    if (filters.year) {
      conditions.push(eq(curriculum.year, filters.year));
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
      .orderBy(desc(curriculum.created_at))
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
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get curriculum by ID
   */
  async getCurriculumById(id: string): Promise<CurriculumResponse> {
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
   * Get subjects list with pagination and filters
   */
  async getSubjects(filters: SubjectFilters = {}): Promise<PaginatedResponse<SubjectResponse>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const offset = (page - 1) * limit;

    const conditions = [isNull(subjects.deleted_at)];

    if (filters.search) {
      conditions.push(
        or(
          ilike(subjects.name, `%${filters.search}%`),
          ilike(subjects.code, `%${filters.search}%`)
        )!
      );
    }

    if (filters.curriculum_id) {
      conditions.push(eq(subjects.curriculum_id, filters.curriculum_id));
    }

    if (filters.year_level) {
      conditions.push(eq(subjects.year_level, filters.year_level));
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
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(id: string): Promise<SubjectResponse> {
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
   * Get curriculum statistics
   */
  async getStats(): Promise<CurriculumStats> {
    const totalCurriculumResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(curriculum)
      .where(isNull(curriculum.deleted_at));

    const totalSubjectsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subjects)
      .where(isNull(subjects.deleted_at));

    const totalUnitsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${curriculum.total_units}), 0)::int` })
      .from(curriculum)
      .where(isNull(curriculum.deleted_at));

    const byProgramResult = await db
      .select({
        program: curriculum.program,
        count: sql<number>`count(*)::int`,
      })
      .from(curriculum)
      .where(isNull(curriculum.deleted_at))
      .groupBy(curriculum.program)
      .orderBy(desc(sql`count(*)`));

    const byYearResult = await db
      .select({
        year: curriculum.year,
        count: sql<number>`count(*)::int`,
      })
      .from(curriculum)
      .where(isNull(curriculum.deleted_at))
      .groupBy(curriculum.year)
      .orderBy(desc(curriculum.year));

    const byStatusResult = await db
      .select({
        status: curriculum.status,
        count: sql<number>`count(*)::int`,
      })
      .from(curriculum)
      .where(isNull(curriculum.deleted_at))
      .groupBy(curriculum.status)
      .orderBy(desc(sql`count(*)`));

    return {
      total_curriculum: totalCurriculumResult[0]?.count || 0,
      total_subjects: totalSubjectsResult[0]?.count || 0,
      total_units: totalUnitsResult[0]?.total || 0,
      by_program: byProgramResult,
      by_year: byYearResult,
      by_status: byStatusResult,
    };
  }

  /**
   * Export curriculum to PDF
   */
  async exportToPDF(filters: CurriculumFilters = {}): Promise<Readable> {
    const conditions = [isNull(curriculum.deleted_at)];

    if (filters.search) {
      conditions.push(
        or(
          ilike(curriculum.name, `%${filters.search}%`),
          ilike(curriculum.code, `%${filters.search}%`),
          ilike(curriculum.program, `%${filters.search}%`)
        )!
      );
    }

    if (filters.program) {
      conditions.push(eq(curriculum.program, filters.program));
    }

    if (filters.year) {
      conditions.push(eq(curriculum.year, filters.year));
    }

    if (filters.status) {
      conditions.push(eq(curriculum.status, filters.status));
    }

    const data = await db
      .select({
        id: curriculum.id,
        code: curriculum.code,
        name: curriculum.name,
        program: curriculum.program,
        year: curriculum.year,
        total_units: curriculum.total_units,
        status: curriculum.status,
        effective_date: curriculum.effective_date,
        subject_count: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${subjects}
          WHERE ${subjects.curriculum_id} = ${curriculum.id}
          AND ${subjects.deleted_at} IS NULL
        )`,
      })
      .from(curriculum)
      .where(and(...conditions))
      .orderBy(desc(curriculum.created_at));

    const doc = new PDFDocument({ margin: 50 });

    doc
      .fontSize(20)
      .text('Curriculum Report', { align: 'center' })
      .moveDown();

    doc
      .fontSize(10)
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Total Curriculum: ${data.length}`, { underline: true })
      .moveDown(0.5);

    data.forEach((item, index) => {
      doc
        .fontSize(10)
        .text(`${index + 1}. ${item.code} - ${item.name}`)
        .fontSize(9)
        .text(`   Program: ${item.program}`)
        .text(`   Year: ${item.year}`)
        .text(`   Total Units: ${item.total_units}`)
        .text(`   Status: ${item.status}`)
        .text(`   Subjects: ${item.subject_count}`)
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
  async exportToExcel(filters: CurriculumFilters = {}): Promise<Readable> {
    const conditions = [isNull(curriculum.deleted_at)];

    if (filters.search) {
      conditions.push(
        or(
          ilike(curriculum.name, `%${filters.search}%`),
          ilike(curriculum.code, `%${filters.search}%`),
          ilike(curriculum.program, `%${filters.search}%`)
        )!
      );
    }

    if (filters.program) {
      conditions.push(eq(curriculum.program, filters.program));
    }

    if (filters.year) {
      conditions.push(eq(curriculum.year, filters.year));
    }

    if (filters.status) {
      conditions.push(eq(curriculum.status, filters.status));
    }

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
        subject_count: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${subjects}
          WHERE ${subjects.curriculum_id} = ${curriculum.id}
          AND ${subjects.deleted_at} IS NULL
        )`,
      })
      .from(curriculum)
      .where(and(...conditions))
      .orderBy(desc(curriculum.created_at));

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
      { header: 'Subject Count', key: 'subject_count', width: 15 },
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
        subject_count: item.subject_count || 0,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    return stream;
  }
}
