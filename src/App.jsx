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
import Sidebar from "@/app/header/sidebar/Sidebar";
import MoviesTab from "@/app/pages/movies/MoviesTab";
import Account from "@/app/header/components/Account";
import Preferences from "@/app/header/components/Preferences";
import MovieDetail from "@/app/pages/MovieDetail";
import HistoryPage from "@/app/pages/watched/WatchedTab";

// ---- Only ONE declaration of each! ----
function TrendingPage()   { return <div className="p-8">Trending Coming Soon!</div>; }
function WatchlistPage()  { return <div className="p-8">Watchlist Coming Soon!</div>; }

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

function AppLayout({ user, onSignOut, children }) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar />
      <div className="flex-1 ml-20 relative">
        <Header user={user} onSignOut={onSignOut} />
        <main className="pb-10 pt-24 w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [user, setUser] = useState(null);
  const [onboardingVersion, setOnboardingVersion] = useState(Date.now());

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null);
      console.log("getSession() on mount:", data);
    });

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

  const { loading: onboardingLoading, complete: onboardingComplete } =
    useOnboardingStatus(session, onboardingVersion);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    window.location.href = "/";
  }

  function handleProfileUpdate(profile) {
    setProfileName(profile.name || "");
    setUser(u => ({ ...u, ...profile }));
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth/sign-in" element={<AuthPage mode="sign-in" />} />
        <Route path="/auth/sign-up" element={<AuthPage mode="sign-up" />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/confirm" element={<ConfirmEmail />} />
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

        {/* Main App Routes: All have Sidebar + Header */}
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
          path="/trending"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            <AppLayout user={user} onSignOut={handleSignOut}>
              <TrendingPage />
            </AppLayout>
          }
        />
        <Route
          path="/browse"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            <AppLayout user={user} onSignOut={handleSignOut}>
              <MoviesTab session={session} />
            </AppLayout>
          }
        />
        <Route
          path="/history"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            <AppLayout user={user} onSignOut={handleSignOut}>
              <HistoryPage />
            </AppLayout>
          }
        />
        <Route
          path="/watchlist"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            <AppLayout user={user} onSignOut={handleSignOut}>
              <WatchlistPage />
            </AppLayout>
          }
        />
        <Route
          path="/account"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            <AppLayout user={user} onSignOut={handleSignOut}>
              <Account user={user} onProfileUpdate={handleProfileUpdate} />
            </AppLayout>
          }
        />
        <Route
          path="/preferences"
          element={
            !session ? <Navigate to="/auth/sign-in" replace /> :
            <AppLayout user={user} onSignOut={handleSignOut}>
              <Preferences user={user} />
            </AppLayout>
          }
        />
        <Route
          path="/movie/:id"
          element={
            <AppLayout user={user} onSignOut={handleSignOut}>
              <MovieDetail />
            </AppLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
