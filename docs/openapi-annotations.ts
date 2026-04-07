/**
 * OpenAPI/Swagger Annotations for API Endpoints
 * 
 * This file contains JSDoc annotations for all API endpoints.
 * These annotations are parsed by swagger-jsdoc to generate the OpenAPI specification.
 * 
 * Requirements: 24.1, 24.2, 24.3, 24.4
 */

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and receive JWT token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get the currently authenticated user's information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/admin/students:
 *   get:
 *     summary: List students
 *     description: Get a paginated list of students with optional filters
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or student_id
 *       - in: query
 *         name: program
 *         schema:
 *           type: string
 *         description: Filter by program
 *       - in: query
 *         name: year_level
 *         schema:
 *           type: integer
 *         description: Filter by year level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, graduated]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentListResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/admin/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     description: Retrieve a single student by their UUID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student UUID
 *     responses:
 *       200:
 *         description: Student retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudentResponse'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/admin/students:
 *   post:
 *     summary: Create student
 *     description: Create a new student profile with optional user account
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStudentRequest'
 *     responses:
 *       201:
 *         description: Student created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudentResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - Student ID or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/admin/students/{id}:
 *   put:
 *     summary: Update student
 *     description: Update an existing student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStudentRequest'
 *     responses:
 *       200:
 *         description: Student updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudentResponse'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/admin/students/{id}:
 *   delete:
 *     summary: Soft delete student
 *     description: Soft delete a student (sets deleted_at timestamp)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student UUID
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Student deleted successfully
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/admin/students/{id}/profile:
 *   get:
 *     summary: Get complete student profile
 *     description: Get student profile with all related data (skills, violations, affiliations, academic history, enrollments)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student UUID
 *     responses:
 *       200:
 *         description: Student profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   allOf:
 *                     - $ref: '#/components/schemas/StudentResponse'
 *                     - type: object
 *                       properties:
 *                         skills:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/SkillResponse'
 *                         violations:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ViolationResponse'
 *                         affiliations:
 *                           type: array
 *                           items:
 *                             type: object
 *                         academic_history:
 *                           type: array
 *                           items:
 *                             type: object
 *                         enrollments:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/EnrollmentResponse'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/admin/faculty:
 *   get:
 *     summary: List faculty
 *     description: Get a paginated list of faculty members with optional filters
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or faculty_id
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: Faculty list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FacultyResponse'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */

/**
 * @swagger
 * /v1/admin/faculty:
 *   post:
 *     summary: Create faculty
 *     description: Create a new faculty profile with optional user account
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFacultyRequest'
 *     responses:
 *       201:
 *         description: Faculty created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FacultyResponse'
 */

/**
 * @swagger
 * /v1/admin/students/{studentId}/skills:
 *   get:
 *     summary: List student skills
 *     description: Get all skills for a specific student
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student UUID
 *     responses:
 *       200:
 *         description: Skills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SkillResponse'
 */

/**
 * @swagger
 * /v1/admin/students/{studentId}/skills:
 *   post:
 *     summary: Add student skill
 *     description: Add a new skill to a student's profile
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSkillRequest'
 *     responses:
 *       201:
 *         description: Skill added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SkillResponse'
 */

/**
 * @swagger
 * /v1/admin/students/{studentId}/violations:
 *   post:
 *     summary: Record student violation
 *     description: Record a new violation for a student
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateViolationRequest'
 *     responses:
 *       201:
 *         description: Violation recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ViolationResponse'
 */

/**
 * @swagger
 * /v1/admin/enrollments:
 *   post:
 *     summary: Enroll student
 *     description: Enroll a student in a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEnrollmentRequest'
 *     responses:
 *       201:
 *         description: Student enrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EnrollmentResponse'
 *       409:
 *         description: Conflict - Student already enrolled in this course
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/admin/schedules:
 *   post:
 *     summary: Create schedule
 *     description: Create a new class/exam schedule with automatic conflict detection
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateScheduleRequest'
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ScheduleResponse'
 *       409:
 *         description: Conflict - Schedule conflict detected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: Schedule conflict detected for room 301 on monday between 08:00:00 and 10:00:00
 *                 code: CONFLICT
 *                 timestamp: 2024-01-01T00:00:00.000Z
 */

