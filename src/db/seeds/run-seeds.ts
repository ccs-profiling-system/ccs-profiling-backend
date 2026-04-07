#!/usr/bin/env tsx

import { runSeeders } from './index';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Run the seeders
runSeeders()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });
