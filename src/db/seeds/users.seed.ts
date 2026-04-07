import { Database } from '../index';
import { users } from '../schema';
import { generateUUIDv7 } from '../../shared/utils/uuid';
import bcrypt from 'bcrypt';

interface UserSeed {
  email: string;
  password: string;
  role: 'admin' | 'faculty' | 'student';
  is_active: boolean;
}

const userSeeds: UserSeed[] = [
  // Admin users
  {
    email: 'admin@ccs.edu',
    password: 'pass1234',
    role: 'admin',
    is_active: true,
  },
  {
    email: 'superadmin@ccs.edu',
    password: 'pass1234',
    role: 'admin',
    is_active: true,
  },
  // Faculty users
  {
    email: 'john.doe@ccs.edu',
    password: 'pass1234',
    role: 'faculty',
    is_active: true,
  },
  {
    email: 'jane.smith@ccs.edu',
    password: 'pass1234',
    role: 'faculty',
    is_active: true,
  },
  {
    email: 'robert.johnson@ccs.edu',
    password: 'pass1234',
    role: 'faculty',
    is_active: true,
  },
  // Student users
  {
    email: 'student1@ccs.edu',
    password: 'pass1234',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student2@ccs.edu',
    password: 'pass1234',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student3@ccs.edu',
    password: 'pass1234',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student4@ccs.edu',
    password: 'pass1234',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student5@ccs.edu',
    password: 'pass1234',
    role: 'student',
    is_active: true,
  },
];

export async function seedUsers(db: Database) {
  const createdUsers: Array<{ id: string; role: string }> = [];

  for (const userSeed of userSeeds) {
    // Generate UUID v7 for primary key
    const id = generateUUIDv7();
    const password_hash = await bcrypt.hash(userSeed.password, 10);

    const [user] = await db
      .insert(users)
      .values({
        id,
        email: userSeed.email,
        password_hash,
        role: userSeed.role,
        is_active: userSeed.is_active,
      })
      .returning({ id: users.id, role: users.role });

    createdUsers.push(user);
    console.log(`  - Created ${userSeed.role}: ${userSeed.email}`);
  }

  return createdUsers;
}