/**
 * @swagger
 * /v1/admin/schedules/check-conflict:
 *   post:
 *     summary: Check schedule conflict
 *     description: Check if a schedule would conflict with existing schedules
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [room, day, start_time, end_time, semester, academic_year]
 *             properties:
 *               room:
 *                 type: string
 *               day:
 *                 type: string
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *               semester:
 *                 type: string
 *               academic_year:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conflict check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     has_conflict:
 *                       type: boolean
 *                     conflicts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ScheduleResponse'
 */

/**
 * @swagger
 * /v1/admin/dashboard:
 *   get:
 *     summary: Get dashboard metrics
 *     description: Get system-wide statistics and metrics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_students:
 *                       type: integer
 *                     total_faculty:
 *                       type: integer
 *                     total_events:
 *                       type: integer
 *                     total_research:
 *                       type: integer
 *                     active_enrollments:
 *                       type: integer
 */

/**
 * @swagger
 * /v1/admin/search:
 *   get:
 *     summary: Global search
 *     description: Search across all entities (students, faculty, events, research)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [students, faculty, events, research, all]
 *           default: all
 *         description: Entity type to search
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     students:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StudentResponse'
 *                     faculty:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FacultyResponse'
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                     research:
 *                       type: array
 *                       items:
 *                         type: object
 */

/**
 * @swagger
 * /v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Refresh access token using refresh token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token obtained from login
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */

/**
 * @swagger
 * /v1/auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Change password for authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid old password
 */

/**
 * @swagger
 * /v1/auth/logout:
 *   post:
 *     summary: Logout
 *     description: Logout endpoint
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 */

/**
 * @swagger
 * /v1/admin/students/deleted:
 *   get:
 *     summary: Get deleted students
 *     description: Get all soft-deleted students
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentListResponse'
 */

/**
 * @swagger
 * /v1/admin/students/{id}/restore:
 *   patch:
 *     summary: Restore student
 *     description: Restore a soft-deleted student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student UUID
 *     responses:
 *       200:
 *         description: Student restored successfully
 *       404:
 *         description: Student not found
 */

/**
 * @swagger
 * /v1/admin/students/{id}/permanent:
 *   delete:
 *     summary: Permanently delete student
 *     description: Permanently delete a student record (cannot be undone)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student UUID
 *     responses:
 *       200:
 *         description: Student permanently deleted
 *       404:
 *         description: Student not found
 */

/**
 * @swagger
 * /v1/admin/faculty/deleted:
 *   get:
 *     summary: Get deleted faculty
 *     description: Get all soft-deleted faculty members
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted faculty retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/faculty/{id}/restore:
 *   patch:
 *     summary: Restore faculty
 *     description: Restore a soft-deleted faculty member
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Faculty restored successfully
 */

/**
 * @swagger
 * /v1/admin/faculty/{id}/permanent:
 *   delete:
 *     summary: Permanently delete faculty
 *     description: Permanently delete a faculty record
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Faculty permanently deleted
 */

/**
 * @swagger
 * /v1/admin/instructions:
 *   get:
 *     summary: List instructions
 *     description: Get paginated list of instructions/subjects
 *     tags: [Instructions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by subject code or name
 *       - in: query
 *         name: curriculum_year
 *         schema:
 *           type: string
 *         description: Filter by curriculum year
 *     responses:
 *       200:
 *         description: Instructions retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/instructions:
 *   post:
 *     summary: Create instruction
 *     description: Create new instruction/subject
 *     tags: [Instructions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject_code, subject_name, credits, curriculum_year]
 *             properties:
 *               subject_code:
 *                 type: string
 *               subject_name:
 *                 type: string
 *               description:
 *                 type: string
 *               credits:
 *                 type: integer
 *               curriculum_year:
 *                 type: string
 *     responses:
 *       201:
 *         description: Instruction created successfully
 */

