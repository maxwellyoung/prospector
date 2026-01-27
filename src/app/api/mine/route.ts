import Anthropic from "@anthropic-ai/sdk";

// ===== Types =====

interface MineRequest {
  query: string;
  niche?: string;
  depth?: "quick" | "deep";
  subreddits?: string[];
}

interface Post {
  source: "reddit" | "hackernews";
  subreddit?: string;
  title: string;
  text: string;
  score: number;
  num_comments: number;
  url: string;
  hn_url?: string;
  created_utc: number;
}

interface Analysis {
  pain_point: string;
  intensity: number;
  willingness_to_pay: number;
  idea: string;
  market_size: "small" | "medium" | "large";
  category: string;
}

interface AnalyzedPost extends Post {
  analysis: Analysis;
}

interface ScoredOpportunity {
  score: number;
  idea: string;
  pain_point: string;
  quote: string;
  frequency: number;
  avg_intensity: number;
  avg_willingness_to_pay: number;
  market_size: string;
  category: string;
  sources: Record<string, number>;
  posts: AnalyzedPost[];
}

// ===== Constants =====

const USER_AGENT = "Mozilla/5.0 (compatible; Prospector/1.0)";

const DEFAULT_SUBREDDITS = [
  "SaaS", "startups", "smallbusiness", "Entrepreneur", "freelance",
  "webdev", "sysadmin", "devops", "marketing", "accounting",
];

const FRUSTRATION_PATTERNS = [
  "I wish", "I hate", "frustrated",
  "looking for alternative", "anyone know a tool",
];

const HN_FRUSTRATION_QUERIES = [
  "looking for", "what tool do you use", "frustrated",
  "I wish", "alternative to", "anyone built",
];

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "it", "to", "for", "of", "and", "or", "in",
  "on", "at", "by", "with", "from", "that", "this", "as", "be", "are",
  "was", "were", "been", "has", "have", "had", "do", "does", "did",
  "but", "not", "no", "so", "if", "just", "more", "some", "any",
  "i", "me", "my", "you", "your", "we", "our", "they", "their",
  "what", "which", "who", "when", "where", "how", "why",
  "can", "could", "would", "should", "will", "need", "want",
  "like", "use", "using", "used", "get", "got", "make", "thing",
  "about", "there", "than", "too", "also", "very", "really",
  "all", "one", "out", "up", "don't", "doesn't", "didn't",
]);

const MARKET_MULTIPLIER: Record<string, number> = {
  small: 1,
  medium: 2,
  large: 3,
};

const MAX_BATCH_SIZE = 30;
const MAX_TEXT_LENGTH = 500;
const MODEL = "claude-sonnet-4-20250514";

