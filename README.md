# ⛏️ Prospector

**Mine the internet for your next SaaS idea.**

Prospector discovers SaaS/app opportunities by mining frustration signals from Reddit, Hacker News, and the broader web. It uses AI to analyze sentiment, score opportunities, and surface the most promising ideas.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York)
- **Animation:** Framer Motion 12 (spring-based motion system)
- **Icons:** Lucide React
- **Fonts:** Inter (body) + Newsreader (headings/editorial) + Geist Mono (code/data)

## Design Philosophy

Inspired by:
- **Emil Kowalski** — motion grammar, soft futurism
- **Jordan Singer** — product poetry, humane minimalism
- **Mariana Castilho** — fluid interfaces
- **Muriel Cooper** — pre-internet interface metaphysics (depth, layering)
- **Susan Kare** — symbolic micro-iconography
- **Christopher Alexander** — pattern language structure
- **Dieter Rams** — moral baseline (honest, unobtrusive, as little design as possible)

## Pages

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ Built | Landing page — hero, how it works, features, footer |
| `/mine` | ✅ Built | Mining interface — input, progress animation, mock results |
| `/history` | 🔜 Planned | Mining history and saved opportunities |
| `/settings` | 🔜 Planned | User preferences and API keys |

## Not Yet Built

- **Auth** — Clerk or Supabase Auth
- **API Routes** — Will port from the Prospector CLI tool
- **Payment** — Stripe integration for premium mining
- **History** — Persistent mining history with search
- **Real Mining** — Currently uses mock data; API integration coming

## Case Study

See [CASE_STUDY.md](./CASE_STUDY.md) for the product framing, tradeoffs, and next steps.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout (fonts, theme)
│   ├── globals.css           # Design system
│   └── (dashboard)/
│       ├── layout.tsx        # Dashboard shell with sidebar
│       └── mine/
│           └── page.tsx      # Mining interface
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── landing/              # Landing page sections
│   │   ├── hero.tsx
│   │   ├── how-it-works.tsx
│   │   ├── social-proof.tsx
│   │   ├── features.tsx
│   │   └── footer.tsx
│   ├── dashboard/
│   │   └── sidebar.tsx
│   └── mining/
│       ├── mining-interface.tsx
│       ├── mining-progress.tsx
│       └── result-card.tsx
└── lib/
    ├── utils.ts              # cn() helper
    └── motion.ts             # Spring configs & animation variants
```

## Design System

- **Dark mode primary** with light mode secondary
- **Color palette:** Deep charcoal (#0a0a0b, #111113, #18181b), warm muted gold (#c9a84c → #e5c566)
- **Radius:** 12-16px (soft, not sharp, not pill)
- **Motion:** Spring-based via Framer Motion — nothing is static
- **Glass morphism:** Subtle backdrop blur, layered depth
- **Typography:** Sans (Inter) + Serif (Newsreader) = editorial data feel

---

Built by [Maxwell Young](https://github.com/maxwellyoung)

## AI quotas and configuration

`POST /api/mine` reserves one daily request before searching or calling Anthropic.
The per-IP and global caps default to 20 and 500 attempts per UTC day. Reservations
are atomic and are retained after errors; the model SDK does not retry paid calls.
Each request analyzes at most 20 posts in one model call, with 500 body characters
and 200 title characters per post, and at most 2,000 output tokens. JSON request
bodies are limited to 16 KiB, queries to 200 characters, niches to 100, and subreddit
lists to 10 valid names.

Set these **server-side** in Vercel Project Settings → Environment Variables for
Production and Preview (and `.env.local` for local development):

- `ANTHROPIC_API_KEY`: model key.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: an existing durable
  Upstash Redis database's HTTPS REST endpoint and writable token. Legacy
  `KV_REST_API_URL` + `KV_REST_API_TOKEN` are also accepted. Do not mix pairs.
- `AI_IP_DAILY_LIMIT` / `AI_GLOBAL_DAILY_LIMIT`: optional positive integer caps.

All deployments of this app should use the same store and limits to share the
budget. Disable Redis eviction so quota keys cannot be removed before reset.
Missing, partial, invalid or unreachable quota configuration returns **503** before
any paid call; exhausted quotas return **429** with `Retry-After`. Only explicit
local `NODE_ENV=development` without Vercel may use an in-memory fallback. On
Vercel the platform-overwritten `x-forwarded-for` identifies clients; other hosts
conservatively share one client bucket, ignoring untrusted forwarded headers.
No datastore or backend is provisioned by this change.

The helper uses [Upstash REST](https://upstash.com/docs/redis/features/restapi)
with one Lua EVAL so both daily counters are checked/reserved together, rather than
separate limiter calls. See [Vercel request headers](https://vercel.com/docs/headers/request-headers)
for the trusted proxy boundary. Run `npm test`, `npm run lint`, `npm run typecheck`
and `npm run build` before merging.