/**
 * @swagger
 * /v1/admin/instructions/{id}:
 *   get:
 *     summary: Get instruction by ID
 *     description: Get instruction details
 *     tags: [Instructions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Instruction retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/instructions/{id}:
 *   put:
 *     summary: Update instruction
 *     description: Update instruction information
 *     tags: [Instructions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject_name:
 *                 type: string
 *               description:
 *                 type: string
 *               credits:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Instruction updated successfully
 */

/**
 * @swagger
 * /v1/admin/instructions/{id}:
 *   delete:
 *     summary: Delete instruction (soft delete)
 *     description: Soft delete instruction
 *     tags: [Instructions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Instruction deleted successfully
 */

/**
 * @swagger
 * /v1/admin/instructions/deleted:
 *   get:
 *     summary: Get deleted instructions
 *     description: Get all soft-deleted instructions
 *     tags: [Instructions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted instructions retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/instructions/{id}/restore:
 *   patch:
 *     summary: Restore instruction
 *     description: Restore a soft-deleted instruction
 *     tags: [Instructions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Instruction restored successfully
 */

/**
 * @swagger
 * /v1/admin/instructions/{id}/permanent:
 *   delete:
 *     summary: Permanently delete instruction
 *     description: Permanently delete an instruction record
 *     tags: [Instructions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Instruction permanently deleted
 */

/**
 * @swagger
 * /v1/admin/enrollments:
 *   get:
 *     summary: List enrollments
 *     description: Get paginated list of enrollments
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *           enum: [1st, 2nd, summer]
 *       - in: query
 *         name: academic_year
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [enrolled, dropped, completed]
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/students/{studentId}/enrollments:
 *   get:
 *     summary: Get enrollments by student
 *     description: Get all enrollments for a specific student
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student enrollments retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/instructions/{instructionId}/enrollments:
 *   get:
 *     summary: Get enrollments by instruction
 *     description: Get all enrollments for a specific instruction
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instructionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Instruction enrollments retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/enrollments/{id}:
 *   put:
 *     summary: Update enrollment
 *     description: Update enrollment status
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enrollment_status:
 *                 type: string
 *                 enum: [enrolled, dropped, completed]
 *     responses:
 *       200:
 *         description: Enrollment updated successfully
 */

/**
 * @swagger
 * /v1/admin/enrollments/{id}:
 *   delete:
 *     summary: Delete enrollment
 *     description: Delete enrollment record
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 */

/**
 * @swagger
 * /v1/admin/students/{studentId}/academic-history:
 *   get:
 *     summary: Get academic history by student
 *     description: Get all academic history records for a student
 *     tags: [Academic History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Academic history retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/students/{studentId}/academic-history:
 *   post:
 *     summary: Create academic history record
 *     description: Create new academic history record for a student
 *     tags: [Academic History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject_code, subject_name, grade, semester, academic_year, credits]
 *             properties:
 *               subject_code:
 *                 type: string
 *               subject_name:
 *                 type: string
 *               grade:
 *                 type: number
 *                 format: float
 *               semester:
 *                 type: string
 *                 enum: [1st, 2nd, summer]
 *               academic_year:
 *                 type: string
 *               credits:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Academic history record created successfully
 */

/**
 * @swagger
 * /v1/admin/students/{studentId}/gpa:
 *   get:
 *     summary: Get student GPA
 *     description: Calculate and get GPA for a student
 *     tags: [Academic History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: GPA calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     gpa:
 *                       type: number
 *                       format: float
 *                     total_credits:
 *                       type: integer
 */

/**
 * @swagger
 * /v1/admin/academic-history/{id}:
 *   put:
 *     summary: Update academic history record
 *     description: Update academic history record
 *     tags: [Academic History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grade:
 *                 type: number
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Academic history updated successfully
 */

