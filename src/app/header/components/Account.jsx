// src/app/header/components/Account.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import {
  Camera, Loader2, CheckCircle2, LogOut, Shield, Key, RefreshCcw, Trash2,
} from "lucide-react";

const BTN_GRAD = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";
const AVATAR_SIZE = "h-14 w-14";
const BTN_ICON_SIZE = "h-5 w-5";

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
      await supabase.auth.signOut({ scope: "global" });
      nav("/auth", { replace: true });
    } catch (e) {
      console.warn("Global signout error", e);
      await supabase.auth.signOut();
      nav("/auth", { replace: true });
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
        setMsg("Could not upload avatar (storage not configured).");
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub?.publicUrl || "";
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
    const subject = encodeURIComponent("FeelFlick – Account deletion request");
    const body = encodeURIComponent(
      `Please delete my account.\n\nUser ID: ${authUser?.id}\nEmail: ${authUser?.email}\n\nI understand this action is permanent.`
    );
    window.location.href = `mailto:hello@feelflick.com?subject=${subject}&body=${body}`;
  }

  if (!authUser) {
    return (
      <div className="mx-auto mt-8 max-w-[440px] rounded-2xl border border-white/10 bg-neutral-950/70 p-4 text-white/80 backdrop-blur-md">
        <p>You’re signed out.</p>
      </div>
    );
  }

  return (
    <div
      className={`
        w-full
        md:mx-auto md:mt-6 md:mb-6 md:max-w-[820px] md:rounded-2xl md:border md:border-white/10 md:bg-neutral-950/70 md:shadow-[0_32px_80px_rgba(0,0,0,.45)] md:p-6 md:backdrop-blur-md
        min-h-screen
        flex flex-col
      `}
      style={{
        minHeight: "calc(100vh - var(--hdr-h,48px) - 58px)", // fits header+tab bar
        padding: 0,
      }}
    >
      {/* Header row, no extra padding on mobile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 px-4 pt-3 md:px-0 md:pt-0">
        {/* Avatar */}
        <div className="relative">
          <div
            className={`grid ${AVATAR_SIZE} place-items-center rounded-full bg-white/10 text-lg font-bold select-none ring-1 ring-white/15`}
            style={{
              background: avatarUrl ? `center/cover url(${avatarUrl})` : undefined,
            }}
          >
            {!avatarUrl && initials}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 inline-flex items-center justify-center rounded-full bg-white/15 p-1 ring-1 ring-white/20 hover:bg-white/25"
            title="Change avatar"
          >
            {uploading ? <Loader2 className={`${BTN_ICON_SIZE} animate-spin`} /> : <Camera className={BTN_ICON_SIZE} />}
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
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.3rem] font-semibold tracking-tight leading-snug mb-0.5">My Account</h1>
          <p className="text-xs text-white/75 mb-2">{authUser.email}</p>
          <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-lg border border-white/15 bg-[#181a20] px-3 py-2 text-[15px] font-medium text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/25"
              style={{ minHeight: 40 }}
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl px-5 py-2 min-h-[40px] text-base font-semibold text-white focus:outline-none"
              style={{
                background: BTN_GRAD,
                opacity: saving ? 0.7 : 1,
                letterSpacing: 0.1,
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
          {msg && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-white/80">
              <CheckCircle2 className={`${BTN_ICON_SIZE} text-green-400`} /> {msg}
            </div>
          )}
        </div>
      </div>

      {/* Meta tiles */}
      <div className="mt-5 flex flex-col gap-2 px-4 md:px-0">
        <MetaRow label="Joined">{profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString() : "—"}</MetaRow>
        <MetaRow label="Sign-in method">{profile?.signup_source || authUser?.app_metadata?.provider || "—"}</MetaRow>
        <MetaRow label="Onboarding">{profile?.onboarding_complete || profile?.onboarding_completed_at ? "Completed" : "Not completed"}</MetaRow>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.04] p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Re-run Onboarding</span>
          <button
            type="button"
            onClick={rerunOnboarding}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
            style={{ minHeight: 34 }}
          >
            <RefreshCcw className={BTN_ICON_SIZE} /> Start
          </button>
        </div>
      </div>

      {/* Sections */}
      <Section title="Security" extraClass="px-4 md:px-0">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={openResetPassword}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#181a20] px-4 py-3 text-[15px] font-semibold text-white hover:bg-white/10 min-h-[44px]"
          >
            <Key className={BTN_ICON_SIZE} /> Change password
          </button>
        </div>
      </Section>
      <Section title="Danger Zone" extraClass="px-4 md:px-0">
        <div className="flex items-center justify-between rounded-xl border border-red-400/20 bg-red-400/5 p-3">
          <div className="text-xs text-white/80">
            Permanently delete your account. This action cannot be undone.
          </div>
          <button
            type="button"
            onClick={requestDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/15"
          >
            <Trash2 className={BTN_ICON_SIZE} /> Request deletion
          </button>
        </div>
      </Section>
    </div>
  );
}

function MetaRow({ label, children }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.04] p-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/60">{label}</span>
      <span className="text-xs text-white/85">{children}</span>
    </div>
  );
}

function Section({ title, children, extraClass }) {
  return (
    <div className={`mt-4 ${extraClass || ""}`}>
      <h2 className="text-xs font-bold uppercase tracking-wide text-white/60 mb-2">{title}</h2>
      {children}
    </div>
  );
}
