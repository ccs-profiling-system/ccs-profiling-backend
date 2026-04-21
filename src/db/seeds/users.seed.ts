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

function generateUserSeeds(): UserSeed[] {
  const seeds: UserSeed[] = [
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
  ];

  // Generate 1000 student users
  for (let i = 1; i <= 1000; i++) {
    seeds.push({
      email: `student${i}@ccs.edu`,
      password: 'pass1234',
      role: 'student',
      is_active: true,
    });
  }

  return seeds;
}

const userSeeds: UserSeed[] = generateUserSeeds();

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
