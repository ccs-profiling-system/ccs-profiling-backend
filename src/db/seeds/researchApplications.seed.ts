import { Database } from '../index';
import { researchApplications } from '../schema/researchApplications';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface ApplicationSeed {
  statement_of_interest: string;
  status: 'pending' | 'accepted' | 'rejected';
  faculty_feedback?: string;
  daysAgo: number; // How many days ago the application was submitted
}

const statementTemplates = [
  'I am very interested in this research opportunity because of my strong background in computer science and passion for innovation. I have completed relevant coursework including Data Structures, Algorithms, and Software Engineering. I am eager to contribute to this project and develop my research skills under your guidance.',
  'This research aligns perfectly with my academic interests and career goals. I have hands-on experience with programming languages such as Python and Java, and I am familiar with the methodologies used in this field. I am committed to dedicating the necessary time and effort to make meaningful contributions to this research.',
  'I am excited about the opportunity to participate in this research project. My academic performance demonstrates my dedication and capability, and I have a strong interest in the subject matter. I believe this experience will be invaluable for my professional development and I am ready to take on the challenges it presents.',
  'As a student passionate about advancing knowledge in this area, I am eager to apply my skills and learn from experienced researchers. I have relevant coursework and project experience that has prepared me for this opportunity. I am confident that I can contribute positively to the research team.',
  'I am writing to express my strong interest in joining this research project. My academic background and technical skills make me a suitable candidate for this opportunity. I am particularly drawn to the innovative approach of this research and I am excited about the potential to contribute to meaningful discoveries.',
];

const feedbackTemplates = {
  accepted: [
    'Excellent application. Your background and enthusiasm make you a great fit for this research project. Welcome to the team!',
    'Your statement of interest demonstrates strong motivation and relevant skills. We are pleased to accept your application.',
    'Impressive credentials and clear research interests. We look forward to working with you on this project.',
  ],
  rejected: [
    'Thank you for your interest. Unfortunately, we have filled all available positions for this research project.',
    'We appreciate your application. However, we are looking for candidates with more advanced coursework in this specific area.',
    'Thank you for applying. While your qualifications are strong, we have selected candidates whose research interests more closely align with the project goals.',
  ],
};

export async function seedResearchApplications(
  db: Database,
  studentIds: string[],
  researchIds: string[]
) {
  const createdApplications: string[] = [];

  console.log('  Creating research applications...');

  // Each student applies to 0-3 research opportunities
  for (const studentId of studentIds) {
    const applicationCount = Math.floor(Math.random() * 4); // 0-3 applications

    if (applicationCount === 0) continue;

    // Select random research opportunities
    const selectedResearch = [...researchIds]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(applicationCount, researchIds.length));

    for (let i = 0; i < selectedResearch.length; i++) {
      const researchId = selectedResearch[i];
      const id = generateUUIDv7();

      // Determine application status (60% pending, 25% accepted, 15% rejected)
      const statusRoll = Math.random();
      let status: 'pending' | 'accepted' | 'rejected';
      let faculty_feedback: string | undefined;

      if (statusRoll < 0.60) {
        status = 'pending';
        faculty_feedback = undefined;
      } else if (statusRoll < 0.85) {
        status = 'accepted';
        faculty_feedback = feedbackTemplates.accepted[
          Math.floor(Math.random() * feedbackTemplates.accepted.length)
        ];
      } else {
        status = 'rejected';
        faculty_feedback = feedbackTemplates.rejected[
          Math.floor(Math.random() * feedbackTemplates.rejected.length)
        ];
      }

      // Random statement of interest
      const statement = statementTemplates[
        Math.floor(Math.random() * statementTemplates.length)
      ];

      // Application date (5-60 days ago)
      const daysAgo = Math.floor(Math.random() * 56) + 5;
      const applicationDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const formattedDate = applicationDate.toISOString().split('T')[0]; // YYYY-MM-DD

      try {
        await db.insert(researchApplications).values({
          id,
          research_id: researchId,
          student_id: studentId,
          application_date: formattedDate,
          statement_of_interest: statement,
          status,
          faculty_feedback,
        });

        createdApplications.push(id);
      } catch (error) {
        // Skip if duplicate (unique constraint violation)
        console.log(`  - Skipped duplicate application for student ${studentId} to research ${researchId}`);
      }
    }
  }

  console.log(`  - Created ${createdApplications.length} research applications`);

  return createdApplications;
}
