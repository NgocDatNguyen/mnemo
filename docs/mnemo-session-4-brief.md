# Mnemo Session 4 — Landing Page + Placeholder Routes Brief

## Page goal

Convert IELTS band-6.5 Vietnamese learners ("Linh" persona per CLAUDE.md) into beta signups. Communicate three things in order:

1. **What Mnemo does** (analyze your mock-test mistakes → personalized flashcards → FSRS review)
2. **Why it works** (proven SRS science, no-lock-in, anti-gamification stance)
3. **How to start** (join beta → magic link signup; or join waitlist if cap reached)

Secondary goal: position against Duolingo-style gamification and against generic flashcard apps. Mnemo is a **calm tool for serious learners**, not an engagement-loop app.

## Audience hierarchy

- **Primary**: Linh — VN female, 19-28, currently band 6.0-6.5, target 7.0-7.5, Reading + Writing focus, mobile-first. Skeptical of Vietnamese ed-tech buzzword copy. Wants substance.
- **Secondary**: Tutor referral (Anh Tuấn persona) — same page; role differentiation happens in onboarding (Session 5).
- **Not addressed**: beginners (<5.5), parents, casual learners, IELTS 7.5+, Speaking-focused users.

## Brand voice

| Be | Not be |
|---|---|
| Factual | Marketing-y |
| Calm | Excited / urgent |
| Quietly confident | Salesy |
| Vietnamese-natural | Literal EN→VN translation |
| Pro-serious-learner | Pro-fun-engagement |

Hard rules: no emojis, no exclamation marks, no "AI-powered" / "revolutionary" / "transform", no comparison pricing tables, no mascots / photos / stock illustrations.

## Visual system

- **Background**: warm white `#FAFAF7` (entire page)
- **Text**: deep navy `#1A2547` primary, `#4A5570` secondary, `#8590A8` muted
- **Accent**: warm gold `#B8845F` — buttons, links, geometric decoration only
- **Wordmark**: Fraunces serif at hero scale
- **Body**: Inter sans
- **Decoration**: abstract geometric SVGs (lines, dots, subtle curves) in `#B8845F`, used **sparingly** — at most one per section. Generous whitespace.
- **No** quality-grade colors (`#4A6B4A`, `#5A6878`, etc.) — those belong to the app interior, not marketing
- **Section dividers**: 1px `#E8E5E0` horizontal line (subtle)
- **Mobile-first**: design at 375px first; desktop breakpoint at 768px

## Section structure (top to bottom)

### 1. Hero

**Visual layout**: single column, generous vertical padding (~96px top, ~72px bottom on desktop), left-aligned.

**Above the headline** — a small beta pill badge:

> `Beta 0.1 · Miễn phí cho 100 người đầu`

In Inter 12px uppercase tracked (0.06em), accent gold border + accent gold text on bg-subtle background.

**Headline** (Fraunces Display M, ~36-48px depending on viewport, weight 500, `letter-spacing: -0.02em`, color `#1A2547`):

> Mnemo — học một lần, *nhớ trọn đời*

The phrase **"nhớ trọn đời"** uses italic Fraunces with WONK axis at 1: `font-style: italic; font-variation-settings: 'WONK' 1;`. This is the brand-defining visual treatment.

**Subhead** (Inter Body L, ~18px, color `#4A5570`, max-width ~600px):

> Mnemo phân tích bài làm sai, tạo flashcard riêng cho điểm yếu của bạn, và lên lịch ôn để bạn nhớ lâu.
>
> Dành cho người học IELTS muốn từ band 6.5 lên 7.0–7.5.

**CTA row** (2 buttons side-by-side on desktop, stacked on mobile):

- **Primary** (warm gold filled): `Tham gia beta` → `/login`
- **Secondary** (text link with underline, no border): `Vào waitlist` → `/waitlist`

Below the CTAs, a small clarifying line in muted gray (~13px):

> Không cần mật khẩu. Đăng nhập qua link email.

**Geometric decoration**: a thin warm-gold horizontal line (~80px wide) below the headline, before the subhead. Single decoration; nothing else in the hero.

---

### 2. Methodology — "Cách Mnemo hoạt động"

**Heading**: `Cách Mnemo hoạt động` (Inter H1, 24px, weight 600, `#1A2547`)

**Subhead** (Inter Body M, `#4A5570`):

> Ba bước từ bài thi thử đến nhớ lâu.

**Three columns** (1 col on mobile, 3 cols on desktop, equal width, padding ~32px):

