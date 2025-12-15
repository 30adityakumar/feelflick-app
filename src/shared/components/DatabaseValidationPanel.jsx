/**
 * Database Validation Panel
 * Developer-only component for testing database integrity
 * 
 * Usage in MovieDetail.jsx:
 *   {process.env.NODE_ENV === 'development' && (
 *     <DatabaseValidationPanel movieId={movie.id} />
 *   )}
 */

import { useState } from 'react'
import { Activity, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'
import { runAllValidationTests, quickHealthCheck } from '@/shared/services/databaseValidation'

export default function DatabaseValidationPanel({ movieId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [user, setUser] = useState(null)

  // Get current user
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null)
    })
  }, [])

  const runTests = async () => {
    if (!user) {
      alert('Please log in first')
      return
    }

    setIsRunning(true)
    setResults(null)

    const startTime = Date.now()
    const success = await runAllValidationTests(user.id, movieId)
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    setResults({
      success,
      duration,
      timestamp: new Date().toLocaleTimeString()
    })
    setIsRunning(false)
  }

  const runQuickCheck = async () => {
    if (!user) {
      alert('Please log in first')
      return
    }

    setIsRunning(true)
    const success = await quickHealthCheck(user.id)
    setIsRunning(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
        title="Open Database Validation Panel"
      >
        <Activity className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl bg-black/90 backdrop-blur-xl border border-white/20 shadow-2xl animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">DB Validation</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <span className="text-white/60">×</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* User Info */}
        <div className="text-xs text-white/60">
          {user ? (
            <>
              <div>User: {user.email}</div>
              <div>Movie ID: {movieId}</div>
            </>
          ) : (
            <div className="text-yellow-400">⚠️ Not logged in</div>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className={`rounded-lg p-3 ${results.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              {results.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <span className="text-sm font-bold text-white">
                {results.success ? 'All Tests Passed' : 'Tests Failed'}
              </span>
            </div>
            <div className="text-xs text-white/60 space-y-1">
              <div>Duration: {results.duration}s</div>
              <div>Time: {results.timestamp}</div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={runTests}
            disabled={isRunning || !user}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                <span>Run Full Tests</span>
              </>
            )}
          </button>

          <button
            onClick={runQuickCheck}
            disabled={isRunning || !user}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Quick Health Check</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="text-10px text-white/40 leading-relaxed">
          <strong>Full Tests:</strong> Creates test data, validates constraints, cleans up.
          <br />
          <strong>Quick Check:</strong> Non-destructive check for existing issues.
        </div>
      </div>
    </div>
  )
}