/**
 * @swagger
 * /v1/admin/academic-history/{id}:
 *   delete:
 *     summary: Delete academic history record
 *     description: Delete academic history record
 *     tags: [Academic History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Academic history deleted successfully
 */

/**
 * @swagger
 * /v1/admin/skills:
 *   get:
 *     summary: List skills
 *     description: Get paginated list of skill records
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: proficiency_level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced, expert]
 *     responses:
 *       200:
 *         description: Skills retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/skills/{id}:
 *   put:
 *     summary: Update skill
 *     description: Update skill record
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proficiency_level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, expert]
 *               years_of_experience:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Skill updated successfully
 */

/**
 * @swagger
 * /v1/admin/skills/{id}:
 *   delete:
 *     summary: Delete skill
 *     description: Delete skill record
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Skill deleted successfully
 */

/**
 * @swagger
 * /v1/admin/violations:
 *   get:
 *     summary: List violations
 *     description: Get paginated list of violation records
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: resolution_status
 *         schema:
 *           type: string
 *           enum: [pending, resolved, dismissed]
 *     responses:
 *       200:
 *         description: Violations retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/violations/{id}:
 *   put:
 *     summary: Update violation
 *     description: Update violation record
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               violation_type:
 *                 type: string
 *               description:
 *                 type: string
 *               resolution_status:
 *                 type: string
 *                 enum: [pending, resolved, dismissed]
 *     responses:
 *       200:
 *         description: Violation updated successfully
 */

/**
 * @swagger
 * /v1/admin/violations/{id}/resolve:
 *   patch:
 *     summary: Resolve violation
 *     description: Resolve a violation record
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolution_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Violation resolved successfully
 */

/**
 * @swagger
 * /v1/admin/violations/{id}:
 *   delete:
 *     summary: Delete violation
 *     description: Delete violation record
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Violation deleted successfully
 */

/**
 * @swagger
 * /v1/admin/affiliations:
 *   get:
 *     summary: List affiliations
 *     description: Get paginated list of affiliation records
 *     tags: [Affiliations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Affiliations retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/students/{studentId}/affiliations:
 *   get:
 *     summary: Get affiliations by student
 *     description: Get all affiliations for a student
 *     tags: [Affiliations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student affiliations retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/students/{studentId}/affiliations:
 *   post:
 *     summary: Create affiliation
 *     description: Create new affiliation for a student
 *     tags: [Affiliations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organization_name, start_date]
 *             properties:
 *               organization_name:
 *                 type: string
 *               role:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Affiliation created successfully
 */

/**
 * @swagger
 * /v1/admin/affiliations/{id}:
 *   put:
 *     summary: Update affiliation
 *     description: Update affiliation record
 *     tags: [Affiliations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Affiliation updated successfully
 */

/**
 * @swagger
 * /v1/admin/affiliations/{id}/end:
 *   patch:
 *     summary: End affiliation
 *     description: End an affiliation
 *     tags: [Affiliations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [end_date]
 *             properties:
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Affiliation ended successfully
 */

/**
 * @swagger
 * /v1/admin/affiliations/{id}:
 *   delete:
 *     summary: Delete affiliation
 *     description: Delete affiliation record
 *     tags: [Affiliations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Affiliation deleted successfully
 */

/**
 * @swagger
 * /v1/admin/events:
 *   get:
 *     summary: List events
 *     description: Get paginated list of events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *           enum: [seminar, workshop, defense, competition]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/events:
 *   post:
 *     summary: Create event
 *     description: Create new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event_name, event_type, event_date]
 *             properties:
 *               event_name:
 *                 type: string
 *               event_type:
 *                 type: string
 *                 enum: [seminar, workshop, defense, competition]
 *               description:
 *                 type: string
 *               event_date:
 *                 type: string
 *                 format: date
 *               start_time:
 *                 type: string
 *                 format: time
 *               end_time:
 *                 type: string
 *                 format: time
 *               location:
 *                 type: string
 *               max_participants:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Event created successfully
 */

