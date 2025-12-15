import { useState } from 'react'
import { supabase } from '/src/shared/lib/supabase/client'
import { runAllValidationTests, quickValidationCheck } from '/src/utils/databaseValidation'


/**
 * DevTools Component
 * Only visible in development mode
 * Provides database validation testing UI
 */
export default function DevTools() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const handleRunTests = async () => {
    setIsRunning(true)
    console.clear()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('❌ Please log in first to run tests')
        setIsRunning(false)
        return
      }
      
      const result = await runAllValidationTests(user.id)
      setLastResult(result)
    } catch (error) {
      console.error('Test execution failed:', error)
      setLastResult(false)
    } finally {
      setIsRunning(false)
    }
  }

  const handleQuickCheck = async () => {
    console.clear()
    await quickValidationCheck()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-110"
          title="Open DevTools"
        >
          🧪
        </button>
      ) : (
        <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 w-80 border border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">🧪 DevTools</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Quick Check Button */}
            <button
              onClick={handleQuickCheck}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
            >
              🔍 Quick Check
            </button>

            {/* Full Test Suite Button */}
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className={`w-full ${
                isRunning 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white py-2 px-4 rounded transition-colors`}
            >
              {isRunning ? '⏳ Running Tests...' : '🚀 Run Full Test Suite'}
            </button>

            {/* Last Result Indicator */}
            {lastResult !== null && (
              <div className={`p-3 rounded ${
                lastResult 
                  ? 'bg-green-900/50 border border-green-500' 
                  : 'bg-red-900/50 border border-red-500'
              }`}>
                <p className="text-sm font-medium">
                  {lastResult ? '✅ All tests passed!' : '❌ Some tests failed'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Check console for details
                </p>
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
              <p>Open browser console (F12) to see detailed test results</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
