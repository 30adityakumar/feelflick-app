import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

import Landing          from "./components/Landing";
import AuthPage         from "./AuthPage";
import ResetPassword    from "./components/ResetPassword";
import ConfirmEmail     from "./components/ConfirmEmail";
import Onboarding       from "./components/Onboarding";

import HomePage         from "./components/HomePage";
import Header           from "./components/Header";
import MoviesTab        from "./components/MoviesTab";
import RecommendationsTab from "./components/RecommendationsTab";
import WatchedTab       from "./components/WatchedTab";
import AccountModal     from "./components/AccountModal";

/* ───────────────────────── MainApp shell ───────────────────────── */
function MainApp({ session, profileName, setProfileName }) {
  const [activeTab, setActiveTab]       = useState("home");
  const [showAccountModal, setShowAcc]  = useState(false);

  const handleProfileUpdate = (newName) => setProfileName(newName);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10" style={{ width: "100vw", overflowX: "hidden" }}>
      <Header
        userName={profileName || session?.user?.user_metadata?.name || "Account"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        onMyAccount={() => setShowAcc(true)}
      />

      {showAccountModal && (
        <AccountModal
          user={session.user}
          onClose={() => setShowAcc(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {activeTab === "home"           && <HomePage userName={profileName || session.user?.user_metadata?.name || "Movie Lover"} userId={session.user.id} />}
      {activeTab === "movies"         && <MoviesTab          session={session} />}
      {activeTab === "recommendations"&& <RecommendationsTab session={session} />}
      {activeTab === "watched"        && <WatchedTab         session={session} />}
    </div>
  );
}

/* ───────────────────────── Root component ───────────────────────── */
export default function App() {
  const [session, setSession]     = useState(null);
  const [profileName, setProfile] = useState("");

  /* listen for auth changes */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { subscription } =
      supabase.auth.onAuthStateChange((_evt, newSession) => setSession(newSession)).data;

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* public landing */}
        <Route path="/" element={<Landing />} />

        {/* auth */}
        <Route path="/auth/sign-in"  element={<AuthPage mode="sign-in"  />} />
        <Route path="/auth/sign-up"  element={<AuthPage mode="sign-up"  />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/confirm"  element={<ConfirmEmail />} />

        {/* first-time onboarding (must be signed-in) */}
        <Route
          path="/onboarding"
          element={
            session
              ? <Onboarding session={session} />
              : <Navigate to="/auth/sign-in" replace />
          }
        />

        {/* private app – require auth AND finished onboarding */}
        <Route
          path="/app/*"
          element={
            session
              ? (
                  session.user?.user_metadata?.onboarding_complete
                    ? <MainApp
                        session={session}
                        profileName={profileName}
                        setProfileName={setProfile}
                      />
                    : <Navigate to="/onboarding" replace />
                )
              : <Navigate to="/auth/sign-in" replace />
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
