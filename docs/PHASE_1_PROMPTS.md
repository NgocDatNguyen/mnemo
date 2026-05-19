# Phase 1 — Claude Code Session Prompts (Beta-First)

5 focused sessions to bootstrap Mnemo from scratch to a deployed landing page with auth + beta signup capping. Estimate ~10-15 hours total. **No payment integration in MVP** — beta is free for first 100 users.

**Important:** Before each session, ensure `CLAUDE.md` is in project root and Claude Code reads it. Start each session with `cd` into project directory and run `claude` CLI.

---

## Session 1 — Project scaffold + tooling (3-4h)

Copy-paste this prompt:

```
Read CLAUDE.md in this directory completely before doing anything else. Pay special attention to the "Beta Mode" and "AI providers" sections.

Phase 1, Session 1 goal: Scaffold a production-ready Next.js 15 project with all locked dependencies, ready for feature development. We are in BETA phase — DO NOT install any payment SDKs (Stripe, MoMo, ZaloPay).

Tasks to complete in this session (use TodoWrite to track):

1. Initialize Next.js 15 project with:
   - App Router
   - TypeScript strict mode
   - Tailwind CSS 4
   - Use pnpm as package manager

2. Install and configure these dependencies:
   - shadcn/ui (new-york style, slate base color)
   - Drizzle ORM + drizzle-kit + @neondatabase/serverless
   - Better Auth (with Drizzle adapter)
   - ts-fsrs
   - **AI SDK suite:** `ai`, `@ai-sdk/google`, `@ai-sdk/anthropic`, `zod`
   - @tanstack/react-query + provider setup
   - Resend
   - posthog-js + posthog-node
   - @sentry/nextjs
   - next-pwa
   - Biome (replace any ESLint/Prettier configs)
   - Vitest + @testing-library/react
   - Playwright
   - `@aws-sdk/client-s3` (for Cloudflare R2 S3-compatible API)
   - `uuidv7`
   - `pino` for logging

3. **DO NOT install:** stripe, @stripe/stripe-js, momo-sdk, zalopay-sdk, or any payment-related packages. We are beta-only.

4. Set up project structure per CLAUDE.md "File structure conventions" section.

5. Create `.env.example` with all required environment variables (placeholders):
   - DATABASE_URL
   - BETTER_AUTH_SECRET, BETTER_AUTH_URL
   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   - GOOGLE_GENERATIVE_AI_API_KEY  # for Gemini (default AI provider)
   - ANTHROPIC_API_KEY              # optional premium fallback
   - RESEND_API_KEY
   - NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
   - SENTRY_DSN, SENTRY_AUTH_TOKEN
   - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
   - **Beta config:**
     - BETA_MODE=true
     - BETA_USER_LIMIT=100

6. Configure Biome with sensible defaults (tab indent, double quotes, trailing commas). Add `pnpm lint` and `pnpm format` scripts.

7. Configure Vitest for unit tests, Playwright for e2e.

8. Set up basic GitHub Actions workflow `.github/workflows/ci.yml` that runs lint + typecheck + build + tests on PRs.

9. Create initial README.md with: project name, brief description, dev setup instructions, env var setup, **note about current beta phase**.

10. Run `pnpm build` to verify everything works. Fix any errors.

11. Commit with message `chore: initial project scaffold for beta phase`.

Constraints:
- Do NOT add any product features yet. This session is pure infrastructure.
- Do NOT install Prisma, Clerk, NextAuth, ESLint, Prettier, or any payment SDK.
- Ask me before installing any dependency not in the list above.

When done, report:
- All files created
- Build success/failure
- Any decisions made that I should review
```

**Validation after Session 1:**
- `pnpm dev` starts without errors
- `pnpm build` completes successfully
- `pnpm lint` runs clean
- `.env.example` has all keys including beta vars
- AI SDK packages installed correctly (`ai`, `@ai-sdk/google`, `@ai-sdk/anthropic`)
- No payment packages in package.json

---

## Session 2 — Database schema + Drizzle setup (3-4h)

Copy-paste this prompt:

