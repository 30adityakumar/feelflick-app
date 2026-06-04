# F10C — Synthetic Persona Set

> **Phase F10C. Synthetic personas for usability inspection — NOT real users.** These are
> **archetypes** built from *observable product behavior and plausible motivation*. They do
> **not** represent real users of any platform, and imply **no access to any platform's
> proprietary data**. A persona's reaction is a **hypothesis to validate with real testers**
> (Wave 1+), never evidence on its own, and they **do not unblock F8C**.

**Status:** ✅ 16 personas (10 platform archetypes + 6 FeelFlick targets). **Date:** 2026-06-04.
Fields per [persona-schema-f10c.md](persona-schema-f10c.md). Read against the [wedge](../product-doctrine.md).

---

## A. Platform-archetype personas (the competitive mindset they bring)

### P1 — "Diarist" · Letterboxd power user
- **Age/context:** 24–34, urban, deeply online cinephile. **Frequency:** 4–6 films/wk. **Primary:** Letterboxd (+ a streaming app to actually watch). **Secondary:** Mubi, physical media, Twitter/Letterboxd lists.
- **Decision style:** list-driven + identity-driven (logs everything; watchlist is curated). **Genres:** arthouse, world cinema, auteur retrospectives; **avoids:** formula blockbusters. **Tolerance:** old ★★★★★ / foreign ★★★★★ / subtitles ★★★★★ / slow ★★★★★.
- **Social/solo:** mostly solo, social *about* films. **Mood-dependence:** medium (often project/season-driven). **Patience:** high for depth, low for being condescended to.
- **Frustration:** algorithms don't know *taste*, just popularity; no tool *picks* tonight from his own canon. **Switching trigger:** a rec engine that demonstrably reads his actual taste. **Trust requirements:** specific, grounded reasons + no fake authority; respect for deep cuts.
- **Valuable when:** the pick names a real seed he loves and surfaces something he hasn't seen but should. **Abandons if:** picks feel mainstream/popularity-driven, reasons are generic, or it feels like a worse Letterboxd. **First-session success:** one pick that earns a "huh, good call."
- **Likely tasks:** Tonight-pick judgment, Film File depth, DNA honesty, diary/list expectations. **Objections:** "this is just popular stuff," "where's my diary/lists." **Feedback style:** analytical, comparative, blunt.

### P2 — "Spec-checker" · TMDB metadata browser
- **Age/context:** 20–40, data-minded hobbyist/dev. **Frequency:** few/wk. **Primary:** TMDB/IMDb to look things up. **Secondary:** whatever streams it.
- **Decision style:** fact-first (cast, crew, runtime, ratings) then decide. **Genres:** broad; rating/vote-count sensitive. **Tolerance:** old ★★★★ / foreign ★★★ / subtitles ★★★ / slow ★★★.
- **Social/solo:** solo. **Mood-dependence:** low–medium. **Patience:** medium; wants the data to back a claim.
- **Frustration:** has the *data* but no engine that turns it into a *decision for me*. **Switching trigger:** transparent, evidence-backed picks. **Trust requirements:** the "why" must cite something checkable (a seed, a real signal), and numbers must mean what they say.
- **Valuable when:** the match % / "why" reads as honest evidence, not a grade. **Abandons if:** numbers feel arbitrary/inflated or the reason is hand-wavy. **First-session success:** a pick whose reasoning he can verify and agree with.
- **Likely tasks:** Tonight pick + "why" scrutiny, Film File data, match %. **Objections:** "what does this score actually mean?" **Feedback style:** precise, skeptical.

### P3 — "Scroller" · Netflix casual scroller
- **Age/context:** 25–45, busy, tired evenings. **Frequency:** most nights (background + intentional). **Primary:** Netflix. **Secondary:** Prime, Disney+, YouTube.
- **Decision style:** browse-til-tired; often gives up or rewatches. **Genres:** comfort comedies, thrillers, true-crime, popular dramas; **avoids:** subtitles, "homework" films. **Tolerance:** old ★★ / foreign ★ / subtitles ★ / slow ★.
- **Social/solo:** solo or with partner. **Mood-dependence:** high (but unaware of it). **Patience:** low — wants to be watching within minutes.
- **Frustration:** the endless grid + 20 minutes of deciding = decision fatigue. **Switching trigger:** "it just tells me what to watch and I trust it." **Trust requirements:** low overhead; the pick must feel right *fast* and not niche/pretentious.
- **Valuable when:** one good pick removes the scroll. **Abandons if:** onboarding is long, the pick feels random/too arty, or it becomes another grid. **First-session success:** opened FeelFlick, got a pick, watched it — no scrolling.
- **Likely tasks:** first-10-sec clarity, onboarding friction, Tonight pick, anti-scroll. **Objections:** "why do I have to sign in/onboard," "I've never heard of this film." **Feedback style:** terse, gut-reaction.

