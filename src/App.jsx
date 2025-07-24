import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import Landing from "@/features/landing/Landing";
import AuthPage from "@/features/auth/AuthPage";
import ResetPassword from "@/features/auth/components/ResetPassword";
import ConfirmEmail from "@/features/auth/components/ConfirmEmail";
import Onboarding from "@/features/onboarding/Onboarding";
import HomePage from "@/app/homepage/HomePage";
import Header from "@/app/header/Header";
import MoviesTab from "@/app/pages/movies/MoviesTab";
import WatchedTab from "@/app/pages/watched/WatchedTab";
import Account from "@/app/header/components/Account";
import Preferences from "@/app/header/components/Preferences";
import MovieDetail from '@/app/pages/MovieDetail';

// Onboarding status check hook
function useOnboardingStatus(session, version) {
  const [status, setStatus] = useState({ loading: true, complete: false });

  useEffect(() => {
    let ignore = false;
    async function fetchStatus() {
      if (!session) { setStatus({ loading: false, complete: false }); return; }
      const userId = session.user.id;
      const { data } = await supabase
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
  }, [session, version]);
  return status;
}

// Layout for all main app pages
function AppLayout({ user, onSignOut, children }) {
  return (
    <>
      <Header user={user} onSignOut={onSignOut} />
      <main className="min-h-screen bg-zinc-950 text-white pb-10 pt-24 w-full overflow-x-hidden">
        {children}
      </main>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [user, setUser] = useState(null);
  const [onboardingVersion, setOnboardingVersion] = useState(Date.now());

  // Get Supabase session and fetch user profile
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user) { setUser(null); return; }
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setUser({ ...session.user, ...data });
      setProfileName(data?.name || session.user.user_metadata?.name || "");
    }
    if (session?.user) fetchProfile();
  }, [session]);

  // Onboarding status
  const { loading: onboardingLoading, complete: onboardingComplete } =
    useOnboardingStatus(session, onboardingVersion);

  // Sign out
  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    window.location.href = "/";
  }

  // Profile update from /account
  function handleProfileUpdate(profile) {
    setProfileName(profile.name || "");
    setUser(u => ({ ...u, ...profile }));
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/sign-in" element={<AuthPage mode="sign-in" />} />
        <Route path="/auth/sign-up" element={<AuthPage mode="sign-up" />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/confirm" element={<ConfirmEmail />} />

        {/* Onboarding page */}
        <Route
          path="/onboarding"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            onboardingLoading ? <div className="text-white text-center mt-40">Loading…</div> :
            onboardingComplete ? <Navigate to="/app" replace /> :
            <Onboarding
              session={session}
              onOnboardingFinish={() => setOnboardingVersion(Date.now())}
            />
          }
        />

        {/* Main app pages: now using router for tab/pages */}
        <Route
          path="/app"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            onboardingLoading ? <div className="text-white text-center mt-40">Loading…</div> :
            !onboardingComplete ? <Navigate to="/onboarding" replace /> :
            <AppLayout user={user} onSignOut={handleSignOut}>
              <HomePage userName={user?.name || profileName || session?.user?.user_metadata?.name || "Movie Lover"} userId={session?.user?.id} />
            </AppLayout>
          }
        />
        <Route
          path="/movies"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            onboardingLoading ? <div className="text-white text-center mt-40">Loading…</div> :
            !onboardingComplete ? <Navigate to="/onboarding" replace /> :
            <AppLayout user={user} onSignOut={handleSignOut}>
              <MoviesTab session={session} />
            </AppLayout>
          }
        />
        <Route
          path="/watched"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            onboardingLoading ? <div className="text-white text-center mt-40">Loading…</div> :
            !onboardingComplete ? <Navigate to="/onboarding" replace /> :
            <AppLayout user={user} onSignOut={handleSignOut}>
              <WatchedTab session={session} />
            </AppLayout>
          }
        />

        {/* Account and preferences (protected) */}
        <Route
          path="/account"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            onboardingLoading ? <div className="text-white text-center mt-40">Loading…</div> :
            !onboardingComplete ? <Navigate to="/onboarding" replace /> :
            <AppLayout user={user} onSignOut={handleSignOut}>
              <Account user={user} onProfileUpdate={handleProfileUpdate} />
            </AppLayout>
          }
        />
        <Route
          path="/preferences"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            onboardingLoading ? <div className="text-white text-center mt-40">Loading…</div> :
            !onboardingComplete ? <Navigate to="/onboarding" replace /> :
            <AppLayout user={user} onSignOut={handleSignOut}>
              <Preferences user={user} />
            </AppLayout>
          }
        />

        {/* Movie detail page */}
        <Route path="/movie/:id" element={<MovieDetail />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
