/**
 * Create Dummy Files for Seeded Documents
 * 
 * Creates placeholder files in the uploads directory for seeded documents.
 * This allows the download functionality to work with seeded data.
 */

import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const BASE_DIR = process.env.LOCAL_STORAGE_PATH || './uploads';

interface DummyFile {
  path: string;
  content: string;
}

/**
 * List of dummy files to create (matching the uploads seeder)
 */
const DUMMY_FILES: DummyFile[] = [
  // Student documents
  {
    path: 'student/2026/04/1704067200000_a1b2c3d4_transcript.pdf',
    content: 'Dummy transcript PDF content',
  },
  {
    path: 'student/2026/04/1704153600000_e5f6g7h8_resume.pdf',
    content: 'Dummy resume PDF content',
  },
  {
    path: 'student/2026/04/1704240000000_i9j0k1l2_id_card.jpg',
    content: 'Dummy ID card image content',
  },
  {
    path: 'student/2026/04/1704326400000_m3n4o5p6_certificate.pdf',
    content: 'Dummy certificate PDF content',
  },
  // Faculty documents
  {
    path: 'faculty/2026/04/1704412800000_q7r8s9t0_cv.pdf',
    content: 'Dummy CV PDF content',
  },
  {
    path: 'faculty/2026/04/1704499200000_u1v2w3x4_research_paper.pdf',
    content: 'Dummy research paper PDF content',
  },
  {
    path: 'faculty/2026/04/1704585600000_y5z6a7b8_credentials.pdf',
    content: 'Dummy credentials PDF content',
  },
  // Research documents
  {
    path: 'research/2026/04/1704672000000_c9d0e1f2_proposal.docx',
    content: 'Dummy proposal document content',
  },
  {
    path: 'research/2026/04/1704758400000_g3h4i5j6_methodology.pdf',
    content: 'Dummy methodology PDF content',
  },
  {
    path: 'research/2026/04/1704844800000_k7l8m9n0_results.xlsx',
    content: 'Dummy results spreadsheet content',
  },
  // Event documents
  {
    path: 'event/2026/04/1704931200000_o1p2q3r4_poster.png',
    content: 'Dummy poster image content',
  },
  {
    path: 'event/2026/04/1705017600000_s5t6u7v8_program.pdf',
    content: 'Dummy program PDF content',
  },
  // General documents
  {
    path: 'document/2026/04/1705104000000_w9x0y1z2_memo_2024_001.pdf',
    content: 'Department Memo 2024-001\n\nThis is a sample department memo for testing purposes.',
  },
  {
    path: 'document/2026/04/1705190400000_a3b4c5d6_policy_guidelines.pdf',
    content: 'Academic Policy Guidelines\n\nThis document contains academic policy guidelines.',
  },
  {
    path: 'document/2026/04/1705276800000_e7f8g9h0_enrollment_form.pdf',
    content: 'Enrollment Form Template\n\nThis is a template for student enrollment.',
  },
  {
    path: 'document/2026/04/1705363200000_i1j2k3l4_curriculum_2024.pdf',
    content: 'BS Computer Science Curriculum 2024\n\nThis document outlines the curriculum.',
  },
  {
    path: 'document/2026/04/1705449600000_m5n6o7p8_faculty_handbook.pdf',
    content: 'Faculty Handbook 2024\n\nThis handbook contains guidelines for faculty members.',
  },
  {
    path: 'document/2026/04/1705536000000_q9r0s1t2_student_handbook.pdf',
    content: 'Student Handbook 2024\n\nThis handbook contains guidelines for students.',
  },
  {
    path: 'document/2026/04/1705622400000_u3v4w5x6_grading_system.pdf',
    content: 'Grading System Guidelines\n\nThis document explains the grading system.',
  },
  {
    path: 'document/2026/04/1705708800000_y7z8a9b0_attendance_policy.pdf',
    content: 'Attendance Policy\n\nThis document outlines the attendance requirements.',
  },
];

/**
 * Create dummy files in the uploads directory
 */
async function createDummyFiles() {
  console.log('📁 Creating dummy files for seeded documents...\n');

  try {
    let created = 0;
    let skipped = 0;

    for (const file of DUMMY_FILES) {
      const fullPath = join(BASE_DIR, file.path);
      
      // Check if file already exists
      if (existsSync(fullPath)) {
        console.log(`  ⏭️  Skipping (exists): ${file.path}`);
        skipped++;
        continue;
      }

      // Create directory if it doesn't exist
      const dir = dirname(fullPath);
      await mkdir(dir, { recursive: true });

      // Write dummy content to file
      await writeFile(fullPath, file.content, 'utf-8');
      console.log(`  ✅ Created: ${file.path}`);
      created++;
    }

    console.log(`\n✅ Dummy file creation completed!`);
    console.log(`   Created: ${created} files`);
    console.log(`   Skipped: ${skipped} files (already exist)\n`);
  } catch (error) {
    console.error('❌ Error creating dummy files:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createDummyFiles()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { createDummyFiles };
