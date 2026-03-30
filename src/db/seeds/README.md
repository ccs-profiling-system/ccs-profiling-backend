# Database Seeders

This directory contains seed files for populating the database with initial data.

## Structure

- `index.ts` - Main seeder orchestrator that runs all seed files in order
- `users.seed.ts` - Seeds user accounts (admin, faculty, student)
- `students.seed.ts` - Seeds student profiles
- `faculty.seed.ts` - Seeds faculty profiles
- `run-seeds.ts` - Standalone script to execute seeders

## Usage

### Run all seeders

```bash
npm run seed
```

### Run seeders with tsx directly

```bash
tsx src/db/seeds/run-seeds.ts
```

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
4. Ensure proper ordering based on foreign key dependencies

## Notes

- Seeders run in order of dependencies (users → students/faculty)
- Passwords are hashed using bcrypt before storage
- All seed data is for development/testing purposes only
- Make sure your database is migrated before running seeders