### P4 — "Where-can-I-watch" · JustWatch availability-first user
- **Age/context:** 28–45, multi-subscription household. **Frequency:** few/wk. **Primary:** JustWatch (then the service that has it). **Secondary:** all the major streamers.
- **Decision style:** availability-first — won't watch what he can't stream tonight. **Genres:** broad mainstream. **Tolerance:** old ★★ / foreign ★★ / subtitles ★★ / slow ★★.
- **Social/solo:** with partner/family. **Mood-dependence:** medium. **Patience:** medium; allergic to dead ends.
- **Frustration:** great rec → can't stream it → wasted. **Switching trigger:** picks that respect where he can actually watch. **Trust requirements:** must answer "where can I watch this?"
- **Valuable when:** the pick is watchable tonight (or clearly tells him where). **Abandons if:** recommends things he can't access and never says so. **First-session success:** a pick he can press play on within his subscriptions.
- **Likely tasks:** Tonight pick + "where can I watch this?", Film File. **Objections:** "ok but is it on anything I have?" **Feedback style:** practical, impatient. **(Note: where-to-watch is a [do-not-become](../product-doctrine.md#do-not-become-list) convenience, not the loop — this persona stress-tests that boundary.)**

### P5 — "Completionist" · Trakt tracker
- **Age/context:** 22–38, systematic. **Frequency:** near-nightly. **Primary:** Trakt (tracking) + streamers. **Secondary:** Letterboxd, spreadsheets.
- **Decision style:** progress/collection-driven; loves stats + history. **Genres:** broad, franchise + prestige. **Tolerance:** old ★★★ / foreign ★★★ / subtitles ★★★ / slow ★★★.
- **Social/solo:** solo. **Mood-dependence:** low–medium. **Patience:** high for tracking, low for things that ignore his history.
- **Frustration:** recs that don't account for what he's already watched. **Switching trigger:** an engine that *uses* his history well. **Trust requirements:** must not re-recommend watched films; must show it learns.
- **Valuable when:** the pick clearly reflects his logged history + never repeats. **Abandons if:** it re-shows watched films or ignores history. **First-session success:** a pick that proves it read his diary.
- **Likely tasks:** Tonight pick, history/diary, DNA, repeated-pick check. **Objections:** "I already saw this," "where's my tracking." **Feedback style:** systematic, detail-oriented.

### P6 — "Curator's-eye" · Apple TV editorial-quality user
- **Age/context:** 30–50, design-literate, pays for quality. **Frequency:** few/wk, intentional. **Primary:** Apple TV+/app. **Secondary:** Mubi, Criterion.
- **Decision style:** quality + craft-led; trusts good editorial. **Genres:** prestige drama, elevated genre, craft-forward. **Tolerance:** old ★★★★ / foreign ★★★★ / subtitles ★★★★ / slow ★★★★.
- **Social/solo:** solo or partner. **Mood-dependence:** medium. **Patience:** medium; intolerant of jank/ugliness.
- **Frustration:** most apps feel cheap/cluttered; recs lack a point of view. **Switching trigger:** Apple-grade craft + a real editorial voice. **Trust requirements:** polish, restraint, a credible "why," no fake hype.
- **Valuable when:** the Film File reads like a sharp, honest editorial case. **Abandons if:** it looks cheap, over-promises, or the case is thin. **First-session success:** "this feels considered."
- **Likely tasks:** first-impression craft, Film File case-making, "why" quality. **Objections:** "the writing feels generic," "this looks unfinished." **Feedback style:** discerning, aesthetic.

### P7 — "Just-put-something-on" · Prime Video mainstream convenience user
- **Age/context:** 30–55, mainstream, low film-identity. **Frequency:** most nights, low-effort. **Primary:** Prime Video. **Secondary:** whatever's bundled.
- **Decision style:** convenience + familiarity; picks known stars/franchises. **Genres:** action, rom-com, popular thrillers; **avoids:** subtitles, "difficult" films. **Tolerance:** old ★★ / foreign ★ / subtitles ★ / slow ★.
- **Social/solo:** family/partner. **Mood-dependence:** low (consciously). **Patience:** low.
- **Frustration:** too many options, none obviously "for tonight." **Switching trigger:** less effort, a safe pick. **Trust requirements:** familiar enough to feel safe; no pretension.
- **Valuable when:** one safe, enjoyable pick with zero effort. **Abandons if:** picks feel niche/arty or onboarding asks too much. **First-session success:** a no-brainer pick they actually enjoy.
- **Likely tasks:** onboarding friction, Tonight pick, anti-scroll. **Objections:** "never heard of it," "too much setup." **Feedback style:** casual, brief.

### P8 — "Library-owner" · Plex collector
- **Age/context:** 30–50, tech-savvy, owns a media library. **Frequency:** few/wk. **Primary:** Plex (own server). **Secondary:** streamers, physical media.
- **Decision style:** collection-led; values ownership + control. **Genres:** broad + deep catalog, cult/obscure. **Tolerance:** old ★★★★ / foreign ★★★ / subtitles ★★★ / slow ★★★.
- **Social/solo:** solo/family. **Mood-dependence:** medium. **Patience:** high for setup, expects control.
- **Frustration:** recs ignore *his* library; cloud-only tools don't fit. **Switching trigger:** something that respects his own collection (or at least doesn't fight it). **Trust requirements:** control + transparency; no lock-in feel.
- **Valuable when:** the pick fits his taste even if library-integration isn't there. **Abandons if:** it assumes he only streams, or feels like a walled garden. **First-session success:** a pick that fits, with controls he understands.
- **Likely tasks:** Tonight pick, Preferences/dials, "does my own library matter?". **Objections:** "does this know my Plex?" **Feedback style:** technical, control-focused. **(Note: personal-library support is out of scope; this persona tests how gracefully FeelFlick says "not yet.")**

### P9 — "Trailer-led" · YouTube/trailer casual chooser
- **Age/context:** 18–30, short-attention, visual. **Frequency:** sporadic, impulse. **Primary:** YouTube (trailers/clips). **Secondary:** whatever's free/handy.
- **Decision style:** trailer/vibe-led; decides in seconds. **Genres:** spectacle, comedy, horror, hype titles. **Tolerance:** old ★ / foreign ★ / subtitles ★ / slow ★.
- **Social/solo:** friends. **Mood-dependence:** high (vibe). **Patience:** very low.
- **Frustration:** nothing looks exciting fast enough. **Switching trigger:** instant, visual, low-commitment. **Trust requirements:** must *look* good immediately; a trailer helps.
- **Valuable when:** a pick that looks exciting in seconds. **Abandons if:** text-heavy, slow, or "boring-looking." **First-session success:** an instant "ooh, that one."
- **Likely tasks:** first-10-sec clarity, Tonight pick visual appeal, Film File trailer. **Objections:** "too much reading," "looks boring." **Feedback style:** impulsive, visual.

### P10 — "Tell-me-what's-good" · Reddit/word-of-mouth seeker
- **Age/context:** 22–40, trusts people over algorithms. **Frequency:** few/wk. **Primary:** Reddit/forums/friends for what to watch. **Secondary:** streamers.
- **Decision style:** social-proof-led; "what do people I trust say is good." **Genres:** broad, hidden-gems hungry. **Tolerance:** old ★★★ / foreign ★★★ / subtitles ★★★ / slow ★★.
- **Social/solo:** solo, socially-informed. **Mood-dependence:** medium. **Patience:** medium.
- **Frustration:** algorithmic recs feel soulless; wants a *reason* a human would give. **Switching trigger:** recs that feel like a trusted friend's, with a real why. **Trust requirements:** an honest, human-sounding reason — and crucially **no fake social proof**.
- **Valuable when:** the "why" feels like a smart friend's case, grounded in *his* taste. **Abandons if:** it fabricates hype/counts/"people like you," or feels generic. **First-session success:** a pick + reason he'd repeat to a friend.
- **Likely tasks:** "why" quality + honesty, Film File case, DNA. **Objections:** "says who?", "this smells like marketing." **Feedback style:** skeptical of hype, values authenticity. **(Tests the no-fake-social-proof rule hard.)**

---

## B. FeelFlick target personas (who the wedge is *for*)

### P11 — "Fried" · Mood-first exhausted scroller  ⭐ core target
- **Age/context:** 28–42, full days, fried by 9pm. **Frequency:** most nights. **Primary:** Netflix/Prime. **Secondary:** YouTube.
- **Decision style:** wants to *not* decide; mood is everything but unnamed. **Genres:** comfort + occasional reach. **Tolerance:** old ★★ / foreign ★★ / subtitles ★★ / slow ★★.
- **Social/solo:** solo or partner. **Mood-dependence:** very high. **Patience:** low for setup, high for something that finally *gets* it.
- **Frustration:** "I have 2 hours and I can't decide, so I scroll and give up." (The [primary user problem](../product-doctrine.md#primary-user-problem).) **Switching trigger:** one trustworthy pick that ends the scroll. **Trust requirements:** the pick must *feel* like it read her mood + the reason must ring true.
- **Valuable when:** mood in → one pick out → watched, no scroll. **Abandons if:** it makes her work, or the pick ignores how she feels. **First-session success:** "it just knew" — watched something good with no fatigue.
- **Likely tasks:** mood signal, Tonight pick fit, anti-scroll, return reason. **Objections:** "I don't want to fill out a survey." **Feedback style:** emotional, relief-or-frustration.

### P12 — "Curious" · Taste-curious but not cinephile  ⭐ core target
- **Age/context:** 25–40, likes good films, no film-school vocabulary. **Frequency:** few/wk. **Primary:** streamers. **Secondary:** friends' recs.
- **Decision style:** open to being guided; wants to discover *her* taste. **Genres:** broad, growth-curious. **Tolerance:** old ★★★ / foreign ★★★ / subtitles ★★★ / slow ★★.
- **Social/solo:** solo/partner. **Mood-dependence:** medium–high. **Patience:** medium.
- **Frustration:** doesn't know what she'd love beyond the obvious. **Switching trigger:** a tool that reflects + expands her taste without condescension. **Trust requirements:** the DNA must feel *true* and the picks must feel personal, not generic.
- **Valuable when:** the Cinematic DNA shows her something real about herself + the pick stretches her *just enough*. **Abandons if:** DNA feels fake/flattering or picks feel random. **First-session success:** "this gets me, and showed me something new."
- **Likely tasks:** onboarding, Tonight pick, DNA honesty, "find another." **Objections:** "is this DNA real or just flattery?" **Feedback style:** curious, reflective.

### P13 — "The Couple" · Deciding what to watch tonight  ⭐ core target
- **Age/context:** two people, 28–45, different tastes, shared sofa. **Frequency:** most nights together. **Primary:** Netflix/Prime. **Secondary:** Disney+.
- **Decision style:** negotiation — the nightly "what do *we* watch" standoff. **Genres:** the overlap of two sets. **Tolerance:** old ★★ / foreign ★★ / subtitles ★★ / slow ★★ (lowest-common-denominator).
- **Social/solo:** always together. **Mood-dependence:** high (joint mood). **Patience:** very low — the negotiation is the pain.
- **Frustration:** 30 minutes of "I don't know, what do you want." **Switching trigger:** something that breaks the standoff with one pick both accept. **Trust requirements:** one pick neither vetoes; a reason both buy.
- **Valuable when:** it ends the negotiation fast with a pick they both accept. **Abandons if:** it only models one person, or restarts the debate. **First-session success:** "it picked, we both said yes, done."
- **Likely tasks:** Tonight pick as a tiebreaker, shared decision-making. **Objections:** "but it doesn't know *both* of us." **Feedback style:** two voices, relief-seeking. **(Note: multi-user is out of scope today — this persona surfaces the gap + whether single-user picks still help a couple.)**

### P14 — "Allergic-to-slop" · Serious film lover who hates algorithmic slop  ⭐ core target
- **Age/context:** 30–50, real taste, burned by recommendation engines. **Frequency:** 3–5/wk. **Primary:** Mubi/Criterion/Letterboxd-informed. **Secondary:** streamers reluctantly.
- **Decision style:** taste-led + quality-gated; deeply distrusts "the algorithm." **Genres:** auteur, world, elevated genre; **avoids:** content-farm filler. **Tolerance:** old ★★★★★ / foreign ★★★★★ / subtitles ★★★★★ / slow ★★★★★.
- **Social/solo:** solo. **Mood-dependence:** medium. **Patience:** high for quality, zero for slop.
- **Frustration:** algorithms push popular mediocrity + dishonest hype. **Switching trigger:** an engine with taste *and* honesty. **Trust requirements:** never mediocre, never fabricated, reasons specific + true, anti-recency respected.
- **Valuable when:** the pick is genuinely good + the case is honest + it isn't recency/popularity-biased. **Abandons instantly if:** one fabricated claim, one mediocre popular pick, or fake social proof. **First-session success:** "it didn't insult me — that pick was real."
- **Likely tasks:** Tonight pick quality, Film File honesty, DNA, "find another" without slop. **Objections:** "this is just the algorithm again," "prove it's not popularity." **Feedback style:** exacting, unforgiving, high-signal. **(The harshest honesty test — the trust moat lives or dies here.)**

### P15 — "Cold-start" · New user with almost no logged history  ⭐ core target
- **Age/context:** 25–45, just arrived, zero history. **Frequency:** TBD. **Primary:** whatever streamer. **Secondary:** —.
- **Decision style:** undefined yet; first impression decides everything. **Genres:** a few seeds from onboarding. **Tolerance:** unknown.
- **Social/solo:** solo. **Mood-dependence:** unknown. **Patience:** low — must see value before committing.
- **Frustration:** new tools usually demand data before giving value. **Switching trigger:** value *before* commitment — a believable pick on night 1. **Trust requirements:** must be honest that it barely knows her yet (no fake confidence) while still giving a plausible pick.
- **Valuable when:** onboarding is short and the first pick is believable despite thin data. **Abandons if:** it fakes confidence/DNA it can't have, or the cold pick is random. **First-session success:** a believable first pick + honest "I'm still learning you."
- **Likely tasks:** onboarding, first Tonight pick, DNA cold-state honesty. **Objections:** "how can it know me already? (it shouldn't pretend to)." **Feedback style:** wary, first-impression-driven. **(Tests the cold→warm trust jump — the hardest moment, F7's honesty work.)**

### P16 — "Warmed-up" · Returning user with enough history for Cinematic DNA  ⭐ core target
- **Age/context:** 25–45, ~20–50 films logged over weeks. **Frequency:** nightly ritual forming. **Primary:** FeelFlick (aspirationally). **Secondary:** streamers to watch.
- **Decision style:** trusts the ritual if it keeps earning it. **Genres:** a now-legible taste shape. **Tolerance:** per her real DNA.
- **Social/solo:** solo. **Mood-dependence:** high (mood × deep taste). **Patience:** medium; expects the payoff of having "fed" it.
- **Frustration:** would be betrayed by déjà-vu picks or a DNA that feels off. **Switching trigger:** already in — stays only if it keeps compounding. **Trust requirements:** picks must visibly use her depth; DNA must be accurate; no repeats.
- **Valuable when:** the pick feels *made for her* + the DNA reads true + tonight ≠ yesterday. **Abandons if:** repeated picks, stale DNA, or it stops feeling personal. **First-session success:** "this is the best it's been — it knows me now."
- **Likely tasks:** Tonight pick depth, DNA accuracy, repeated-pick fatigue, return loop. **Objections:** "I've seen this pick before," "my DNA feels stale." **Feedback style:** invested, expects compounding value. **(The payoff persona — proves the loop compounds.)**

---

## Coverage map (which wedge clause + do-not-become risk each stresses)

| Persona | Wedge clause most tested | Do-not-become risk stressed |
|---|---|---|
| P1 Letterboxd | taste-deep | not-a-Letterboxd-clone |
| P2 TMDB | makes-its-case (evidence) | not-a-TMDB-wrapper |
| P3 Netflix | anti-scroll | not-a-Netflix-grid |
| P4 JustWatch | single-pick (actionable) | not-a-JustWatch-replacement |
| P5 Trakt | taste-deep (history) | not-a-generic-tracker |
| P6 Apple TV | makes-its-case (craft) | craft benchmark (borrow) |
| P7 Prime | anti-scroll (low effort) | not-a-grid |
| P8 Plex | taste-deep | not-a-tracker / scope honesty |
| P9 YouTube | mood-first (vibe) | anti-scroll (visual) |
| P10 Reddit | makes-its-case (honesty) | no-fake-social-proof |
| P11 Fried | mood-first + anti-scroll | the core problem |
| P12 Curious | taste-deep (DNA) | personalization honesty |
| P13 Couple | single-pick (tiebreak) | scope: multi-user gap |
| P14 Anti-slop | all four (honesty) | every anti-drift tell |
| P15 Cold-start | taste-deep (cold honesty) | no-fabrication |
| P16 Warmed-up | taste-deep (compounding) | repeated-pick / DNA honesty |