| # | Icon (Lucide) | Heading | Body |
|---|---|---|---|
| 1 | `scan-search` (24px, accent gold) | `Phân tích bài thi thử` | `Tải ảnh bài làm sai của bạn. Mnemo nhận diện chữ viết tay, phân tích từ vựng, ngữ pháp và collocation bạn còn yếu.` |
| 2 | `layers` (24px, accent gold) | `Flashcard cá nhân hóa` | `Mnemo tạo 10-30 flashcard nhắm đúng điểm yếu. Mỗi card được Quality Engine chấm điểm trước khi vào deck của bạn.` |
| 3 | `calendar-clock` (24px, accent gold) | `Lịch ôn theo FSRS` | `Thuật toán FSRS quyết định khi nào bạn cần ôn lại từng card — không quá sớm, không quá muộn. Nhớ lâu, học ít hơn.` |

`Quality Engine` kept as English brand term per CLAUDE.md naming convention.

**Visual decoration**: nothing — just the three columns.

---

### 3. Why this works — "Tại sao Mnemo hoạt động"

**Heading**: `Tại sao Mnemo hoạt động` (Inter H1, 24px, weight 600)

**Three short paragraphs** (Inter Body M, `#1A2547`, max-width ~640px, generous line-height):

**Para 1 — FSRS / SRS precedent:**

> FSRS không phải thuật toán mới. Spaced repetition đã được Anki — phần mềm flashcard mã nguồn mở — chứng minh trong gần 20 năm. Mnemo dùng FSRS-5, phiên bản hiện đại nhất, được tinh chỉnh từ hàng triệu lượt ôn của người học toàn thế giới.

**Para 2 — No lock-in:**

> Anki bridge: bạn có thể import file `.apkg` vào Mnemo, và export ngược lại bất cứ lúc nào. Tính năng này miễn phí vĩnh viễn, kể cả sau khi Mnemo có gói trả phí. Nếu bạn không thích Mnemo, bạn không mất gì.

**Para 3 — Anti-gamification:**

> Mnemo không có streak, không có level, không có mascot dễ thương nhắc bạn vào học. Đây là công cụ cho người học nghiêm túc — không phải trò chơi học.

**Visual decoration**: a single warm-gold dot pattern (3x3 dots, ~6px each, ~12px gap) to the left of the heading. Subtle.

---

### 4. Pricing callout

**Visual**: a single card-style block with `bg-bg-subtle` (`#F5F4EF`) background, ~32px padding, 8px border-radius. Centered horizontally, max-width ~640px.

**Content** (single paragraph, Inter Body M, `#1A2547`):

> Hiện tại Mnemo đang trong beta: miễn phí cho 100 người đầu tiên. Sau beta sẽ có gói trả phí — người dùng beta được giữ giá ưu đãi vĩnh viễn (grandfather pricing).

**Visual decoration**: subtle warm-gold left border (~3px) on the card to emphasize without shouting.

---

### 5. CTA section

**Heading** (Fraunces Display S, ~28px, weight 500, `#1A2547`):

> Mnemo đang mở cho 100 người dùng đầu

**Body** (Inter Body M, `#4A5570`):

> Tham gia bây giờ hoặc vào waitlist nếu beta đã đầy.

**CTA row** (same as hero — primary + secondary, side-by-side on desktop, stacked on mobile):

- Primary: `Tham gia beta` → `/login`
- Secondary: `Vào waitlist` → `/waitlist`

**Visual decoration**: a thin warm-gold horizontal line (~80px wide) above the heading.

---

### 6. Footer

**Layout**: single row on desktop (logo+tagline left, links right). Stacked on mobile.

| Slot | Content |
|---|---|
| Wordmark | `Mnemo` (Fraunces, 20px, weight 500, `#1A2547`) |
| EN tagline | `Mnemo — turn what you study into what you know` (Inter, 13px italic, `#8590A8`) |
| Attribution | `Made in Hà Nội · Beta 0.1` (Inter, 12px, `#8590A8`) |
| Links | `Privacy` → `/privacy` · `Terms` → `/terms` (Inter, 13px, `#4A5570`, underline on hover) |

**Visual decoration**: 1px `#E8E5E0` horizontal divider above the footer block.

No social media. No contact email yet.

---

## Routes covered by Session 4

