# F10D — Full Synthetic Persona Findings (16 personas)

> **SYNTHETIC simulation — NOT real-user validation.** All 16 personas from
> [synthetic-personas-f10c.md](synthetic-personas-f10c.md) run the full journey. Reactions
> are **simulated hypotheses** grounded in **browser-observed** landing copy + **code-grounded**
> authenticated surfaces; the *actual served pick* is **NOT OBSERVED** (needs a real account).
> Per the [protocol](full-synthetic-simulation-protocol-f10d.md). **Does not unblock F8C.**
> Scores: **Trust / Return 1–5 (5 best); Friction 1–5 (1 = smooth, 5 = heavy).**

**Status:** ✅ 16/16 simulated. **Date:** 2026-06-04. **Engine:** frozen `2.17`.

**Observed product facts used throughout** (so nothing is invented):
landing "Films that know you." · "You spent 23 minutes picking. You watched thirty." · "Not three
options. One pick, with the article that makes its case." · the "M." engine voice · "$0 · One price.
No tiers." · Google sign-in · **onboarding = 4 steps** (genres, mood, movies, rating) — *richer than
the landing's "three short questions" line* · Briefing single pick + **WhyThisPick null-safe** (no
"why" when cold) · Film File **PrimaryCaseCard** ("FeelFlick's read", match "how it fits your taste so
far") + **ViewerNotes** ("not real reviews or quotes from real critics") · **DnaConfidence** ("taste
evidence… not a score of you"; tiers "Still learning / Getting sharper / Reading you well") · **Discover**
mood→"pick between three" (complementary small set) · **`/home` tail carousels** ("Pick up where you
paused.", "What your twins are watching.", "Your taste, taking shape.") · Queue/Diary with light stats ·
**gaps:** no where-to-watch, no library, no Letterboxd/Trakt import, no diary home-base, no multi-user.

---

## A. Platform-archetype personas

### P1 — Letterboxd power user · Trust 3 · Return 4 · Friction 3
- **Habit:** logs everything on Letterboxd; lists-driven. **Expected:** an engine that reads his real, deep taste.
- **Journey:** landing "the article that makes its case" + "M. reads your taste" intrigues him; sign-in fine but **wants to import his diary** (can't). Onboarding's 4 steps still can't represent thousands of films → night-1 DNA is a caricature. Briefing "Because you loved {seed}" lands **iff** the seed is genuinely his; **respects** that WhyThisPick shows nothing rather than faking a why. Film File "FeelFlick's read" + ViewerNotes "not real reviews" = **standout trust win**. Looks for diary/lists → finds Lists as seasoning, not a home base (by doctrine).
- **Worked:** honesty layer; case-making. **Failed:** no import → starts cold; diary expectation unmet.
- **Trust-break:** none on honesty; risk is a *mainstream* pick (NOT OBSERVED). **Confusion:** "where's my diary/log."
- **Likely action:** completes onboarding skeptically; judges the first real pick hard. **Quote (simulated):** *"If it names a film I actually love, I'm listening. But three steps can't know me — let me bring my Letterboxd."*
- **Scores:** D5 case-making 5 ("not real reviews" respected); D2 onboarding 2 (no import); D6 DNA honesty 5.
- **Issues:** Insight cold-start re-seeding (no import); Insight diary-expectation copy. **Rec:** validate (does the import gap actually block power users?).

### P2 — TMDB metadata browser · Trust 4 · Return 3 · Friction 2
- **Habit:** looks up facts, then decides. **Expected:** transparent, checkable reasoning.
- **Journey:** landing clear; sign-in acceptable. Onboarding fine. Briefing pick — he scrutinizes the **match %**; the gloss **"how it fits your taste so far"** reads as honest evidence, not a grade → **win**. Film File data + honest case satisfy him. DNA "taste evidence… not a score of you" is exactly his mental model.
- **Worked:** honest numbers; checkable "why." **Failed:** wants more underlying data/links (minor).
- **Trust-break:** would only break if a number felt arbitrary (none observed). **Confusion:** minimal.
- **Likely action:** opens Film File, verifies, accepts. **Quote (simulated):** *"Good — the percentage admits it's 'so far.' That's an honest number."*
- **Scores:** D4 why 4; D6 DNA honesty 5; D11 confusion 5. **Issues:** Insight (wants evidence depth). **Rec:** protect the honest-number framing.

### P3 — Netflix casual scroller · Trust 3 · Return 3 · Friction 3
- **Habit:** browse-til-tired. **Expected:** "just tell me what to watch," fast.
- **Journey:** landing **"You spent 23 minutes picking. You watched thirty."** = his exact pain → strong. Mildly annoyed he must **sign in + onboard before a pick** (mitigated by $0 + Google). On a brand-new account the Briefing pick shows **no "Why this pick"** (null-safe) → less convincing exactly when trust is lowest. Low patience → may not open the Film File. **`/home` tail carousels** risk pulling him back into scrolling.
- **Worked:** anti-scroll hook + single pick. **Failed:** sign-in-before-value; cold no-why; tail re-scroll risk.
- **Trust-break:** a niche/subtitled cold pick (NOT OBSERVED) would lose him. **Confusion:** "why no reason on my first pick?"
- **Likely action:** tries it; returns only if the first pick lands. **Quote (simulated):** *"It nailed the problem. But make me sign in, then give me a film with no reason? Eh."*
- **Scores:** D1 clarity 5; D4 why 2 (cold no-why); D7 anti-scroll 3 (tail risk). **Issues:** P2 sign-in gate; Insight cold no-why; Insight tail re-scroll. **Rec:** validate funnel + tail in Wave 1.

### P4 — JustWatch availability-first · Trust 3 · Return 2 · Friction 4
- **Habit:** won't watch what he can't stream tonight. **Expected:** "where can I watch this?"
- **Journey:** landing fine; but on the pick / Film File there is **no where-to-watch** answer → for him a **dead end**. The best pick is worthless if he can't press play.
- **Worked:** the single-pick idea. **Failed:** no availability → his core need unmet (by doctrine — convenience, not the loop).
- **Trust-break:** recommending something with no "where" feels incomplete. **Confusion:** "ok, but is it on anything I have?"
- **Likely action:** abandons unless he already knows where it streams. **Quote (simulated):** *"Great pick. Can I actually watch it tonight? It won't tell me."*
- **Scores:** D10 completion 2 (his task can't complete); D3 trust 3. **Issues:** Insight (where-to-watch gap — deferred; needs graceful "not yet" copy). **Rec:** defer integration; consider honest "not yet" line; validate how much this frustrates real users.

### P5 — Trakt completionist · Trust 3 · Return 3 · Friction 3
- **Habit:** tracks progress + stats. **Expected:** the engine *uses* his history and never repeats.
- **Journey:** landing ok; onboarding seeds some history. Cares most about **no re-recommending watched films** (the engine has a 48h→7d→permanent skip system + watched exclusion — code-grounded, but the *actual* no-repeat behavior is NOT OBSERVED without a real account). Looks for a tracking/stats home → Diary + light stats exist but it's not Trakt.
- **Worked:** the loop *claims* to learn (skip teaches). **Failed:** no rich tracking/stats home; cold start ignores external history.
- **Trust-break:** a re-shown watched film would end it instantly. **Confusion:** "where are my stats."
- **Likely action:** tests whether it repeats; stays if it doesn't. **Quote (simulated):** *"Prove it read my history and won't show me what I've seen."*
- **Scores:** D8 personalization NOT OBSERVED; D3 trust 3. **Issues:** Insight history-use (validate no-repeat with real account); Insight tracking-home expectation. **Rec:** validate repeated-pick guard in Wave 1.

### P6 — Apple TV editorial-quality user · Trust 4 · Return 4 · Friction 2
- **Habit:** pays for quality + craft. **Expected:** Apple-grade polish + a real editorial voice.
- **Journey:** landing craft reads well (Outfit/Inter typography, restrained). The **"M." editorial voice** + Film File "FeelFlick's read" satisfy his want for a point of view; ViewerNotes honesty earns respect. Intolerant of jank — would flag any rough edge.
- **Worked:** craft + editorial case + honesty. **Failed:** any unfinished surface would stand out (none specific observed).
- **Trust-break:** thin/over-promising copy (none observed in the case layer). **Confusion:** minimal.
- **Likely action:** engages, judges the writing quality. **Quote (simulated):** *"This is considered. The case reads like a sharp note, not marketing."*
- **Scores:** D5 case-making 5; D1 clarity 4; D9 resonance 4. **Issues:** Insight (sustain craft everywhere). **Rec:** protect editorial voice + polish.

### P7 — Prime convenience user · Trust 3 · Return 3 · Friction 3
- **Habit:** just-put-something-on. **Expected:** zero-effort, safe, familiar.
- **Journey:** landing's "one pick" appeals, but **onboarding (4 steps) feels like work** for someone who wants instant. Will bristle at unfamiliar picks. The single pick *is* low-effort once past setup.
- **Worked:** low-effort end state. **Failed:** onboarding effort vs. his patience; niche picks feel unsafe.
- **Trust-break:** "never heard of it" picks. **Confusion:** "why so much setup."
- **Likely action:** may drop during onboarding; if through, enjoys a safe pick. **Quote (simulated):** *"Four steps? I just want something on. Make it one tap."*
- **Scores:** D2 onboarding 3 (effort); D7 anti-scroll 4. **Issues:** P2 onboarding effort for convenience-seekers. **Rec:** validate onboarding drop-off (P3/P7/P9 share it).

### P8 — Plex collector · Trust 3 · Return 2 · Friction 4
- **Habit:** owns a library; values control. **Expected:** respect for his own collection.
- **Journey:** landing ok; **no personal-library integration** → assumes "streaming-only," which doesn't fit him. Preferences/dials give *some* control. Picks may not be in his library.
- **Worked:** taste-fit (if it lands). **Failed:** no library awareness; feels not-for-him.
- **Trust-break:** assumes he only streams. **Confusion:** "does this know my Plex?" (no).
- **Likely action:** abandons unless taste-fit alone wins him. **Quote (simulated):** *"Does it touch my library? No? Then it's just another streaming recommender."*
- **Scores:** D8 personalization NOT OBSERVED; D3 trust 3. **Issues:** Insight library gap (deferred). **Rec:** defer; graceful "not yet" copy; not a core target.

### P9 — YouTube/trailer casual chooser · Trust 2 · Return 2 · Friction 4
- **Habit:** decides in seconds off a trailer/vibe. **Expected:** instant, visual, low-commitment.
- **Journey:** landing has motion/posters but the path is **text + sign-in + 4-step onboarding** → too slow for his attention span. Wants a **trailer** on the pick (Film File can embed YouTube — code-grounded) but the journey to it is long.
- **Worked:** poster/visual hooks. **Failed:** too much reading + setup before the payoff.
- **Trust-break:** "looks boring / too much text." **Confusion:** "where's the trailer, why am I reading."
- **Likely action:** bounces early. **Quote (simulated):** *"Too much reading. Show me a 10-second clip and one button."*
- **Scores:** D1 clarity 3; D2 onboarding 2; D9 resonance 2. **Issues:** P2 time-to-visual-payoff. **Rec:** validate (is this persona even a target? likely low-priority).

### P10 — Reddit/word-of-mouth seeker · Trust 4 · Return 4 · Friction 2
- **Habit:** trusts people over algorithms; hates marketing. **Expected:** a human-sounding *why*, no fake hype.
- **Journey:** skeptical at the landing's claims, but the **"M." voice** + Film File case feel like a smart friend's note. **ViewerNotes "not real reviews or quotes from real critics"** is the moment he relaxes — **no fabricated social proof** → big trust win. WhyThisPick's null-safe honesty reinforces it.
- **Worked:** honesty + human voice. **Failed:** would distrust any hype (none observed).
- **Trust-break:** one fabricated count/quote would end it (none found). **Confusion:** minimal.
- **Likely action:** gives it a real shot; would repeat a good "why" to a friend. **Quote (simulated):** *"It told me these aren't real critic quotes. That honesty is why I'd trust the next pick."*
- **Scores:** D4 why 4; D5/honesty 5; D6 DNA honesty 5. **Issues:** Win (protect no-fake-proof). **Rec:** protect; validate that the honesty reads as *strength* not *weakness* to real users.

---

## B. FeelFlick target personas

### P11 — Mood-first exhausted scroller ("Fried") · Trust 4 · Return 4 · Friction 2 ⭐
- **Habit:** fried by 9pm, can't decide, scrolls and gives up. **Expected:** one trustworthy pick that ends the scroll.
- **Journey:** landing **is** her problem statement → instant resonance. Mood as the front door fits her (she's highly mood-driven). The single pick + "M."'s short note is exactly the relief she wants — **if** the pick fits (NOT OBSERVED). Cold-start night-1 with no "why" is the main risk; the `/home` tail could re-trigger scrolling.
- **Worked:** mood-first + anti-scroll + relief framing. **Failed:** cold no-why; tail re-scroll.
- **Trust-break:** a pick that ignores her mood. **Confusion:** "do I have to fill out a survey?" (onboarding).
- **Likely action:** the most likely to adopt **if** night 1 lands. **Quote (simulated):** *"If it just hands me one film that fits how I feel, I'd never scroll Netflix again."*
- **Scores:** D1 clarity 5; D7 anti-scroll 4; D9 resonance 5. **Issues:** Insight cold no-why; Insight tail. **Rec:** **top validate** — she's the core target; confirm night-1 fit + anti-scroll hold.

### P12 — Taste-curious non-cinephile ("Curious") · Trust 4 · Return 4 · Friction 2 ⭐
- **Habit:** likes good films, no film vocabulary. **Expected:** to be guided + discover her taste honestly.
- **Journey:** onboarding feels like a fun taste quiz. **DnaConfidence "taste evidence… not a score of you"** + the "Still learning / Getting sharper" tiers feel *honest, not flattering* → she trusts it. The pick that stretches her "just enough" is the win (NOT OBSERVED).
- **Worked:** honest DNA; guided discovery. **Failed:** cold DNA underrates her early.
- **Trust-break:** DNA that felt fake/flattering (it doesn't). **Confusion:** "is this DNA real?" → answered by the honest copy.
- **Likely action:** engages with Profile; returns to see DNA grow. **Quote (simulated):** *"It says it's 'still learning' — that makes me believe the parts it does show."*
- **Scores:** D6 DNA honesty 5; D8 personalization NOT OBSERVED; D3 trust 4. **Issues:** Insight cold DNA thinness. **Rec:** validate the DNA-honesty → trust link with real new users.

### P13 — Couple choosing together · Trust 3 · Return 3 · Friction 3 ⭐
- **Habit:** nightly "what do *we* watch" standoff. **Expected:** one pick both accept, fast.
- **Journey:** the single justified pick is a natural **tiebreaker** — but the product models **one** account, not two. No multi-user mode → it only knows one of them. Still, "here's one film, here's why" can break the negotiation if both buy the why.
- **Worked:** single pick as a decision. **Failed:** no shared/dual-taste model.
- **Trust-break:** "but it doesn't know *both* of us." **Confusion:** whose taste is this?
- **Likely action:** uses one partner's account as the tiebreaker; wishes for a couple mode. **Quote (simulated):** *"It picked one film and made a case — that ended the argument. But it's only really me."*
- **Scores:** D7 anti-scroll 4 (ends the standoff); D8 personalization 3 (one-sided). **Issues:** Insight multi-user gap (deferred future bet). **Rec:** defer multi-user; validate whether single-user picks still help couples.

### P14 — Serious film lover who hates algorithmic slop ("Anti-slop") · Trust 4 · Return 4 · Friction 3 ⭐
- **Habit:** real taste, burned by recommenders. **Expected:** taste + honesty; never mediocre, never fabricated, anti-recency respected.
- **Journey:** scrutinizes everything. The **honesty layer is the win** — null-safe "why" (no fake reason), ViewerNotes "not real reviews," DnaConfidence "not a score of you," honest match gloss. Quality gating + anti-recency are doctrine (code-grounded), but whether the *actual pick* is non-mediocre/non-recency-biased is **NOT OBSERVED** — the make-or-break. Cold start underrates his deep taste (no import).
- **Worked:** the entire honesty/no-fabrication stack. **Failed:** cold-start underrepresentation; one slop pick = instant exit.
- **Trust-break:** a single fabricated claim or mediocre-popular pick. **Confusion:** none; he's testing for dishonesty.
- **Likely action:** stress-tests; converts only if picks are genuinely good + honest. **Quote (simulated):** *"They don't fake critic quotes and they don't fake a 'why.' Now show me the pick isn't just popular."*
- **Scores:** D5/honesty 5; D6 DNA honesty 5; D3 trust NOT OBSERVED (pick-dependent). **Issues:** Insight (pick quality/anti-recency — F8C, blocked); Insight cold import. **Rec:** **top validate** — the trust moat lives here; watch his real-pick reaction closely.

### P15 — Cold-start new user · Trust 3 · Return 3 · Friction 3 ⭐
- **Habit:** zero history; first impression decides all. **Expected:** value *before* commitment + honesty that it barely knows her.
- **Journey:** onboarding (4 steps) is the value-before-commitment moment — **but** it's more than the landing's "three short questions" promise (a small expectation mismatch). First Briefing pick has **no "why"** (null-safe) → could read as honest *or* as unjustified. DnaConfidence **"Still learning"** is the right honest signal. The make-or-break is whether the thin-data first pick is *believable*.
- **Worked:** honest cold framing (DNA "still learning"). **Failed:** cold no-why; onboarding longer than promised.
- **Trust-break:** a random-feeling first pick, or faked confidence (the product avoids the latter). **Confusion:** "why did it pick this, with no reason?"
- **Likely action:** stays iff night 1 feels believable. **Quote (simulated):** *"It's honest that it's still learning — but my first pick had no reason at all. Is it a guess?"*
- **Scores:** D2 onboarding 3; D4 why 2 (cold no-why); D6 DNA honesty 5. **Issues:** **Insight (high)** cold no-why (B2); P2 onboarding-vs-"three questions" copy mismatch. **Rec:** **top validate** — the cold→warm trust jump is the hardest moment.

### P16 — Returning user with enough history for DNA ("Warmed-up") · Trust 4 · Return 5 · Friction 2 ⭐
- **Habit:** ~20–50 films logged; nightly ritual forming. **Expected:** the payoff of having fed it.
- **Journey:** DnaConfidence now reads **"Getting sharper / Reading you well"** with real counts ("Built from N logged · N rated · N mood signals") → feels earned. The Briefing should now *visibly use her depth* and **never repeat** (weighted-random + cooldowns — code-grounded; actual feel NOT OBSERVED). Discover's complementary small set + the tail's "Your taste, taking shape." reinforce compounding.
- **Worked:** the loop compounding; honest, now-richer DNA. **Failed:** would be betrayed by déjà-vu picks or stale DNA.
- **Trust-break:** a repeated hero pick or DNA that feels off. **Confusion:** minimal.
- **Likely action:** the most likely to form a nightly ritual. **Quote (simulated):** *"This is the best it's been — it actually knows me now. Just don't show me yesterday's pick."*
- **Scores:** D6 DNA honesty 5; D8 personalization NOT OBSERVED (history-dependent); D13 return 5. **Issues:** Insight repeated-pick fatigue (validate no-repeat). **Rec:** validate the compounding payoff + repeated-pick guard with a warm real user.

---

## Per-persona score summary (simulated predictions)

| # | Persona | Trust | Return | Friction¹ | Make-or-break |
|---|---|:--:|:--:|:--:|---|
| P1 | Letterboxd | 3 | 4 | 3 | import gap / real-pick specificity |
| P2 | TMDB | 4 | 3 | 2 | honest numbers (✓) |
| P3 | Netflix scroller | 3 | 3 | 3 | sign-in gate + cold no-why + tail |
| P4 | JustWatch | 3 | 2 | 4 | no where-to-watch |
| P5 | Trakt | 3 | 3 | 3 | no-repeat + history use |
| P6 | Apple TV | 4 | 4 | 2 | sustained craft (✓) |
| P7 | Prime | 3 | 3 | 3 | onboarding effort |
| P8 | Plex | 3 | 2 | 4 | no library |
| P9 | YouTube trailer | 2 | 2 | 4 | time-to-visual |
| P10 | Reddit | 4 | 4 | 2 | no-fake-proof (✓) |
| P11 | Fried ⭐ | 4 | 4 | 2 | night-1 fit + anti-scroll |
| P12 | Curious ⭐ | 4 | 4 | 2 | DNA honesty (✓) + stretch pick |
| P13 | Couple ⭐ | 3 | 3 | 3 | single-user model |
| P14 | Anti-slop ⭐ | 4 | 4 | 3 | pick quality + honesty (✓) |
| P15 | Cold-start ⭐ | 3 | 3 | 3 | cold no-why + believable first pick |
| P16 | Warmed-up ⭐ | 4 | 5 | 2 | compounding + no-repeat |

¹ Friction: **1 = smooth, 5 = heavy** (lower is better). Trust/Return: 5 = best. **All simulated — not measured.**

**Means (simulated):** Trust ≈ 3.4 · Return ≈ 3.4 · Friction ≈ 2.8. Targets (P11/P12/P14/P16) score
highest on trust/return — the wedge resonates *most* with who it's for. The lowest scorers (P4, P8, P9)
are personas the doctrine deliberately doesn't serve — expected, not a defect.
