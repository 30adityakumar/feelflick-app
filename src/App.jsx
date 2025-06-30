import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

import AuthPage from './AuthPage'
import Header from './components/Header'
import MoviesTab from './components/MoviesTab'
import RecommendationsTab from './components/RecommendationsTab'
import WatchedTab from './components/WatchedTab'
import AccountModal from './components/AccountModal' // or MyAccountModal

export default function App() {
  // --- Auth/session state ---
  const [session, setSession] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // --- Tab navigation ---
  const [activeTab, setActiveTab] = useState('home') // movies | recommendations | watched

  // --- My Account modal ---
  const [showAccountModal, setShowAccountModal] = useState(false)
  // For instant update after changing name:
  const [profileName, setProfileName] = useState("")

  // --- Sign out ---
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  // --- Show My Account Modal handler ---
  const handleMyAccount = () => setShowAccountModal(true)
  const handleCloseAccount = () => setShowAccountModal(false)
  const handleProfileUpdate = (newName) => setProfileName(newName)

  // --- Unauthenticated view ---
  if (!session) return <AuthPage />

  // --- Authenticated app ---
  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10">
      <Header
        userName={profileName || session?.user?.user_metadata?.name || "Account"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        onSignOut={handleSignOut}
        onMyAccount={handleMyAccount}
      />
      {/* My Account Modal */}
      {showAccountModal && (
        <AccountModal
          user={session.user}
          onClose={handleCloseAccount}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
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
