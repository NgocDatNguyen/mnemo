# Mnemo — Project Context

> **Read this file at the start of every Claude Code session.** It contains all locked product decisions, tech stack, schema, and conventions. Do not deviate without explicit user confirmation.

## What is Mnemo?

Mnemo is a personalized AI flashcard builder for serious IELTS learners stuck at band 6.5 trying to reach 7.0-7.5, focused on Reading + Writing. It analyzes mock test mistakes to generate weakness-driven decks reviewed via FSRS spaced repetition. Anki users can import/export freely.

**Tagline VN:** Mnemo — học một lần, nhớ trọn đời.
**Tagline EN:** Mnemo — turn what you study into what you know.

**Positioning:** "AI flashcard builder for serious learners" — NOT "another flashcard app". Sell the outcome (faster IELTS band improvement), not the tool (cards).

## Current phase: BETA (free-for-all, no payment integration)

We are in **beta phase**. All MVP features available free to all signed-up users (capped at 100 beta testers initially). Payment integration deferred to V2 post-beta validation. See "Beta Mode" section below.

## Target users (focus only on these)

**Primary B2C — "Linh":** Vietnamese IELTS candidates aged 19-28, band 6.0-6.5, targeting 7.0-7.5, mostly female, students or recent graduates, mobile-first behavior. Beta: free. Post-launch: willing to pay 150-300k VND/month.

**Primary B2B — "Anh Tuấn":** Vietnamese IELTS freelance tutors aged 27-35, managing 8-30 students. Beta: free with cohort feature. Post-launch: willing to pay 299-599k VND/month.

**Secondary B2B — "Cô Hương":** Small IELTS center owners — phase 2 target.

**NOT target:** Beginners (<5.5), parents-as-buyers, casual English learners without exam goal, IELTS 7.5+ users, Speaking-focused (ELSA territory).

## Core value loop (the ONE thing that matters)

1. User uploads photo/PDF of completed mock test with their wrong answers
2. AI analyzes weaknesses (vocabulary, collocations, grammar patterns)
3. AI generates 10-30 personalized flashcards targeting those weaknesses
4. Each card scored by Quality Engine (atomicity, reading load, etc.)
5. User reviews via FSRS on mobile
6. Stats show retention improvement over time
7. User uploads next mock test → loop repeats

This is the core loop. Everything else is supporting infrastructure.

## Anti-patterns (DO NOT build these)

- **Gamification / streaks / leaderboards** — anti-Duolingo brand positioning
- **Pretty UI without quality substance** — we are "serious learner" not "casual cute"
- **Live tutoring marketplace** — not our category
- **Speaking practice** — ELSA owns this
- **AnkiConnect live sync** — file-based .apkg import/export only for MVP
- **TikTok-style notification guilt** — adult learners hate this
- **Hiding Anki export behind paywall** — political suicide
- **AI hype copy** ("Lên band 7.0 trong 1 tuần với AI") — destroys trust
- **Generic horizontal flashcard features** — every feature must serve IELTS R/W workflow
- **Payment integration in MVP** — defer to V2 (see Beta Mode)

## Tech stack (LOCKED — do not suggest alternatives)

- **Framework:** Next.js 16 (App Router), TypeScript strict mode
- **Styling:** Tailwind CSS 4 + shadcn/ui (new-york style)
- **Database:** Postgres on Neon
- **ORM:** Drizzle ORM (not Prisma)
- **Auth:** Better Auth (not Clerk, not NextAuth/Auth.js)
- **SRS engine:** ts-fsrs (MIT license)
- **AI:** Vercel AI SDK (`ai` package) with multi-provider routing (see "AI providers" section below)
- **Client state:** TanStack Query v5
- **Server state:** React Server Components + Server Actions
- **Payments:** **NOT IN MVP** — deferred to V2
- **Email:** Resend
- **Analytics:** Posthog
- **Error tracking:** Sentry
- **Mobile:** PWA via next-pwa (NO native app in MVP)
- **Storage:** Cloudflare R2 (S3-compatible)
- **OCR:** Gemini 2.5 Flash vision capability (no separate OCR service)
- **Lint/format:** Biome (not ESLint + Prettier)
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Package manager:** pnpm
- **Deployment:** Vercel
- **Domain:** mnemo.app (primary)

