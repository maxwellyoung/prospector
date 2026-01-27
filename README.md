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
