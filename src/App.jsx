import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

import AuthPage from './AuthPage';
import HomePage from './components/HomePage';
import Header from './components/Header';
import MoviesTab from './components/MoviesTab';
import RecommendationsTab from './components/RecommendationsTab';
import WatchedTab from './components/WatchedTab';
import AccountModal from './components/AccountModal';

// Main App (Logged-in experience, can be its own component)
function MainApp({ session, profileName, setProfileName }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showAccountModal, setShowAccountModal] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; // Return to public landing page after sign out
  };
  const handleMyAccount = () => setShowAccountModal(true);
  const handleCloseAccount = () => setShowAccountModal(false);
  const handleProfileUpdate = (newName) => setProfileName(newName);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10" style={{ width: "100vw", overflowX: "hidden" }}>
      <Header
        userName={profileName || session?.user?.user_metadata?.name || "Account"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        onSignOut={handleSignOut}
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
          // Pass correct onSignIn and onSignUp
          onSignIn={() => window.location.href = "/auth/sign-in"}
          onSignUp={() => window.location.href = "/auth/sign-up"}
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

  // Provide onSignIn and onSignUp for HomePage, Landing, etc.
  const handleSignIn = () => window.location.href = "/auth/sign-in";
  const handleSignUp = () => window.location.href = "/auth/sign-up";

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing/Home Page: always public */}
        <Route
          path="/"
          element={
            <HomePage
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
              // you can pass other props like userName if you want
            />
          }
        />

        {/* Auth pages: public */}
        <Route path="/auth/sign-in" element={<AuthPage mode="sign-in" />} />
        <Route path="/auth/sign-up" element={<AuthPage mode="sign-up" />} />

        {/* Your logged-in app (only at /app/*) */}
        <Route
          path="/app/*"
          element={
            session ? (
              <MainApp session={session} profileName={profileName} setProfileName={setProfileName} />
            ) : (
              <Navigate to="/auth/sign-in" replace />
            )
          }
        />

        {/* Fallback: redirect unknown routes to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
