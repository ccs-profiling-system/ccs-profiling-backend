/**
 * Swagger/OpenAPI Configuration
 * 
 * This module configures OpenAPI 3.0 documentation for the CCS Backend API.
 * 
 */

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { config } from './index';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CCS Comprehensive Profiling System API',
    version: '1.0.0',
    description: `
# CCS Backend System API Documentation

The CCS Comprehensive Profiling System Backend is a production-ready Node.js + Express + TypeScript REST API 
designed to manage academic and institutional data for the College of Computer Studies.

## Key Features

- **Domain-Driven Modularity**: Each business domain is isolated in its own module
- **Three-Layer Architecture**: Controller → Service → Repository pattern
- **DTO-First Design**: Data Transfer Objects decouple API contracts from database schemas
- **Transaction-Safe Operations**: Multi-step operations use database transactions
- **Security-Hardened**: Input sanitization, SQL injection prevention, rate limiting
- **Audit-Ready**: Comprehensive logging with before/after state capture

## Authentication

All admin endpoints require JWT authentication. Include the JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

To obtain a token, use the \`POST /api/v1/auth/login\` endpoint.

## Response Format

All API responses follow a standardized format:

### Success Response
\`\`\`json
{
  "success": true,
  "data": {},
  "meta": {}
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

## Error Codes

- **VALIDATION_ERROR** (400): Input validation failed
- **UNAUTHORIZED** (401): Authentication failed or token invalid
- **FORBIDDEN** (403): Insufficient permissions
- **NOT_FOUND** (404): Resource not found
- **CONFLICT** (409): Resource conflict (e.g., duplicate entry, scheduling conflict)
- **INTERNAL_ERROR** (500): Server error

## Pagination

List endpoints support pagination with the following query parameters:

- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 10, max: 100)

Paginated responses include a \`meta\` object:

\`\`\`json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
\`\`\`
    `,
    contact: {
      name: 'CCS Backend Team',
      email: 'support@ccs.edu',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api`,
      description: 'Development server',
    },
    {
      url: 'https://ccs-profiling-backend-oqve.onrender.com/api',
      description: 'Production server (Render)',
    },
    {
      url: 'https://api.ccs.edu/api',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Students',
      description: 'Student profile management',
    },
    {
      name: 'Faculty',
      description: 'Faculty profile management',
    },
    {
      name: 'Skills',
      description: 'Student skills management',
    },
    {
      name: 'Violations',
      description: 'Student violations management',
    },
    {
      name: 'Affiliations',
      description: 'Student affiliations management',
    },
    {
      name: 'Academic History',
      description: 'Student academic history and grades',
    },
    {
      name: 'Enrollments',
      description: 'Student course enrollments',
    },
    {
      name: 'Instructions',
      description: 'Curriculum and subject management',
    },
    {
      name: 'Schedules',
      description: 'Class and exam scheduling',
    },
    {
      name: 'Research',
      description: 'Research projects and thesis management',
    },
    {
      name: 'Events',
      description: 'Academic events management',
    },
    {
      name: 'Uploads',
      description: 'File upload management',
    },
    {
      name: 'Audit Logs',
      description: 'System activity audit logs',
    },
    {
      name: 'Dashboard',
      description: 'System-wide metrics and statistics',
    },
    {
      name: 'Analytics',
      description: 'Data analytics and insights',
    },
    {
      name: 'Reports',
      description: 'Report generation (PDF/Excel)',
    },
    {
      name: 'Search',
      description: 'Global search across entities',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from the login endpoint',
      },
    },
    schemas: {
      // Common Schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Response payload',
          },
          meta: {
            type: 'object',
            description: 'Metadata (pagination, etc.)',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Validation failed',
              },
              code: {
                type: 'string',
                enum: ['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'CONFLICT', 'INTERNAL_ERROR'],
                example: 'VALIDATION_ERROR',
              },
              details: {
                type: 'object',
                description: 'Additional error details',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1,
          },
          limit: {
            type: 'integer',
            example: 10,
          },
          total: {
            type: 'integer',
            example: 150,
          },
          totalPages: {
            type: 'integer',
            example: 15,
          },
        },
      },
      
      // Authentication Schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'admin@ccs.edu',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'password123',
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              user: {
                $ref: '#/components/schemas/UserResponse',
              },
            },
          },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'admin@ccs.edu',
          },
          role: {
            type: 'string',
            enum: ['admin', 'faculty', 'student'],
            example: 'admin',
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      // Student Schemas
      CreateStudentRequest: {
        type: 'object',
        required: ['first_name', 'last_name', 'email'],
        properties: {
          first_name: {
            type: 'string',
            example: 'John',
          },
          last_name: {
            type: 'string',
            example: 'Doe',
          },
          middle_name: {
            type: 'string',
            example: 'Smith',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@student.ccs.edu',
          },
          phone: {
            type: 'string',
            example: '+1234567890',
          },
          date_of_birth: {
            type: 'string',
            format: 'date',
            example: '2000-01-15',
          },
          address: {
            type: 'string',
            example: '123 Main St, City, State',
          },
          year_level: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            example: 1,
          },
          program: {
            type: 'string',
            example: 'BSCS',
          },
          create_user_account: {
            type: 'boolean',
            example: true,
            description: 'Whether to create a user account for the student',
          },
        },
      },
      UpdateStudentRequest: {
        type: 'object',
        properties: {
          first_name: {
            type: 'string',
          },
          last_name: {
            type: 'string',
          },
          middle_name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          phone: {
            type: 'string',
          },
          date_of_birth: {
            type: 'string',
            format: 'date',
          },
          address: {
            type: 'string',
          },
          year_level: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
          },
          program: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'graduated'],
          },
        },
      },
      StudentResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          student_id: {
            type: 'string',
            example: 'S-2024-0001',
          },
          first_name: {
            type: 'string',
          },
          last_name: {
            type: 'string',
          },
          middle_name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          phone: {
            type: 'string',
          },
          date_of_birth: {
            type: 'string',
            format: 'date',
          },
          address: {
            type: 'string',
          },
          year_level: {
            type: 'integer',
          },
          program: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'graduated'],
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      StudentListResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/StudentResponse',
            },
          },
          meta: {
            $ref: '#/components/schemas/PaginationMeta',
          },
        },
      },
      
      // Faculty Schemas
      CreateFacultyRequest: {
        type: 'object',
        required: ['first_name', 'last_name', 'email', 'department'],
        properties: {
          first_name: {
            type: 'string',
            example: 'Jane',
          },
          last_name: {
            type: 'string',
            example: 'Smith',
          },
          middle_name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'jane.smith@ccs.edu',
          },
          phone: {
            type: 'string',
          },
          department: {
            type: 'string',
            example: 'Computer Science',
          },
          position: {
            type: 'string',
            example: 'Associate Professor',
          },
          specialization: {
            type: 'string',
            example: 'Machine Learning, Data Science',
          },
          create_user_account: {
            type: 'boolean',
            example: true,
          },
        },
      },
      FacultyResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          faculty_id: {
            type: 'string',
            example: 'F-2024-0001',
          },
          first_name: {
            type: 'string',
          },
          last_name: {
            type: 'string',
          },
          middle_name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          phone: {
            type: 'string',
          },
          department: {
            type: 'string',
          },
          position: {
            type: 'string',
          },
          specialization: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      // Skill Schemas
      CreateSkillRequest: {
        type: 'object',
        required: ['skill_name'],
        properties: {
          skill_name: {
            type: 'string',
            example: 'JavaScript',
          },
          proficiency_level: {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            example: 'advanced',
          },
          years_of_experience: {
            type: 'integer',
            minimum: 0,
            example: 2,
          },
        },
      },
      SkillResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          skill_name: {
            type: 'string',
          },
          proficiency_level: {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          },
          years_of_experience: {
            type: 'integer',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      // Violation Schemas
      CreateViolationRequest: {
        type: 'object',
        required: ['violation_type', 'description', 'violation_date'],
        properties: {
          violation_type: {
            type: 'string',
            example: 'Late Submission',
          },
          description: {
            type: 'string',
            example: 'Assignment submitted 2 days late',
          },
          violation_date: {
            type: 'string',
            format: 'date',
            example: '2024-01-15',
          },
        },
      },
      ViolationResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          violation_type: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          violation_date: {
            type: 'string',
            format: 'date',
          },
          resolution_status: {
            type: 'string',
            enum: ['pending', 'resolved', 'dismissed'],
          },
          resolution_notes: {
            type: 'string',
          },
          resolved_at: {
            type: 'string',
            format: 'date-time',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      // Enrollment Schemas
      CreateEnrollmentRequest: {
        type: 'object',
        required: ['student_id', 'instruction_id', 'semester', 'academic_year'],
        properties: {
          student_id: {
            type: 'string',
            format: 'uuid',
          },
          instruction_id: {
            type: 'string',
            format: 'uuid',
          },
          semester: {
            type: 'string',
            enum: ['1st', '2nd', 'summer'],
            example: '1st',
          },
          academic_year: {
            type: 'string',
            example: '2023-2024',
          },
        },
      },
      EnrollmentResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          student_id: {
            type: 'string',
            format: 'uuid',
          },
          instruction_id: {
            type: 'string',
            format: 'uuid',
          },
          subject_code: {
            type: 'string',
          },
          subject_name: {
            type: 'string',
          },
          enrollment_status: {
            type: 'string',
            enum: ['enrolled', 'dropped', 'completed'],
          },
          semester: {
            type: 'string',
          },
          academic_year: {
            type: 'string',
          },
          enrolled_at: {
            type: 'string',
            format: 'date-time',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      // Schedule Schemas
      CreateScheduleRequest: {
        type: 'object',
        required: ['schedule_type', 'room', 'day', 'start_time', 'end_time', 'semester', 'academic_year'],
        properties: {
          schedule_type: {
            type: 'string',
            enum: ['class', 'exam', 'consultation'],
            example: 'class',
          },
          instruction_id: {
            type: 'string',
            format: 'uuid',
          },
          faculty_id: {
            type: 'string',
            format: 'uuid',
          },
          room: {
            type: 'string',
            example: 'Room 301',
          },
          day: {
            type: 'string',
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            example: 'monday',
          },
          start_time: {
            type: 'string',
            format: 'time',
            example: '08:00:00',
          },
          end_time: {
            type: 'string',
            format: 'time',
            example: '10:00:00',
          },
          semester: {
            type: 'string',
            enum: ['1st', '2nd', 'summer'],
          },
          academic_year: {
            type: 'string',
            example: '2023-2024',
          },
        },
      },
      ScheduleResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          schedule_type: {
            type: 'string',
          },
          instruction_id: {
            type: 'string',
            format: 'uuid',
          },
          subject_code: {
            type: 'string',
          },
          subject_name: {
            type: 'string',
          },
          faculty_id: {
            type: 'string',
            format: 'uuid',
          },
          faculty_name: {
            type: 'string',
          },
          room: {
            type: 'string',
          },
          day: {
            type: 'string',
          },
          start_time: {
            type: 'string',
          },
          end_time: {
            type: 'string',
          },
          semester: {
            type: 'string',
          },
          academic_year: {
            type: 'string',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  // Path to the API routes files where JSDoc comments are located
  apis: [
    path.join(__dirname, '../modules/*/routes/*.ts'),
    path.join(__dirname, '../modules/*/controllers/*.ts'),
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../../docs/openapi-annotations.ts'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
