import { Database } from '../index';
import { research, researchAuthors, researchAdvisers } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';

interface ResearchSeed {
  title: string;
  abstract: string;
  researchType: 'thesis' | 'capstone' | 'publication';
  status: 'ongoing' | 'completed' | 'published';
  startDate: string;
  completionDate?: string;
  publicationUrl?: string;
  authorCount: number; // How many authors to assign
}

const researchSeeds: ResearchSeed[] = [
  {
    title: 'Machine Learning Approaches for Student Performance Prediction',
    abstract: 'This research explores various machine learning algorithms to predict student academic performance based on historical data, attendance patterns, and engagement metrics. The study compares the effectiveness of decision trees, random forests, and neural networks in achieving accurate predictions.',
    researchType: 'thesis',
    status: 'completed',
    startDate: '2024-06-01',
    completionDate: '2025-03-15',
    authorCount: 1,
  },
  {
    title: 'Development of a Mobile Learning Platform for Computer Science Education',
    abstract: 'A comprehensive mobile application designed to enhance computer science education through interactive lessons, coding challenges, and real-time feedback. The platform incorporates gamification elements to increase student engagement and motivation.',
    researchType: 'capstone',
    status: 'completed',
    startDate: '2024-08-01',
    completionDate: '2025-04-01',
    authorCount: 3,
  },
  {
    title: 'Blockchain-Based Academic Credential Verification System',
    abstract: 'This capstone project presents a decentralized system for verifying academic credentials using blockchain technology. The system ensures tamper-proof storage of academic records and provides instant verification capabilities for employers and institutions.',
    researchType: 'capstone',
    status: 'ongoing',
    startDate: '2025-09-01',
    authorCount: 4,
  },
  {
    title: 'Natural Language Processing for Automated Essay Grading',
    abstract: 'An investigation into the application of NLP techniques for automated assessment of student essays. The research evaluates the accuracy and reliability of various NLP models in providing consistent and fair grading compared to human evaluators.',
    researchType: 'thesis',
    status: 'ongoing',
    startDate: '2025-06-15',
    authorCount: 1,
  },
  {
    title: 'IoT-Based Smart Campus Management System',
    abstract: 'A comprehensive IoT solution for campus management including automated attendance tracking, energy management, and facility monitoring. The system integrates multiple sensors and provides a centralized dashboard for administrators.',
    researchType: 'capstone',
    status: 'completed',
    startDate: '2024-07-01',
    completionDate: '2025-03-30',
    authorCount: 5,
  },
  {
    title: 'Cybersecurity Awareness and Practices Among University Students',
    abstract: 'A comprehensive study examining the current state of cybersecurity awareness among university students, identifying common vulnerabilities, and proposing educational interventions to improve security practices.',
    researchType: 'publication',
    status: 'published',
    startDate: '2024-01-15',
    completionDate: '2024-11-20',
    publicationUrl: 'https://doi.org/10.1234/cybersec.2024.001',
    authorCount: 2,
  },
  {
    title: 'Augmented Reality Applications in Computer Science Laboratory Education',
    abstract: 'This research explores the integration of augmented reality technology in computer science laboratory sessions to enhance student understanding of complex concepts such as data structures, algorithms, and network architectures.',
    researchType: 'thesis',
    status: 'ongoing',
    startDate: '2025-08-01',
    authorCount: 1,
  },
  {
    title: 'Cloud-Based Student Information Management System',
    abstract: 'Development of a scalable, cloud-based system for managing student information, academic records, and administrative processes. The system emphasizes security, accessibility, and integration with existing university infrastructure.',
    researchType: 'capstone',
    status: 'completed',
    startDate: '2024-09-01',
    completionDate: '2025-04-05',
    authorCount: 4,
  },
  {
    title: 'Deep Learning for Facial Recognition in Campus Security Systems',
    abstract: 'Implementation of deep learning algorithms for facial recognition to enhance campus security. The research addresses privacy concerns while improving the accuracy and speed of identification systems.',
    researchType: 'publication',
    status: 'completed',
    startDate: '2024-03-01',
    completionDate: '2025-01-10',
    publicationUrl: 'https://doi.org/10.1234/deeplearn.2025.002',
    authorCount: 3,
  },
  {
    title: 'Gamification Strategies for Improving Student Engagement in Online Learning',
    abstract: 'An empirical study investigating the effectiveness of various gamification elements in online learning platforms. The research measures student engagement, motivation, and learning outcomes across different gamification strategies.',
    researchType: 'thesis',
    status: 'ongoing',
    startDate: '2025-07-01',
    authorCount: 1,
  },
  {
    title: 'Automated Code Review System Using Static Analysis and Machine Learning',
    abstract: 'A capstone project developing an intelligent code review system that combines static analysis tools with machine learning to identify code quality issues, security vulnerabilities, and suggest improvements.',
    researchType: 'capstone',
    status: 'ongoing',
    startDate: '2025-09-15',
    authorCount: 3,
  },
  {
    title: 'Virtual Reality Simulation for Software Engineering Project Management',
    abstract: 'Development of a VR-based simulation environment for teaching software engineering project management concepts. The system allows students to experience realistic project scenarios and practice decision-making in a risk-free environment.',
    researchType: 'capstone',
    status: 'completed',
    startDate: '2024-08-15',
    completionDate: '2025-03-25',
    authorCount: 4,
  },
];

export async function seedResearch(db: Database, studentIds: string[], facultyIds: string[]) {
  const createdResearchIds: string[] = [];

  console.log('  Creating research projects...');

  for (const seed of researchSeeds) {
    const id = generateUUIDv7();

    const [researchProject] = await db
      .insert(research)
      .values({
        id,
        title: seed.title,
        abstract: seed.abstract,
        research_type: seed.researchType,
        status: seed.status,
        start_date: seed.startDate,
        completion_date: seed.completionDate,
        publication_url: seed.publicationUrl,
      })
      .returning({ id: research.id, title: research.title });

    createdResearchIds.push(researchProject.id);
    console.log(`  - Created research: ${seed.title.substring(0, 60)}...`);

    // Add authors (students)
    const availableStudents = [...studentIds];
    const authorCount = Math.min(seed.authorCount, availableStudents.length);

    for (let i = 0; i < authorCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableStudents.length);
      const studentId = availableStudents.splice(randomIndex, 1)[0];

      const authorId = generateUUIDv7();

      await db.insert(researchAuthors).values({
        id: authorId,
        research_id: researchProject.id,
        student_id: studentId,
        author_order: i + 1,
      });
    }

    // Add advisers (faculty)
    const adviserCount = Math.floor(Math.random() * 2) + 1; // 1-2 advisers per research
    const availableFaculty = [...facultyIds];

    for (let i = 0; i < Math.min(adviserCount, availableFaculty.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableFaculty.length);
      const facultyId = availableFaculty.splice(randomIndex, 1)[0];

      const adviserId = generateUUIDv7();
      const adviserRole = i === 0 ? 'adviser' : Math.random() > 0.5 ? 'co-adviser' : 'panel-member';

      await db.insert(researchAdvisers).values({
        id: adviserId,
        research_id: researchProject.id,
        faculty_id: facultyId,
        adviser_role: adviserRole,
      });
    }
  }

  console.log(`  - Created authors and advisers for ${createdResearchIds.length} research projects`);

  return createdResearchIds;
}
