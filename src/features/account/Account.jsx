// src/features/account-v2/Account.jsx
// FeelFlick — Account (v2). Mount at /account-v2 alongside the existing /account.
// PR 1: real handlers (avatar upload, name save, sign out, sign out everywhere,
//        reset DNA, delete via mailto) ported from the existing Account.jsx
//        page; settings toggles + sliders persist to localStorage until per-user
//        preference tables ship.
// Page is rendered inside AppShell which already provides the global TopNav;
// the prototype's internal nav has been dropped.

import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { HP } from './data'
import {
  Masthead, IdentityCard, Notifications,
} from './top'
import {
  Privacy, Connections, PlanCard, SessionsCard, DangerZone, AccountFooter,
} from './bottom'
import { AccountDataProvider, useAccountData } from './useAccountData'
import './account.css'

export default function Account() {
  usePageMeta({ title: 'Account — FeelFlick' })
  return (
    <AccountDataProvider>
      <AccountV2Shell />
    </AccountDataProvider>
  )
}

function AccountV2Shell() {
  const { loading, authUser, error } = useAccountData()
  if (loading) return <PageSkeleton />
  if (error) return <PageError error={error} />
  if (!authUser) return <SignedOut />

  return (
    <div className="ff-account-v2" style={{ minHeight:'100vh', background: HP.bgDeep, color: HP.text, fontFamily:'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Masthead />
        <IdentityCard />
        <Notifications />
        <Privacy />
        <Connections />
        <PlanCard />
        <SessionsCard />
        <DangerZone />
        <AccountFooter />
      </div>
    </div>
  )
}

function PageSkeleton() {
  const pulse = { background: 'rgba(255,255,255,0.04)' }
  return (
    <div className="ff-account-v2" style={{ minHeight:'100vh', background: HP.bgDeep, color: HP.text, fontFamily:'Inter, sans-serif' }}>
      <div className="ff-acct-section" style={{ maxWidth:1280, margin:'0 auto', padding:'80px 88px' }}>
        <div className="animate-pulse" style={{ ...pulse, height:14, width:280, borderRadius:999, marginBottom:30 }} />
        <div className="animate-pulse" style={{ background:'rgba(167,139,250,0.10)', height:80, width:'40%', borderRadius:8, marginBottom:48 }} />
        <div style={{ display:'flex', gap:48, alignItems:'center', flexWrap:'wrap' }}>
          <div className="animate-pulse" style={{ ...pulse, width:96, height:96, borderRadius:999 }} />
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14, minWidth:200 }}>
            <div className="animate-pulse" style={{ ...pulse, height:28, width:'40%', borderRadius:6 }} />
            <div className="animate-pulse" style={{ ...pulse, height:14, width:'60%', borderRadius:999 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function SignedOut() {
  return (
    <div className="ff-account-v2" style={{ minHeight:'100vh', background:HP.bgDeep, color:HP.text, display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Inter, sans-serif' }}>
      <div style={{ textAlign:'center', maxWidth:480 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:18 }}>Account</div>
        <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:42, fontWeight:500, color: HP.text, margin:'0 0 18px 0', letterSpacing:'-0.025em' }}>Sign in to manage your settings.</h1>
        <p style={{ margin:0, color:'rgba(250,250,250,0.6)', fontSize:14, lineHeight:1.6 }}>The settings drawer needs an account to attach to.</p>
      </div>
    </div>
  )
}

function PageError({ error }) {
  return (
    <div className="ff-account-v2" style={{ minHeight:'100vh', background:HP.bgDeep, color:HP.text, display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Inter, sans-serif' }}>
      <div style={{ textAlign:'center', maxWidth:520 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:18 }}>Account · error</div>
        <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:36, fontWeight:500, color:HP.text, margin:'0 0 18px 0', letterSpacing:'-0.025em' }}>Couldn&rsquo;t load your settings.</h1>
        <p style={{ margin:0, color:'rgba(250,250,250,0.6)', fontSize:14, lineHeight:1.6 }}>{error}</p>
      </div>
    </div>
  )
}
