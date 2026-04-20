/**
 * Student Portal Routes
 * 
 * Aggregates all student portal routes under the /api/student prefix.
 * All routes require JWT authentication and student.* permissions.
 * 
 * Registered Routes:
 * - /api/student/profile - Profile management (GET, PUT)
 * 
 * Requirements: 27.1, 27.2, 27.3, 27.4, 27.5
 */

import { Router } from 'express';
import { db } from '../../../db';

// Import controllers
import { ProfileController } from '../controllers/profile.controller';

// Import services
import { ProfileService } from '../services/profile.service';

// Import route creators
import { createProfileRoutes } from './profile.routes';

// Initialize services
const profileService = new ProfileService(db);

// Initialize controllers
const profileController = new ProfileController(profileService);

// Create route modules
const profileRoutes = createProfileRoutes(profileController);

// Aggregate all student portal routes
export const studentPortalRouter = Router();

// Register profile routes (uses /student/profile pattern)
studentPortalRouter.use('/student/profile', profileRoutes);
