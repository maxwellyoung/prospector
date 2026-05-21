# Prospector Case Study

## Problem

Good product ideas often start as repeated frustration, but the signal is scattered across forums, comments, support threads, and niche communities. Prospector explores a workflow for collecting those signals and turning them into more concrete product opportunities.

## Approach

The app frames opportunity discovery as a mining workflow: enter a market or audience, gather raw signals, score the pain, then review possible product angles. The current public version focuses on the interface and product model.

## Engineering decisions

- Use Next.js App Router for a product surface that can grow from landing page into dashboard.
- Keep the mining interface stateful and animated so the system feels inspectable while work is happening.
- Separate landing, dashboard, and mining components to keep marketing and product flows distinct.
- Use TypeScript and shadcn-style primitives for a UI that can be hardened into a real SaaS surface.

## Tradeoffs

- The public demo uses mock results, which keeps the repo safe and easy to run but limits evidence of backend depth.
- A broad mining workflow can become vague quickly, so the strongest future direction is narrow vertical searches with better scoring.
- AI summaries are useful only when the raw evidence remains inspectable.

## Next steps

- Add real data connectors behind explicit user-provided inputs.
- Store mining runs and let users compare opportunities over time.
- Add source citations for every scored opportunity.
- Build a small evaluation set for scoring quality.