```
Read CLAUDE.md completely, especially the "Database schema (MVP — with beta extensions)" section and "Beta Mode" section.

Phase 1, Session 2 goal: Implement complete database schema with Drizzle ORM, generate migrations, run against Neon Postgres. Schema MUST include beta-related fields (`beta_tester`, `beta_joined_at`) and feedback table.

Tasks (use TodoWrite):

1. Set up Drizzle config:
   - `drizzle.config.ts` pointing to schema directory and migrations directory
   - `lib/db/index.ts` exporting db client (Neon serverless driver)

2. Create schema files in `lib/db/schema/`:
   - `users.ts` — user table with `beta_tester` boolean and `beta_joined_at` timestamp
   - `auth.ts` — sessions, accounts, verifications (Better Auth)
   - `decks.ts`
   - `cards.ts`
   - `reviews.ts`
   - `review-logs.ts`
   - `mock-tests.ts` — include `ai_provider` and `ai_cost_estimate_cents` fields for telemetry
   - `cohorts.ts` — cohorts + cohort_members
   - `subscriptions.ts` — INCLUDE this table even though no records during beta (V2 readiness)
   - `usage-credits.ts` — track only, no enforcement during beta
   - `email-captures.ts` — waitlist when beta cap reached
   - `feedback.ts` — beta feedback collection
   - `index.ts` — barrel export

   Match the schema in CLAUDE.md exactly. Use UUID v7 for IDs (install `uuidv7` if not done).

3. Create enum types in `lib/db/schema/enums.ts`:
   - user_role, deck_type, deck_source, card_type, quality_score
   - review_state, review_rating, mock_test_type, mock_input_source
   - cohort_member_status, subscription_tier (include 'beta'), billing_cycle (include 'beta'), subscription_status (include 'beta')
   - feedback_type

4. Add indexes:
   - reviews: composite index on (user_id, due) for fast "due today" queries
   - reviews: unique constraint on (user_id, card_id)
   - cards: index on (deck_id)
   - cohort_members: composite pk on (cohort_id, user_id)
   - usage_credits: composite pk on (user_id, period_start)
   - users: index on `beta_tester` for fast counting of beta cohort

5. Set up query helpers in `lib/db/queries/`:
   - `users.ts` — getUserById, updateUserBand, getBetaUserCount, markAsBetaUser
   - `decks.ts` — listUserDecks, createDeck
   - `cards.ts` — getCardsInDeck, createCards (batch)
   - `reviews.ts` — getDueReviews, recordReview
   - `feedback.ts` — submitFeedback
   - (skeleton functions, just exports + types, implementation in later sessions)

6. Generate migration: `pnpm drizzle-kit generate`

7. I will provide a Neon DATABASE_URL. Add it to `.env.local`. Run migration: `pnpm drizzle-kit migrate`.

8. Verify with `pnpm drizzle-kit studio` that all tables exist.

9. Write a smoke test in `tests/db/connection.test.ts` that:
   - Connects to DB
   - Inserts a test user with `beta_tester=true`
   - Queries beta user count
   - Cleans up

10. Commit with message `feat(db): initial schema with beta-aware fields`.

Constraints:
- Strictly follow CLAUDE.md schema
- Money values in subscription/pricing are INTEGERS (cents)
- All timestamps are `timestamp with time zone`
- `subscriptions` table created but unused during beta — required for V2 readiness
```

