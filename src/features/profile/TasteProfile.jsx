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
  usePageMeta({ title: paramUserId && paramUserId !== user?.id ? 'Taste profile — FeelFlick' : 'Your taste profile — FeelFlick' })
  // When viewing via /profile-v2/:userId we render someone else's DNA;
  // otherwise fall back to the signed-in user.
  const targetUserId = paramUserId || user?.id
  const isSelf = !paramUserId || paramUserId === user?.id
  const data = useProfileDataFetch({ userId: targetUserId, authUser: user, isSelf })

  if (data.loading) return <PageSkeleton />
  if (data.error) return <PageError error={data.error} />

  return (
    <ProfileDataProvider value={{ ...data, isSelf, viewingUserId: targetUserId }}>
      <div className="ff-profile-v2" style={{ minHeight:'100vh', background: HP.bgDeep, color: HP.text, fontFamily:'Inter, sans-serif', position:'relative' }}>
        <div style={{ maxWidth:1440, margin:'0 auto' }}>
          <Masthead />
          <QuickStats />
          {/* DNA confidence, honestly framed (self-only — a viewer can't improve
              someone else's profile). Explains the number as taste *evidence*,
              guides cold-start users, and connects the profile to Tonight. */}
          {isSelf && (
            <DnaConfidence
              confidence={data.stats?.dnaConfidence}
              filmsLogged={data.stats?.filmsLogged}
              filmsRated={data.stats?.filmsRated}
              moodSignals={data.moods?.length}
            />
          )}
          <MoodRadar />
          <SignatureDirectors />
          <MotifCloud />
          <Trajectory />
          <PatternPanel />
          <Mixtape />
          <Skew />
          <FriendsRanked />
          {isSelf && <YIRBanner />}
          {isSelf && <ShareCard />}
          <ProfileFooter />
        </div>
      </div>
    </ProfileDataProvider>
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

function PageError({ error }) {
  return (
    <div className="ff-profile-v2" style={{ minHeight:'100vh', background: HP.bgDeep, color: HP.text, display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Inter, sans-serif' }}>
      <div style={{ textAlign:'center', maxWidth:520 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:18 }}>Profile · error</div>
        <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:36, fontWeight:500, color: HP.text, margin:'0 0 18px 0', letterSpacing:'-0.025em' }}>Couldn&rsquo;t load your DNA.</h1>
        <p style={{ margin:0, color:'rgba(250,250,250,0.6)', fontSize:14, lineHeight:1.6 }}>{error}</p>
      </div>
    </div>
  )
}