| Route | Purpose | Content |
|---|---|---|
| `/` | Landing | All sections above |
| `/dashboard` | App placeholder (auth-protected by Session 3 middleware) | shadcn `Card`: `Mnemo đang được hoàn thiện. Bạn sẽ nhận email khi sẵn sàng.` + sign-out button. Server component reading session via `auth.api.getSession()`. |
| `/privacy` | Marketing placeholder | shadcn `Card`: `Chính sách bảo mật đang được hoàn thiện. Sẽ có bản đầy đủ trước khi Mnemo ra mắt chính thức.` + back-to-home link. |
| `/terms` | Marketing placeholder | shadcn `Card`: `Điều khoản sử dụng đang được hoàn thiện. Sẽ có bản đầy đủ trước khi Mnemo ra mắt chính thức.` + back-to-home link. |

## Component structure

```
components/marketing/
├── hero.tsx              # Beta badge + headline (WONK italic) + subhead + CTA row
├── methodology.tsx       # Heading + 3-column grid with icons
├── why-works.tsx         # Heading + 3 paragraphs
├── pricing-callout.tsx   # Card with single paragraph
├── cta-section.tsx       # Heading + body + CTA row (reuse buttons from hero)
└── footer.tsx            # Wordmark + tagline + attribution + links
```

`app/page.tsx` composes these in order. All components are server components (no client state on landing).

## Dependencies to install

| Package | Why |
|---|---|
| `lucide-react` | Icons for methodology section |

shadcn `Card` and `Button` already installed (Session 3) — reused for dashboard/privacy/terms placeholders and CTAs.

## i18n strategy

Populate `i18n/vi.json` and `i18n/en.json` with all landing page strings organized by section. Components read from a typed JSON via a small `getCopy(locale)` helper (Vietnamese is default; English provided for V2 readiness but not yet switchable in UI).

Schema:

```json
{
  "hero": { "badge": "...", "headline": "...", "headlineItalic": "...", "subhead": "...", ... },
  "methodology": { "heading": "...", "columns": [ ... ] },
  ...
}
```

No multi-language switcher UI in this session.

## SEO meta

In `app/layout.tsx`, extend `metadata`:

```ts
{
  title: { default: "Mnemo — học một lần, nhớ trọn đời", template: "%s · Mnemo" },
  description: "Mnemo phân tích mock test của bạn, tạo flashcard cá nhân hóa, và dùng FSRS để bạn nhớ lâu. Cho IELTS Reading + Writing, band 6.5 lên 7.0–7.5.",
  openGraph: {
    title: "Mnemo — học một lần, nhớ trọn đời",
    description: "Mnemo phân tích mock test của bạn, tạo flashcard cá nhân hóa, và dùng FSRS để bạn nhớ lâu. Cho IELTS Reading + Writing, band 6.5 lên 7.0–7.5.",
    type: "website",
    locale: "vi_VN",
    url: "https://mnemo.app",
    siteName: "Mnemo",
  },
  twitter: { card: "summary_large_image", title: "Mnemo — học một lần, nhớ trọn đời", description: "..." },
  alternates: { canonical: "https://mnemo.app" }
}
```

No OG image yet (would need design work) — flag as Phase 2.

## Tests

Single component test verifying:
- Hero renders the headline text
- Primary CTA link points to `/login`
- Secondary CTA link points to `/waitlist`

`tests/unit/marketing/hero.test.tsx` using `@testing-library/react` + Vitest. Render + `getByRole('link', { name: /tham gia beta/i })` + `getByRole('link', { name: /waitlist/i })`.

## CLAUDE.md decisions log entry (to append after commit)

> **2026-05-20**: Landing page locked (sections: hero with WONK italic on "nhớ trọn đời", 3-column methodology, 3-paragraph why-works, pricing callout, CTA, footer). Anti-gamification positioning explicit. Anki bridge wording clarified as "free forever even after Mnemo paid tier" to avoid contradicting pricing callout. No live beta counter in MVP. No OG image yet. i18n files populated for vi + en but no UI switcher.

## Out of scope (defer to later sessions)

- Working signup flow (Session 3 handles auth — landing just links to `/login`)
- Real dashboard content (Session 5+)
- Real privacy/terms text (legal review needed, current placeholders OK for beta launch)
- Live beta counter on landing (`X/100 đã tham gia`) — adds DB-on-render complexity for marginal marketing value
- Marketing animations / scroll reveal effects
- PostHog event wiring for CTA clicks (later infra session)
- Multi-language UI switcher
- OG image (Phase 2 — needs design pass)
- Accessibility audit (basic semantic HTML + alt text only)
- Lighthouse score optimization (the Next 16 + Tailwind 4 + minimal page should pass ≥85 mobile by default; not formally verified)
