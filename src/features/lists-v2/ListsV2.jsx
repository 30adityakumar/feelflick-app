// src/features/lists-v2/ListsV2.jsx
// FeelFlick — Lists v2 ("Shelves"). Editorial surface backed by
// public.lists × public.list_movies and the curated-lists config.
// Drops the internal Nav (AppShell owns nav). All cards/CTAs route to the
// existing /lists, /lists/:id, and /lists/curated/:slug surfaces.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './lists-v2.css'
import { ListsDataProvider, useListsData } from './useListsData'

const HP = {
  bgDeep: '#06060a',
  border: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.14)',
  text: '#FAFAFA', textSoft: 'rgba(250,250,250,0.72)', textMuted: 'rgba(250,250,250,0.45)', textFaint: 'rgba(250,250,250,0.28)',
  purple: '#A78BFA', purpleDeep: '#7C3AED', pink: '#EC4899', amber: '#F59E0B', red: '#EF4444', green: '#34D399',
}
const HP_GRAD = 'linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)'

const RESET_BTN = { background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }

// === Masthead ============================================================

function Masthead() {
  const navigate = useNavigate()
  const { user } = useListsData()
  return (
    <section style={{ padding: '72px 88px 32px', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 30% at 10% 0%, rgba(167,139,250,0.12), transparent 60%)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: HP.purple }}>Lists</div>
          <div style={{ height: 1, width: 38, background: HP.purple, opacity: 0.5 }} />
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit' }}>{user.mineCount} yours · {user.followedCount} followed</div>
        </div>
        <h1 style={{ fontFamily: 'Outfit', fontSize: 88, lineHeight: 0.92, fontWeight: 300, letterSpacing: '-0.05em', color: HP.text, margin: 0, textWrap: 'balance' }}>
          The <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>shelves.</em>
        </h1>
        <p style={{ marginTop: 18, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 17, color: HP.textSoft, fontStyle: 'italic', maxWidth: 680, lineHeight: 1.55 }}>
          Curated collections. Hand-built, not algorithmic. Yours, your taste twins&rsquo;, and the FeelFlick editors&rsquo;.
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/lists-legacy?new=1')}
            style={{ padding: '12px 22px', borderRadius: 8, background: HP_GRAD, border: 'none', color: '#fff', fontFamily: 'Outfit', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', cursor: 'pointer', boxShadow: '0 12px 28px -8px rgba(236,72,153,0.5)' }}
          >+ New list</button>
        </div>
      </div>
    </section>
  )
}

// === Tabs ================================================================

function Tabs({ tab, setTab }) {
  const { mine, followed, editorial } = useListsData()
  const tabs = [
    { v: 'mine', l: 'Yours', count: mine.length },
    { v: 'followed', l: 'Followed', count: followed.length },
    { v: 'editorial', l: 'Editorial', count: editorial.length },
  ]
  return (
    <section style={{ padding: '24px 88px 24px' }}>
      <div style={{ display: 'inline-flex', gap: 6, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: `1px solid ${HP.border}` }}>
        {tabs.map(t => {
          const on = tab === t.v
          return (
            <button
              key={t.v}
              type="button"
              onClick={() => setTab(t.v)}
              style={{
                padding: '9px 18px', borderRadius: 999,
                background: on ? HP_GRAD : 'transparent',
                color: on ? '#fff' : HP.textMuted,
                border: 'none', cursor: 'pointer',
                fontFamily: 'Outfit', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              {t.l} <span style={{ fontSize: 10, opacity: 0.7 }}>{t.count}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// === Cards ===============================================================

function ListCard({ list, kind, onOpen }) {
  const [c1, c2] = list.palette
  return (
    <article style={{ cursor: 'pointer' }}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open list ${list.title}`}
        style={{ ...RESET_BTN, width: '100%' }}
      >
        <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: 8, overflow: 'hidden', background: `linear-gradient(155deg, ${c1}, ${c2})`, boxShadow: `0 18px 40px -14px rgba(0,0,0,0.6), 0 0 32px ${c1}22`, marginBottom: 14 }}>
          {list.cover && (
            <img src={list.cover} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4, mixBlendMode: 'luminosity' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 30%, ${c2}cc 75%, ${c2})` }} />
          <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ padding: '4px 9px', borderRadius: 3, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'Outfit', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              {list.count} films
            </div>
            {kind === 'mine' && (
              <div style={{ padding: '4px 9px', borderRadius: 3, background: list.public ? 'rgba(52,211,153,0.18)' : 'rgba(0,0,0,0.65)', border: `1px solid ${list.public ? HP.green + '66' : HP.border}`, fontSize: 9, fontWeight: 700, color: list.public ? HP.green : HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {list.public ? 'Public' : 'Private'}
              </div>
            )}
            {kind === 'followed' && list.by && (
              <div style={{ width: 30, height: 30, borderRadius: 999, background: list.byBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: '#0a0510', fontSize: 13, border: '2px solid #06060a' }}>
                {list.by.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18 }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 24, lineHeight: 1.05, fontWeight: 500, color: '#fff', letterSpacing: '-0.02em', margin: 0, textWrap: 'balance' }}>{list.title}</h3>
            {list.blurb && <p style={{ margin: '8px 0 0 0', fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.78)', fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic' }}>{list.blurb}</p>}
          </div>
        </div>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.04em' }}>
        {kind === 'mine' && <span>Updated {list.updated}</span>}
        {kind === 'followed' && <span>{list.by} · {list.updated}</span>}
        {kind === 'editorial' && <span style={{ color: HP.purple, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>FeelFlick · Curated</span>}
        <span style={{ color: HP.textFaint }}>→</span>
      </div>
    </article>
  )
}

function ListsGrid({ items, kind, onOpen }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22 }}>
      {items.map(l => <ListCard key={l.id} list={l} kind={kind} onOpen={() => onOpen(l)} />)}
    </div>
  )
}

function EmptyTab({ label, body, ctaLabel, onCta }) {
  return (
    <div style={{ border: `1px dashed ${HP.border}`, borderRadius: 12, padding: '48px 32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 500, color: HP.text, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'Outfit, Inter, sans-serif', fontSize: 13, color: HP.textMuted, maxWidth: 480, margin: '0 auto 18px', lineHeight: 1.6 }}>{body}</div>
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          style={{ padding: '10px 18px', borderRadius: 999, background: HP_GRAD, border: 'none', color: '#fff', fontFamily: 'Outfit', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
        >{ctaLabel}</button>
      )}
    </div>
  )
}

function Body({ tab }) {
  const navigate = useNavigate()
  const { mine, followed, editorial, loading } = useListsData()

  const openMineOrFollowed = (l) => navigate(`/lists/${l.id}`)
  const openEditorial = (l) => navigate(`/lists/curated/${l.slug}`)

  if (loading) {
    return (
      <section style={{ padding: '8px 88px 56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" style={{ aspectRatio: '4/5', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}` }} />
          ))}
        </div>
      </section>
    )
  }

  if (tab === 'mine') {
    return (
      <section style={{ padding: '8px 88px 56px' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />Your shelves
            </div>
            <h2 style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>Hand-built by <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>you.</em></h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/lists-legacy?new=1')}
            style={{ padding: '10px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: `1px solid ${HP.borderStrong}`, color: HP.text, fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
          >+ New list</button>
        </div>
        {mine.length === 0 ? (
          <EmptyTab
            label="No shelves yet"
            body="Start a list — a director's run, a mood for the week, the five films you'd hand someone new to your taste."
            ctaLabel="Create your first list"
            onCta={() => navigate('/lists-legacy?new=1')}
          />
        ) : (
          <ListsGrid items={mine} kind="mine" onOpen={openMineOrFollowed} />
        )}
      </section>
    )
  }

  if (tab === 'followed') {
    return (
      <section style={{ padding: '8px 88px 56px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />From your circle
          </div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>Lists from your <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>taste twins.</em></h2>
        </div>
        {followed.length === 0 ? (
          <EmptyTab
            label="Nothing from your circle yet"
            body="Follow someone whose taste lines up with yours. When they publish a list, it lands here."
            ctaLabel="Find taste twins"
            onCta={() => navigate('/people')}
          />
        ) : (
          <ListsGrid items={followed} kind="followed" onOpen={openMineOrFollowed} />
        )}
      </section>
    )
  }

  return (
    <section style={{ padding: '8px 88px 56px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />FeelFlick editorial
        </div>
        <h2 style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>Hand-built by <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>the editors.</em></h2>
      </div>
      <ListsGrid items={editorial} kind="editorial" onOpen={openEditorial} />
    </section>
  )
}

// === Featured shelf (first owned list with films) =========================

function FeaturedOpen() {
  const navigate = useNavigate()
  const { featured, user } = useListsData()
  if (!featured) return null

  return (
    <section style={{ padding: '72px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.012)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'flex-start' }}>
        <div style={{ position: 'sticky', top: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 14 }}>Featured shelf</div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 44, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.035em', color: HP.text, margin: 0, textWrap: 'balance' }}>
            {featured.title}
          </h2>
          {featured.blurb && (
            <p style={{ marginTop: 18, fontSize: 14, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.6, textWrap: 'pretty' }}>
              &ldquo;{featured.blurb}&rdquo;
            </p>
          )}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.06em' }}>
            <span>{featured.films.length} film{featured.films.length === 1 ? '' : 's'} · {user.name} · updated {featured.updated}</span>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => navigate(`/lists/${featured.id}`)}
              style={{ padding: '10px 16px', borderRadius: 6, background: HP_GRAD, border: 'none', color: '#fff', fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
            >Open shelf →</button>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${HP.border}` }}>
          {featured.films.map((f, i) => (
            <button
              key={f.id || f.title}
              type="button"
              onClick={() => f.tmdbId && navigate(`/movie/${f.tmdbId}`)}
              style={{ ...RESET_BTN, display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: 24, alignItems: 'center', padding: '20px 0', borderBottom: `1px solid ${HP.border}`, width: '100%' }}
            >
              <div style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 200, color: HP.textMuted, letterSpacing: '-0.04em', width: 36, textAlign: 'right' }}>{String(i + 1).padStart(2, '0')}</div>
              {f.poster ? (
                <img src={f.poster} alt="" style={{ width: 52, height: 78, objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <div style={{ width: 52, height: 78, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 500, color: HP.text, letterSpacing: '-0.015em' }}>{f.title}</span>
                  <span style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit' }}>{f.year}{f.year && ' · '}{f.dir}</span>
                  {f.mood && f.mood !== 'Mixed' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 999, background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.30)', fontSize: 10, color: HP.purple, fontFamily: 'Outfit' }}>
                      <span style={{ width: 5, height: 5, borderRadius: 999, background: HP.purple }} />{f.mood}
                    </span>
                  )}
                </div>
                {f.note && (
                  <p style={{ margin: '6px 0 0 0', fontSize: 13, lineHeight: 1.55, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', textWrap: 'pretty' }}>&ldquo;{f.note}&rdquo;</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function Foot() {
  return (
    <footer style={{ padding: '40px 88px 64px', borderTop: `1px solid ${HP.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'Outfit', flexWrap: 'wrap', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: HP_GRAD, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff' }}>FF</div>
        <span style={{ fontSize: 13, color: HP.textMuted }}>FeelFlick · Lists</span>
      </div>
    </footer>
  )
}

function ListsV2Body() {
  const [tab, setTab] = useState('mine')
  return (
    <div style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <Masthead />
        <Tabs tab={tab} setTab={setTab} />
        <Body tab={tab} />
        <FeaturedOpen />
        <Foot />
      </div>
    </div>
  )
}

export default function ListsV2() {
  return (
    <ListsDataProvider>
      <ListsV2Body />
    </ListsDataProvider>
  )
}