// ===== Helpers =====

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendSSE(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: Record<string, unknown>
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

// ===== Reddit Search =====

async function redditFetch(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (response.status === 429) {
    // Rate limited — skip
    return null;
  }

  if (response.status === 403) {
    // Forbidden — skip
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function extractRedditPosts(data: unknown): Post[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children = (data as any)?.data?.children;
  if (!Array.isArray(children)) return [];

  return children.map((child: { data: Record<string, unknown> }) => ({
    source: "reddit" as const,
    subreddit: child.data.subreddit as string,
    title: (child.data.title as string) || "",
    text: (child.data.selftext as string) || "",
    score: (child.data.score as number) || 0,
    num_comments: (child.data.num_comments as number) || 0,
    url: `https://www.reddit.com${child.data.permalink}`,
    created_utc: (child.data.created_utc as number) || 0,
  }));
}

async function searchReddit(
  query: string,
  options: { niche?: string; depth?: "quick" | "deep"; subreddits?: string[] }
): Promise<Post[]> {
  const { niche, depth = "quick", subreddits } = options;
  const targetSubreddits = subreddits || DEFAULT_SUBREDDITS;
  const isDeep = depth === "deep";
  const allResults: Post[] = [];
  const seen = new Set<string>();

  function addPost(post: Post) {
    if (!seen.has(post.url)) {
      seen.add(post.url);
      allResults.push(post);
    }
  }

  // Build queries
  const focus = niche || query;
  const queries = [query];
  for (const pattern of FRUSTRATION_PATTERNS) {
    queries.push(`${focus} ${pattern}`);
  }
  const activeQueries = isDeep ? queries : queries.slice(0, 4);

  // 1. Global search
  try {
    const params = new URLSearchParams({
      q: query,
      sort: "relevance",
      limit: isDeep ? "100" : "50",
    });
    const data = await redditFetch(
      `https://www.reddit.com/search.json?${params}`
    );
    if (data) {
      extractRedditPosts(data).forEach(addPost);
    }
    await sleep(1200);
  } catch {
    // Skip errors silently
  }

  // 2. Subreddit-specific searches
  const subLimit = isDeep
    ? targetSubreddits.length
    : Math.min(5, targetSubreddits.length);
  const queryLimit = isDeep ? 3 : 1;

  for (let i = 0; i < subLimit; i++) {
    const sub = targetSubreddits[i];
    for (let q = 0; q < queryLimit && q < activeQueries.length; q++) {
      try {
        const params = new URLSearchParams({
          q: activeQueries[q],
          sort: "relevance",
          limit: isDeep ? "50" : "25",
          restrict_sr: "on",
        });
        const data = await redditFetch(
          `https://www.reddit.com/r/${sub}/search.json?${params}`
        );
        if (data) {
          extractRedditPosts(data).forEach(addPost);
        }
        await sleep(1200);
      } catch {
        // Skip errors
      }
    }
  }

  return allResults;
}

// ===== Hacker News Search =====

async function searchHackerNews(
  query: string,
  options: { niche?: string; depth?: "quick" | "deep" }
): Promise<Post[]> {
  const { niche, depth = "quick" } = options;
  const isDeep = depth === "deep";
  const allResults: Post[] = [];
  const seen = new Set<string>();

  const focus = niche || query;

  // Build queries
  const queries = [`Ask HN ${focus}`];
  const patternCount = isDeep ? HN_FRUSTRATION_QUERIES.length : 3;
  for (let i = 0; i < patternCount; i++) {
    queries.push(`${focus} ${HN_FRUSTRATION_QUERIES[i]}`);
  }

  for (const q of queries) {
    try {
      const params = new URLSearchParams({
        query: q,
        tags: "(story,ask_hn)",
        hitsPerPage: isDeep ? "50" : "30",
      });
      const response = await fetch(
        `https://hn.algolia.com/api/v1/search?${params}`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const hits = data.hits || [];

      for (const hit of hits) {
        const key = hit.objectID;
        if (seen.has(key)) continue;
        seen.add(key);

        allResults.push({
          source: "hackernews",
          title: hit.title || "",
          text: hit.story_text || hit.comment_text || "",
          score: hit.points || 0,
          num_comments: hit.num_comments || 0,
          url:
            hit.url ||
            `https://news.ycombinator.com/item?id=${hit.objectID}`,
          hn_url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
          created_utc: hit.created_at_i || 0,
        });
      }

      await sleep(500);
    } catch {
      // Skip errors
    }
  }

  // Deep mode: also search comments
  if (isDeep) {
    try {
      const params = new URLSearchParams({
        query: focus,
        tags: "comment",
        hitsPerPage: "50",
      });
      const response = await fetch(
        `https://hn.algolia.com/api/v1/search?${params}`,
        { headers: { Accept: "application/json" } }
      );

      if (response.ok) {
        const data = await response.json();
        for (const hit of data.hits || []) {
          const key = `comment-${hit.objectID}`;
          if (seen.has(key)) continue;
          seen.add(key);

          allResults.push({
            source: "hackernews",
            title: `[Comment] ${hit.story_title || "HN comment"}`,
            text: hit.comment_text || "",
            score: hit.points || 0,
            num_comments: 0,
            url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
            hn_url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
            created_utc: hit.created_at_i || 0,
          });
        }
      }
    } catch {
      // Skip
    }
  }

  return allResults;
}

// ===== Claude Analysis =====

function buildAnalysisPrompt(posts: Post[]): string {
  const postsText = posts
    .map((p, i) => {
      const text = p.text ? p.text.slice(0, MAX_TEXT_LENGTH) : "";
      const source =
        p.source === "reddit" ? `Reddit (r/${p.subreddit})` : "Hacker News";
      return `[${i}] Source: ${source}\nTitle: ${p.title}\nBody: ${text}\nScore: ${p.score} | Comments: ${p.num_comments}`;
    })
    .join("\n\n");

  return postsText;
}

const SYSTEM_PROMPT = `You are a SaaS opportunity analyst. Analyze these forum posts and comments to identify product/business opportunities.

For each distinct pain point or opportunity you identify, return a JSON object with:
- "idea": string — A concise SaaS/app idea that solves the problem (one sentence)
- "painPoint": string — The core frustration or need expressed (direct quote or close paraphrase, in quotes)
- "category": string — One of: productivity, finance, dev-tools, marketing, health, ecommerce, education, communication, HR, legal, other
- "intensity": number 1-10 — How frustrated/desperate are they?
- "willingnessToPay": number 1-10 — Based on language, how likely they'd pay for a solution?
- "marketSize": "small" | "medium" | "large" — Estimated addressable market
- "sourceIndices": number[] — Which posts (by index) relate to this opportunity

Return ONLY a JSON array of these objects. No markdown, no explanation. If no clear opportunities, return [].`;

async function analyzePosts(posts: Post[]): Promise<AnalyzedPost[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  if (posts.length === 0) return [];

  // Filter meaningful posts
  const meaningful = posts.filter(
    (p) =>
      (p.title && p.title.length > 10) || (p.text && p.text.length > 20)
  );

  if (meaningful.length === 0) return [];

  const client = new Anthropic({ apiKey });

  // Batch posts
  const batches: Post[][] = [];
  for (let i = 0; i < meaningful.length; i += MAX_BATCH_SIZE) {
    batches.push(meaningful.slice(i, i + MAX_BATCH_SIZE));
  }

  const allAnalyzed: AnalyzedPost[] = [];

  for (const batch of batches) {
    try {
      const postsText = buildAnalysisPrompt(batch);
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analyze these ${batch.length} forum posts:\n\n${postsText}`,
          },
        ],
      });

      const text =
        message.content[0].type === "text" ? message.content[0].text : "";

      // Parse JSON — handle potential markdown wrapping
      let jsonStr = text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }

      const analyses = JSON.parse(jsonStr) as Array<{
        idea: string;
        painPoint: string;
        category: string;
        intensity: number;
        willingnessToPay: number;
        marketSize: "small" | "medium" | "large";
        sourceIndices: number[];
      }>;

      // Map analyses back to posts
      for (const analysis of analyses) {
        if (!analysis || !analysis.sourceIndices) continue;

        for (const idx of analysis.sourceIndices) {
          if (idx >= 0 && idx < batch.length) {
            allAnalyzed.push({
              ...batch[idx],
              analysis: {
                pain_point: analysis.painPoint,
                intensity: analysis.intensity,
                willingness_to_pay: analysis.willingnessToPay,
                idea: analysis.idea,
                market_size: analysis.marketSize,
                category: analysis.category,
              },
            });
          }
        }
      }
    } catch (err) {
      console.error("Claude batch analysis error:", err);
      // Continue with other batches
    }

    // Delay between batches
    if (batches.length > 1) {
      await sleep(1000);
    }
  }

  return allAnalyzed;
}

// ===== Scoring =====

function significantWords(text: string): Set<string> {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function wordOverlap(setA: Set<string>, setB: Set<string>): number {
  let overlap = 0;
  for (const word of setA) {
    if (setB.has(word)) overlap++;
  }
  return overlap;
}

function scoreOpportunities(analyzedPosts: AnalyzedPost[]): ScoredOpportunity[] {
  if (analyzedPosts.length === 0) return [];

  // Cluster by similarity
  const clusters: { posts: AnalyzedPost[]; indices: number[] }[] = [];
  const assigned = new Set<number>();

  const postWords = analyzedPosts.map((post) => {
    const ideaWords = significantWords(post.analysis?.idea || "");
    const painWords = significantWords(post.analysis?.pain_point || "");
    const titleWords = significantWords(post.title || "");
    return new Set([...ideaWords, ...painWords, ...titleWords]);
  });

  for (let i = 0; i < analyzedPosts.length; i++) {
    if (assigned.has(i)) continue;

    const cluster = { posts: [analyzedPosts[i]], indices: [i] };
    assigned.add(i);

    for (let j = i + 1; j < analyzedPosts.length; j++) {
      if (assigned.has(j)) continue;
      if (wordOverlap(postWords[i], postWords[j]) >= 3) {
        cluster.posts.push(analyzedPosts[j]);
        cluster.indices.push(j);
        assigned.add(j);
      }
    }

    clusters.push(cluster);
  }

  // Score each cluster
  const scored: ScoredOpportunity[] = clusters.map((cluster) => {
    const { posts } = cluster;
    const frequency = posts.length;

    const avgIntensity =
      posts.reduce((sum, p) => sum + (p.analysis?.intensity || 0), 0) /
      frequency;
    const avgWTP =
      posts.reduce(
        (sum, p) => sum + (p.analysis?.willingness_to_pay || 0),
        0
      ) / frequency;

    // Most common market size
    const sizeCount: Record<string, number> = {};
    posts.forEach((p) => {
      const size = p.analysis?.market_size || "small";
      sizeCount[size] = (sizeCount[size] || 0) + 1;
    });
    const marketSize = Object.entries(sizeCount).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    const marketMultiplier = MARKET_MULTIPLIER[marketSize] || 1;

    // Most common category
    const catCount: Record<string, number> = {};
    posts.forEach((p) => {
      const cat = p.analysis?.category || "other";
      catCount[cat] = (catCount[cat] || 0) + 1;
    });
    const category = Object.entries(catCount).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    // Best idea (highest individual intensity * WTP)
    const bestPost = posts.reduce((best, p) => {
      const s =
        (p.analysis?.intensity || 0) * (p.analysis?.willingness_to_pay || 0);
      const bs =
        (best.analysis?.intensity || 0) *
        (best.analysis?.willingness_to_pay || 0);
      return s > bs ? p : best;
    });

    // Best quote
    const bestQuote = posts.reduce((best, p) => {
      const text = p.analysis?.pain_point || p.title || p.text || "";
      if (text.length > best.length && text.length < 200) return text;
      return best;
    }, "");

    const rawScore = frequency * avgIntensity * avgWTP * marketMultiplier;

    // Source breakdown
    const sources: Record<string, number> = {};
    posts.forEach((p) => {
      const src =
        p.source === "reddit"
          ? `r/${p.subreddit}`
          : p.source === "hackernews"
          ? "HN"
          : "Web";
      sources[src] = (sources[src] || 0) + 1;
    });

    return {
      score: Math.round(rawScore),
      idea: bestPost.analysis?.idea || "Unknown opportunity",
      pain_point: bestPost.analysis?.pain_point || bestQuote,
      quote: bestQuote,
      frequency,
      avg_intensity: Math.round(avgIntensity * 10) / 10,
      avg_willingness_to_pay: Math.round(avgWTP * 10) / 10,
      market_size: marketSize,
      category,
      sources,
      posts,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// ===== API Route =====

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MineRequest;
    const { query, niche, depth = "quick", subreddits } = body;

    if (!query || !query.trim()) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check API key early
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "ANTHROPIC_API_KEY is not configured. Set it in your environment variables.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stage 1: Reddit
          sendSSE(controller, encoder, {
            stage: "reddit",
            status: "searching",
            message: "Searching Reddit...",
          });

          let redditPosts: Post[] = [];
          try {
            redditPosts = await searchReddit(query, {
              niche,
              depth,
              subreddits,
            });
          } catch (err) {
            console.error("Reddit search error:", err);
          }

          sendSSE(controller, encoder, {
            stage: "reddit",
            status: "done",
            count: redditPosts.length,
          });

          // Stage 2: Hacker News
          sendSSE(controller, encoder, {
            stage: "hackernews",
            status: "searching",
            message: "Searching Hacker News...",
          });

          let hnPosts: Post[] = [];
          try {
            hnPosts = await searchHackerNews(query, { niche, depth });
          } catch (err) {
            console.error("HN search error:", err);
          }

          sendSSE(controller, encoder, {
            stage: "hackernews",
            status: "done",
            count: hnPosts.length,
          });

          const allPosts = [...redditPosts, ...hnPosts];

          if (allPosts.length === 0) {
            sendSSE(controller, encoder, {
              stage: "complete",
              results: [],
              message: "No posts found. Try a different query.",
            });
            controller.close();
            return;
          }

          // Stage 3: Claude analysis
          sendSSE(controller, encoder, {
            stage: "analyze",
            status: "processing",
            message: `Analyzing ${allPosts.length} posts with Claude...`,
          });

          let analyzed: AnalyzedPost[] = [];
          try {
            analyzed = await analyzePosts(allPosts);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Analysis failed";
            sendSSE(controller, encoder, {
              stage: "analyze",
              status: "error",
              message,
            });
            sendSSE(controller, encoder, {
              stage: "complete",
              results: [],
              message,
            });
            controller.close();
            return;
          }

          sendSSE(controller, encoder, {
            stage: "analyze",
            status: "done",
            count: analyzed.length,
          });

          // Stage 4: Scoring
          sendSSE(controller, encoder, {
            stage: "scoring",
            status: "processing",
            message: "Scoring and clustering opportunities...",
          });

          const results = scoreOpportunities(analyzed);

          sendSSE(controller, encoder, {
            stage: "scoring",
            status: "done",
          });

          // Final results — strip full post bodies to reduce payload size
          const cleanResults = results.map((r, i) => ({
            id: String(i + 1),
            score: r.score,
            idea: r.idea,
            painPoint: r.pain_point,
            quote: r.quote,
            frequency: r.frequency,
            avgIntensity: r.avg_intensity,
            avgWTP: r.avg_willingness_to_pay,
            marketSize: r.market_size,
            category: r.category,
            sources: r.posts.map((p) => ({
              title:
                p.source === "reddit"
                  ? `r/${p.subreddit} — ${p.title}`
                  : p.title,
              url: p.hn_url || p.url,
              platform: p.source === "reddit" ? "Reddit" : "HN",
            })),
          }));

          sendSSE(controller, encoder, {
            stage: "complete",
            results: cleanResults,
          });
        } catch (err) {
          console.error("Mining pipeline error:", err);
          sendSSE(controller, encoder, {
            stage: "error",
            status: "error",
            message:
              err instanceof Error ? err.message : "An unexpected error occurred",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Mine API error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
