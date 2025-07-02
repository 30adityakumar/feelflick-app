import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

import Landing from './components/Landing';
import AuthPage from './AuthPage';
import HomePage from './components/HomePage';
import Header from './components/Header';
import MoviesTab from './components/MoviesTab';
import RecommendationsTab from './components/RecommendationsTab';
import WatchedTab from './components/WatchedTab';
import AccountModal from './components/AccountModal';

function MainApp({ session, profileName, setProfileName }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showAccountModal, setShowAccountModal] = useState(false);

  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/"); // Go to public landing after sign out
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
          onSignIn={() => navigate("/auth/sign-in")}
          onSignUp={() => navigate("/auth/sign-up")}
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
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // Use navigate for sign in/up
  const handleSignIn = () => navigate("/auth/sign-in");
  const handleSignUp = () => navigate("/auth/sign-up");

  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route
          path="/"
          element={
            <Landing
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
            />
          }
        />
        {/* Auth pages */}
        <Route path="/auth/sign-in" element={<AuthPage mode="sign-in" />} />
        <Route path="/auth/sign-up" element={<AuthPage mode="sign-up" />} />

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
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
