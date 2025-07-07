import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Landing from "./components/Landing";
import AuthPage from "./AuthPage";
import ResetPassword from "./components/ResetPassword";
import ConfirmEmail from "./components/ConfirmEmail";
import Onboarding from "./components/Onboarding";
import HomePage from "./components/HomePage";
import Header from "./components/Header";
import MoviesTab from "./components/MoviesTab";
import RecommendationsTab from "./components/RecommendationsTab";
import WatchedTab from "./components/WatchedTab";
import AccountModal from "./components/AccountModal";

/* --- AppShell with tab navigation, account modal, etc --- */
function MainApp({ session, profileName, setProfileName }) {
  const [activeTab, setActiveTab] = useState("home");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const handleProfileUpdate = (newName) => setProfileName(newName);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10" style={{ width: "100vw", overflowX: "hidden" }}>
      <Header
        userName={profileName || session?.user?.user_metadata?.name || "Account"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        onMyAccount={() => setShowAccountModal(true)}
      />
      {showAccountModal && (
        <AccountModal
          user={session.user}
          onClose={() => setShowAccountModal(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
      {activeTab === "home"           && <HomePage userName={profileName || session.user?.user_metadata?.name || "Movie Lover"} userId={session.user.id} />}
      {activeTab === "movies"         && <MoviesTab session={session} />}
      {activeTab === "recommendations"&& <RecommendationsTab session={session} />}
      {activeTab === "watched"        && <WatchedTab session={session} />}
    </div>
  );
}

/* --- Hook: robust onboarding status from users table --- */
function useOnboardingStatus(session, version) {
  const [status, setStatus] = useState({ loading: true, complete: false });

  useEffect(() => {
    let ignore = false;
    async function fetchStatus() {
      if (!session) { setStatus({ loading: false, complete: false }); return; }
      const userId = session.user.id;
      // Query the public.users table for onboarding_complete
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', userId)
        .single();
      if (!ignore) {
        setStatus({
          loading: false,
          complete: Boolean(data?.onboarding_complete)
        });
      }
    }
    fetchStatus();
    return () => { ignore = true; };
  }, [session, version]); // <-- Also refetch if version (timestamp) changes

  return status;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profileName, setProfileName] = useState("");
  // Used to force onboarding status reload after onboarding finishes
  const [onboardingVersion, setOnboardingVersion] = useState(Date.now());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const { loading: onboardingLoading, complete: onboardingComplete } =
    useOnboardingStatus(session, onboardingVersion);

  // --- Main routing ---
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/sign-in" element={<AuthPage mode="sign-in" />} />
        <Route path="/auth/sign-up" element={<AuthPage mode="sign-up" />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/confirm" element={<ConfirmEmail />} />

        {/* Onboarding page (only accessible if logged in & NOT onboarded) */}
        <Route
          path="/onboarding"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            onboardingLoading ? <div style={{ color: "#fff", textAlign: "center", marginTop: "25vh" }}>Loading…</div> :
            onboardingComplete ? <Navigate to="/app" replace /> :
            <Onboarding
              session={session}
              onOnboardingFinish={() => setOnboardingVersion(Date.now())}
            />
          }
        />

        {/* App pages – only accessible if signed in AND onboarding is complete */}
        <Route
          path="/app/*"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            onboardingLoading ? <div style={{ color: "#fff", textAlign: "center", marginTop: "25vh" }}>Loading…</div> :
            !onboardingComplete ? <Navigate to="/onboarding" replace /> :
            <MainApp session={session} profileName={profileName} setProfileName={setProfileName} />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
