/**
 * Faculty Portal Module
 * 
 * This module provides REST API endpoints for faculty members to manage their
 * teaching activities, research projects, events, and course materials.
 * 
 * Features:
 * - Profile Management: View and update faculty profile information
 * - Course Management: View assigned courses and teaching load
 * - Roster Management: View student rosters for assigned courses
 * - Attendance Management: View and submit attendance records
 * - Participation Management: View and submit participation scores
 * - Research Management: Create and manage research projects
 * - Event Management: View department events and register for participation
 * - Material Management: Upload, view, and delete course materials
 * - Skills Management: View and update faculty skills
 * - Affiliations Management: View and update faculty affiliations
 * 
 * All endpoints require JWT authentication and RBAC authorization using
 * the faculty.* permission namespace.
 * 
 * Requirements: 1.6, 15.5
 */

export { facultyPortalRouter } from './routes';