/**
 * @swagger
 * /v1/admin/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     description: Get event details
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/events/{id}:
 *   put:
 *     summary: Update event
 *     description: Update event information
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_name:
 *                 type: string
 *               location:
 *                 type: string
 *               max_participants:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Event updated successfully
 */

/**
 * @swagger
 * /v1/admin/events/{id}:
 *   delete:
 *     summary: Delete event (soft delete)
 *     description: Soft delete event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event deleted successfully
 */

/**
 * @swagger
 * /v1/admin/events/deleted:
 *   get:
 *     summary: Get deleted events
 *     description: Get all soft-deleted events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted events retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/events/{id}/restore:
 *   patch:
 *     summary: Restore event
 *     description: Restore a soft-deleted event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event restored successfully
 */

/**
 * @swagger
 * /v1/admin/events/{id}/permanent:
 *   delete:
 *     summary: Permanently delete event
 *     description: Permanently delete an event record
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event permanently deleted
 */

/**
 * @swagger
 * /v1/admin/events/{id}/participants:
 *   get:
 *     summary: Get event participants
 *     description: Get all participants for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Participants retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/events/{id}/participants:
 *   post:
 *     summary: Add participant to event
 *     description: Add a student or faculty participant to an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_id:
 *                 type: string
 *                 format: uuid
 *               faculty_id:
 *                 type: string
 *                 format: uuid
 *               participation_role:
 *                 type: string
 *               attendance_status:
 *                 type: string
 *                 enum: [registered, attended, absent, cancelled]
 *     responses:
 *       201:
 *         description: Participant added successfully
 */

/**
 * @swagger
 * /v1/admin/events/{id}/participants/{participantId}:
 *   delete:
 *     summary: Remove participant from event
 *     description: Remove a participant from an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: participantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Participant removed successfully
 */

/**
 * @swagger
 * /v1/admin/research:
 *   get:
 *     summary: List research projects
 *     description: Get paginated list of research projects
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title
 *       - in: query
 *         name: research_type
 *         schema:
 *           type: string
 *           enum: [thesis, capstone, research_paper]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ongoing, completed, published]
 *     responses:
 *       200:
 *         description: Research projects retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/research:
 *   post:
 *     summary: Create research project
 *     description: Create new research project
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, research_type]
 *             properties:
 *               title:
 *                 type: string
 *               research_type:
 *                 type: string
 *                 enum: [thesis, capstone, research_paper]
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [ongoing, completed, published]
 *     responses:
 *       201:
 *         description: Research project created successfully
 */

/**
 * @swagger
 * /v1/admin/research/{id}:
 *   get:
 *     summary: Get research project by ID
 *     description: Get research project details
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Research project retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/research/{id}:
 *   put:
 *     summary: Update research project
 *     description: Update research project information
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ongoing, completed, published]
 *     responses:
 *       200:
 *         description: Research project updated successfully
 */

/**
 * @swagger
 * /v1/admin/research/{id}:
 *   delete:
 *     summary: Delete research project (soft delete)
 *     description: Soft delete research project
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Research project deleted successfully
 */

/**
 * @swagger
 * /v1/admin/research/deleted:
 *   get:
 *     summary: Get deleted research projects
 *     description: Get all soft-deleted research projects
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted research projects retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/research/{id}/restore:
 *   patch:
 *     summary: Restore research project
 *     description: Restore a soft-deleted research project
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Research project restored successfully
 */

/**
 * @swagger
 * /v1/admin/research/{id}/permanent:
 *   delete:
 *     summary: Permanently delete research project
 *     description: Permanently delete a research project record
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Research project permanently deleted
 */

/**
 * @swagger
 * /v1/admin/research/{id}/authors:
 *   get:
 *     summary: Get research authors
 *     description: Get all authors for a research project
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Research authors retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/research/{id}/authors:
 *   post:
 *     summary: Add research author
 *     description: Add an author to a research project
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student_id]
 *             properties:
 *               student_id:
 *                 type: string
 *                 format: uuid
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Author added successfully
 */

