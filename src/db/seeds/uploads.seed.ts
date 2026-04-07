import { Database } from '../index';
import { uploads } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface UploadSeed {
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  entityType: 'student' | 'faculty' | 'research' | 'event';
  entityIndex: number; // Index into the respective entity array
}

const uploadSeeds: UploadSeed[] = [
  // Student documents
  {
    fileName: '1704067200000_a1b2c3d4_transcript.pdf',
    originalName: 'transcript.pdf',
    fileType: 'application/pdf',
    fileSize: 245678,
    entityType: 'student',
    entityIndex: 0,
  },
  {
    fileName: '1704153600000_e5f6g7h8_resume.pdf',
    originalName: 'resume.pdf',
    fileType: 'application/pdf',
    fileSize: 189234,
    entityType: 'student',
    entityIndex: 0,
  },
  {
    fileName: '1704240000000_i9j0k1l2_id_card.jpg',
    originalName: 'id_card.jpg',
    fileType: 'image/jpeg',
    fileSize: 512345,
    entityType: 'student',
    entityIndex: 1,
  },
  {
    fileName: '1704326400000_m3n4o5p6_certificate.pdf',
    originalName: 'certificate.pdf',
    fileType: 'application/pdf',
    fileSize: 156789,
    entityType: 'student',
    entityIndex: 2,
  },
  // Faculty documents
  {
    fileName: '1704412800000_q7r8s9t0_cv.pdf',
    originalName: 'cv.pdf',
    fileType: 'application/pdf',
    fileSize: 345678,
    entityType: 'faculty',
    entityIndex: 0,
  },
  {
    fileName: '1704499200000_u1v2w3x4_research_paper.pdf',
    originalName: 'research_paper.pdf',
    fileType: 'application/pdf',
    fileSize: 1234567,
    entityType: 'faculty',
    entityIndex: 0,
  },
  {
    fileName: '1704585600000_y5z6a7b8_credentials.pdf',
    originalName: 'credentials.pdf',
    fileType: 'application/pdf',
    fileSize: 234567,
    entityType: 'faculty',
    entityIndex: 1,
  },
  // Research documents
  {
    fileName: '1704672000000_c9d0e1f2_proposal.docx',
    originalName: 'proposal.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 456789,
    entityType: 'research',
    entityIndex: 0,
  },
  {
    fileName: '1704758400000_g3h4i5j6_methodology.pdf',
    originalName: 'methodology.pdf',
    fileType: 'application/pdf',
    fileSize: 678901,
    entityType: 'research',
    entityIndex: 0,
  },
  {
    fileName: '1704844800000_k7l8m9n0_results.xlsx',
    originalName: 'results.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 234567,
    entityType: 'research',
    entityIndex: 1,
  },
  // Event documents
  {
    fileName: '1704931200000_o1p2q3r4_poster.png',
    originalName: 'poster.png',
    fileType: 'image/png',
    fileSize: 1567890,
    entityType: 'event',
    entityIndex: 0,
  },
  {
    fileName: '1705017600000_s5t6u7v8_program.pdf',
    originalName: 'program.pdf',
    fileType: 'application/pdf',
    fileSize: 123456,
    entityType: 'event',
    entityIndex: 0,
  },
];

export async function seedUploads(
  db: Database,
  studentIds: string[],
  facultyIds: string[],
  researchIds: string[],
  eventIds: string[],
  userIds: Array<{ id: string; role: string }>
) {
  const createdUploads: string[] = [];

  // Get admin user for uploaded_by field
  const adminUser = userIds.find(u => u.role === 'admin');
  const uploadedBy = adminUser?.id || userIds[0]?.id;

  for (const uploadSeed of uploadSeeds) {
    // Determine entity_id based on entity type and index
    let entityId: string | undefined;
    
    switch (uploadSeed.entityType) {
      case 'student':
        entityId = studentIds[uploadSeed.entityIndex];
        break;
      case 'faculty':
        entityId = facultyIds[uploadSeed.entityIndex];
        break;
      case 'research':
        entityId = researchIds[uploadSeed.entityIndex];
        break;
      case 'event':
        entityId = eventIds[uploadSeed.entityIndex];
        break;
    }

    // Skip if entity doesn't exist
    if (!entityId) {
      console.log(`  ⚠️  Skipping upload for ${uploadSeed.entityType} at index ${uploadSeed.entityIndex} (entity not found)`);
      continue;
    }

    // Generate UUID v7 for primary key
    const id = generateUUIDv7();

    // Generate storage path based on entity type and current date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const storagePath = `uploads/${uploadSeed.entityType}/${year}/${month}/${uploadSeed.fileName}`;

    const [upload] = await db
      .insert(uploads)
      .values({
        id,
        file_name: uploadSeed.fileName,
        original_name: uploadSeed.originalName,
        file_type: uploadSeed.fileType,
        file_size: uploadSeed.fileSize,
        storage_path: storagePath,
        entity_type: uploadSeed.entityType,
        entity_id: entityId,
        uploaded_by: uploadedBy,
      })
      .returning({ id: uploads.id, original_name: uploads.original_name });

    createdUploads.push(upload.id);
    console.log(`  - Created upload: ${upload.original_name} for ${uploadSeed.entityType}`);
  }

  return createdUploads;
}
