# Database Seeders

This directory contains seed files for populating the database with initial data.

## Structure

- `index.ts` - Main seeder orchestrator that runs all seed files in order
- `users.seed.ts` - Seeds user accounts (admin, faculty, student)
- `students.seed.ts` - Seeds student profiles
- `faculty.seed.ts` - Seeds faculty profiles
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

## Default Credentials

All users have the same password: `pass1234`

### Admin Users
- Email: `admin@ccs.edu`
- Email: `superadmin@ccs.edu`

### Faculty Users
- Email: `john.doe@ccs.edu`
- Email: `jane.smith@ccs.edu`
- Email: `robert.johnson@ccs.edu`

### Student Users
- Email: `student1@ccs.edu`
- Email: `student2@ccs.edu`
- Email: `student3@ccs.edu`
- Email: `student4@ccs.edu`
- Email: `student5@ccs.edu`

## Adding New Seeders

1. Create a new seed file in this directory (e.g., `courses.seed.ts`)
2. Export a seed function that accepts the database instance
3. Import and call your seed function in `index.ts`
4. Add table check logic to prevent duplicate seeding
5. Ensure proper ordering based on foreign key dependencies

## Notes

- Seeders run in order of dependencies (users → students/faculty)
- Passwords are hashed using bcrypt before storage
- All seed data is for development/testing purposes only
- Make sure your database is migrated before running seeders
- Smart seeding prevents duplicate data on re-runs
