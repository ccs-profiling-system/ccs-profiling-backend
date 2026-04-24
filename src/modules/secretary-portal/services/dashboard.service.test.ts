/**
 * Dashboard Service Tests
 * 
 * Tests for the dashboard service functionality.
 */

import { describe, it, expect } from 'vitest';
import { getDashboardStats } from './dashboard.service';

describe('Dashboard Service', () => {
  describe('getDashboardStats', () => {
    it('should return dashboard statistics with correct structure', async () => {
      const result = await getDashboardStats();

      // Verify structure
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('recent_activities');

      // Verify stats structure
      expect(result.stats).toHaveProperty('total_students');
      expect(result.stats).toHaveProperty('total_faculty');
      expect(result.stats).toHaveProperty('total_events');
      expect(result.stats).toHaveProperty('total_research');
      expect(result.stats).toHaveProperty('pending_changes');

      // Verify stats are numbers
      expect(typeof result.stats.total_students).toBe('number');
      expect(typeof result.stats.total_faculty).toBe('number');
      expect(typeof result.stats.total_events).toBe('number');
      expect(typeof result.stats.total_research).toBe('number');
      expect(typeof result.stats.pending_changes).toBe('number');

      // Verify pending_changes is 0 (table doesn't exist yet)
      expect(result.stats.pending_changes).toBe(0);

      // Verify recent_activities is an array
      expect(Array.isArray(result.recent_activities)).toBe(true);

      // Verify recent_activities has at most 10 items
      expect(result.recent_activities.length).toBeLessThanOrEqual(10);

      // If there are activities, verify their structure
      if (result.recent_activities.length > 0) {
        const activity = result.recent_activities[0];
        expect(activity).toHaveProperty('activity_type');
        expect(activity).toHaveProperty('entity_type');
        expect(activity).toHaveProperty('entity_id');
        expect(activity).toHaveProperty('timestamp');
        expect(activity.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should return non-negative counts', async () => {
      const result = await getDashboardStats();

      expect(result.stats.total_students).toBeGreaterThanOrEqual(0);
      expect(result.stats.total_faculty).toBeGreaterThanOrEqual(0);
      expect(result.stats.total_events).toBeGreaterThanOrEqual(0);
      expect(result.stats.total_research).toBeGreaterThanOrEqual(0);
      expect(result.stats.pending_changes).toBeGreaterThanOrEqual(0);
    });
  });
});
