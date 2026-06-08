import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, Bookmark } from 'lucide-react'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { logSurfaceImpressions } from '@/shared/services/recommendations'
import { HP_GRAD } from '@/shared/lib/tokens'
import { constellationName, buildBecauseLine } from '../derive'
import { HP } from '../constants'
import { moodFilter, buildRuntimeFitLine } from '../resultPresentation'
import { useStreamingProvider } from '../hooks/useStreamingProvider'
import { useDiscoverResultActions } from '../hooks/useDiscoverResultActions'
import TrailerModal from './TrailerModal'
import StreamingChip from './StreamingChip'

// ── Stage 3 — one confident pick (F3.8) + trust/a11y hardening (F3.9) ──
// ONE film on the decision surface: FeelFlick's considered recommendation for
// tonight, with an honest "Why this one" case. The ranked `results` list stays
// INTERNAL — a controlled "Not tonight" / "Already watched" fallback (hiddenTopIds
// promotes the next-best result), never a visible deck, count, or feed. A single
// polite live region narrates what appeared / succeeded / failed; the queue depth
// is never announced.
export default function StagePick({ selected, who, energy, intention, results, profile, sessionShownIds, onRestart, onBack, blendHex, audioToggle, time, isFallback }) {
  // Session-only "hidden" set — Not tonight / Already watched add the current
  // top's id here and the next-best result promotes into view. Resets only when
  // `results` changes (the user adjusted inputs or started over).
  const [hiddenTopIds, setHiddenTopIds] = useState(() => new Set());
  useEffect(() => { setHiddenTopIds(new Set()); }, [results]);

  // Internal ranked depth — a controlled fallback for Not tonight, NOT a visible
  // deck and NOT a feed. Its length is never exposed.
  const MAX_PICKS = 15;
  const initialPicks = useMemo(() => results.slice(0, MAX_PICKS), [results]);
  const visibleResults = useMemo(
    () => initialPicks.filter(r => !hiddenTopIds.has(r.id)),
    [initialPicks, hiddenTopIds]
  );
  const top = visibleResults[0];
  const exhausted = !top;

  const cName = constellationName(selected);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthSession();
  // Streaming availability — { provider, status } so we can be honest about
  // found / no-data / couldn't-check (never implying the film is unavailable).
  const { provider, status: providerStatus } = useStreamingProvider(top?.tmdbId);
  // "Because…" line — the one honest signal that proves the engine knows the user;
  // null when no signal can be claimed (the case section then omits it).
  const becauseLine = useMemo(
    () => buildBecauseLine({ film: top, profile, selected }),
    [top, profile, selected]
  );
  // Honest runtime-fit line — only when the film genuinely sits inside the chosen
  // time band (no fuzzy tolerance, no fabricated claim).
  const runtimeFitLine = top ? buildRuntimeFitLine({ time, runtime: top.runtime }) : null;

  // Film descriptor chips — genre + up to two real mood/tone tags in catalogue
  // order (not ranked "strongest"). Says what KIND of film this is at a glance.
  const chips = useMemo(() => {
    if (!top) return [];
    const out = [];
    if (top.genre) out.push(top.genre);
    const tags = [...(top._raw?.mood_tags || []), ...(top._raw?.tone_tags || [])]
      .filter(Boolean)
      .slice(0, 2)
      .map(t => String(t).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    return [...out, ...tags].slice(0, 3);
  }, [top]);

  // The result-actions hook owns Save / Already watched / Not tonight / Open Film
  // File + every write payload. setSelectedTopId is part of its (frozen) contract —
  // it cleared a pinned alternate; with alternates removed, top is always the
  // next non-hidden result, so clearing is a no-op.
  const { savedState, watchedState, handleSeeMore, handleSaveForLater, handleMarkWatched, handleSkip } =
    useDiscoverResultActions({ top, user, selected, intention, energy, who, setHiddenTopIds, setSelectedTopId: () => {}, navigate });

  // ── Single polite live region ───────────────────────────────────────────────
  // One status string, updated only on meaningful changes (pick appeared /
  // promoted, write succeeded / failed, exhausted). promotionReasonRef records
  // WHY the next top-change happens so we can phrase it honestly; the queue
  // count is never spoken.
  const [liveStatus, setLiveStatus] = useState('');
  const promotionReasonRef = useRef(null); // null | 'skip' | 'watched'
  const announcedTopRef = useRef(null);

  // Pick appearance / promotion / exhausted.
  useEffect(() => {
    if (exhausted) { setLiveStatus('No more strong fits for this set of details.'); return; }
    if (!top?.id || announcedTopRef.current === top.id) return;
    announcedTopRef.current = top.id;
    const reason = promotionReasonRef.current;
    promotionReasonRef.current = null;
    if (reason === 'skip') setLiveStatus(`New pick: ${top.title}.`);
    else if (reason === 'watched') setLiveStatus(`Marked watched. New pick: ${top.title}.`);
    else setLiveStatus(`Tonight's pick: ${top.title}.`);
  }, [top?.id, top?.title, exhausted]);

  // Save success / failure.
  useEffect(() => {
    if (savedState === 'saved') setLiveStatus('Saved for later.');
    else if (savedState === 'error') setLiveStatus('Could not save. Try again.');
  }, [savedState]);

  // Already-watched success / failure. Success also marks the next top-change as a
  // watched-promotion so it reads "Marked watched. New pick: …".
  useEffect(() => {
    if (watchedState === 'watched') { setLiveStatus('Marked watched.'); promotionReasonRef.current = 'watched'; }
    else if (watchedState === 'error') setLiveStatus('Could not mark watched. Try again.');
  }, [watchedState]);

  // Not tonight — flag the promotion reason before the synchronous advance.
  const onNotTonight = () => { promotionReasonRef.current = 'skip'; handleSkip(); };

  // Session-shown tracking — record ONLY the film the user actually saw (the
  // current top). Queued films are never marked shown. diversifyTop3 reads this
  // ref on the NEXT input change to demote genuinely-seen films.
  useEffect(() => {
    if (!sessionShownIds?.current) return;
    if (top?.id) sessionShownIds.current.add(top.id);
  }, [top?.id, sessionShownIds]);

  // Stage 3 impression log — one row per current top pick. top.match remains the
  // engineScore for analytics (it is simply no longer shown to the user as a %).
  const topId = top?.id
  useEffect(() => {
    if (!user?.id || !topId || !top) return
    logSurfaceImpressions({
      userId: user.id,
      films: [{ id: top.id, engineScore: top.match, _pickReasonLabel: 'discover_top_pick' }],
      placement: 'discover',
      pickReasonType: 'discover_reveal',
      pickReasonLabel: `Discover · ${cName}`,
    })
    // top.id pins the impression — when Not tonight / Already watched advance the
    // pick we log the new top as its own row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, topId])

  const filter = moodFilter(selected[0]);

  // Computed only when a pick exists (guarded so the exhausted branch is safe).
  const synopsis = top && top.overview && top.overview.trim().length > 20 ? top.overview.trim() : null;
  const titleWords = top ? top.title.split(' ') : [];
  const hasCase = Boolean(becauseLine || runtimeFitLine);
  const SAVE_LABEL = { idle: 'Save for later', saving: 'Saving…', saved: 'Saved', error: 'Try again' };
  const watchedLabel = watchedState === 'watched' ? 'Watched' : watchedState === 'error' ? 'Try again' : 'Already watched';

  // One persistent, polite, sr-only status region wraps both states so the
  // exhausted announcement lands on the same live element (no fresh region).
  const liveRegion = (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{liveStatus}</p>
  );

  // Exhausted — the internal ranked list is consumed. No automatic refill (that
  // would read as an infinite feed). Two honest doors: adjust tonight's details,
  // or start over with a different mood.
  if (exhausted) {
    return (
      <>
        {liveRegion}
        <section className="ff-discover-section" style={{ position:'relative', minHeight:'70vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px', textAlign:'center', animation:'ff-fade 0.5s ease' }}>
          {audioToggle}
          <div className="ff-pick-eyebrow" style={{ color:blendHex, marginBottom:18, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span aria-hidden="true" style={{ height:1, width:22, background:blendHex, opacity:0.6 }} />
            No more strong fits
          </div>
          <h2 style={{ fontFamily:'Outfit', fontSize:'clamp(32px, 4.6vw, 56px)', lineHeight:1.04, fontWeight:200, letterSpacing:'-0.04em', color:HP.text, margin:0, maxWidth:760, textWrap:'balance' }}>
            That&rsquo;s the honest edge of tonight&rsquo;s list.
          </h2>
          <p style={{ marginTop:18, fontFamily:'Outfit, Inter, sans-serif', fontSize:14, color:HP.textMuted, fontStyle:'italic', maxWidth:480, lineHeight:1.6 }}>
            Adjust tonight&rsquo;s details, or start again with a different mood.
          </p>
          <div style={{ marginTop:32, display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
            <button onClick={onBack} style={{ minHeight:44, display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'12px 22px', borderRadius:10, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:700, letterSpacing:'0.01em', cursor:'pointer', boxShadow:'0 10px 26px -10px rgba(236,72,153,0.55)' }}>Adjust tonight</button>
            <button onClick={onRestart} style={{ minHeight:44, display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'12px 18px', borderRadius:10, background:HP.surface, border:`1px solid ${HP.borderStrong}`, color:HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor:'pointer' }}>Start over</button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {liveRegion}
      <section className="ff-discover-section" style={{ position:'relative', animation:'ff-fade 0.7s ease' }}>
        {audioToggle}
        {/* Static film grain + vignette (decorative, no animated movement). */}
        <div aria-hidden="true" style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2, opacity:0.045, mixBlendMode:'overlay', backgroundImage:'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22220%22 height=%22220%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")' }} />
        <div aria-hidden="true" style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2, background:'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)' }} />

        {/* AnimatePresence keyed on top.id — the only result motion: a short
            crossfade when Not tonight / Already watched advance the pick. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={top.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="ff-stage3-spread">
              {/* LEFT — poster (static mood-coloured glow, no parallax, no ken burns). */}
              <div className="ff-stage3-spread__left" style={{ position:'relative' }}>
                <div style={{ position:'relative' }}>
                  <div aria-hidden="true" style={{ position:'absolute', inset:-14, borderRadius:14, background:`radial-gradient(ellipse at center, ${blendHex}55, transparent 70%)`, filter:'blur(30px)' }} />
                  <div style={{ position:'relative', overflow:'hidden', borderRadius:8, boxShadow:`0 30px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px ${blendHex}33` }}>
                    <img className="ff-pick-poster" src={top.poster} alt={`${top.title} poster`} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block', filter: filter.cardFilter || 'none', animation:'ff-poster-in 1s cubic-bezier(.2,.7,.2,1)' }} />
                    {filter.overlay && <div aria-hidden="true" style={{ position:'absolute', inset:0, background:filter.overlay, pointerEvents:'none', mixBlendMode:'overlay' }} />}
                  </div>
                </div>
              </div>

              {/* RIGHT — eyebrow, title, meta, chips, the case, synopsis, provider, actions. */}
              <div className="ff-stage3-spread__right">
                <div className="ff-pick-eyebrow" style={{ color:blendHex }}>Tonight&rsquo;s pick</div>
                {isFallback && (
                  <p className="ff-pick-fallback-note">Example pick &mdash; we couldn&rsquo;t reach your live recommendations.</p>
                )}
                <h1 style={{ fontFamily:'Outfit', fontSize:'clamp(44px, 5.6vw, 76px)', lineHeight:0.96, fontWeight:300, letterSpacing:'-0.045em', color:HP.text, margin:'12px 0 0', textWrap:'balance' }}>
                  {titleWords.map((w, i) => <span key={i} className="ff-pick-word" style={{ display:'inline-block', opacity:0, animation:`ff-word-in 0.55s cubic-bezier(.2,.7,.2,1) ${0.1 + i*0.06}s forwards`, marginRight:'0.2em' }}>{w}</span>)}
                </h1>

                {/* Meta — director · year · runtime (no percentages). */}
                <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', fontFamily:'Outfit', fontSize:13, color:HP.textMuted, letterSpacing:'0.04em' }}>
                  <span>{top.dir}</span>
                  <span aria-hidden="true" style={{ color:HP.textFaint }}>·</span>
                  <span>{top.year}</span>
                  <span aria-hidden="true" style={{ color:HP.textFaint }}>·</span>
                  <span>{top.runtime} min</span>
                </div>

                {chips.length > 0 && (
                  <div style={{ marginTop:14, display:'flex', flexWrap:'wrap', gap:7 }}>
                    {chips.map((c, i) => (
                      <span key={`${c}-${i}`} style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:999, border:`1px solid ${HP.border}`, fontFamily:'Outfit', fontSize:11, fontWeight:500, color:HP.textSoft, letterSpacing:'0.02em' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Why this one — the honest case. Renders only when at least one
                    true line exists; never a generic fallback sentence. */}
                {hasCase && (
                  <div className="ff-pick-case" style={{ marginTop:22 }}>
                    <div className="ff-pick-case__label" style={{ color:HP.textMuted }}>Why this one</div>
                    {becauseLine && (
                      <p className="ff-pick-case__line" style={{ margin:'10px 0 0', fontFamily:'Outfit, Inter, sans-serif', fontSize:14, fontStyle:'italic', color:blendHex, letterSpacing:'0.01em', textWrap:'balance' }}>{becauseLine}</p>
                    )}
                    {runtimeFitLine && (
                      <p className="ff-pick-case__line" style={{ margin:'6px 0 0', fontFamily:'Outfit, Inter, sans-serif', fontSize:13, color:HP.textSoft }}>{runtimeFitLine}</p>
                    )}
                  </div>
                )}

                {synopsis && (
                  <p style={{ marginTop:22, marginBottom:0, fontFamily:'Inter, sans-serif', fontSize:14.5, color:HP.textMuted, lineHeight:1.7, textWrap:'pretty', maxWidth:580, opacity:0, animation:'ff-fade 0.7s ease 0.6s forwards' }}>
                    {synopsis}
                  </p>
                )}

                {(provider || providerStatus === 'empty' || providerStatus === 'error') && (
                  <div style={{ marginTop:18 }}>
                    <StreamingChip provider={provider} status={providerStatus} />
                  </div>
                )}

                {/* Actions — one primary, two secondary, two quiet tertiary. */}
                <div className="ff-pick-actions" role="group" aria-label="Film actions" style={{ marginTop:26 }}>
                  {top.tmdbId ? (
                    <button
                      type="button"
                      className="ff-pick-actions__primary"
                      onClick={handleSeeMore}
                      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'12px 22px', borderRadius:10, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:700, letterSpacing:'0.01em', cursor:'pointer', boxShadow:'0 10px 26px -10px rgba(236,72,153,0.55)' }}
                    >
                      Open Film File &rarr;
                    </button>
                  ) : (
                    <span className="ff-pick-unavailable">Film file unavailable for this title.</span>
                  )}
                  {top.trailerKey && (
                    <button
                      type="button"
                      className="ff-pick-actions__secondary"
                      onClick={() => setTrailerOpen(true)}
                      title="Watch the trailer"
                      style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', borderRadius:10, background:HP.surface, border:`1px solid ${HP.borderStrong}`, color:HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor:'pointer' }}
                    >
                      <Play size={14} fill="currentColor" aria-hidden="true" />
                      <span>Trailer</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="ff-pick-actions__secondary"
                    onClick={handleSaveForLater}
                    disabled={savedState === 'saving' || savedState === 'saved'}
                    aria-busy={savedState === 'saving'}
                    aria-pressed={savedState === 'saved'}
                    style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', borderRadius:10, background: savedState === 'saved' ? `${HP.green}14` : HP.surface, border:`1px solid ${savedState === 'saved' ? HP.green + '66' : HP.borderStrong}`, color: savedState === 'saved' ? HP.green : HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor: (savedState === 'idle' || savedState === 'error') ? 'pointer' : 'default' }}
                  >
                    <Bookmark size={14} fill={savedState === 'saved' ? 'currentColor' : 'none'} strokeWidth={2} aria-hidden="true" />
                    <span>{SAVE_LABEL[savedState]}</span>
                  </button>
                  <button
                    type="button"
                    className="ff-pick-actions__tertiary"
                    onClick={handleMarkWatched}
                    disabled={watchedState === 'saving' || watchedState === 'watched'}
                    aria-busy={watchedState === 'saving'}
                    aria-pressed={watchedState === 'watched'}
                    title="I've already seen this one"
                    style={{ background:'transparent', border:'none', color: watchedState === 'watched' ? HP.green : watchedState === 'error' ? HP.text : HP.textMuted, fontFamily:'Outfit', fontSize:12, fontWeight:500, letterSpacing:'0.01em', cursor: (watchedState === 'saving' || watchedState === 'watched') ? 'default' : 'pointer', padding:'0 8px' }}
                  >
                    {watchedLabel}
                  </button>
                  <button
                    type="button"
                    className="ff-pick-actions__tertiary"
                    onClick={onNotTonight}
                    style={{ background:'transparent', border:'none', color:HP.textMuted, fontFamily:'Outfit', fontSize:12, fontWeight:500, letterSpacing:'0.01em', cursor:'pointer', padding:'0 8px' }}
                  >
                    Not tonight
                  </button>
                </div>
              </div>
            </div>

            {/* Footer — quiet ways back into the flow. */}
            <div className="ff-pick-footer">
              <button onClick={onBack}    style={{ minHeight:44, padding:'9px 14px', borderRadius:8, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:11, fontWeight:500, cursor:'pointer' }}>Adjust tonight</button>
              <button onClick={onRestart} style={{ minHeight:44, padding:'9px 14px', borderRadius:8, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:11, fontWeight:500, cursor:'pointer' }}>Start over</button>
            </div>
          </motion.div>
        </AnimatePresence>

        <TrailerModal open={trailerOpen} youtubeKey={top.trailerKey} title={top.title} onClose={() => setTrailerOpen(false)} />
      </section>
    </>
  );
}