## AI providers — multi-provider strategy

Use **Vercel AI SDK** (`ai` package) for provider abstraction. Default to Gemini free tier for all operations during beta. Switch providers via single config without rewriting code.

```typescript
// lib/ai/models.ts
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

// Beta: Gemini free tier (no credit card, generous limits)
export const models = {
  // Vision: mock test photo → text extraction
  vision: google('gemini-2.5-flash'),

  // Generation: weakness analysis + card creation
  generation: google('gemini-2.5-flash'),

  // Classification: quality engine atomicity/disambiguation checks
  classification: google('gemini-2.5-flash-lite'),

  // Premium fallback: only if Gemini quality insufficient (paid, pay-as-you-go)
  premium: anthropic('claude-haiku-4-5'),
};
```

**Free tier limits (as of May 2026):**
- Gemini 2.5 Flash: 10 RPM, 1,500 RPD, 1M TPM
- Gemini 2.5 Flash-Lite: 15 RPM, 1,500 RPD, 1M TPM
- No credit card required

**Beta usage estimate (50 users):** ~150 mock test analyses + ~1,500 card generations + ~1,500 quality checks per month = comfortably within free limits.

**⚠️ Privacy note for beta:** Free tier Gemini may use prompts/responses for training Google's models. Must disclose in Beta TOS. Auto-redact PII (names, emails) from uploaded mock test photos before sending to API. After beta → upgrade to paid Tier 1 ($250/month cap, no training).

**Migration plan (post-beta):**
- When MRR >$1k: enable Gemini paid Tier 1 (data not used for training)
- Or migrate to Claude Haiku 4.5 for higher reasoning quality
- Code changes: only `lib/ai/models.ts` provider config

**Fallback for rate limits:**
- If Gemini returns 429: retry once after 5s, then fallback to Claude Haiku
- Log rate-limit events to Posthog for monitoring

## Beta Mode

Beta phase MUST be implemented from Day 1. Control via environment variable.

**Environment variable:**
```bash
BETA_MODE=true
BETA_USER_LIMIT=100
```

**Database field:**
- `users.beta_tester: boolean default false`
- `users.beta_joined_at: timestamp?`
- On signup during beta: set `beta_tester=true`, `beta_joined_at=now()`
- Track beta cohort for future loyalty rewards

**Feature access logic:**
```typescript
// lib/auth/access.ts
export const BETA_MODE = process.env.BETA_MODE === 'true';

export async function canAccessFeature(
  user: User,
  feature: 'mock_test' | 'ai_generation' | 'tutor_mode' | 'anki_export'
): Promise<boolean> {
  if (BETA_MODE && user.beta_tester) return true; // bypass all limits
  // Post-beta: check subscription tier
  return checkSubscriptionLimits(user, feature);
}
```

**Signup cap:**
- Track total beta user count
- When >= BETA_USER_LIMIT, show waitlist page instead of signup
- Send Resend email when slot opens

**UI signals:**
- "BETA — Miễn phí" badge in app header
- Welcome email mentions beta status + future grandfather pricing
- Feedback CTA prominent ("Bạn nghĩ sao về Mnemo?" link to Tally form)

**No paywall logic in MVP:**
- Skip Stripe SDK installation
- Skip MoMo/ZaloPay integration
- Skip subscription management UI
- Skip pricing page (replace with "/about-beta" page explaining free beta)
- Skip usage credit enforcement (track for analytics only)

