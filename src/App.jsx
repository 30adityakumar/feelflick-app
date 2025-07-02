import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import AuthPage from './AuthPage'
import Header from './components/Header'
import MoviesTab from './components/MoviesTab'
import RecommendationsTab from './components/RecommendationsTab'
import WatchedTab from './components/WatchedTab'
import AccountModal from './components/AccountModal'
import HomePage from './components/HomePage'

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

  // --- Global navigation handlers (to pass as props) ---
  // We use useNavigate() inside a component, so make a wrapper component below.

  return (
    <BrowserRouter>
      <AppRoutes
        session={session}
        setSession={setSession}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showAccountModal={showAccountModal}
        setShowAccountModal={setShowAccountModal}
        profileName={profileName}
        setProfileName={setProfileName}
        handleSignOut={handleSignOut}
        handleMyAccount={handleMyAccount}
        handleCloseAccount={handleCloseAccount}
        handleProfileUpdate={handleProfileUpdate}
      />
    </BrowserRouter>
  )
}

// --- Wrapper to get useNavigate ---
function AppRoutes(props) {
  const navigate = useNavigate();

  // --- Authenticated app ---
  const {
    session,
    setSession,
    activeTab,
    setActiveTab,
    showAccountModal,
    setShowAccountModal,
    profileName,
    setProfileName,
    handleSignOut,
    handleMyAccount,
    handleCloseAccount,
    handleProfileUpdate
  } = props;

  // --- Navigation handlers ---
  const handleSignUp = () => navigate('/auth/sign-up');
  const handleSignIn = () => navigate('/auth/sign-in');

  return (
    <Routes>
      {/* Unauthenticated routes */}
      <Route path="/auth/sign-up" element={<AuthPage mode="sign-up" />} />
      <Route path="/auth/sign-in" element={<AuthPage mode="sign-in" />} />
      {/* Fallback: any /auth/* shows AuthPage */}
      <Route path="/auth/*" element={<AuthPage />} />

      {/* Main app (authenticated) */}
      <Route
        path="*"
        element={
          session ? (
            <div className="min-h-screen bg-zinc-950 text-white pb-10" style={{ width: "100vw", overflowX: "hidden" }}>
              <Header
                userName={profileName || session?.user?.user_metadata?.name || "Account"}
                onTabChange={setActiveTab}
                activeTab={activeTab}
                onSignOut={handleSignOut}
                onMyAccount={handleMyAccount}
                onSignIn={handleSignIn}
                onSignUp={handleSignUp}
              />
              {/* My Account Modal */}
              {showAccountModal && (
                <AccountModal
                  user={session.user}
                  onClose={handleCloseAccount}
                  onProfileUpdate={handleProfileUpdate}
                />
              )}

              {/* Tab navigation, pass handleSignIn and handleSignUp as needed */}
              {activeTab === 'home' && (
                <HomePage
                  userName={profileName || session?.user?.user_metadata?.name || "Movie Lover"}
                  userId={session?.user?.id}
                  onSignIn={handleSignIn}
                  onSignUp={handleSignUp}
                />
              )}
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
          ) : (
            // Not authenticated? Redirect to sign in
            <Navigate to="/auth/sign-in" />
          )
        }
      />
    </Routes>
  );
}