**Before this session:** Sign up for Neon (https://neon.tech), create database, copy DATABASE_URL.

**Validation:**
- All migrations run successfully
- `pnpm drizzle-kit studio` shows all tables including `feedback`, `beta_tester` field on users
- Smoke test passes

---

## Session 3 — Better Auth + Beta access control (3h)

Copy-paste this prompt:

```
Read CLAUDE.md, especially "Beta Mode" and any auth-related sections.

Phase 1, Session 3 goal: Better Auth fully integrated with email + Google OAuth, with sign-in/sign-up/sign-out flows working. Sign-up automatically marks user as `beta_tester=true` if BETA_MODE is on and cap not reached.

Tasks (use TodoWrite):

1. Configure Better Auth in `lib/auth/server.ts`:
   - Drizzle adapter pointing to our users/sessions/accounts/verifications tables
   - Email + password provider
   - Google OAuth provider
   - Email verification flow with Resend
   - Session expiry: 30 days
   - **After sign-up hook:** if `BETA_MODE=true`, check current beta user count; if under `BETA_USER_LIMIT`, set `beta_tester=true` and `beta_joined_at=now()`; if over, redirect to waitlist

2. Configure client in `lib/auth/client.ts` for React hooks.

3. Create access control utility in `lib/auth/access.ts`:
   ```typescript
   export const BETA_MODE = process.env.BETA_MODE === 'true';
   export const BETA_USER_LIMIT = parseInt(process.env.BETA_USER_LIMIT || '100', 10);

   export async function canAccessFeature(
     user: User,
     feature: 'mock_test' | 'ai_generation' | 'tutor_mode' | 'anki_export'
   ): Promise<boolean> {
     if (BETA_MODE && user.beta_tester) return true;
     // Post-beta: implement subscription check
     return false; // for now during beta
   }

   export async function isBetaCapReached(): Promise<boolean> {
     const count = await getBetaUserCount();
     return count >= BETA_USER_LIMIT;
   }
   ```

4. Create auth API route handler at `app/api/auth/[...all]/route.ts`.

5. Build pages:
   - `app/(auth)/sign-in/page.tsx` — email + Google buttons
   - `app/(auth)/sign-up/page.tsx` — name, email, password; check beta cap before signup
   - `app/(auth)/verify-email/page.tsx`
   - `app/(auth)/reset-password/page.tsx`
   - `app/(auth)/sign-out/page.tsx`
   - `app/(auth)/waitlist/page.tsx` — shown when beta cap reached; collect email for `email_captures` table

6. Use shadcn/ui components: Card, Input, Button, Label, Form (with react-hook-form + zod).

7. Vietnamese UI by default. Add i18n with `i18n/vi.json` and `i18n/en.json`. Auth labels in both languages including "Bạn là một trong 100 beta tester đầu tiên — cảm ơn!"

8. Create middleware `middleware.ts`:
   - Protects `(app)` routes — redirect to /sign-in if not authenticated
   - If BETA_MODE and user.beta_tester=false, redirect to waitlist (edge case: user signed up before they were marked beta)

9. Create placeholder `app/(app)/dashboard/page.tsx`:
   - Shows "Welcome, {user.name}"
   - Shows "BETA — Miễn phí" badge prominently
   - Shows beta cohort number ("Bạn là beta tester #47")
   - Sign-out button
   - Placeholder feedback button

10. Set up Resend email templates in `lib/emails/templates/`:
    - Welcome email after sign-up — mentions beta status, "Chúng tôi sẽ liên lạc khi V2 launch, beta tester sẽ được ưu đãi đặc biệt"
    - Email verification
    - Password reset
    - Waitlist confirmation: "Beta đã đủ 100 người. Bạn ở vị trí số X trong danh sách chờ"

11. Test sign-up flow end-to-end:
    - Sign up with email → marked beta_tester=true → see verification email mentioning beta
    - Verify email → sign in → see dashboard with beta badge

12. Test Google OAuth flow + beta marking.

13. Test waitlist flow: simulate cap reached, ensure new signup → waitlist page.

14. Write Playwright e2e test for sign-up + beta marking + sign-in.

15. Commit `feat(auth): Better Auth + beta access control`.

Constraints:
- Sign-up MUST require email verification before access
- Sessions persist 30 days
- Password requirements: min 8 chars
- Default UI language = Vietnamese
- Beta cap enforcement MUST be race-safe (use transaction)
```

**Before this session:**
- Create Google OAuth credentials
- Sign up Resend, get API key
- Add to `.env.local`

**Validation:**
- Can sign up with email → see beta badge in dashboard
- Beta user count increases in DB
- Waitlist page appears when cap simulated
- Playwright test passes

---

## Session 4 — Landing page + waitlist (2-3h)

Copy-paste this prompt:

```
Read CLAUDE.md, especially "What is Mnemo?", "Target users", "Core value loop", "Anti-patterns", and "Beta Mode" sections.

Phase 1, Session 4 goal: Build the marketing landing page that captures emails for beta waitlist (or signup if beta cap not reached). Page emphasizes that beta is free and limited to first 100 users.

Page structure at `/`:

1. **Hero section:**
   - Headline VN: "Học một lần, nhớ trọn đời."
   - Subheadline: "Mnemo phân tích bài làm sai của bạn, tự động tạo flashcard cá nhân hóa, và lên lịch ôn tập tối ưu — để bạn lên band IELTS không phải bằng cách học vẹt."
   - **Beta badge prominent:** "🌱 Beta — Miễn phí cho 100 người dùng đầu tiên"
   - Live counter: "Đã có X/100 beta tester" (query from email_captures + users)
   - Primary CTA button:
     - If beta cap not reached: "Tham gia Beta miễn phí" → /sign-up
     - If beta cap reached: "Đăng ký waitlist" → email capture form

2. **The problem section:**
   - Heading: "Tại sao bạn stuck ở band 6.5?"
   - 3 columns: Quên nhanh / Không biết yếu gì / Tài liệu chung chung

3. **The solution section (the loop):**
   - Heading: "Quy trình Mnemo"
   - 4 steps with visuals: Upload mock → AI phân tích → Deck cá nhân → Ôn FSRS

4. **For tutors section:**
   - Heading: "Bạn là giáo viên IELTS?"
   - "Trong beta, tutor mode hoàn toàn miễn phí cho lớp đến 30 học viên."
   - CTA → /sign-up?role=tutor

5. **Trust section:**
   - "Mnemo respects open source. Anki bridge always free, no paywall."
   - "Made by Vietnamese developer in Hanoi"

6. **Beta transparency section:**
   - Heading: "Tại sao Beta?"
   - 3 points:
     - "Chúng tôi đang validate sản phẩm với 100 người dùng đầu tiên"
     - "Beta tester sẽ được lifetime grandfather discount khi V2 launch"
     - "Đổi lại: chúng tôi cần feedback chân thật của bạn"

7. **FAQ section** (accordion):
   - Tại sao không dùng Anki miễn phí?
   - Beta tester có phải pay sau này không? ("Bạn sẽ có ưu đãi đặc biệt grandfather khi V2 launch — chi tiết sẽ thông báo sau")
   - Khi nào V2 launch?
   - Có hỗ trợ Speaking không?
   - Data của tôi có an toàn không? ("Trong beta, chúng tôi dùng Gemini AI free tier — prompts có thể được Google dùng để cải thiện AI. Auto-redact thông tin cá nhân. V2 sẽ chuyển sang private tier.")

8. **Footer:**
   - Logo + tagline
   - Links: About Beta, Privacy, Terms, Anki Integration
   - Email: hello@mnemo.app
   - Built in Hanoi, Vietnam

Signup vs Waitlist flow:
- Server component checks `getBetaUserCount() < BETA_USER_LIMIT`
- If under cap: CTA → /sign-up directly
- If over cap: CTA → email capture form → insert into `email_captures` → send waitlist confirmation email

Design:
- Calm, minimal, "serious learner"
- Warm white #FAFAF7 / deep navy #1A2547 / warm gold #B8845F
- Mobile-first (375px)
- Inter (body) + Fraunces (display) from Google Fonts

Performance:
- Lighthouse mobile ≥85
- Server Components for static content
- Image optimization via next/image

Tasks:
1. Build landing page with conditional CTA
2. Implement email capture Server Action for waitlist
3. Resend templates: waitlist confirmation
4. Beta counter component (real-time from DB)
5. SEO meta tags
6. Test mobile + desktop
7. Lighthouse audit
8. Commit `feat(marketing): landing page with beta signup and waitlist`
```

**Validation:**
- Lighthouse mobile ≥85
- Live beta counter shows current count
- When under cap: CTA goes to signup
- When at cap (manually test by setting BETA_USER_LIMIT=0): CTA goes to waitlist
- Email capture works

---

## Session 5 — Deploy to Vercel + verify everything (1-2h)

Copy-paste this prompt:

```
Read CLAUDE.md.

Phase 1, Session 5 goal: Deploy Mnemo to production at mnemo.app with full beta mode working.

Tasks:

1. Set up Vercel project, connect GitHub repo.

2. Add all environment variables to Vercel:
   - DATABASE_URL (Neon production branch)
   - BETTER_AUTH_SECRET, BETTER_AUTH_URL=https://mnemo.app
   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   - GOOGLE_GENERATIVE_AI_API_KEY (Gemini free tier key from aistudio.google.com)
   - RESEND_API_KEY
   - NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
   - SENTRY_DSN, SENTRY_AUTH_TOKEN
   - R2_* credentials
   - **BETA_MODE=true**
   - **BETA_USER_LIMIT=100**

3. Configure custom domain mnemo.app (you provide CNAME values, I update DNS).

4. Configure preview deployments + main → production auto-deploy.

5. Verify monitoring:
   - Sentry catches a test error
   - Posthog records pageview
   - Vercel Analytics enabled

6. Security headers in `next.config.ts`:
   - Strict-Transport-Security
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Content-Security-Policy (start permissive)
   - Referrer-Policy: strict-origin-when-cross-origin

7. **Test production deployment end-to-end:**
   - https://mnemo.app loads landing page with beta badge
   - Sign up with new email → marked as beta_tester
   - Receive verification email
   - Verify → see dashboard with "BETA — Miễn phí" badge
   - Beta counter increments
   - Sentry receives test error
   - Posthog records signup event

8. Test waitlist flow:
   - Temporarily set BETA_USER_LIMIT=0 in Vercel
   - Try signup → should redirect to waitlist
   - Submit email → receive waitlist confirmation email
   - Reset BETA_USER_LIMIT=100

9. Document in README.md:
   - How to deploy
   - How to add new env var
   - How to roll back
   - How to switch BETA_MODE off when V2 ready (with checklist of what to add)

10. Commit `chore: production deployment with beta mode active`.

Constraints:
- Use Vercel free tier (Hobby)
- All secrets in Vercel env, never in git
- Production must have BETA_MODE=true initially
```

**Before this session:**
- Buy mnemo.app domain
- Get Gemini API key at https://aistudio.google.com (free)
- Set up Vercel account
- Sign up Resend, get API key
- Sign up Posthog + Sentry, get keys
- Sign up Cloudflare R2, create bucket

**Validation:**
- https://mnemo.app live with beta badge
- Signup → beta_tester=true in production DB
- Beta counter live
- All monitoring receiving data
- Waitlist mode works when toggled

---

## After Phase 1

You have:
- ✅ Deployed landing page at mnemo.app
- ✅ Working auth with beta marking
- ✅ Database schema ready (including V2-ready subscription tables)
- ✅ Monitoring + analytics
- ✅ CI/CD pipeline
- ✅ Live beta counter / waitlist failover

**This is your "alive on internet, ready for first user" milestone.** Start collecting signups while you build Phase 2.

## Phase 2 preview — Mock test → AI deck (the heart of Mnemo)

Next sessions will build the core value loop:

- **Session 6:** Mock test upload UI (photo / PDF / manual text input)
- **Session 7:** Gemini Vision OCR + text extraction pipeline
- **Session 8:** Weakness analyzer (Gemini Flash prompt engineering)
- **Session 9:** AI card generator with Vercel AI SDK (`generateObject` with Zod schema)
- **Session 10:** Card editor with quality engine integration (Gemini Flash-Lite classification)

Ask user "Generate Phase 2 prompts" when ready to proceed.

---

## Tips for working with Claude Code

### Session hygiene
- One session = one focused goal
- Start each session by `cd` into project + `claude`
- CLAUDE.md is read automatically
- Use plan mode (`/plan`) for complex tasks
- Use TodoWrite for multi-step work

### When to interrupt
- Claude suggests installing Stripe/payment SDK → "Stop. We're in beta phase, no payment."
- Claude suggests Prisma/Clerk/NextAuth → wrong stack, redirect
- Claude adds gamification → wrong, anti-pattern
- Claude suggests OpenAI SDK → wrong, we use Vercel AI SDK
- Scope creep → "Stop. Focus only on [specific task]."

### Commit cadence
- Commit at each working milestone
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Push to GitHub after each session

### Context management
- Long sessions degrade after 60-90 min — exit and start fresh
- Reference specific CLAUDE.md sections when asking questions
- If Claude Code seems confused, ask it to re-read CLAUDE.md

### Red flags
- "Let me also add payment integration..." → STOP, beta phase
- "I'll add Stripe webhooks just in case..." → STOP, beta phase
- "Let me improvise the data structure..." → STOP, refer to CLAUDE.md schema
- "I'll add some gamification..." → STOP, anti-pattern
- Long answer without TodoWrite → ask it to plan first

---

## Cost expectation (Phase 1 + first 3 months beta)

**One-time:**
- Domain mnemo.app: ~$30-50/year

**Recurring (during beta):**
- Vercel: $0 (free Hobby tier)
- Neon Postgres: $0 (free tier 0.5GB)
- Cloudflare R2: $0 (free 10GB)
- **Gemini API: $0** (free tier, 1500 RPD)
- Resend: $0 (free 3k email/month)
- Posthog: $0 (free 1M events)
- Sentry: $0 (free 5k errors)

**Total Phase 1 + beta first 3 months cost: ~$40-50 + your time.**

Only when you hit Gemini free tier limits (>50 active users doing daily mock tests) or want to migrate off free tier for privacy → add ~$20-50/month for Gemini paid tier or Claude Haiku.

Beta validates product-market fit at near-zero infrastructure cost.

---

## When ready to launch V2 (post-beta)

Checklist for switching `BETA_MODE=false`:

1. Set `BETA_MODE=false` in Vercel env
2. Install Stripe SDK + create products
3. Build pricing page at `/pricing`
4. Build subscription management page at `/settings/billing`
5. Implement MoMo + ZaloPay integration for VN users
6. Update `canAccessFeature` to check subscription tier
7. Migrate beta users to grandfather subscription tier:
   - Option A: Free Pro for 6 months
   - Option B: 50% off lifetime
8. Send announcement email to all beta users
9. Update landing page CTA from "Tham gia Beta" to "Bắt đầu miễn phí"
10. Upgrade Gemini to paid Tier 1 OR migrate to Claude (privacy)

This will be a separate session set when you're ready.