**Schema notes for V2 readiness:**
- Keep `subscriptions` table in schema (empty during beta)
- Keep `usage_credits` table (record usage, don't enforce limits)
- This lets V2 launch enable payments without migration

**Beta exit criteria:**
When ready to launch V2 with payments:
1. ≥50 active beta users with ≥30% D30 retention
2. Average user has uploaded ≥3 mock tests
3. ≥5 testimonials/feedback collected
4. Core bugs cleared

Then:
- Set `BETA_MODE=false`
- Existing `beta_tester=true` users keep grandfather access (free Pro for 6 months OR 50% off lifetime — decide closer to date)
- New signups go through paid funnel

## Database schema (MVP — with beta extensions)

```typescript
// users (Better Auth managed + Mnemo extensions)
users: {
  id: uuid (pk)
  email: string (unique)
  name: string?
  emailVerified: boolean
  image: string?
  role: enum('student', 'tutor', 'admin')
  // Mnemo-specific
  current_band: numeric(2,1)?
  target_band: numeric(2,1)?
  exam_date: date?
  language_ui: enum('vi', 'en') default 'vi'
  onboarding_completed_at: timestamp?
  // Beta tracking
  beta_tester: boolean default false
  beta_joined_at: timestamp?
  created_at: timestamp
  updated_at: timestamp
}

// Better Auth tables: sessions, accounts, verifications

// decks
decks: {
  id: uuid (pk)
  owner_id: uuid (fk users)
  cohort_id: uuid (fk cohorts)?
  title: string
  description: text?
  type: enum('system', 'personal', 'cohort')
  source: enum('manual', 'mock_test', 'pdf_upload', 'imported_apkg')
  source_mock_test_id: uuid (fk mock_tests)?
  card_count: integer default 0
  is_public: boolean default false
  created_at: timestamp
  updated_at: timestamp
}

// cards
cards: {
  id: uuid (pk)
  deck_id: uuid (fk decks)
  type: enum('basic', 'cloze')
  front: text
  back: text
  context: text?
  source_reference: string?
  quality_score: enum('A', 'B', 'C', 'needs_work')?
  quality_warnings: jsonb?
  created_at: timestamp
  updated_at: timestamp
}

// reviews (FSRS state per user × card)
reviews: {
  id: uuid (pk)
  user_id: uuid (fk users)
  card_id: uuid (fk cards)
  stability: numeric
  difficulty: numeric
  retrievability: numeric
  state: enum('new', 'learning', 'review', 'relearning')
  due: timestamp
  last_review: timestamp?
  lapses: integer default 0
  reps: integer default 0
  created_at: timestamp
  updated_at: timestamp
}

// review_logs
review_logs: {
  id: uuid (pk)
  review_id: uuid (fk reviews)
  rating: enum('again', 'hard', 'good', 'easy')
  reviewed_at: timestamp
  elapsed_days: numeric
  scheduled_days: numeric
}

// mock_tests
mock_tests: {
  id: uuid (pk)
  user_id: uuid (fk users)
  test_type: enum('reading', 'writing')
  input_source: enum('photo', 'pdf', 'manual_text')
  raw_input_url: string?  // R2 URL; auto-delete after 30 days
  extracted_text: text?
  analyzed_at: timestamp?
  weakness_clusters: jsonb?
  generated_deck_id: uuid (fk decks)?
  total_questions: integer?
  correct_count: integer?
  band_estimate: numeric(2,1)?
  ai_provider: string?  // 'gemini-2.5-flash' etc. for telemetry
  ai_cost_estimate_cents: integer?  // tracked for analytics
  created_at: timestamp
}

// cohorts (tutor mode)
cohorts: {
  id: uuid (pk)
  tutor_id: uuid (fk users)
  name: string
  target_band: numeric(2,1)?
  exam_date: date?
  invite_token: string (unique)
  is_active: boolean default true
  created_at: timestamp
  archived_at: timestamp?
}

// cohort_members
cohort_members: {
  cohort_id: uuid (fk cohorts)
  user_id: uuid (fk users)
  status: enum('invited', 'active', 'paused', 'completed', 'left')
  joined_at: timestamp
}

// usage_credits (tracking only during beta, not enforcement)
usage_credits: {
  user_id: uuid (fk users)
  period_start: date
  mock_tests_used: integer default 0
  cards_generated: integer default 0
  ai_cost_estimate_cents: integer default 0
}

// subscriptions (V2 — keep schema, no records during beta)
subscriptions: {
  id: uuid (pk)
  user_id: uuid (fk users) (unique)
  tier: enum('free', 'pro', 'power', 'tutor_lite', 'tutor_pro', 'beta')
  billing_cycle: enum('monthly', 'annual', 'lifetime', 'free', 'beta')
  status: enum('active', 'cancelled', 'expired', 'past_due', 'beta')
  stripe_customer_id: string?
  stripe_subscription_id: string?
  current_period_end: timestamp?
  created_at: timestamp
  updated_at: timestamp
}

// email_captures (waitlist when beta cap reached)
email_captures: {
  id: uuid (pk)
  email: string (unique)
  source: string
  notes: text?
  notified_at: timestamp?  // when slot opens
  created_at: timestamp
}

// feedback (beta user feedback collection)
feedback: {
  id: uuid (pk)
  user_id: uuid (fk users)?  // null if anonymous
  type: enum('bug', 'feature_request', 'general', 'praise', 'complaint')
  message: text
  page_url: string?
  device_info: jsonb?
  resolved: boolean default false
  created_at: timestamp
}
```

## Quality Engine — 5 rules (MVP)

Implementation strategy: combine deterministic heuristics + Gemini Flash-Lite classification. Run on card creation/edit.

**Rule 1 — Atomicity** (severity: high)
- Use Gemini Flash-Lite to classify: "Does this card test 1 or >1 distinct facts?"
- Prompt for JSON `{ "atomic": boolean, "reason": string }`
- If `atomic: false`, warning: "This card may contain multiple facts. Consider splitting."

**Rule 2 — Reading load** (severity: medium)
- Word count regex
- Warning if >20 words, error if >35 words

**Rule 3 — Disambiguation** (severity: medium)
- Heuristic flag for short questions
- Gemini Flash-Lite classification for ambiguity

**Rule 4 — Cloze placement** (severity: high, cloze cards only)
- Parse cloze deletions
- Check against English frequency list (deleted word should not be stop word)

**Rule 5 — Interference** (severity: low-medium)
- TF-IDF cosine similarity vs existing deck cards
- Warning if similarity >0.85

Quality scoring: Start at A. High-severity warning drops 1 grade. Medium drops 0.5. Final grade rounded down.

## SRS algorithm

Use `ts-fsrs`. Default FSRS-5 parameters. Phase 2: tune for Vietnamese IELTS learners.

Review flow: due cards → show front → rating → ts-fsrs.next() → update reviews + append to review_logs.

## Pricing tiers (POST-BETA — not implemented in MVP)

Reference for V2 (do not implement during beta):

| Tier | VND/month | VND/year | VND Lifetime |
|---|---|---|---|
| Free | 0 | 0 | — |
| Pro | 149,000 | 1,490,000 | 1,990,000 |
| Power | 299,000 | 2,990,000 | — |
| Tutor Lite | 299,000 | 2,990,000 | — |
| Tutor Pro | 599,000 | 5,990,000 | — |

During beta: all features free for `beta_tester=true` users. Anki bridge ALWAYS free regardless of phase.

## File structure conventions

```
mnemo/
├── app/
│   ├── (marketing)/        # Landing, about-beta, blog
│   ├── (auth)/             # Sign in, sign up
│   ├── (app)/              # Authenticated app
│   │   ├── dashboard/
│   │   ├── decks/
│   │   ├── review/
│   │   ├── mock-test/
│   │   ├── cohorts/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   └── ai/             # Provider-routed AI endpoints
│   └── layout.tsx
├── components/
│   ├── ui/                 # shadcn/ui
│   ├── marketing/
│   ├── review/
│   ├── editor/
│   ├── tutor/
│   └── beta/               # BetaBadge, FeedbackButton, etc.
├── lib/
│   ├── db/
│   │   ├── schema/
│   │   └── queries/
│   ├── ai/
│   │   ├── models.ts       # Provider routing
│   │   ├── prompts/
│   │   ├── card-generator.ts
│   │   ├── weakness-analyzer.ts
│   │   └── quality-engine.ts
│   ├── fsrs/
│   ├── auth/
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── access.ts       # canAccessFeature with beta logic
│   └── utils/
├── drizzle/
├── public/
├── i18n/
│   ├── vi.json
│   └── en.json
├── biome.json
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
├── .env.local
├── .env.example
├── CLAUDE.md
└── README.md
```

## Design tokens

Locked Foundation v0.1 from Claude Design System work. All UI must use these tokens via Tailwind 4 `@theme {}` block in `app/globals.css`. Hex values are the source of truth — Tailwind class names derive from them.

### Color tokens

**Surface & text**
- `--color-bg`: `#FAFAF7` (warm white, primary background)
- `--color-bg-elevated`: `#FFFFFF` (cards on warm background)
- `--color-bg-subtle`: `#F5F4EF` (section backgrounds)
- `--color-text`: `#1A2547` (deep navy, primary text)
- `--color-text-secondary`: `#4A5570`
- `--color-text-muted`: `#8590A8`
- `--color-text-inverse`: `#FAFAF7`
- `--color-border`: `#E8E5E0`
- `--color-border-strong`: `#D4D0C8`

**Accent — warm gold (single accent, never multiple)**
- `--color-accent`: `#B8845F`
- `--color-accent-hover`: `#A8744F`
- `--color-accent-subtle`: `#F4ECDF`

**Semantic (muted by design — never neon, never alarm)**
- `--color-success`: `#6B8E6B` sage / `--color-success-bg`: `#EEF2EE`
- `--color-warning`: `#C4934C` amber / `--color-warning-bg`: `#FAF3E8`
- `--color-error`: `#A85544` brick / `--color-error-bg`: `#F5EBE8`
- `--color-info`: `#5A7591` slate / `--color-info-bg`: `#ECF0F4`

**Quality engine (card grading)**
- `--color-quality-a`: `#4A6B4A` on `#EEF2EE` (Excellent)
- `--color-quality-b`: `#5A6878` on `#EEF0F2` (Good)
- `--color-quality-c`: `#8E6B3A` on `#F8F1E5` (Interference)
- `--color-quality-needswork`: `#8B4A3A` on `#F2E8E5` (Needs work)

### Typography

Font loading: Use `next/font/google` in `app/layout.tsx`. Each font assigns a CSS variable via the `variable` option. Subsets must include `latin` and `vietnamese` for Vietnamese diacritic rendering.

- **Display** — Fraunces variable, with `opsz` and `WONK` axes exposed → exposed as `--font-display`
- **UI** — Inter variable → exposed as `--font-ui`
- **Mono** — JetBrains Mono variable (stats numbers, IELTS scores, code-like data) → exposed as `--font-mono`

In `app/globals.css` `@theme {}` block:
```css
--font-display: var(--font-fraunces, Georgia), serif;
--font-ui: var(--font-inter, system-ui), sans-serif;
--font-mono: var(--font-jetbrains-mono, ui-monospace), monospace;
```

Where `--font-fraunces` / `--font-inter` / `--font-jetbrains-mono` are set by `next/font/google` declarations in `layout.tsx`.

### Type scale

| Role | Family | Size/leading | Weight | Tracking |
|---|---|---|---|---|
| Display L | Fraunces | 48/56 | 500 | -0.02em |
| Display M | Fraunces | 36/44 | 500 | -0.02em |
| Display S | Fraunces | 28/36 | 500 | -0.01em |
| H1 | Inter | 24/32 | 600 | -0.01em |
| H2 | Inter | 20/28 | 600 | -0.01em |
| H3 | Inter | 18/26 | 600 | 0 |
| Body L | Inter | 18/28 | 400 | 0 |
| Body M (default) | Inter | 16/24 | 400 | 0 |
| Body S | Inter | 14/20 | 400 | 0 |
| Label | Inter | 12/16 | 500 | 0.06em uppercase |
| Card front | Fraunces | 24/36 | 500 | 0, centered |
| Stats number | Fraunces tabular | 36/44 | 500 | 0 |
| Mono (scores) | JetBrains Mono | 14/20 | 500 | 0 |

### Spacing, radius, shadow

- Spacing scale: Tailwind default (`4px` base = `space-1`)
- Radius: button `4px`, card `8px`, flashcard `12px`, pill `9999px`
- Shadow: avoid except flashcards (`shadow-sm`). Buttons + cards are flat with `1px` border.

### Hard rules

- One primary accent only (warm gold). Never introduce secondary accent without spec amendment.
- Never alarming colors. Semantic colors muted by design.
- No drop shadows on buttons. Surfaces are flat with borders.
- No celebrations of low-quality cards. "Needs work" badge appears when quality engine detects interference.
- Vietnamese diacritics must render correctly in Fraunces — verify before shipping any display copy.

## Code conventions

- snake_case for DB columns, camelCase for TS variables, PascalCase for components
- Server Components by default; `'use client'` only when needed
- Server Actions preferred over API routes for forms
- Types in `lib/types/` or co-located
- Custom Error classes per domain
- Pino for structured logs
- i18n: Vietnamese default, English toggle
- Money: integer cents (for V2 schema readiness)
- UUID v7 for IDs
- Mobile-first: design at 375px first
- Lighthouse mobile ≥85 for marketing

## AI prompt patterns

All Claude/Gemini API calls via Vercel AI SDK. Example:

```typescript
// lib/ai/card-generator.ts
import { generateObject } from 'ai';
import { models } from './models';
import { z } from 'zod';

const CardSchema = z.object({
  cards: z.array(z.object({
    front: z.string(),
    back: z.string(),
    context: z.string().optional(),
  }))
});

export async function generateCardsFromWeakness(
  weakness: WeaknessCluster,
  level: { current: number; target: number }
) {
  const { object } = await generateObject({
    model: models.generation,
    schema: CardSchema,
    system: SYSTEM_PROMPT,
    prompt: buildCardGenPrompt(weakness, level),
  });

  return object.cards;
}
```

Always include in prompts:
- Output schema (Zod)
- Examples (1-shot or few-shot)
- Vietnamese context where relevant
- Anti-hallucination guards (e.g., "If unsure, return empty array rather than guessing")

## Anki bridge requirements

- Import + Export `.apkg` files
- **Both ALWAYS FREE — no tier restriction, no beta restriction**
- Test against real Anki desktop for compatibility

## Tutor mode requirements

Tutor user can create cohorts, invite students via magic link, assign master decks, view retention dashboard. Weekly digest email via Resend cron.

During beta: all tutors have free Tutor Pro access automatically.

## Beta launch criteria (replaces previous Day 90 criteria)

Before opening beta signups to first 100 users:
- Sign-up flow works end-to-end (Better Auth)
- Mock test photo upload → Gemini Vision → AI analysis → 10+ cards generated
- Card editor with quality engine showing scores
- Review flow on mobile (PWA installable)
- Anki .apkg import + export working
- Tutor mode: create cohort, invite student, see dashboard
- Beta badge + feedback button prominent
- 5-10 internal/family users tested without major bugs
- Beta TOS + Privacy Policy mentioning Gemini free tier data usage

**No payment integration required for beta launch.**

## Decisions log (most recent first)

- **2026-05-20**: Landing page locked (sections: hero with WONK italic on "nhớ trọn đời", 3-column methodology with Lucide icons, 3-paragraph why-works, pricing callout, CTA, footer). Anti-gamification positioning explicit. Anki bridge wording clarified as "free forever even after Mnemo paid tier" to avoid contradicting pricing callout. No live beta counter in MVP. No OG image yet (Phase 2 design task). i18n files populated for vi + en but no UI switcher.
- **2026-05-20**: Auth strategy locked = magic link email only via Resend. NO passwords (eliminates breach/reset surface). NO Google OAuth in beta (defer to V2 if needed based on signup friction data). Supersedes PHASE_1_PROMPTS.md Session 3 prompt which mentioned email+password+OAuth — that prompt is outdated; decisions log is the source of truth going forward.
- **2026-05-20**: Added lib/email/ folder for transactional email infrastructure (Resend client + templates). Initial template: magic-link.ts (Session 3). Future templates: weekly digest, beta access notification, feedback acknowledgment.
- **2026-05-20**: Phase 1 email sending uses Resend dev mode (from onboarding@resend.dev → email used to sign up Resend only). Production from-domain at mnemo.app deferred to Phase 2 after domain purchased + Resend domain verification configured.
- **2026-05-20**: Drizzle schema uses snake_case columns + camelCase TS fields (casing: "snake_case" in drizzle.config.ts). 12 MVP tables defined. JSONB for weakness_clusters/quality_warnings/device_info with $type<> annotations. Circular FK between decks ↔ mock_tests dropped (app-level enforcement). Better Auth column mapping deferred to Session 3.
- **2026-05-19**: Next.js bumped from 15 to 16. create-next-app@latest installed Next 16.2.6 as default — Next.js team considers it stable for new projects. No breaking changes affecting our MVP. React Compiler is more stable in 16. React 19.2.4 unchanged.
- **2026-05-19**: Design tokens v0.1 locked (warm white / deep navy / warm gold + semantic + quality grades). All UI via Tailwind 4 `@theme` block. Fonts via `next/font/google` (Fraunces with WONK axis for Vietnamese italic accents).
- **2026-05-19**: Beta phase strategy — skip payment, use Gemini free tier, free for first 100 users, grandfather discount post-V2.
- **2026-05-19**: AI providers — Vercel AI SDK with Gemini as default (free), Claude Haiku as premium fallback (paid).
- **2026-05-19**: Tech stack locked. Mobile-first PWA. Quality engine closed source. Brand = Mnemo.
- **2026-05-19**: Pricing locked (for V2). Anki bridge always free.
- **2026-05-19**: Vertical = IELTS 6.5→7.5 Reading + Writing.
- **2026-05-19**: Tutor mode in MVP, not phase 2.
- **2026-05-19**: Cambridge IELTS copyright → use AWL public domain + AI-generated for starter decks.

## Working with Claude Code

When starting a session:

1. Read this CLAUDE.md fully before starting work
2. Use TodoWrite for complex multi-step tasks
3. Reference specific sections when making decisions
4. **If a request conflicts with this file, flag the conflict** and ask user
5. After implementing, run `pnpm build` and `pnpm test`
6. Commit frequently with conventional commit messages
7. Never invent decisions not specified here — ask the user
8. Never add anti-features

**Critical reminders for beta phase:**
- DO NOT install Stripe, MoMo, or ZaloPay SDKs
- DO NOT build payment UI, pricing page, or paywall logic
- DO check `beta_tester` flag and `BETA_MODE` env var on feature access
- DO use Vercel AI SDK with Gemini as default provider
- DO track usage in `usage_credits` table for analytics (no enforcement)
- DO disclose Gemini free tier data usage in Beta TOS

Language: User may chat in Vietnamese or English. Respond in same language. Code comments in English.
