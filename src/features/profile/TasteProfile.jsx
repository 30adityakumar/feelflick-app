// src/features/profile/TasteProfile.jsx
// FeelFlick — Cinematic DNA / Taste Profile (v2).
// Mount at /profile-v2 alongside the existing /profile.
//
// PR 2: live data wiring. The page reads the signed-in user's history,
// ratings, and taste fingerprint and derives every section. Sections with
// empty data sources self-hide. PR 3 will wire FRIENDS + SKEWS (need
// user_similarity + an FF-median comparison); PR 4 adds an editorial
// overlay for archetype/summary/signature.

import { useParams } from 'react-router-dom'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { HP } from './data'
import { Masthead, QuickStats, MoodRadar } from './sections-top'
import DnaConfidence from './DnaConfidence'
import {
  SignatureDirectors, MotifCloud, Trajectory, PatternPanel,
  Mixtape, Skew, FriendsRanked, ShareCard, YIRBanner, ProfileFooter,
} from './sections-bottom'
import { ProfileDataProvider, useProfileDataFetch } from './useProfileData'
import './profile.css'

export default function TasteProfile() {
  const { user } = useAuthSession()
  const { userId: paramUserId } = useParams()
  const isSelf = !paramUserId || paramUserId === user?.id
  usePageMeta({ title: isSelf ? 'Your taste profile — FeelFlick' : 'Cinematic DNA — FeelFlick' })

  // F7.2 privacy containment: a Cinematic DNA profile is OWNER-PRIVATE. Another user's
  // behavioral portrait must never render — and we must not even fetch their
  // history/ratings/similarity/editorial. (This is defense-in-depth; the authoritative
  // boundary is the owner-only RLS restored in supabase/migrations/20260609000000.)
  // Keeping the data hook out of the non-self branch guarantees no cross-user query runs.
  if (!isSelf) return <PrivateProfile />
  return <SelfProfile authUser={user} />
}

function SelfProfile({ authUser }) {
  const data = useProfileDataFetch({ userId: authUser?.id, authUser, isSelf: true })

  if (data.loading) return <PageSkeleton />
  if (data.error) return <PageError onRetry={data.retry} />

  return (
    <ProfileDataProvider value={{ ...data, isSelf: true, viewingUserId: authUser?.id }}>
      <div className="ff-profile-v2" style={{ minHeight:'100vh', background: HP.bgDeep, color: HP.text, fontFamily:'Inter, sans-serif', position:'relative' }}>
        <div style={{ maxWidth:1440, margin:'0 auto' }}>
          <Masthead />
          <QuickStats />
          {/* DNA confidence, honestly framed. Explains the number as taste *evidence*,
              guides cold-start users, and connects the profile to Tonight. */}
          <DnaConfidence
            confidence={data.stats?.dnaConfidence}
            filmsLogged={data.stats?.filmsLogged}
            filmsRated={data.stats?.filmsRated}
            moodSignals={data.moods?.length}
          />
          <MoodRadar />
          <SignatureDirectors />
          <MotifCloud />
          <Trajectory />
          <PatternPanel />
          <Mixtape />
          <Skew />
          <FriendsRanked />
          <YIRBanner />
          <ShareCard />
          <ProfileFooter />
        </div>
      </div>
    </ProfileDataProvider>
  )
}

// F7.2 — shown for /profile/:userId of anyone other than the signed-in user. No data is
// fetched for the target. Honest, minimal, keyboard-accessible; explains the current rule
// rather than implying the person has no taste data.
function PrivateProfile() {
  return (
    <div className="ff-profile-v2" style={{ minHeight:'100vh', background: HP.bgDeep, color: HP.text, display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Inter, sans-serif' }}>
      <div style={{ textAlign:'center', maxWidth:520 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:18 }}>Cinematic DNA</div>
        <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:36, fontWeight:500, color: HP.text, margin:'0 0 14px 0', letterSpacing:'-0.025em' }}>This profile is private.</h1>
        <p style={{ margin:'0 0 28px 0', color:'rgba(250,250,250,0.6)', fontSize:14, lineHeight:1.6 }}>
          Cinematic DNA — your watch history, ratings, and taste portrait — is visible only to you. Public taste profiles aren&rsquo;t available yet.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <a href="/profile" style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:14, fontWeight:600, color:'#0A0510', background:HP.text, padding:'11px 20px', borderRadius:8, textDecoration:'none' }}>Your Cinematic DNA</a>
          <a href="/people" style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:14, fontWeight:600, color:HP.text, background:'transparent', border:`1px solid ${HP.border}`, padding:'11px 20px', borderRadius:8, textDecoration:'none' }}>People</a>
        </div>
      </div>
    </div>
  )
}

function PageSkeleton() {
  const pulse = { background: 'rgba(255,255,255,0.04)' }
  return (
    <div className="ff-profile-v2" style={{ minHeight:'100vh', background: HP.bgDeep, color: HP.text, fontFamily:'Inter, sans-serif' }}>
      <div style={{ maxWidth:1440, margin:'0 auto', padding:'80px 88px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:30 }}>
          <div className="animate-pulse" style={{ ...pulse, height:12, width:280, borderRadius:999 }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:48, alignItems:'flex-end' }}>
          <div className="animate-pulse" style={{ ...pulse, width:120, height:120, borderRadius:999 }} />
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="animate-pulse" style={{ background:'rgba(167,139,250,0.10)', height:80, width:'70%', borderRadius:8 }} />
            <div className="animate-pulse" style={{ ...pulse, height:16, width:'55%', borderRadius:999 }} />
          </div>
          <div className="animate-pulse" style={{ ...pulse, width:240, height:120, borderRadius:6 }} />
        </div>
      </div>
    </div>
  )
}

// F7.3: fixed, safe error copy off the stable `load_error` classification — the raw backend
// message is never rendered. One h1, role="alert", a real in-SPA retry, and a safe exit.
function PageError({ onRetry }) {
  const btn = { fontFamily:'Outfit, Inter, sans-serif', fontSize:14, fontWeight:600, minHeight:44, padding:'11px 20px', borderRadius:8, cursor:'pointer' }
  return (
    <div className="ff-profile-v2" style={{ minHeight:'100vh', background: HP.bgDeep, color: HP.text, display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Inter, sans-serif' }}>
      <div role="alert" style={{ textAlign:'center', maxWidth:520 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:18 }}>Cinematic DNA</div>
        <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:36, fontWeight:500, color: HP.text, margin:'0 0 14px 0', letterSpacing:'-0.025em' }}>We couldn&rsquo;t load your Cinematic DNA.</h1>
        <p style={{ margin:'0 0 28px 0', color:'rgba(250,250,250,0.6)', fontSize:14, lineHeight:1.6 }}>Try refreshing in a moment.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          {typeof onRetry === 'function' && (
            <button type="button" onClick={onRetry} style={{ ...btn, color:'#0A0510', background:HP.text, border:'none' }}>Try again</button>
          )}
          <a href="/home" style={{ ...btn, color:HP.text, background:'transparent', border:`1px solid ${HP.border}`, textDecoration:'none', display:'inline-flex', alignItems:'center' }}>Go to Home</a>
        </div>
      </div>
    </div>
  )
}
