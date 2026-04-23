import { Database } from '../index';
import { uploads } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface UploadSeed {
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  entityType: 'student' | 'faculty' | 'research' | 'event' | 'document';
  entityIndex: number; // Index into the respective entity array (0 for document type)
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
  // General documents (for secretary portal document management)
  {
    fileName: '1705104000000_w9x0y1z2_memo_2024_001.pdf',
    originalName: 'Department Memo 2024-001.pdf',
    fileType: 'application/pdf',
    fileSize: 234567,
    entityType: 'document',
    entityIndex: 0,
  },
  {
    fileName: '1705190400000_a3b4c5d6_policy_guidelines.pdf',
    originalName: 'Academic Policy Guidelines.pdf',
    fileType: 'application/pdf',
    fileSize: 567890,
    entityType: 'document',
    entityIndex: 0,
  },
  {
    fileName: '1705276800000_e7f8g9h0_enrollment_form.pdf',
    originalName: 'Enrollment Form Template.pdf',
    fileType: 'application/pdf',
    fileSize: 123456,
    entityType: 'document',
    entityIndex: 0,
  },
  {
    fileName: '1705363200000_i1j2k3l4_curriculum_2024.pdf',
    originalName: 'BS CS Curriculum 2024.pdf',
    fileType: 'application/pdf',
    fileSize: 789012,
    entityType: 'document',
    entityIndex: 0,
  },
  {
    fileName: '1705449600000_m5n6o7p8_faculty_handbook.pdf',
    originalName: 'Faculty Handbook 2024.pdf',
    fileType: 'application/pdf',
    fileSize: 1234567,
    entityType: 'document',
    entityIndex: 0,
  },
  {
    fileName: '1705536000000_q9r0s1t2_student_handbook.pdf',
    originalName: 'Student Handbook 2024.pdf',
    fileType: 'application/pdf',
    fileSize: 987654,
    entityType: 'document',
    entityIndex: 0,
  },
  {
    fileName: '1705622400000_u3v4w5x6_grading_system.pdf',
    originalName: 'Grading System Guidelines.pdf',
    fileType: 'application/pdf',
    fileSize: 345678,
    entityType: 'document',
    entityIndex: 0,
  },
  {
    fileName: '1705708800000_y7z8a9b0_attendance_policy.pdf',
    originalName: 'Attendance Policy.pdf',
    fileType: 'application/pdf',
    fileSize: 234567,
    entityType: 'document',
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
    let entityId: string;
    
    switch (uploadSeed.entityType) {
      case 'student':
        entityId = studentIds[uploadSeed.entityIndex];
        if (!entityId) {
          console.log(`  ⚠️  Skipping upload for ${uploadSeed.entityType} at index ${uploadSeed.entityIndex} (entity not found)`);
          continue;
        }
        break;
      case 'faculty':
        entityId = facultyIds[uploadSeed.entityIndex];
        if (!entityId) {
          console.log(`  ⚠️  Skipping upload for ${uploadSeed.entityType} at index ${uploadSeed.entityIndex} (entity not found)`);
          continue;
        }
        break;
      case 'research':
        entityId = researchIds[uploadSeed.entityIndex];
        if (!entityId) {
          console.log(`  ⚠️  Skipping upload for ${uploadSeed.entityType} at index ${uploadSeed.entityIndex} (entity not found)`);
          continue;
        }
        break;
      case 'event':
        entityId = eventIds[uploadSeed.entityIndex];
        if (!entityId) {
          console.log(`  ⚠️  Skipping upload for ${uploadSeed.entityType} at index ${uploadSeed.entityIndex} (entity not found)`);
          continue;
        }
        break;
      case 'document':
        // For general documents, generate a new UUID (self-referencing)
        entityId = generateUUIDv7();
        break;
      default:
        console.log(`  ⚠️  Unknown entity type: ${uploadSeed.entityType}`);
        continue;
    }

    // Generate UUID v7 for primary key
    const id = uploadSeed.entityType === 'document' ? entityId : generateUUIDv7();

    // Generate storage path based on entity type and current date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const storagePath = `${uploadSeed.entityType}/${year}/${month}/${uploadSeed.fileName}`;

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
