// src/app/header/components/Account.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import {
  Camera,
  Loader2,
  CheckCircle2,
  LogOut,
  Shield,
  Key,
  RefreshCcw,
  Trash2,
  User as UserIcon,
} from "lucide-react";

const BTN_GRAD = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";

export default function Account() {
  const nav = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setAuthUser(user || null);
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select(
          "name,email,avatar_url,signup_source,joined_at,onboarding_complete,onboarding_completed_at"
        )
        .eq("id", user.id)
        .maybeSingle();
      setProfile(data || null);
      setName(data?.name || user.user_metadata?.name || "");
      setAvatarUrl(data?.avatar_url || "");
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const initials = useMemo(() => {
    const base =
      profile?.name ||
      authUser?.user_metadata?.name ||
      authUser?.email?.split("@")[0] ||
      "User";
    return (
      base
        .trim()
        .split(/\s+/)
        .map((s) => s[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || "U"
    );
  }, [profile, authUser]);

  async function handleSave(e) {
    e.preventDefault();
    if (!authUser) return;
    setSaving(true);
    setMsg("");
    try {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("id", authUser.id)
        .maybeSingle();
      if (existing) {
        await supabase.from("users").update({ name }).eq("id", authUser.id);
      } else {
        await supabase.from("users").insert({
          id: authUser.id,
          name,
          email: authUser.email,
          avatar_url: avatarUrl || null,
        });
      }
      setMsg("Profile updated successfully!");
    } catch (e) {
      console.warn("Account save error", e);
      setMsg("Could not save. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 2500);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    nav("/", { replace: true });
  }

  async function signOutEverywhere() {
    try {
      setBusy(true);
      await supabase.auth.signOut({ scope: "global" });
      nav("/", { replace: true });
    } catch (e) {
      console.warn("Global signout error", e);
      await supabase.auth.signOut();
      nav("/", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  function openResetPassword() {
    nav("/auth/reset-password");
  }

  async function rerunOnboarding() {
    if (!authUser) return;
    try {
      setBusy(true);
      await supabase
        .from("users")
        .update({ onboarding_complete: false, onboarding_completed_at: null })
        .eq("id", authUser.id);
      await supabase.auth.updateUser({
        data: { onboarding_complete: false, has_onboarded: false },
      });
      nav("/onboarding", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    try {
      setUploading(true);
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${authUser.id}.${ext}`;
      const up = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
      if (up.error) {
        console.warn("Avatar upload error:", up.error.message);
        setMsg("Could not upload avatar.");
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub?.publicUrl || "";
      await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", authUser.id);
      setAvatarUrl(publicUrl);
      setMsg("Avatar updated!");
    } catch (e) {
      console.warn("Avatar error", e);
      setMsg("Could not update avatar.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      setTimeout(() => setMsg(""), 2000);
    }
  }

  function requestDelete() {
    const subject = encodeURIComponent("FeelFlick – Account deletion request");
    const body = encodeURIComponent(
      `Please delete my account.\n\nUser ID: ${authUser?.id}\nEmail: ${authUser?.email}\n\nI understand this action is permanent.`
    );
    window.location.href = `mailto:hello@feelflick.com?subject=${subject}&body=${body}`;
  }

  if (!authUser) {
    return (
      <div
        className="flex items-center justify-center bg-black text-white"
        style={{
          minHeight: "calc(100vh - var(--hdr-h, 64px))",
          paddingTop: "var(--hdr-h, 64px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 text-center max-w-sm mx-4">
          <UserIcon className="h-10 w-10 mx-auto text-white/40 mb-3" />
          <p className="text-white/80 text-sm">You're signed out.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-black text-white w-full pb-20 md:pb-6"
      style={{
        paddingTop: "var(--hdr-h, 64px)",
        minHeight: "100vh",
      }}
    >
      <div className="mx-auto max-w-4xl px-4 py-4 md:py-6">
        {/* Header Section */}
        <div className="mb-4">
          <h1 className="text-xl md:text-2xl font-black tracking-tight mb-1">
            Account Settings
          </h1>
          <p className="text-xs md:text-sm text-white/60">
            Manage your profile and account preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 md:p-5 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center text-xl md:text-2xl font-bold text-white ring-4 ring-white/10"
                style={{
                  background: avatarUrl
                    ? `center/cover url(${avatarUrl})`
                    : undefined,
                }}
              >
                {!avatarUrl && initials}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-8 w-8 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm ring-2 ring-white/20 hover:bg-white/25 transition-all active:scale-95"
                title="Change avatar"
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={onPickFile}
              />
            </div>

            {/* Profile Form */}
            <div className="flex-1 w-full min-w-0">
              <div className="mb-2">
                <p className="text-xs font-medium text-white/70 mb-1">Email</p>
                <p className="text-sm font-semibold text-white truncate">
                  {authUser.email}
                </p>
              </div>
              <form onSubmit={handleSave} className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-white/70 block mb-1.5">
                    Display Name
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-bold text-white focus:outline-none transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                      style={{ background: BTN_GRAD }}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
              {msg && (
                <div className="mt-2 inline-flex items-center gap-2 text-xs text-white/90 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  {msg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 md:p-5 mb-4">
          <h2 className="text-base font-bold mb-3">Account Details</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <MetaRow label="Joined">
              {profile?.joined_at
                ? new Date(profile.joined_at).toLocaleDateString()
                : "—"}
            </MetaRow>
            <MetaRow label="Sign-in method">
              {profile?.signup_source ||
                authUser?.app_metadata?.provider ||
                "Email"}
            </MetaRow>
            <MetaRow label="Onboarding Status">
              {profile?.onboarding_complete ||
              profile?.onboarding_completed_at
                ? "Completed"
                : "Not completed"}
            </MetaRow>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
              <span className="text-xs font-semibold text-white/70">
                Re-run Onboarding
              </span>
              <button
                type="button"
                onClick={rerunOnboarding}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs font-semibold text-white transition-all active:scale-95"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Start
              </button>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <Section title="Security & Privacy">
          <div className="flex flex-col gap-2">
            <ActionButton
              icon={<Key className="h-4 w-4" />}
              label="Change Password"
              onClick={openResetPassword}
            />
            <ActionButton
              icon={<Shield className="h-4 w-4" />}
              label="Sign Out All Devices"
              onClick={signOutEverywhere}
              disabled={busy}
            />
            <ActionButton
              icon={<LogOut className="h-4 w-4" />}
              label="Sign Out"
              onClick={signOut}
            />
          </div>
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-red-300 mb-1">
                  Delete Account
                </h3>
                <p className="text-xs text-white/70">
                  Permanently delete your account. This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={requestDelete}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-300 transition-all active:scale-95 whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Request Deletion
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ===== Helper Components ===== */
function MetaRow({ label, children }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <span className="text-xs font-medium text-white">{children}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 md:p-5 mb-4">
      <h2 className="text-base font-bold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function ActionButton({ icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-between w-full rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-3 text-left transition-all group active:scale-[0.98]"
    >
      <span className="flex items-center gap-2.5 text-xs font-semibold text-white">
        <span className="text-white/70 group-hover:text-white transition-colors">
          {icon}
        </span>
        {label}
      </span>
      <svg
        className="h-4 w-4 text-white/40 group-hover:text-white/70 transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}
