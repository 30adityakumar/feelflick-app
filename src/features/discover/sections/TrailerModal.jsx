import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// ── YouTube IFrame Player API — singleton loader ────────────────────────────
// Loads https://www.youtube.com/iframe_api once (idempotent). The API
// requires a global `onYouTubeIframeAPIReady` callback that fires after the
// script finishes; we wrap it in a memoized Promise so multiple TrailerModal
// mounts share the same load. Returns a Promise that resolves to window.YT.
let _ytApiPromise = null;
function loadYouTubeApi() {
  if (_ytApiPromise) return _ytApiPromise;
  _ytApiPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const existing = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof existing === 'function') existing();
      resolve(window.YT);
    };
    if (!document.querySelector('script[data-yt-iframe-api]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.dataset.ytIframeApi = '1';
      document.head.appendChild(tag);
    }
  });
  return _ytApiPromise;
}

// ── Inline trailer modal (YouTube IFrame Player) ────────────────────────────
// Uses the official IFrame Player API (not a raw <iframe>) so we can listen
// for the ENDED state and auto-close. That keeps the user on /discover after
// the trailer instead of staring at YouTube's end-card with related-video
// thumbnails (a brand leak). Click-on-overlay also closes — common modal
// pattern users expect alongside Esc + the explicit X button.
export default function TrailerModal({ open, youtubeKey, title, onClose }) {
  const closeBtnRef = useRef(null);
  const playerRef = useRef(null);
  const playerSlotRef = useRef(null);
  const dialogRef = useRef(null);
  // Element focused before the dialog opened, so we can restore focus on close.
  const openerRef = useRef(null);
  // Latest onClose held in a ref so the player effect's deps stay stable —
  // otherwise the parent's inline `() => setTrailerOpen(false)` would
  // re-create the player on every parent re-render.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Body scroll lock + Escape + Tab containment + initial/return focus
  useEffect(() => {
    if (!open) return;
    // Remember the opener so focus can return to it on close (e.g. the Trailer
    // button). Guarded on restore in case it was unmounted while the modal was open.
    openerRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current?.(); return; }
      if (e.key !== 'Tab') return;
      // Focus trap — keep Tab / Shift+Tab inside the dialog.
      const root = dialogRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll(
        'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) { e.preventDefault(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) { e.preventDefault(); last.focus(); }
      } else if (active === last || !root.contains(active)) {
        e.preventDefault(); first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      const opener = openerRef.current;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [open]);

  // Mount the YouTube player + listen for ENDED
  useEffect(() => {
    if (!open || !youtubeKey) return;
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !YT || !playerSlotRef.current) return;
      // new YT.Player replaces the slot div with an iframe sized to the
      // parent (which is our 16/9 wrapper).
      playerRef.current = new YT.Player(playerSlotRef.current, {
        videoId: youtubeKey,
        playerVars: {
          autoplay: 1,
          rel: 0,            // limit related videos to same channel
          modestbranding: 1, // smaller YouTube logo
          playsinline: 1,    // iOS inline play (no fullscreen takeover)
        },
        events: {
          onStateChange: (e) => {
            // YT.PlayerState.ENDED === 0. Hardcoded to avoid an extra
            // import; the constant is stable in the YouTube API.
            if (e.data === 0) onCloseRef.current?.();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
      }
      playerRef.current = null;
    };
  }, [open, youtubeKey]);

  if (!open || !youtubeKey) return null;

  // Overlay click → close (only when target is the overlay itself, not the
  // inner iframe wrapper — stopPropagation on the wrapper prevents clicks
  // inside the player from triggering close).
  const onOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  // Portal to <body> so the modal escapes any parent stacking context.
  // AppShell's main container creates a z:10 stacking context which would
  // otherwise trap the modal beneath the z:50 fixed header — the close X
  // was rendering but hidden behind the header bar. Portaling to body lifts
  // the modal to the root stacking layer where z:300 actually means z:300.
  return createPortal(
    // Overlay click → close is a standard modal-dismiss pattern. Keyboard
    // equivalent is the Escape key (handled in the effect above) + the
    // explicit X close button (auto-focused on mount). The two a11y rules
    // disabled here flag the click-on-overlay convention; suppress for
    // this single modal — the dialog role + Escape handler cover the
    // accessibility intent.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      ref={dialogRef}
      role="dialog" aria-modal="true" aria-label={`${title} trailer`}
      onClick={onOverlayClick}
      style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', cursor:'pointer' }}
    >
      {/* Close X — bumped to opaque dark-glass so it reads against any
         video frame (the older near-transparent treatment vanished
         against bright content). Solid black background + brighter
         white outline + slightly larger touch target. */}
      <button
        ref={closeBtnRef}
        type="button"
        onClick={onClose}
        aria-label="Close trailer"
        className="ff-trailer-close"
        style={{ position:'absolute', top:20, right:20, width:44, height:44, borderRadius:999, background:'rgba(0,0,0,0.75)', border:'1px solid rgba(255,255,255,0.28)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', transition:'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease' }}
      >
        <X size={22} strokeWidth={2.2} />
      </button>
      {/* Esc-to-close hint — fades in for ~3s then out. Surfaces the
         keyboard shortcut once on open (common in fullscreen video
         players like YouTube + Netflix) without lingering. Pure
         decoration once dismissed; sub-100ms CPU cost. */}
      <div
        aria-hidden="true"
        style={{ position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:2, fontSize:11, fontFamily:'Outfit', fontWeight:500, color:'rgba(255,255,255,0.6)', letterSpacing:'0.06em', opacity:0, animation:'ff-titlecard 3.6s ease forwards', pointerEvents:'none', whiteSpace:'nowrap' }}
      >
        Press <span style={{ padding:'1px 6px', borderRadius:4, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.22)', fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:10, marginLeft:4, marginRight:4, color:'#fff' }}>Esc</span> to close
      </div>
      {/* stopPropagation prevents overlay close when clicking inside the
         iframe area. Pure click-intercept, no keyboard action expected. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position:'relative', width:'100%', maxWidth:1080, aspectRatio:'16/9', borderRadius:8, overflow:'hidden', boxShadow:'0 24px 60px -16px rgba(0,0,0,0.8)', cursor:'default' }}
      >
        {/* Slot div — YT.Player replaces this with the actual iframe.
           Sized to fill the 16/9 wrapper above. */}
        <div ref={playerSlotRef} style={{ width:'100%', height:'100%' }} />
      </div>
    </div>,
    document.body
  );
}