/**
 * @swagger
 * /v1/admin/research/{id}/authors/{authorId}:
 *   delete:
 *     summary: Remove research author
 *     description: Remove an author from a research project
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: authorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Author removed successfully
 */

/**
 * @swagger
 * /v1/admin/research/{id}/advisers:
 *   get:
 *     summary: Get research advisers
 *     description: Get all advisers for a research project
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Research advisers retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/research/{id}/advisers:
 *   post:
 *     summary: Add research adviser
 *     description: Add an adviser to a research project
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [faculty_id]
 *             properties:
 *               faculty_id:
 *                 type: string
 *                 format: uuid
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Adviser added successfully
 */

/**
 * @swagger
 * /v1/admin/research/{id}/advisers/{adviserId}:
 *   delete:
 *     summary: Remove research adviser
 *     description: Remove an adviser from a research project
 *     tags: [Research]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: adviserId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Adviser removed successfully
 */

/**
 * @swagger
 * /v1/admin/schedules/{id}:
 *   get:
 *     summary: Get schedule by ID
 *     description: Get schedule details
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Schedule retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/schedules/{id}:
 *   put:
 *     summary: Update schedule
 *     description: Update schedule information
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               room:
 *                 type: string
 *               day:
 *                 type: string
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 */

/**
 * @swagger
 * /v1/admin/uploads:
 *   post:
 *     summary: Upload file
 *     description: Upload a file to the server
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               entity_type:
 *                 type: string
 *               entity_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */

/**
 * @swagger
 * /v1/admin/uploads:
 *   get:
 *     summary: List uploads
 *     description: Get paginated list of uploaded files
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: entity_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Uploads retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/uploads/{id}:
 *   get:
 *     summary: Get upload by ID
 *     description: Get upload details
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Upload retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/uploads/{id}:
 *   delete:
 *     summary: Delete upload
 *     description: Delete an uploaded file
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Upload deleted successfully
 */

/**
 * @swagger
 * /v1/admin/audit-logs:
 *   get:
 *     summary: List audit logs
 *     description: Get paginated list of audit logs
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, update, delete, restore]
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/audit-logs/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     description: Get audit log details
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     description: Get system-wide analytics overview
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics overview retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/analytics/students:
 *   get:
 *     summary: Get student analytics
 *     description: Get analytics data for students
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: program
 *         schema:
 *           type: string
 *       - in: query
 *         name: year_level
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student analytics retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/analytics/enrollments:
 *   get:
 *     summary: Get enrollment analytics
 *     description: Get analytics data for enrollments
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *       - in: query
 *         name: academic_year
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment analytics retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/analytics/performance:
 *   get:
 *     summary: Get performance analytics
 *     description: Get academic performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: program
 *         schema:
 *           type: string
 *       - in: query
 *         name: academic_year
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance analytics retrieved successfully
 */

/**
 * @swagger
 * /v1/admin/reports/students:
 *   get:
 *     summary: Generate student report
 *     description: Generate and download student report (PDF/Excel)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, excel]
 *       - in: query
 *         name: program
 *         schema:
 *           type: string
 *       - in: query
 *         name: year_level
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report generated successfully
 */

/**
 * @swagger
 * /v1/admin/reports/enrollments:
 *   get:
 *     summary: Generate enrollment report
 *     description: Generate and download enrollment report (PDF/Excel)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, excel]
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *       - in: query
 *         name: academic_year
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report generated successfully
 */

/**
 * @swagger
 * /v1/admin/reports/grades:
 *   get:
 *     summary: Generate grades report
 *     description: Generate and download grades report (PDF/Excel)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, excel]
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *       - in: query
 *         name: academic_year
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report generated successfully
 */

/**
 * @swagger
 * /v1/admin/reports/research:
 *   get:
 *     summary: Generate research report
 *     description: Generate and download research report (PDF/Excel)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, excel]
 *       - in: query
 *         name: research_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report generated successfully
 */
