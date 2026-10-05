import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";
import { validateMineRequest } from "@/lib/mine-request";

const modelCreate = vi.hoisted(() => vi.fn());
const modelConstructor = vi.hoisted(() => vi.fn());
vi.mock("@anthropic-ai/sdk", () => ({ default: class {
  messages = { create: modelCreate };
  constructor(options: unknown) { modelConstructor(options); }
} }));

const request = (body: unknown) => new Request("https://app.example/api/mine", { method: "POST", body: JSON.stringify(body) });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); vi.clearAllMocks(); });

describe("mining input", () => {
  it("accepts a bounded request", () => {
    expect(validateMineRequest({ query: "bookkeeping", depth: "deep", subreddits: ["SaaS"] }).query).toBe("bookkeeping");
  });
  it.each([null, [], { query: 3 }, { query: "" }, { query: "x".repeat(201) }, { query: "ok", niche: "x".repeat(101) }, { query: "ok", depth: "unlimited" }, { query: "ok", subreddits: Array(11).fill("SaaS") }, { query: "ok", subreddits: ["../../"] }])("rejects invalid or unbounded input", body => {
    expect(() => validateMineRequest(body)).toThrow();
  });
});

it("returns 503 with no network or paid calls when production quota is absent", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  for (const key of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN"]) vi.stubEnv(key, undefined);
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  const response = await POST(request({ query: "tools" }));
  expect(response.status).toBe(503);
  expect((await response.json()).error).toContain("durable quota store");
  expect(fetcher).not.toHaveBeenCalled();
});

it("returns 429 before searching when durable quota denies the request", async () => {
  vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://quota.example"); vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  const fetcher = vi.fn().mockResolvedValue(Response.json({ result: 0 })); vi.stubGlobal("fetch", fetcher);
  const response = await POST(request({ query: "tools" }));
  expect(response.status).toBe(429); expect(fetcher).toHaveBeenCalledTimes(1);
  expect(response.headers.get("Retry-After")).toBeTruthy();
});

it("returns 413 for an oversized body before any quota or model call", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  expect((await POST(request({ query: "x".repeat(20_000) }))).status).toBe(413);
  expect(fetcher).not.toHaveBeenCalled();
});


it("allows a reserved request but bounds the only paid call", async () => {
  vi.useFakeTimers();
  vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://quota.example"); vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  const posts = Array.from({ length: 60 }, (_, index) => ({ data: {
    title: "t".repeat(10_000), selftext: "b".repeat(10_000), permalink: `/posts/${index}`, subreddit: "SaaS", score: 2, num_comments: 3,
  } }));
  const fetcher = vi.fn().mockImplementation(async (url: string | URL) => {
    if (String(url).includes("quota.example")) return Response.json({ result: 1 });
    if (String(url).includes("reddit.com")) return Response.json({ data: { children: posts } });
    return Response.json({ hits: [] });
  });
  vi.stubGlobal("fetch", fetcher);
  modelCreate.mockResolvedValue({ content: [{ type: "text", text: "[]" }] });
  const response = await POST(request({ query: "tools", subreddits: [] }));
  await vi.runAllTimersAsync();
  expect(response.status).toBe(200);
  expect(await response.text()).toContain('"stage":"complete"');
  expect(modelCreate).toHaveBeenCalledTimes(1);
  expect(modelConstructor).toHaveBeenCalledWith({ apiKey: "test-key", maxRetries: 0 });
  const call = modelCreate.mock.calls[0][0];
  expect(call.max_tokens).toBe(2000);
  expect(call.messages[0].content).toContain("Analyze these 20 forum posts");
  expect(call.messages[0].content.length).toBeLessThan(16_384);
});
