// src/shared/lib/supabase/onboarding.js
import { supabase } from "@/shared/lib/supabase/client";

/** Write to BOTH: auth.user_metadata + public.users.onboarding_complete */
export async function markOnboardingComplete() {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("No authenticated user");

  const uid = user.id;

  // 1) Update auth metadata (we can keep compat keys here, harmless)
  const metaUpdates = {
    onboarding_complete: true,
    has_onboarded: true,
    onboarded: true,
    onboarding_completed_at: new Date().toISOString(),
  };
  const { error: metaErr } = await supabase.auth.updateUser({ data: metaUpdates });
  if (metaErr) throw metaErr;

  // 2) Update your table (ONLY columns that exist in your schema)
  //    Your schema has just: id, ... , onboarding_complete (bool)
  const { error: tableErr } = await supabase
    .from("users")
    .upsert({ id: uid, onboarding_complete: true }, { onConflict: "id" });
  if (tableErr) throw tableErr;

  return true;
}

/** If either side says “done”, promote both to done */
export async function syncOnboardingComplete() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const meta = user.user_metadata || {};
  const metaDone = !!(
    meta.onboarding_complete === true ||
    meta.has_onboarded === true ||
    meta.onboarded === true ||
    meta.onboarding_completed_at
  );

  const { data, error } = await supabase
    .from("users")
    .select("onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  const tableDone = !error && !!data?.onboarding_complete;

  if (metaDone || tableDone) {
    await markOnboardingComplete();
    return true;
  }
  return false;
}