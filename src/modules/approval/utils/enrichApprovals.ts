/**
 * Utility to enrich approval records with entity names
 * 
 * Fetches entity names from respective tables and adds them to approval records
 */

import { db } from '../../../db';
import { students } from '../../../db/schema/students';
import { faculty } from '../../../db/schema/faculty';
import { events } from '../../../db/schema/events';
import { research } from '../../../db/schema/research';
import { eq } from 'drizzle-orm';
import type { Approval } from '../../../db/schema/approvals';

/**
 * Enriched approval with entity name
 */
export interface EnrichedApproval extends Approval {
  entity_name?: string;
}

/**
 * Enrich a single approval with entity name
 * 
 * @param approval - Approval record
 * @returns Enriched approval with entity_name field
 */
export async function enrichApprovalWithName(approval: Approval): Promise<EnrichedApproval> {
  let entityName: string | undefined;

  // First, try to extract from change_details (most reliable for new/updated data)
  if (approval.change_details) {
    const details = approval.change_details as any;
    entityName = details.title || details.name || 
      (details.first_name && details.last_name 
        ? `${details.first_name} ${details.last_name}` 
        : undefined);
  }

  // If not found in change_details, query the entity table
  if (!entityName) {
    try {
      switch (approval.entity_type) {
        case 'student': {
          const student = await db.query.students.findFirst({
            where: eq(students.id, approval.entity_id),
            columns: {
              first_name: true,
              last_name: true,
            },
          });
          if (student && student.first_name && student.last_name) {
            entityName = `${student.first_name} ${student.last_name}`;
          }
          break;
        }

        case 'faculty': {
          const facultyMember = await db.query.faculty.findFirst({
            where: eq(faculty.id, approval.entity_id),
            columns: {
              first_name: true,
              last_name: true,
            },
          });
          if (facultyMember && facultyMember.first_name && facultyMember.last_name) {
            entityName = `${facultyMember.first_name} ${facultyMember.last_name}`;
          }
          break;
        }

        case 'event': {
          const event = await db.query.events.findFirst({
            where: eq(events.id, approval.entity_id),
            columns: {
              event_name: true,
            },
          });
          if (event && event.event_name) {
            entityName = event.event_name;
          }
          break;
        }

        case 'research': {
          const researchProject = await db.query.research.findFirst({
            where: eq(research.id, approval.entity_id),
            columns: {
              title: true,
            },
          });
          if (researchProject && researchProject.title) {
            entityName = researchProject.title;
          }
          break;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch entity name for ${approval.entity_type} ${approval.entity_id}:`, error);
    }
  }

  // Final fallback: use a descriptive label with truncated ID
  if (!entityName) {
    const entityTypeLabel = approval.entity_type.charAt(0).toUpperCase() + approval.entity_type.slice(1);
    entityName = `${entityTypeLabel} (${approval.entity_id.substring(0, 8)}...)`;
  }

  return {
    ...approval,
    entity_name: entityName,
  };
}

/**
 * Enrich multiple approvals with entity names
 * 
 * @param approvals - Array of approval records
 * @returns Array of enriched approvals with entity_name fields
 */
export async function enrichApprovalsWithNames(approvals: Approval[]): Promise<EnrichedApproval[]> {
  // Process all approvals in parallel for better performance
  return Promise.all(approvals.map(approval => enrichApprovalWithName(approval)));
}
