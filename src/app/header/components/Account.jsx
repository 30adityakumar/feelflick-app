// src/app/header/components/Account.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import {
  Camera, Loader2, CheckCircle2, LogOut, Shield, Key, RefreshCcw, Trash2,
} from "lucide-react";

const BTN_GRAD = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";

export default function Account() {
  const nav = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);   // users row
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // avatar
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setAuthUser(user || null);
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("name,email,avatar_url,signup_source,joined_at,onboarding_complete,onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(data || null);
      setName((data?.name) || user.user_metadata?.name || "");
      setAvatarUrl(data?.avatar_url || "");
    })();

    return () => { mounted = false; };
  }, []);

  const initials = useMemo(() => {
    const base =
      profile?.name ||
      authUser?.user_metadata?.name ||
      authUser?.email?.split("@")[0] ||
      "User";
    return base
      .trim()
      .split(/\s+/)
      .map(s => s[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "U";
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
      setMsg("Saved!");
    } catch (e) {
      console.warn("Account save error", e);
      setMsg("Could not save. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 1800);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    nav("/auth", { replace: true });
  }

  async function signOutEverywhere() {
    try {
      setBusy(true);
      // Supabase JS v2 supports global scope
      await supabase.auth.signOut({ scope: "global" });
      nav("/auth", { replace: true });
    } catch (e) {
      console.warn("Global signout error", e);
      // fallback to normal signout
      await supabase.auth.signOut();
      nav("/auth", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  function openResetPassword() {
    // route you already have in the app
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

      // Try upload to "avatars" bucket
      const up = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
      if (up.error) {
        // If bucket missing or policy denies, just stop quietly
        console.warn("Avatar upload error:", up.error.message);
        setMsg("Could not upload avatar (storage not configured).");
        return;
      }

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub?.publicUrl || "";

      // Save URL into users table
      await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", authUser.id);
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
    // Most apps do this server-side with service role.
    // Provide a mailto as a safe default.
    const subject = encodeURIComponent("FeelFlick – Account deletion request");
    const body = encodeURIComponent(
      `Please delete my account.\n\nUser ID: ${authUser?.id}\nEmail: ${authUser?.email}\n\nI understand this action is permanent.`
    );
    window.location.href = `mailto:hello@feelflick.com?subject=${subject}&body=${body}`;
  }

  if (!authUser) {
    return (
      <div className="mx-auto mt-14 max-w-[680px] rounded-2xl border border-white/10 bg-neutral-950/70 p-6 text-white/80 backdrop-blur-md">
        <p>You’re signed out.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 md:mt-12 max-w-[820px] rounded-3xl border border-white/10 bg-neutral-950/65 p-6 sm:p-8 text-white backdrop-blur-md shadow-[0_40px_120px_rgba(0,0,0,.55)]">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
        {/* Avatar */}
        <div className="relative">
          <div
            className="grid h-24 w-24 place-items-center rounded-full bg-white/10 text-2xl font-extrabold select-none ring-1 ring-white/15"
            style={{
              background:
                avatarUrl
                  ? `center/cover url(${avatarUrl})`
                  : undefined,
            }}
          >
            {!avatarUrl && initials}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 inline-flex items-center justify-center rounded-full bg-white/15 p-2 ring-1 ring-white/20 hover:bg-white/25"
            title="Change avatar"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={onPickFile}
          />
        </div>

        {/* Name + email */}
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">My Account</h1>
          <p className="mt-1 text-sm text-white/75">{authUser.email}</p>

          <form onSubmit={handleSave} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-lg border border-white/10 bg-white/[.06] px-3.5 py-2.5 text-[14px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[0.95rem] font-semibold text-white focus:outline-none"
              style={{ background: BTN_GRAD, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </form>

          {msg && (
            <div className="mt-2 inline-flex items-center gap-1 text-[13px] text-white/80">
              <CheckCircle2 className="h-4 w-4 text-green-400" /> {msg}
            </div>
          )}
        </div>
      </div>

      {/* Meta tiles */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <MetaRow label="Joined">
          {profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString() : "—"}
        </MetaRow>
        <MetaRow label="Sign-in method">{profile?.signup_source || authUser?.app_metadata?.provider || "—"}</MetaRow>
        <MetaRow label="Onboarding">
          {profile?.onboarding_complete || profile?.onboarding_completed_at ? "Completed" : "Not completed"}
        </MetaRow>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.04] p-3.5">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-white/60">
            Re-run Onboarding
          </span>
          <button
            type="button"
            onClick={rerunOnboarding}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-white/10"
          >
            <RefreshCcw className="h-4 w-4" /> Start
          </button>
        </div>
      </div>

      {/* Sections */}
      <Section title="Security">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={openResetPassword}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-[0.95rem] font-semibold text-white hover:bg-white/10"
          >
            <Key className="h-4 w-4" /> Change password
          </button>
          <button
            type="button"
            onClick={signOutEverywhere}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-[0.95rem] font-semibold text-white hover:bg-white/10"
          >
            <Shield className="h-4 w-4" /> Sign out all devices
          </button>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-[0.95rem] font-semibold text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </Section>

      <Section title="Danger Zone">
        <div className="flex items-center justify-between rounded-xl border border-red-400/20 bg-red-400/5 p-3.5">
          <div className="text-[13px] text-white/80">
            Permanently delete your account. This action cannot be undone.
          </div>
          <button
            type="button"
            onClick={requestDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-[13px] font-semibold text-red-200 hover:bg-red-500/15"
          >
            <Trash2 className="h-4 w-4" /> Request deletion
          </button>
        </div>
      </Section>
    </div>
  );
}

/* ---------- Small helpers ---------- */

function MetaRow({ label, children }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.04] p-3.5">
      <span className="text-[12px] font-semibold uppercase tracking-wide text-white/60">
        {label}
      </span>
      <span className="text-[13px] text-white/85">{children}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-6">
      <h2 className="text-[13px] font-bold uppercase tracking-wide text-white/60">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}