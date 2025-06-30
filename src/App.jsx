import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import AuthPage from './AuthPage'
import Header from './components/Header'
import MoviesTab from './components/MoviesTab'
import RecommendationsTab from './components/RecommendationsTab'
import WatchedTab from './components/WatchedTab'

export default function App() {
  // --- Auth/session state ---
  const [session, setSession] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // --- Navigation/tab state ---
  const [activeTab, setActiveTab] = useState('movies') // movies | recommendations | watched

  // --- User sign out handler ---
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (!session) return <AuthPage />

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10">
      <Header
        userName={session?.user?.user_metadata?.name || "Account"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        onSignOut={handleSignOut}
      />
      <div className="container">
        {activeTab === 'movies' && (
          <MoviesTab session={session} />
        )}
        {activeTab === 'recommendations' && (
          <RecommendationsTab session={session} />
        )}
        {activeTab === 'watched' && (
          <WatchedTab session={session} />
        )}
      </div>
    </div>
  )
}
