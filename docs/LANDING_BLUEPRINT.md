# FeelFlick Landing Page Blueprint
*Last updated: April 2026 — approved architecture before implementation*

---

## Product Identity

**Vision:** "FeelFlick — Films That Know You."

**The shift:**
- Old framing: "FeelFlick finds movies based on your mood." — a feature
- New framing: "FeelFlick is where your relationship with cinema becomes 
  visible — to you, to the people who share your taste, and to an engine 
  that learns you more with every film." — an identity

**Ambition benchmark:**
- Letterboxd's identity depth (people feel seen, build a film identity)
- Netflix's recommendation intelligence (feels like it knows you)
- Mood-first UX nobody else does at this quality
- UX/UI standard: what Apple is to design — applied to cinema

---

## Approved Copy — Apple Standard

Every headline passed the "So What?" test and the Apple test.
Do not change these without a new strategy session.

### Section Headlines & Supporting Copy

**Hero**
Headline: "Tell us how you feel. We'll find the film."
Supporting: "Not what's trending. Not what's popular. 
The film that's right for you, right now."
Emotion: Relief — the scrolling problem is over

**Cinematic DNA**
Headline: "Your taste, made visible."
Supporting: "Every film you watch shapes your Cinematic DNA — your genres, 
your directors, your emotional patterns. A living portrait of who you are 
as a film watcher."
Emotion: Self-recognition — "I want to see mine"

**It Learns You**
Headline: "It gets you. More every time."
Supporting: "Five films in, it's good. Fifty films in, it's uncanny. 
The engine behind FeelFlick learns what moves you — and what doesn't."
Emotion: Anticipation — "I want to feed it 50 films"

**Find Your People**
Headline: "Find people who get your taste."
Supporting: "Not followers. Not likes. Genuine taste compatibility — 
with a score that explains why."
Emotion: Belonging

**Trust Block**
Headline: "No ads. No tracking. Just films."
Supporting: "Your taste data makes your recommendations better. 
That's all it does. That's all it ever will."
Emotion: Trust

**Final CTA**
Headline: "Somewhere in 6,700 films is one made for you. Tonight."
Sub-line: "Sign in with Google. Watch five films. See your DNA take shape."
Emotion: Desire — "I'm doing this tonight"

---

## Why "Tonight." Works (Do Not Change)
Option B was chosen over alternatives because:
- Specific (a real number: 6,700)
- Personal ("made for you")
- Urgent ("Tonight." — single-word sentence is a signature Apple move)
- Every word is literally true

---

## Page Architecture — Approved Section Order

| # | Section | Purpose | Core Content | Target Emotion | Height |
|---|---------|---------|-------------|----------------|--------|
| — | TopNav | Navigation + CTA | Logo · How It Works · Sign In · Get Started Free | Orientation | fixed |
| 1 | Hero | Instant value prop | Headline · CTA · Poster mosaic · Trust signal | Relief | 1vh |
| 2 | MoodShowcase | Prove it works ("play first") | 6 mood bubbles → tap → 4 film results · NL teaser line | Delight | 1vh |
| 3 | CinematicDNA | Identity layer — reason to stay | Simulated taste profile: genre bars, top 3 directors, mood patterns, personality label | Self-recognition | 1vh |
| 4 | ItLearnsYou | Retention pitch | 5→50 watch progression · "Because you loved X" card | Anticipation | 0.7vh |
| 5 | FindYourPeople | Social hook | Two profile cards · 87% Taste Match badge · explanation | Belonging | 0.7vh |
| 6 | TrustBlock | Remove objections | "Free forever" · "No ads. No tracking." · "6,700+ films" | Trust | 0.4vh |
| 7 | FinalCTA | Convert — Peak-End closer | Headline · Single CTA · One-line promise | Desire | 0.5vh |
| — | Footer | Navigation fallback + credibility | Three columns · tagline · copyright · human signal | Completion | 0.3vh |

**Total: ~5.6 viewports — within the 5–7 target**

---

## Section Order Rationale (Do Not Reorder Without Reason)

