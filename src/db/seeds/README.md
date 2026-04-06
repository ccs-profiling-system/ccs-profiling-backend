# Database Seeders

This directory contains seed files for populating the database with initial data.

## Structure

- `index.ts` - Main seeder orchestrator that runs all seed files in order
- `users.seed.ts` - Seeds user accounts (admin, faculty, student) with UUID v7
- `students.seed.ts` - Seeds student profiles with auto-generated IDs
- `faculty.seed.ts` - Seeds faculty profiles with auto-generated IDs
- `instructions.seed.ts` - Seeds course/subject instructions
- `enrollments.seed.ts` - Seeds student enrollments in courses
- `academicHistory.seed.ts` - Seeds academic history records with grades
- `skills.seed.ts` - Seeds student skills and competencies
- `violations.seed.ts` - Seeds student violation records
- `affiliations.seed.ts` - Seeds student organization affiliations
- `events.seed.ts` - Seeds academic events with participants
- `schedules.seed.ts` - Seeds class, exam, and consultation schedules
- `research.seed.ts` - Seeds research projects with authors and advisers
- `uploads.seed.ts` - Seeds file upload records for various entities
- `run-seeds.ts` - Standalone script to execute seeders

## Available Commands

### Seed Database
```bash
npm run db:seed
```
Populates the database with initial test data. **Smart seeding**: If tables already have data, seeding is skipped automatically.

### Reset Database
```bash
npm run db:reset
```
**WARNING**: This command drops all tables and deletes ALL data!

After resetting, you need to:
1. Recreate tables: `npm run db:push`
2. Seed data: `npm run db:seed`

### Full Reset and Reseed
```bash
npm run db:reset && npm run db:push && npm run db:seed
```

## Smart Seeding Behavior

The seeding system checks if tables already contain data before seeding:
- ✅ If table is empty → Seeds data
- ⏭️ If table has data → Skips seeding for that table
- 📊 Shows count of existing records

This prevents duplicate data and allows safe re-running of the seed command.

## ID Generation System

The seeders use the new ID generation system that automatically creates:

### UUID v7 Primary Keys
- All entities (users, students, faculty) use UUID v7 for primary keys
- UUID v7 is time-ordered, improving database performance
- Generated using `generateUUIDv7()` utility

### Human-Readable IDs
- **Students**: `S-YYYY-0001`, `S-YYYY-0002`, etc.
- **Faculty**: `F-YYYY-0001`, `F-YYYY-0002`, etc.
- Format: `{Prefix}-{Year}-{Sequence}`
- Automatically generated using entity counters
- Transactionally safe (no duplicate IDs)

Example output:
```
📝 Seeding students...
  - Created student: Alice Williams (S-2026-0001)
  - Created student: Bob Brown (S-2026-0002)
  - Created student: Charlie Davis (S-2026-0003)
✅ Created 5 students

📝 Seeding faculty...
  - Created faculty: John Doe (F-2026-0001)
  - Created faculty: Jane Smith (F-2026-0002)
  - Created faculty: Robert Johnson (F-2026-0003)
✅ Created 3 faculty members
```

## Default Credentials

All users have the same password: `pass1234`

### Admin Users
- Email: `admin@ccs.edu`
- Email: `superadmin@ccs.edu`

### Faculty Users
- Email: `john.doe@ccs.edu` (F-YYYY-0001)
- Email: `jane.smith@ccs.edu` (F-YYYY-0002)
- Email: `robert.johnson@ccs.edu` (F-YYYY-0003)

### Student Users
- Email: `student1@ccs.edu` (S-YYYY-0001) - Year 4, has 3 years of academic history
- Email: `student2@ccs.edu` (S-YYYY-0002) - Year 3, has 2 years of academic history
- Email: `student3@ccs.edu` (S-YYYY-0003) - Year 2, has 1 year of academic history
- Email: `student4@ccs.edu` (S-YYYY-0004) - Year 1, no academic history yet
- Email: `student5@ccs.edu` (S-YYYY-0005) - Year 4, has 3 years of academic history

## Seeded Data Overview

### Instructions (Courses)
- 15 courses across 4 year levels
- First Year: CS101, CS102, MATH101, ENG101
- Second Year: CS201, CS202, CS203, MATH201
- Third Year: CS301, CS302, CS303, CS304
- Fourth Year: CS401, CS402, CS403

### Enrollments
- 23 enrollment records
- Current semester enrollments (1st semester 2025-2026)
- Historical enrollments (2nd semester 2024-2025)
- Mix of enrolled, completed, and dropped statuses

### Academic History
- 44 academic history records
- Covers 3 academic years (2022-2023 to 2024-2025)
- Realistic grade distribution (1.0 to 2.5)
- Year 4 students have complete 3-year history
- Year 3 students have 2-year history
- Year 2 students have 1-year history
- Year 1 students have no history (just started)

### Events
- 10 academic events (seminars, workshops, competitions, defenses)
- Events scheduled from April to June 2026
- Each event has 5-15 participants (mix of students and faculty)
- Participation roles: participant, organizer, speaker, facilitator
- Attendance statuses: registered, attended, absent

### Schedules
- Class schedules for all instructions
- Exam schedules (10 exams)
- Faculty consultation schedules (1-3 per faculty member)
- Covers 1st and 2nd semesters of 2025-2026 academic year
- Various time slots from 7:00 AM to 5:30 PM
- Multiple rooms and days of the week

### Research
- 12 research projects (thesis, capstone, publications)
- Mix of ongoing, completed, and published research
- Research types: thesis (individual), capstone (group), publication (collaborative)
- Each research has 1-5 student authors with proper author ordering
- Each research has 1-2 faculty advisers (adviser, co-adviser, panel-member)
- Includes abstracts, start dates, completion dates, and publication URLs

### Uploads
- 12 file upload records across different entity types
- Student documents: transcripts, resumes, ID cards, certificates
- Faculty documents: CVs, research papers, credentials
- Research documents: proposals, methodology papers, results spreadsheets
- Event documents: posters, programs
- File types: PDF, DOCX, XLSX, JPG, PNG
- File sizes range from 123KB to 1.5MB
- Organized by entity type with realistic storage paths

## Adding New Seeders

1. Create a new seed file in this directory (e.g., `courses.seed.ts`)
2. Export a seed function that accepts the database instance
3. Import and call your seed function in `index.ts`
4. Add table check logic to prevent duplicate seeding
5. Ensure proper ordering based on foreign key dependencies
6. Use UUID v7 for primary keys: `generateUUIDv7()`
7. Use entity counters for human-readable IDs if applicable

## Transactional Integrity

The seeders use database transactions to ensure:
- Atomic ID generation (no duplicate IDs)
- Counter increments are properly locked
- All-or-nothing seeding (rollback on failure)

Each entity type (students, faculty) is seeded within a single transaction that:
1. Creates or gets the entity counter for the current year
2. Increments the counter with row-level locking
3. Generates the human-readable ID
4. Inserts the entity record

If any step fails, the entire transaction rolls back.

## Notes

- Seeders run in order of dependencies (users → students/faculty)
- Passwords are hashed using bcrypt before storage
- All seed data is for development/testing purposes only
- Make sure your database is migrated before running seeders
- Smart seeding prevents duplicate data on re-runs
- IDs are automatically generated - no need to specify them manually
- Entity counters track sequences per entity type and year
