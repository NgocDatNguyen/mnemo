# Mnemo

**Mnemo — học một lần, nhớ trọn đời.**
*Turn what you study into what you know.*

AI flashcard builder for IELTS learners stuck at band 6.5 trying to reach 7.0-7.5. Upload mock tests, get personalized flashcards targeting your weaknesses, review via FSRS spaced repetition.

## Beta phase

Mnemo is currently in **closed beta**, free for the first 100 testers. No payment integration yet — see [`CLAUDE.md`](./CLAUDE.md) "Beta Mode" section for details. Beta testers receive grandfather pricing when V2 launches.

## Tech stack

- Next.js 16 (App Router) · TypeScript strict
- Tailwind CSS 4 · shadcn/ui (new-york)
- Drizzle ORM · Neon Postgres
- Better Auth
- Vercel AI SDK · Gemini 2.5 Flash (default) / Claude Haiku (premium fallback)
- ts-fsrs
- Biome · Vitest · Playwright

See [`CLAUDE.md`](./CLAUDE.md) for the locked spec (schema, design tokens, anti-patterns, decisions log).

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in values
pnpm dev                     # http://localhost:3000
```

### Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | Biome lint + format check |
| `pnpm format` | Biome format (writes changes) |
| `pnpm typecheck` | TypeScript no-emit check |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright E2E tests (needs `npx playwright install chromium` first) |

### Required services for full local dev

| Service | Free tier | Purpose |
|---|---|---|
| Neon Postgres | 0.5GB | App database |
| Google AI Studio | Gemini free tier | AI generation |
| Resend | 3k emails/month | Transactional email |
| Cloudflare R2 | 10GB | Mock test photo storage |
| PostHog | 1M events | Product analytics |
| Sentry | 5k errors | Error tracking |

Beta testers can run with `DATABASE_URL` + `BETTER_AUTH_SECRET` only; AI/email/storage features will be stubbed until configured.

## Project structure

See [`CLAUDE.md`](./CLAUDE.md) "File structure conventions" — root-level `app/`, `components/`, `lib/`, `i18n/`, `tests/`. Path alias `@/*` maps to project root.

## License

Proprietary. Anki bridge import/export is permanently free, regardless of phase.
