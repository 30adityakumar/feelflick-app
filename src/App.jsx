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

  const {
    session,
    activeTab,
    setActiveTab,
    showAccountModal,
    profileName,
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
      {/* --- Public HomePage (always accessible) --- */}
      <Route path="/" element={
        <HomePage
          userName={profileName || session?.user?.user_metadata?.name || "Movie Lover"}
          userId={session?.user?.id}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          isLoggedIn={!!session}
        />
      } />

      {/* --- Sign In/Up Pages --- */}
      <Route path="/auth/sign-up" element={<AuthPage mode="sign-up" />} />
      <Route path="/auth/sign-in" element={<AuthPage mode="sign-in" />} />
      {/* Fallback: any /auth/* shows AuthPage */}
      <Route path="/auth/*" element={<AuthPage />} />

      {/* --- Protected App Tabs (only if logged in) --- */}
      <Route path="/movies" element={
        session
          ? <MoviesTab session={session} />
          : <Navigate to="/auth/sign-in" />
      } />
      <Route path="/recommendations" element={
        session
          ? <RecommendationsTab session={session} />
          : <Navigate to="/auth/sign-in" />
      } />
      <Route path="/watched" element={
        session
          ? <WatchedTab session={session} />
          : <Navigate to="/auth/sign-in" />
      } />

      {/* --- Optionally, catch-all for undefined routes (redirect to home) --- */}
      {/* <Route path="*" element={<Navigate to="/" />} /> */}

    </Routes>
  );
}