1. MoodShowcase before CinematicDNA — experience the product 
   working before imagining your taste profile
2. CinematicDNA before ItLearnsYou — the DNA is what makes 
   the learning visible. Without it, "it learns you" is just 
   another AI claim
3. Social comes late — requires user to already believe FeelFlick 
   understands taste before "find people" resonates
4. TrustBlock immediately before Final CTA — objection removal 
   must precede the ask (Fogg Behavior Model)

---

## Design Principles — The Apple Standard

- Every interaction has intention behind it. Nothing is there by default.
- Transitions feel earned, not decorative.
- Empty states are designed, not forgotten.
- Every screen has one primary action. The eye never wonders where to go.
- Spacing, typography, and color do the heavy lifting.
- It feels inevitable — like it couldn't have been designed any other way.
- The bar: "This could ship from Cupertino."

---

## CinematicDNA Simulation — Specificity Requirement

The simulated profile must feel like a real person with specific taste.
Do NOT use generic data ("Action 35%, Drama 28%").

Use this hardcoded persona:
- **Personality label:** "The one who rewatches Interstellar every November"
- **Top Directors:** Denis Villeneuve · Bong Joon-ho · Greta Gerwig
- **Top Genres:** Sci-Fi 34% · Drama 28% · Thriller 19%
- **Dominant mood:** Contemplative (late night, weekends)
- **Rating style:** Tough critic (avg 3.2 stars)
- **Recently watched:** Dune Part Two · Parasite · Barbie · Arrival · Oppenheimer

---

## Footer Structure

**Three columns:**
- Product: Home · Discover · Browse · Watchlist
- Company: About · Privacy Policy · Terms of Service  
- Connect: Twitter/X · GitHub · Contact

**Bottom bar:**
- Left: "FeelFlick — Films That Know You"
- Right: "© 2026 FeelFlick"

**Human signal line:**
"Built by a film lover in Toronto."

**What to leave OUT:**
Newsletter signup · blog link · App Store badges · 
"Powered by Supabase/Vercel" badges · excessive social icons

---

## Implementation Sequence (5 Sub-tasks)

1. **CinematicDNASection.jsx** — CREATE (establishes visual language)
2. **ItLearnsYouSection.jsx + FindYourPeopleSection.jsx + TrustBlockSection.jsx** — CREATE (follow DNA visual language)
3. **Landing.jsx + HeroSection + MoodShowcase + FinalCTA** — MODIFY (wire + copy polish)
4. **Footer.jsx** — MODIFY (rebuild to spec)
5. **Landing.test.jsx cleanup + HowItWorksSection.jsx deletion** — last

**Critical path:** CinematicDNA first. If it feels like a generic 
mockup, the page's entire emotional arc collapses.

---

## Files Map

### Keep (shipped)
- `src/features/landing/components/TopNav.jsx`

### Modify
- `src/features/landing/Landing.jsx`
- `src/features/landing/sections/HeroSection.jsx`
- `src/features/landing/sections/MoodShowcaseSection.jsx`
- `src/features/landing/sections/FinalCTASection.jsx`
- `src/features/landing/components/Footer.jsx`
- `src/features/landing/__tests__/Landing.test.jsx`

### Create
- `src/features/landing/sections/CinematicDNASection.jsx`
- `src/features/landing/sections/ItLearnsYouSection.jsx`
- `src/features/landing/sections/FindYourPeopleSection.jsx`
- `src/features/landing/sections/TrustBlockSection.jsx`

### Delete (after wiring complete)
- `src/features/landing/sections/HowItWorksSection.jsx`

---

## Frameworks Applied (Reference)

- **StoryBrand** — user is the hero, FeelFlick is the guide
- **Jobs To Be Done** — every section maps to a job users hire FeelFlick to do
- **Fogg Behavior Model** — Motivation × Ability × Trigger at every CTA
- **Peak-End Rule** — strongest emotions at CinematicDNA + Final CTA
- **"So What?" test** — every headline must survive this question
- **Progressive disclosure** — show outcome, not process
- **Von Restorff Effect** — CTA is the single most visually distinct element
