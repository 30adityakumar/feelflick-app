import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, SkipForward, Check, Bookmark } from 'lucide-react'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { logSurfaceImpressions } from '@/shared/services/recommendations'
import { HP_GRAD } from '@/shared/lib/tokens'
import { constellationName, buildBecauseLine } from '../derive'
import { HP } from '../constants'
import { moodFilter } from '../resultPresentation'
import { useCountUp } from '../hooks/useCountUp'
import { useStreamingProvider } from '../hooks/useStreamingProvider'
import { useDiscoverResultActions } from '../hooks/useDiscoverResultActions'
import AlternateCard from './AlternateCard'
import TrailerModal from './TrailerModal'
import StreamingChip from './StreamingChip'

// buildWhyNow removed: the "Why now" box that explained the engine's
// reasoning per intention/mood was one of 4 reason-boxes contributing to
// the OCD/dyslexia clutter. The single "Why this one" proof line above the
// action buttons now carries the reasoning, drawn from real engine signals.

// buildPickProof removed: the multi-signal proof block (director hit, twin
// rating, mood-axis fit, runtime fit, fallback) read as too much text
// alongside the synopsis. Personalisation now lives in the visual signals
// (match ring, mood chips, streaming chip, trailer button). If we bring
// signal-language back later, the helper template is in git history.

// MoodArc removed: the small SVG emotional-arc chart was one of 4 reason
// surfaces contributing to the decision-page clutter. Lives on /movie/:id
// (the Film File) for users who want the deep film-shape read.

