// src/app/dev/DatabaseHealthPanel.js
/**
 * Database Health Panel (Development Only)
 * 
 * Shows real-time database health and allows running tests
 * Only visible in development mode
 * 
 * @module DatabaseHealthPanel
 */

import { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, Play, Loader2, Minimize2 } from 'lucide-react';
import { useDatabaseHealth } from '../../shared/hooks/useDatabaseHealth';
import { runAllValidationTests } from '../../shared/utils/databaseValidation';
import { supabase } from '../../shared/lib/supabaseClient';

export default function DatabaseHealthPanel() {
  const [user, setUser] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [runningTests, setRunningTests] = useState(false);
  const [minimized, setMinimized] = useState(false);
  
  const health = useDatabaseHealth({ 
    enabled: true,
    interval: 30000 // Check every 30 seconds
  });
  
  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user);
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);
  
  async function handleRunTests() {
    if (!user) {
      alert('You must be logged in to run tests');
      return;
    }
    
    setRunningTests(true);
    setTestResults(null);
    
    try {
      const results = await runAllValidationTests(user.id, 550);
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setRunningTests(false);
    }
  }
  
  const statusConfig = {
    healthy: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    checking: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    disabled: { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' }
  };
  
  const config = statusConfig[health.status] || statusConfig.checking;
  const StatusIcon = config.icon;
  
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className={`fixed bottom-4 right-4 ${config.bg} border ${config.border} rounded-full p-3 shadow-2xl hover:scale-110 transition-transform z-50`}
        title="Show Database Health"
      >
        <StatusIcon className={`h-5 w-5 ${config.color} ${health.status === 'checking' ? 'animate-spin' : ''}`} />
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 w-96 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
      {/* Header */}
      <div className={`${config.bg} border-b ${config.border} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${config.color} ${health.status === 'checking' ? 'animate-spin' : ''}`} />
            <span className="text-sm font-bold text-white">Database Health</span>
          </div>
          <div className="flex items-center gap-2">
            {health.lastCheck && (
              <span className="text-xs text-white/60">
                {health.lastCheck.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setMinimized(true)}
              className="text-white/60 hover:text-white transition-colors"
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-xs text-white/60 mb-1">Dup Feedback</div>
            <div className={`text-lg font-bold ${health.metrics.duplicateFeedback > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {health.metrics.duplicateFeedback}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-xs text-white/60 mb-1">Dup Ratings</div>
            <div className={`text-lg font-bold ${health.metrics.duplicateRatings > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {health.metrics.duplicateRatings}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-xs text-white/60 mb-1">Invalid</div>
            <div className={`text-lg font-bold ${health.metrics.invalidStatuses > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {health.metrics.invalidStatuses}
            </div>
          </div>
        </div>
        
        {/* Issues */}
        {health.issues.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            <div className="text-xs text-red-400 font-semibold mb-1">Issues Found:</div>
            <ul className="text-xs text-red-300 space-y-0.5">
              {health.issues.map((issue, i) => (
                <li key={i}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* User Status */}
        {!user && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
            <div className="text-xs text-yellow-300">
              Log in to run validation tests
            </div>
          </div>
        )}
        
        {/* Run Tests Button */}
        <button
          onClick={handleRunTests}
          disabled={runningTests || !user}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
        >
          {runningTests ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Validation Tests
            </>
          )}
        </button>
        
        {/* Test Results */}
        {testResults && !testResults.error && (
          <div className={`${testResults.allPassed ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-lg p-3`}>
            <div className={`text-xs font-bold mb-2 ${testResults.allPassed ? 'text-green-300' : 'text-red-300'}`}>
              Test Results: {testResults.passed}/{testResults.total} passed
            </div>
            <div className="space-y-1">
              {testResults.results.map((result, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {result.success ? (
                    <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                  )}
                  <span className={result.success ? 'text-green-300' : 'text-red-300'}>
                    {result.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Test Error */}
        {testResults?.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="text-xs font-bold text-red-400 mb-1">Test Error:</div>
            <div className="text-xs text-red-300">{testResults.error}</div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-2 bg-white/5">
        <div className="text-10px text-white/40 text-center">
          Dev Tools • Phase 2 Validation
        </div>
      </div>
    </div>
  );
}
