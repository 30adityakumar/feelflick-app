// src/shared/hooks/useDatabaseHealth.js
/**
 * React Hook for Database Health Monitoring
 * 
 * Periodically checks database health and constraint enforcement
 * Use in dev mode or admin dashboards
 * 
 * @module useDatabaseHealth
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Database health monitoring hook
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Enable health checks
 * @param {number} options.interval - Check interval in ms (default: 60000)
 * @returns {{status: string, lastCheck: Date, issues: Array, metrics: Object}}
 */
export function useDatabaseHealth(options = {}) {
  const { 
    enabled = true,
    interval = 60000 // Check every minute by default
  } = options;
  
  const [health, setHealth] = useState({
    status: 'checking', // 'checking' | 'healthy' | 'warning' | 'error'
    lastCheck: null,
    issues: [],
    metrics: {
      duplicateFeedback: 0,
      duplicateRatings: 0,
      invalidStatuses: 0
    }
  });
  
  useEffect(() => {
    if (!enabled) {
      setHealth(prev => ({ ...prev, status: 'disabled' }));
      return;
    }
    
    let intervalId;
    let mounted = true;
    
    async function checkHealth() {
      if (!mounted) return;
      
      try {
        setHealth(prev => ({ ...prev, status: 'checking' }));
        
        const issues = [];
        const metrics = { 
          duplicateFeedback: 0, 
          duplicateRatings: 0, 
          invalidStatuses: 0 
        };
        
        // Check 1: Duplicate feedback
        try {
          const { data: dupFeedback } = await supabase.rpc('check_duplicate_feedback');
          metrics.duplicateFeedback = dupFeedback?.length || 0;
          if (metrics.duplicateFeedback > 0) {
            issues.push(`Found ${metrics.duplicateFeedback} duplicate feedback entries`);
          }
        } catch (err) {
          console.warn('Could not check duplicate feedback:', err.message);
        }
        
        // Check 2: Duplicate ratings
        try {
          const { data: dupRatings } = await supabase.rpc('check_duplicate_ratings');
          metrics.duplicateRatings = dupRatings?.length || 0;
          if (metrics.duplicateRatings > 0) {
            issues.push(`Found ${metrics.duplicateRatings} duplicate rating entries`);
          }
        } catch (err) {
          console.warn('Could not check duplicate ratings:', err.message);
        }
        
        // Check 3: Invalid statuses
        try {
          const { data: invalidStatuses } = await supabase.rpc('check_invalid_watchlist_statuses');
          metrics.invalidStatuses = invalidStatuses?.length || 0;
          if (metrics.invalidStatuses > 0) {
            issues.push(`Found ${metrics.invalidStatuses} invalid watchlist statuses`);
          }
        } catch (err) {
          console.warn('Could not check invalid statuses:', err.message);
        }
        
        // Determine status
        let status = 'healthy';
        if (issues.length > 0) {
          status = issues.length > 2 ? 'error' : 'warning';
        }
        
        if (mounted) {
          setHealth({
            status,
            lastCheck: new Date(),
            issues,
            metrics
          });
        }
        
      } catch (error) {
        console.error('Database health check failed:', error);
        if (mounted) {
          setHealth({
            status: 'error',
            lastCheck: new Date(),
            issues: [error.message],
            metrics: { duplicateFeedback: 0, duplicateRatings: 0, invalidStatuses: 0 }
          });
        }
      }
    }
    
    // Initial check
    checkHealth();
    
    // Periodic checks
    if (interval > 0) {
      intervalId = setInterval(checkHealth, interval);
    }
    
    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [enabled, interval]);
  
  return health;
}