// ── Stage 3 — Pick swiper (top pick + 2 alternates) ──
export default function StagePick({ selected, who, energy, intention, results, profile, sessionShownIds, onRestart, onBack, blendHex, audioToggle }) {
  // Session-only "hidden" set — when the user skips or marks watched, that
  // film's id lands here and the visible picks filter it out. The next-best
  // queued pick auto-advances into the top slot. Resets only when `results`
  // changes (user tweaked inputs or started over). Pool depth is set by
  // MAX_PICKS below — deep enough to feel like a real swipe deck without
  // dropping into low-confidence territory.
  const [hiddenTopIds, setHiddenTopIds] = useState(() => new Set());
  // User can also manually pin one of the picks via the alternate cards
  // ("pick from these" intent). null = use default (first non-hidden).
  // Cleared on skip/watched so default takes over after dismissal.
  const [selectedTopId, setSelectedTopId] = useState(null);
  useEffect(() => { setHiddenTopIds(new Set()); setSelectedTopId(null); }, [results]);

  // Pool of 15 picks — enough that the user can keep skipping without
  // hitting exhausted prematurely, but capped before the engine starts
  // returning weaker matches. 15 is a deep-enough swipe deck without
  // becoming a feed.
  const MAX_PICKS = 15;
  // How many alternate cards to render below the focused top pick. The
  // rest are "queued" — they auto-promote when the user skips/watches.
  // 2 visible cards keeps the row scannable; deeper queue surfaces via
  // the count in the section kicker.
  const ALTERNATES_VISIBLE = 2;

  const initialPicks = useMemo(() => results.slice(0, MAX_PICKS), [results]);
  const visibleResults = useMemo(
    () => initialPicks.filter(r => !hiddenTopIds.has(r.id)),
    [initialPicks, hiddenTopIds]
  );
  const top = useMemo(() => {
    if (selectedTopId) {
      const pinned = visibleResults.find(r => r.id === selectedTopId);
      if (pinned) return pinned;
    }
    return visibleResults[0];
  }, [selectedTopId, visibleResults]);
  // Visible alternates (rendered as cards) vs total remaining in the
  // queue (rendered as a count in the kicker). When the user skips, the
  // queue shrinks and the first queued film slides into the alternate
  // slot. After all 15 are exhausted, falls through to the exhausted state.
  const remainingAfterTop = useMemo(
    () => visibleResults.filter(r => r.id !== top?.id),
    [visibleResults, top]
  );
  const alternates = useMemo(
    () => remainingAfterTop.slice(0, ALTERNATES_VISIBLE),
    [remainingAfterTop]
  );
  const queuedCount = Math.max(0, remainingAfterTop.length - alternates.length);
  const exhausted = !top;

  const cName = constellationName(selected);
  // Mood fit % — answers "how well does this film match what I asked for
  // tonight?". Mean of the user's selected mood-axis fits against the
  // film's fit vector, clamped 0-99. This is the headline ring number
  // because the user JUST answered the mood question — the result page
  // should reflect that answer. The taste % (top.match — calibrated
  // baseScore via computeMatchPercent) is demoted to a meta-row chip,
  // honoring both signals: "tonight" (mood-fit) and "you" (taste).
  const moodFit = useMemo(() => {
    if (!top?.fit || !selected || selected.length === 0) return null;
    const sum = selected.reduce((a, id) => a + (top.fit[id] || 0), 0);
    return Math.max(0, Math.min(99, Math.round((sum / selected.length) * 100)));
  }, [top, selected]);
  const matchAnim = useCountUp(moodFit ?? top?.match ?? 0, 1400, 250);
  const [trailerOpen, setTrailerOpen] = useState(false);
  // Session-shown tracking — add every film that appears as top OR alt to
  // the parent's sessionShownIds ref. diversifyTop3 reads this ref on
  // each allResults recomputation (i.e., whenever user changes inputs)
  // and demotes seen films so the next scenario surfaces fresh picks.
  // Mutating a ref doesn't re-render — intentional; we only want the
  // penalty applied on the NEXT input change, not within the current view.
  useEffect(() => {
    if (!sessionShownIds?.current) return;
    if (top?.id) sessionShownIds.current.add(top.id);
    for (const alt of (visibleResults || [])) {
      if (alt?.id) sessionShownIds.current.add(alt.id);
    }
  }, [top?.id, visibleResults, sessionShownIds]);
  const [mx, setMx] = useState(0); const [my, setMy] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuthSession();
  // Streaming provider (top 1 — flatrate first, then rent/buy). Hides cleanly
  // when TMDB has nothing for this title.
  const provider = useStreamingProvider(top?.tmdbId);
  // "Because…" line — one signal that proves the engine knows the user.
  // Recomputes whenever the top changes (manual pin or auto-advance).
  const becauseLine = useMemo(
    () => buildBecauseLine({ film: top, profile, selected }),
    [top, profile, selected]
  );
  // Mood/tone chips: genre + the 2 strongest mood/tone tags. Tells the user
  // what KIND of film this is at a glance, complementing the proof line
  // (which says why it fits THEM). Capitalize + replace underscores so DB
  // tags like "slow_burn" read as "Slow burn".
  const chips = useMemo(() => {
    if (!top) return [];
    const out = [];
    if (top.genre && top.genre !== 'Drama') out.push(top.genre); // skip plain "Drama" as too generic
    else if (top.genre) out.push(top.genre);
    const tags = [...(top._raw?.mood_tags || []), ...(top._raw?.tone_tags || [])]
      .filter(Boolean)
      .slice(0, 2)
      .map(t => String(t).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    return [...out, ...tags].slice(0, 3);
  }, [top]);
  useEffect(() => {
    const fn = (e) => { const cx = window.innerWidth/2, cy = window.innerHeight/2; setMx((e.clientX - cx)/cx); setMy((e.clientY - cy)/cy); };
    window.addEventListener('mousemove', fn); return () => window.removeEventListener('mousemove', fn);
  }, []);

  const { savedState, watchedState, handleSeeMore, handleSaveForLater, handleMarkWatched, handleSkip } = useDiscoverResultActions({ top, user, selected, intention, energy, who, setHiddenTopIds, setSelectedTopId, navigate });

  // Click an alternate card to promote it to top. AnimatePresence
  // crossfades the spread; the alternate that was promoted swaps places
  // with whatever was currently top. No-op if clicked the current top.
  const handlePickAlternate = (altId) => {
    if (!altId || altId === top?.id) return;
    setSelectedTopId(altId);
  };

  // Stage 3 impression log — fires per current top pick. The page now
  // behaves as a 3-pick swiper (skip → alt #1 becomes top → alt #2 becomes
  // top → exhausted), so each new top deserves its own impression row
  // under placement='discover'. Alternates are not logged as separate
  // impressions until they're promoted to top — they're queued, not yet
  // seen as a "pick" by the user. Per-day-deduped by the table's unique
  // key, so re-visits don't inflate counts.
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
    // top.id pins the impression — when the swiper auto-advances we log
    // the new top as its own row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, topId])

  const filter = moodFilter(selected[0]);

  // Exhausted state — user skipped/watched all 3 initial picks. Editorial
  // dead-end with two doors: tweak inputs (revisit Stage 2 — same
  // constellation, different night-shape answers) or start over (back to
  // Stage 0 — fresh moods). Matches the design language with eyebrow +
  // italic accent + brand-gradient primary action. No new picks magic-
  // refilled here; that would feel like infinite scroll, which the OCD/
  // dyslexia cleanup is explicitly against.
  if (exhausted) {
    return (
      <section className="ff-discover-section" style={{ position:'relative', minHeight:'70vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px', textAlign:'center', animation:'ff-fade 0.5s ease' }}>
        {audioToggle}
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:blendHex, marginBottom:18, fontFamily:'Outfit', display:'inline-flex', alignItems:'center', gap:10 }}>
          <span style={{ height:1, width:22, background:blendHex, opacity:0.6 }} />
          End of edition
        </div>
        <h2 style={{ fontFamily:'Outfit', fontSize:'clamp(36px, 5vw, 62px)', lineHeight:1.02, fontWeight:200, letterSpacing:'-0.04em', color:HP.text, margin:0, maxWidth:760, textWrap:'balance' }}>
          That&rsquo;s <em style={{ fontStyle:'italic', fontWeight:300, color:HP.textSoft }}>everything</em> for tonight.
        </h2>
        <p style={{ marginTop:18, fontFamily:'Outfit, Inter, sans-serif', fontSize:14, color:HP.textMuted, fontStyle:'italic', maxWidth:480, lineHeight:1.6 }}>
          Tweak what you told me &mdash; or start fresh. New picks are seconds away.
        </p>
        <div style={{ marginTop:32, display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
          <button onClick={onBack} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'12px 22px', borderRadius:10, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:700, letterSpacing:'0.01em', cursor:'pointer', boxShadow:'0 10px 26px -10px rgba(236,72,153,0.55)' }}>&larr; Tweak inputs</button>
          <button onClick={onRestart} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'12px 18px', borderRadius:10, background:HP.surface, border:`1px solid ${HP.borderStrong}`, color:HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor:'pointer' }}>Start over</button>
        </div>
      </section>
    );
  }

  // Synopsis — TMDB's real overview. Gracefully degrades: if the film row
  // has no overview (rare; some films missing it, or fallback set), we hide
  // the article paragraph entirely rather than fall back to the older
  // templated ffTake prose, which was the same wording for every film with
  // only the director swapped (read as curator voice but was a Mad Lib).
  const synopsis = top.overview && top.overview.trim().length > 20 ? top.overview.trim() : null;

  // Title words for typesetting
  const titleWords = top.title.split(' ');

  return (
    <section className="ff-discover-section" style={{ position:'relative', animation:'ff-fade 0.7s ease' }}>
      {audioToggle}
      {/* Film grain + vignette overlays */}
      <div aria-hidden style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2, opacity:0.045, mixBlendMode:'overlay', backgroundImage:'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22220%22 height=%22220%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")', animation:'ff-grain 1.6s steps(6) infinite' }} />
      <div aria-hidden style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2, background:'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)' }} />
      {/* No mast banner — the user is already on /discover; the brand
         chrome ("FeelFlick · The Discover Edition") + curator note
         ("Tonight's film, for your constellation X") were two rows of
         magazine theater that added cognitive load before the decision.
         The constellation name still pays off in /movie/:tmdbId if the
         user wants to read deep. */}

      {/* Spread — two columns on desktop, single linear flow on mobile.
         Wrapped in AnimatePresence keyed on top.id so that when the user
         skips or marks Watched it, the current pick fades out and the
         next pick fades in. Without this the swap was a jarring snap —
         posters changed mid-page with no continuity. mode="wait" keeps
         the layout stable (next pick doesn't mount until current finishes
         exiting), and 180ms duration keeps total swap snappy (~360ms). */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={top.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
      <div className="ff-stage3-spread">
        {/* LEFT PAGE — poster + match ring only. The film strip ribbon,
           pairing notes, and IN THIS ISSUE TOC sidebar all gone — pure
           magazine chrome with no decision payload. The spine gutter is
           also gone (it framed a 2-page magazine; without the surrounding
           chrome it now just marks an arbitrary divide). */}
        <div className="ff-stage3-spread__left" style={{ position:'relative', transform:`translate(${mx*-6}px, ${my*-4}px)`, transition:'transform 0.4s cubic-bezier(.2,.7,.2,1)' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:-14, borderRadius:14, background:`radial-gradient(ellipse at center, ${blendHex}55, transparent 70%)`, filter:'blur(30px)', animation: filter.halo ? 'ff-bloom-pulse-strong 4s ease-in-out infinite' : 'ff-bloom-pulse 4s ease-in-out infinite' }} />
            <div style={{ position:'relative', overflow:'hidden', borderRadius:8, boxShadow:`0 30px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px ${blendHex}33` }}>
              <img src={top.poster} alt={top.title} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block', filter: filter.cardFilter || 'none', animation: filter.kenBurns ? 'ff-kenburns 14s ease-in-out infinite alternate' : 'ff-poster-in 1s cubic-bezier(.2,.7,.2,1)' }} />
              {filter.overlay && <div style={{ position:'absolute', inset:0, background:filter.overlay, pointerEvents:'none', mixBlendMode:'overlay' }} />}
            </div>
            {/* Match ring */}
            <div style={{ position:'absolute', right:-22, bottom:-22, width:104, height:104, borderRadius:999, background:`conic-gradient(${blendHex} ${matchAnim*3.6}deg, rgba(255,255,255,0.07) 0)`, display:'flex', alignItems:'center', justifyContent:'center', padding:5, boxShadow:`0 0 32px ${blendHex}66` }}>
              <div style={{ width:'100%', height:'100%', borderRadius:999, background:HP.bgDeep, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontFamily:'Outfit', fontSize:26, fontWeight:300, color:HP.text, letterSpacing:'-0.04em', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{matchAnim}<span style={{ fontSize:11, color:HP.textMuted }}>%</span></div>
                <div style={{ fontSize:7, color:HP.textMuted, letterSpacing:'0.2em', textTransform:'uppercase', fontFamily:'Outfit', marginTop:2 }}>Mood fit</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PAGE */}
        <div className="ff-stage3-spread__right" style={{ transform:`translate(${mx*-3}px, ${my*-2}px)`, transition:'transform 0.4s cubic-bezier(.2,.7,.2,1)' }}>
          {/* Because-line — the one signal that proves the engine knows
             the user. Tinted to the mood-blend hex so it reads as part
             of the user's constellation, not engine chrome. Hides when
             no honest signal exists (cold-start with no mood) rather
             than printing filler. */}
          {becauseLine && (
            <div style={{ marginBottom:14, fontFamily:'Outfit, Inter, sans-serif', fontSize:13, fontStyle:'italic', fontWeight:400, color:blendHex, letterSpacing:'0.01em', textWrap:'balance', opacity:0, animation:'ff-fade 0.5s ease 0.15s forwards' }}>
              {becauseLine}
            </div>
          )}
          {/* Title (no kicker, no byline — the page IS the pick, no need to
             pre-announce it). Word-by-word reveal animation kept; it's pure
             motion, not content load. */}
          <h1 style={{ fontFamily:'Outfit', fontSize:'clamp(44px, 5.6vw, 76px)', lineHeight:0.96, fontWeight:300, letterSpacing:'-0.045em', color:HP.text, margin:0, textWrap:'balance' }}>
            {titleWords.map((w, i) => <span key={i} style={{ display:'inline-block', opacity:0, animation:`ff-word-in 0.55s cubic-bezier(.2,.7,.2,1) ${0.2 + i*0.08}s forwards`, marginRight:'0.2em' }}>{w}</span>)}
          </h1>

          {/* Meta — director · year · runtime · taste %. The taste % was
             demoted from the headline ring (which now shows mood-fit, the
             number that actually answers what the user just asked) into
             this quiet meta row. Both signals stay visible: "tonight"
             (mood-fit, big) and "you" (taste, small). textFaint colour
             keeps it from competing with the director name. */}
          <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', fontFamily:'Outfit', fontSize:13, color:HP.textMuted, letterSpacing:'0.04em', opacity:0, animation:'ff-fade 0.6s ease 0.7s forwards' }}>
            <span>{top.dir}</span>
            <span style={{ color:HP.textFaint }}>·</span>
            <span>{top.year}</span>
            <span style={{ color:HP.textFaint }}>·</span>
            <span>{top.runtime} min</span>
            {Number.isFinite(top.match) && (
              <>
                <span style={{ color:HP.textFaint }}>·</span>
                <span style={{ color:HP.textFaint }} title="How well this film fits your stable taste profile">{top.match}% taste</span>
              </>
            )}
          </div>

          {/* Mood/tone chips — what KIND of film this is at a glance.
             3 chips max: primary genre + 2 strongest mood/tone tags.
             Complements the italic proof line below (which says why it
             fits the USER) by saying what it IS. No background — borders
             only, so visually quieter than the action buttons. */}
          {chips.length > 0 && (
            <div style={{ marginTop:14, display:'flex', flexWrap:'wrap', gap:7, opacity:0, animation:'ff-fade 0.6s ease 0.8s forwards' }}>
              {chips.map((c, i) => (
                <span key={`${c}-${i}`} style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:999, border:`1px solid ${HP.border}`, fontFamily:'Outfit', fontSize:11, fontWeight:500, color:HP.textSoft, letterSpacing:'0.02em' }}>
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* No FOR YOU prose block — the proof lines (mood-axis hit,
             runtime fit, fallback) read as "a lot to read" alongside the
             synopsis. The match ring (calibrated %) + mood chips + trailer
             button already convey personalisation visually. Deeper signal
             readout lives on /movie/:tmdbId for users who want it. */}

          {/* Synopsis — real TMDB overview, plain paragraph, no drop-cap.
             Demoted below the FOR YOU block because it's generic info every
             recommender has; the personal proof above is what makes this
             feel like FeelFlick. Drop-cap was cut earlier (fragments
             reading for dyslexic users). Max-width 580 caps line length
             for readability. Hides when no overview exists. */}
          {synopsis && (
            <p style={{ marginTop:22, marginBottom:0, fontFamily:'Inter, sans-serif', fontSize:14.5, color:HP.textMuted, lineHeight:1.7, textWrap:'pretty', maxWidth:580, opacity:0, animation:'ff-fade 0.7s ease 1.2s forwards' }}>
              {synopsis}
            </p>
          )}

          {/* Streaming provider — one chip with logo + "Streaming on Netflix"
             style label. Renders only when TMDB has a provider for this
             title. Tells the user in one glance whether the recommendation
             is even reachable tonight, removing a click of friction at the
             most decision-critical moment. Detailed provider list (Stream
             / Rent / Buy categories) lives on /movie/:tmdbId. */}
          {provider && (
            <div style={{ marginTop:18, opacity:0, animation:'ff-fade 0.7s ease 1.3s forwards' }}>
              <StreamingChip provider={provider} />
            </div>
          )}

          {/* Action buttons. Primary = gradient "See More" → /movie/:tmdbId
             (deep film page; "Watch now" used to lie because the button
             didn't play the film). Secondary row: Trailer (when YouTube
             key exists), Save, Mark Watched, Skip for tonight. Save +
             Mark Watched both flip to a confirmed state ("Saved" /
             "Watched"); Mark Watched + Skip both auto-advance the swiper
             (positive history write vs. negative dismiss signal). Style:
             rounded-rectangle pills (12px radius) with icons on the left,
             dark surface fill, bolder typography — same shape language as
             the briefing action bar. */}
          <div className="ff-stage3-actions" style={{ opacity:0, animation:'ff-fade 0.7s ease 1.4s forwards' }}>
            <button
              type="button"
              onClick={handleSeeMore}
              style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'12px 22px', borderRadius:10, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:700, letterSpacing:'0.01em', cursor:'pointer', boxShadow:'0 10px 26px -10px rgba(236,72,153,0.55)' }}
            >
              See More &rarr;
            </button>
            {top.trailerKey && (
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                title="Watch the trailer"
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', borderRadius:10, background:HP.surface, border:`1px solid ${HP.borderStrong}`, color:HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor:'pointer' }}
              >
                <Play size={14} fill="currentColor" />
                <span>Trailer</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleMarkWatched}
              disabled={watchedState === 'watched'}
              title="I've already seen this one"
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', borderRadius:10, background: watchedState === 'watched' ? `${HP.green}14` : HP.surface, border:`1px solid ${watchedState === 'watched' ? HP.green + '66' : HP.borderStrong}`, color: watchedState === 'watched' ? HP.green : HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor: watchedState === 'idle' ? 'pointer' : 'default' }}
            >
              <Check size={14} strokeWidth={2.5} />
              <span>{watchedState === 'watched' ? 'Watched' : 'Mark Watched'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveForLater}
              disabled={savedState === 'saving' || savedState === 'saved'}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', borderRadius:10, background: savedState === 'saved' ? `${HP.green}14` : HP.surface, border:`1px solid ${savedState === 'saved' ? HP.green + '66' : HP.borderStrong}`, color: savedState === 'saved' ? HP.green : HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor: savedState === 'idle' ? 'pointer' : 'default' }}
            >
              <Bookmark size={14} fill={savedState === 'saved' ? 'currentColor' : 'none'} strokeWidth={2} />
              <span>
                {savedState === 'idle' && 'Save'}
                {savedState === 'saving' && 'Saving…'}
                {savedState === 'saved' && 'Saved'}
                {savedState === 'error' && 'Try again'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleSkip}
              title="Skip — not tonight"
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', borderRadius:10, background:HP.surface, border:`1px solid ${HP.border}`, color:HP.textSoft, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor:'pointer' }}
            >
              <SkipForward size={14} />
              <span>Skip for tonight</span>
            </button>
          </div>
          {/* No depth zone — the match ring + mood chips + streaming chip
             carry the reasoning visually. The deeper magazine treatment
             (diary callback, why-now, emotional arc, taste twin) was 4
             boxes of competing chrome — OCD-hostile and dyslexia-hostile.
             Users who want a deep read on the film have /movie/:tmdbId
             waiting (linked from the See More button). */}
        </div>
      </div>

      {/* Alternates row — two smaller cards for the other 2 picks from
         this batch. Click to promote to top (crossfade swap). Each card
         carries its own because-line so the user can see WHY each is
         on the table. No match %, no action buttons — those belong only
         to the focused top pick. Hides when no alternates are visible
         (after skip/watched bring the count down to 1). */}
      {alternates.length > 0 && (
        <div style={{ marginTop:48, maxWidth:1080, marginLeft:'auto', marginRight:'auto', padding:'0 24px' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.textMuted, marginBottom:16, fontFamily:'Outfit', display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background:HP.textMuted, opacity:0.5 }} />
            <span>Or pick from these</span>
            {queuedCount > 0 && (
              <span style={{ color:HP.textFaint, letterSpacing:'0.18em' }} title={`${queuedCount} more films queued — skip or mark watched to see them`}>
                &middot; {queuedCount} more queued
              </span>
            )}
          </div>
          <div className="ff-stage3-alternates">
            {alternates.map(alt => (
              <AlternateCard
                key={alt.id}
                film={alt}
                profile={profile}
                selected={selected}
                onPick={() => handlePickAlternate(alt.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer — Tweak inputs / Start over, the two ways back into the
         flow without committing to the current pick. Quiet pills, not
         primary buttons — the action gravity belongs on the spread above. */}
      <div style={{ marginTop:56, paddingTop:24, borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'center', gap:10, maxWidth:1080, margin:'56px auto 0' }}>
        <button onClick={onBack}    style={{ padding:'9px 14px', borderRadius:8, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:11, fontWeight:500, cursor:'pointer' }}>← Tweak inputs</button>
        <button onClick={onRestart} style={{ padding:'9px 14px', borderRadius:8, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:11, fontWeight:500, cursor:'pointer' }}>Start over</button>
      </div>
        </motion.div>
      </AnimatePresence>

      <TrailerModal open={trailerOpen} youtubeKey={top.trailerKey} title={top.title} onClose={() => setTrailerOpen(false)} />
    </section>
  );
}
