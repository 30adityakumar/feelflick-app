// src/features/lists/Lists.jsx
// FeelFlick — Lists v2 ("Shelves"). Editorial surface backed by
// public.lists × public.list_movies and the curated-lists config.
// Drops the internal Nav (AppShell owns nav). All cards/CTAs route to the
// existing /lists, /lists/:id, and /lists/curated/:slug surfaces.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import CreateListModal from '@/features/lists/CreateListModal'
import './lists.css'
import { ListsDataProvider, useListsData } from './useListsData'

import { HP, HP_GRAD } from '@/shared/lib/tokens'
const RESET_BTN = { background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }

// === Masthead ============================================================

function Masthead({ onNewList }) {
  const { user } = useListsData()
  return (
    <section className="ff-lists-section ff-lists-masthead" style={{ padding: '72px 88px 32px', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 30% at 10% 0%, rgba(167,139,250,0.12), transparent 60%)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: HP.purple }}>Lists</div>
          <div style={{ height: 1, width: 38, background: HP.purple, opacity: 0.5 }} />
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit' }}>{user.mineCount} yours · {user.followedCount} followed</div>
        </div>
        <h1 className="ff-lists-hero" style={{ fontFamily: 'Outfit', fontSize: 88, lineHeight: 0.92, fontWeight: 300, letterSpacing: '-0.05em', color: HP.text, margin: 0, textWrap: 'balance' }}>
          The <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>shelves.</em>
        </h1>
        <p style={{ marginTop: 18, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 17, color: HP.textSoft, fontStyle: 'italic', maxWidth: 680, lineHeight: 1.55 }}>
          Curated collections. Hand-built, not algorithmic. Yours, your taste twins&rsquo;, and the FeelFlick editors&rsquo;.
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onNewList}
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
    <section className="ff-lists-section ff-lists-tabs" style={{ padding: '24px 88px 24px' }}>
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
  // Posters from the list's items (up to 3 — fetched in useListsData).
  // Lists about CONTENT should show CONTENT; the gradient is the fallback
  // when the list is empty or its films lack poster_path.
  const posters = list.posters || []
  const hasPosters = posters.length > 0
  return (
    <article className="ff-lists-card" style={{ cursor: 'pointer' }}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open list ${list.title}`}
        style={{ ...RESET_BTN, width: '100%' }}
      >
        <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: 8, overflow: 'hidden', background: `linear-gradient(155deg, ${c1}, ${c2})`, boxShadow: `0 18px 40px -14px rgba(0,0,0,0.6), 0 0 32px ${c1}22`, marginBottom: 14 }}>
          {/* Poster strip — three real posters fanned across the top half of
              the card. Falls through to the gradient when there are no
              posters (empty list / editorial query-driven list). */}
          {hasPosters && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '62%', display: 'flex', gap: 0 }}>
              {posters.slice(0, 3).map((p, i) => (
                <img
                  key={i}
                  src={p}
                  alt=""
                  loading="lazy"
                  style={{
                    flex: 1,
                    width: 0,
                    height: '100%',
                    objectFit: 'cover',
                    filter: i === 0 ? 'none' : `brightness(${0.92 - i * 0.06}) saturate(0.9)`,
                  }}
                />
              ))}
            </div>
          )}
          {/* Bottom gradient veil for legibility of title overlay */}
          <div style={{ position: 'absolute', inset: 0, background: hasPosters
            ? `linear-gradient(180deg, transparent 28%, ${c2}aa 55%, ${c2}f5 75%, ${c2})`
            : `linear-gradient(180deg, transparent 30%, ${c2}cc 75%, ${c2})`
          }} />
          <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ padding: '4px 9px', borderRadius: 3, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'Outfit', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              {list.count} film{list.count === 1 ? '' : 's'}
            </div>
            {kind === 'mine' && (
              <div style={{ padding: '4px 9px', borderRadius: 3, background: list.public ? 'rgba(52,211,153,0.20)' : 'rgba(0,0,0,0.7)', border: `1px solid ${list.public ? HP.green + '66' : HP.border}`, fontSize: 9, fontWeight: 700, color: list.public ? HP.green : HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {list.public ? 'Public' : 'Private'}
              </div>
            )}
            {kind === 'followed' && list.by && (
              <div style={{ width: 30, height: 30, borderRadius: 999, background: list.byBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: '#0a0510', fontSize: 13, border: `2px solid ${HP.bgDeep}` }}>
                {list.by.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18 }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 24, lineHeight: 1.05, fontWeight: 500, color: '#fff', letterSpacing: '-0.02em', margin: 0, textWrap: 'balance' }}>{list.title}</h3>
            {list.blurb && <p style={{ margin: '8px 0 0 0', fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{list.blurb}</p>}
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
    <div className="ff-lists-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22 }}>
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

function Body({ tab, onNewList }) {
  const navigate = useNavigate()
  const { mine, followed, popularPublic, editorial, loading } = useListsData()

  const openMineOrFollowed = (l) => navigate(`/lists/${l.id}`)
  const openEditorial = (l) => navigate(`/lists/curated/${l.slug}`)

  if (loading) {
    return (
      <section className="ff-lists-section" style={{ padding: '8px 88px 56px' }}>
        <div className="ff-lists-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" style={{ aspectRatio: '4/5', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}` }} />
          ))}
        </div>
      </section>
    )
  }

  if (tab === 'mine') {
    return (
      <section className="ff-lists-section" style={{ padding: '8px 88px 56px' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />Your shelves
            </div>
            <h2 className="ff-lists-h2" style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>Hand-built by <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>you.</em></h2>
          </div>
          <button
            type="button"
            onClick={onNewList}
            style={{ padding: '10px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: `1px solid ${HP.borderStrong}`, color: HP.text, fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
          >+ New list</button>
        </div>
        {mine.length === 0 ? (
          <EmptyTab
            label="No shelves yet"
            body="Start a list — a director's run, a mood for the week, the five films you'd hand someone new to your taste."
            ctaLabel="Create your first list"
            onCta={onNewList}
          />
        ) : (
          <ListsGrid items={mine} kind="mine" onOpen={openMineOrFollowed} />
        )}
      </section>
    )
  }

  if (tab === 'followed') {
    // When the user follows nobody (or their follows haven't published lists),
    // fall back to public lists from the wider community so the tab is
    // always populated. Mirrors the /people cold-start fallback pattern.
    const showPopularFallback = followed.length === 0 && popularPublic.length > 0
    return (
      <section className="ff-lists-section" style={{ padding: '8px 88px 56px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />
            {showPopularFallback ? 'Popular on FeelFlick' : 'From your circle'}
          </div>
          <h2 className="ff-lists-h2" style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>
            {showPopularFallback
              ? <>Public lists, <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>worth a look.</em></>
              : <>Lists from your <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>taste twins.</em></>}
          </h2>
          {showPopularFallback && (
            <p style={{ marginTop: 12, fontSize: 13, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', maxWidth: 540 }}>
              Follow someone whose taste lines up and this rail switches to their shelves. Until then, here&rsquo;s what the community is building.
            </p>
          )}
        </div>
        {followed.length > 0 ? (
          <ListsGrid items={followed} kind="followed" onOpen={openMineOrFollowed} />
        ) : showPopularFallback ? (
          <ListsGrid items={popularPublic} kind="followed" onOpen={openMineOrFollowed} />
        ) : (
          <EmptyTab
            label="Nothing from your circle yet"
            body="Follow someone whose taste lines up with yours. When they publish a list, it lands here."
            ctaLabel="Find taste twins"
            onCta={() => navigate('/people')}
          />
        )}
      </section>
    )
  }

  return (
    <section className="ff-lists-section" style={{ padding: '8px 88px 56px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />FeelFlick editorial
        </div>
        <h2 className="ff-lists-h2" style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>Hand-built by <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>the editors.</em></h2>
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
    <section className="ff-lists-section ff-lists-featured" style={{ padding: '72px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.012)' }}>
      <div className="ff-lists-featured-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'flex-start' }}>
        <div className="ff-lists-featured-meta" style={{ position: 'sticky', top: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 14 }}>Featured shelf</div>
          <h2 className="ff-lists-h2-lg" style={{ fontFamily: 'Outfit', fontSize: 44, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.035em', color: HP.text, margin: 0, textWrap: 'balance' }}>
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

function ListsV2Body() {
  const navigate = useNavigate()
  const { user: authUser } = useAuthSession()
  const { reload } = useListsData()
  const [tab, setTab] = useState('mine')
  const [showCreate, setShowCreate] = useState(false)

  const handleSavedList = (created) => {
    setShowCreate(false)
    if (created?.id) {
      // Refresh the hub data so a back-nav (or "Open in /lists" later) shows
      // the new list. Push the user to the v2 detail page so they can keep
      // adding films in one continuous flow.
      reload?.()
      navigate(`/lists/${created.id}`)
    }
  }

  return (
    <div className="ff-lists-v2" style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <Masthead onNewList={() => setShowCreate(true)} />
        <Tabs tab={tab} setTab={setTab} />
        <Body tab={tab} onNewList={() => setShowCreate(true)} />
        <FeaturedOpen />
      </div>
      {showCreate && authUser?.id && (
        <CreateListModal
          userId={authUser.id}
          onClose={() => setShowCreate(false)}
          onSave={handleSavedList}
        />
      )}
    </div>
  )
}

export default function Lists() {
  usePageMeta({ title: 'Lists — FeelFlick' })
  return (
    <ListsDataProvider>
      <ListsV2Body />
    </ListsDataProvider>
  )
}
