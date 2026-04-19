# **FeelFlick — A Mood-First Movie Discovery Platform**

FeelFlick is a discovery-first movie platform that learns your cinematic identity. It combines a sophisticated multi-signal recommendation engine, a personal taste identity layer, and a structured mood taxonomy no other platform has.

The live site is **app.feelflick.com**.

---

# **How Discovery Works**

FeelFlick answers a different question than most platforms. Instead of "what's popular right now," it answers "what's right for you, right now."

## **Mood-Based Sessions**

Choose from 12 moods — Melancholic, Cozy, Anxious, Overwhelmed, Nostalgic, Silly, Curious, Romantic, Tense, Inspired, Dark, and Adventurous — and FeelFlick builds a personalised film selection in real time.

| **AI Narration**             | GPT-4.1-mini generates a contextual intro for your mood session, setting the tone before films appear |
| **Natural Language Input**   | Describe how you feel in your own words — 'tired after a long week but want something hopeful' — and FeelFlick parses it into mood, pacing, intensity, and context signals |
| **Tag-Aware Matching**       | Each film carries controlled-vocabulary mood_tags, tone_tags, and fit_profile from LLM enrichment. Mood session results match on semantic tag intersection, not just genre |
| **18-Dimension Scoring**     | Every film is scored across genre affinity, mood signature, tone, fit profile, pacing, intensity, emotional depth, viewing context, time of day, your personal history, feedback signals, and user satisfaction |
| **Negative Signal Tracking** | Films you skip, genres you avoid, directors whose work doesn't resonate, and fatigued franchises are all tracked and downweighted |

## **Browse by Mood, Tone, or Fit Profile**

Every film's mood_tags, tone_tags, and fit_profile are clickable chips on the detail page. Tap one to browse the full catalog of films matching that specific emotional signature — 44 auto-generated landing pages spanning moods like haunting, contemplative, whimsical; tones like earnest, urgent, absurdist; and fit profiles from arthouse to comfort_watch.

## **Curated Lists**

Ten editorial lists generated from the data layer: Prestige Drama of the 2020s, Challenging Art Cinema, Festival Discoveries, Cult Classics, Comfort Watches, Crowd-Pleasers Critics Didn't Love, Critics' Picks Audiences Missed, Exceptional for Their Kind, Tense & Haunting, World Cinema.

## **Taste Challenges**

Personalized challenges identify gaps in your watch profile — fit profiles you've never explored, moods absent from your history — and suggest 6 high-quality entry points for each. Surfaced at **/challenges** when you have 10+ watched films.

## **Collections**

Franchise and connected-film collections render on their own pages. Click the collection link on any franchise film's detail page to see the full set in release order with average audience rating.

---

# **The Rating System**

Most platforms collapse a film's quality into one number. FeelFlick surfaces five distinct scores, each with explicit confidence:

| **ff_critic_rating**    | 0-100 critic consensus from Rotten Tomatoes, Metacritic, and IMDb (for widely-vetted films). Bayesian-weighted |
| **ff_audience_rating**  | 0-100 broad audience consensus from IMDb, TMDB, and Trakt, with language bias correction |
| **ff_community_rating** | 0-100 satisfaction score from FeelFlick users — blends ratings, completion, sentiment, and feedback |
| **ff_personal_rating**  | 0-100 predicted score for you specifically, blending objective quality + taste match + your rating scale + trust network. Activates at 10+ rated films |
| **ff_rating_genre_normalized** | Quality relative to genre. A 7.3 horror is often more notable than a 7.5 drama — this surfaces that |

Each score has a paired confidence (0-100). Ratings with confidence below 50 are hidden rather than misleading. Detail pages show the full breakdown — critics, audience, community — so every number is traceable to its source.

**Critic/audience split is surfaced as a filter**: "Critics' Picks" shows films critics loved but audiences missed; "Crowd-Pleasers" shows the inverse. This split is the single most useful quality signal because it describes *what kind* of film something is, not just how good.

## **Exceptional for Genre**

A film with ff_rating_genre_normalized ≥ 8.0 earns a "TOP" badge on cards and a full-width badge on detail pages. This surfaces genre-defining work that pure star ratings hide.

