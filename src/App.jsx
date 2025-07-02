import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ResetPassword from "./components/ResetPassword";

import Landing from './components/Landing';
import AuthPage from './AuthPage';
import HomePage from './components/HomePage';
import Header from './components/Header';
import MoviesTab from './components/MoviesTab';
import RecommendationsTab from './components/RecommendationsTab';
import WatchedTab from './components/WatchedTab';
import AccountModal from './components/AccountModal';
import ConfirmEmail from './components/ConfirmEmail';
import Onboarding from './components/Onboarding';


function MainApp({ session, profileName, setProfileName }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Navigation is handled inside children using useNavigate

  const handleMyAccount = () => setShowAccountModal(true);
  const handleCloseAccount = () => setShowAccountModal(false);
  const handleProfileUpdate = (newName) => setProfileName(newName);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10" style={{ width: "100vw", overflowX: "hidden" }}>
      <Header
        userName={profileName || session?.user?.user_metadata?.name || "Account"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        // onSignOut handled inside child (see below)
        onMyAccount={handleMyAccount}
      />
      {showAccountModal && (
        <AccountModal
          user={session.user}
          onClose={handleCloseAccount}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
      {activeTab === 'home' && (
        <HomePage
          userName={profileName || session?.user?.user_metadata?.name || "Movie Lover"}
          userId={session?.user?.id}
        />
      )}
      {activeTab === 'movies' && <MoviesTab session={session} />}
      {activeTab === 'recommendations' && <RecommendationsTab session={session} />}
      {activeTab === 'watched' && <WatchedTab session={session} />}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<Landing />} />

        {/* Auth pages */}
        <Route path="/auth/sign-in" element={<AuthPage mode="sign-in" />} />
        <Route path="/auth/sign-up" element={<AuthPage mode="sign-up" />} />

        {/* Onboarding */}
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Reset password*/}
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        <Route path="/auth/confirm" element={<ConfirmEmail />} />

        {/* Private logged-in app */}
        <Route
          path="/app/*"
          element={
            session ? (
              <MainApp session={session} profileName={profileName} setProfileName={setProfileName} />
            ) : (
              <Navigate to="/auth/sign-in" replace />
            )
          }

          element={
            session
              ? session.user?.user_metadata?.onboarding_complete
                ? <MainApp …/>
                : <Navigate to="/onboarding" replace />
              : <Navigate to="/auth/sign-in" replace />
          }

        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