---

# **Your Taste Identity**

Every watch contributes to a visible taste profile — the opposite of Netflix's silent algorithm.

## **Taste Fingerprint**

A word cloud of your most-watched mood_tags sized by frequency, your tonal range as percentage chips, and your fit profile distribution as horizontal bars. Every element is a link to browse that slice of the catalog. Lives on the profile page after 5+ watched films.

## **Cinematic DNA**

| **Top Genres**       | Most-watched genres with percentage breakdowns |
| **Top Directors**    | Directors whose work appears most in your history |
| **Mood Patterns**    | Emotional states you most often watch in |
| **Rating Style**     | Your average rating and personality label — 'generous rater', 'tough critic', 'balanced' |
| **Taste Summary**    | Single sentence capturing your cinematic identity, LLM-generated from your history and taste signature |
| **Recently Watched** | Last 6 films logged, shown as poster thumbnails |

## **Quick-Rate Prompt**

Immediately after marking a film as watched, a 5-star half-step rating prompt appears inline — no modal, no navigation. Tap a star and it saves. Auto-dismisses after 4 seconds.

## **Your Take**

Deeper feedback modal below Quick-Rate: 5-star rating (half-steps), written review, sentiment (loved/liked/ok/disliked/hated), viewing context tags, what-stood-out tags, and an AI-generated reflection prompt rooted in the film's specific themes.

---

# **How FeelFlick Gets Smarter Over Time**

FeelFlick is designed as a compounding system. Every interaction adds signal:

- Watching a film teaches FeelFlick your genre preferences, director affinities, and fit profile patterns
- Rating teaches it how discriminating you are and what quality means to you
- Completion ratio teaches it what you actually finish, not just what you start
- Sentiment teaches it the difference between films you respected and films you loved
- Choosing a mood teaches it your emotional patterns — when you want what kind of experience
- Skipping teaches it what to downweight; franchise fatigue is detected from skip patterns
- Following someone with an 87% Taste Match means their ratings become a stronger signal for you

**The Compounding Effect:** A user with 5 watches gets decent recommendations. A user with 50 watches gets recommendations that feel made specifically for them, including a personalized ff_personal_rating that reflects both objective quality and your individual taste.

---

# **Under the Hood**

For those who care about how things work:

| **Film Catalog**          | 6,482 films with full TMDB metadata, LLM mood enrichment (mood_tags, tone_tags, fit_profile via GPT-5.4-mini Batch API), external ratings from IMDb/RT/Metacritic/Trakt, and pre-computed semantic embeddings |
| **Recommendation Engine** | 18-dimensional scoring combining base quality (5-score architecture), genre matching, mood tag intersection, tone matching, fit profile affinity, language preferences, content style (pacing/intensity/emotional depth/dialogue density/attention demand), people affinities (director/writer/cinematographer/lead actor), theme keywords, era and runtime match, feedback loop, and user satisfaction aggregates |
| **Semantic Search**       | OpenAI text-embedding-3-large (3072 dimensions) via pgvector in PostgreSQL. Embeddings include mood_tags and tone_tags, so "Because you loved X" surfaces films with shared emotional DNA, not just shared plot points |
| **Mood Taxonomy**         | 30 mood tags, 20 tone tags, 10 fit profiles — controlled vocabulary, semantically consistent across the catalog. No other platform has this |
| **AI Features**           | GPT-4.1-mini powers mood session narration, natural language mood parsing, post-watch reflection prompts, and taste summary generation. GPT-5.4-mini enriches the catalog with mood/tone/fit tags |
| **Infrastructure**        | React 18 + Vite frontend, Supabase (PostgreSQL + pgvector + Edge Functions), Vercel deployment, Cloudflare DNS |
| **Privacy**               | No advertising. No data selling. No third-party tracking. Your taste data is used only to improve your own recommendations |

---

# **What's Coming**

FeelFlick is actively developed. Planned: social graph (friends, taste-match scores, trust-weighted ratings), mood journeys (curated multi-film paths), year-in-review, post-credits recommendations, and continued expansion of the mood taxonomy.
