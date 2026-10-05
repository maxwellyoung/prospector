import { describe, expect, it, vi } from "vitest";
import { AiRequestError, createAiQuota, MAX_AI_BODY_BYTES, readAiJson } from "../ai-quota";

const production = { NODE_ENV: "production", VERCEL: "1", UPSTASH_REDIS_REST_URL: "https://quota.example", UPSTASH_REDIS_REST_TOKEN: "test-token" };
const request = (ip = "192.0.2.1") => new Request("https://app.example/api/mine", { headers: { "x-forwarded-for": ip } });

describe("daily AI quota", () => {
  it("reserves both daily caps in one durable command and hashes the IP", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ result: 1 }));
    const quota = createAiQuota("prospector", { env: production, fetch: fetcher, now: () => Date.parse("2026-10-05T12:00:00Z") });
    await quota(request());
    const [, options] = fetcher.mock.calls[0];
    const command = JSON.parse(options!.body as string);
    expect(command[0]).toBe("EVAL");
    expect(command[2]).toBe(2);
    expect(command[3]).toMatch(/^\{prospector:ai\}:2026-10-05:ip:[a-f0-9]{64}$/);
    expect(command[4]).toBe("{prospector:ai}:2026-10-05:global");
    expect(command.slice(5)).toEqual([20, 500, Date.parse("2026-10-06T00:00:00Z") / 1000]);
    expect(options!.cache).toBe("no-store");
  });

  it.each([{}, { UPSTASH_REDIS_REST_URL: "https://quota.example" }])("fails closed for missing or partial production config", async config => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(createAiQuota("app", { env: { NODE_ENV: "production", ...config }, fetch: fetcher })(request())).rejects.toMatchObject({ status: 503 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fails closed in previews and unknown environments", async () => {
    for (const env of [{ NODE_ENV: "development", VERCEL: "1" }, {}]) {
      await expect(createAiQuota("app", { env })(request())).rejects.toMatchObject({ status: 503 });
    }
  });

  it.each([Response.json({ error: "denied" }), Response.json({ result: null }), Response.json({ result: 2 }), new Response("offline", { status: 503 })])("fails closed on store failures or malformed replies", async reply => {
    await expect(createAiQuota("app", { env: production, fetch: vi.fn<typeof fetch>().mockResolvedValue(reply) })(request())).rejects.toMatchObject({ status: 503 });
  });

  it("does not retry ambiguous store errors or fall back to memory", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("network"));
    await expect(createAiQuota("app", { env: { ...production, NODE_ENV: "development" }, fetch: fetcher })(request())).rejects.toMatchObject({ status: 503 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("denies an exhausted durable quota and advertises UTC reset", async () => {
    const quota = createAiQuota("app", { env: production, fetch: vi.fn<typeof fetch>().mockResolvedValue(Response.json({ result: 0 })), now: () => Date.parse("2026-10-05T23:59:00Z") });
    await expect(quota(request())).rejects.toMatchObject({ status: 429, retryAfter: 60 });
  });

  it("supports the complete legacy KV pair", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ result: 1 }));
    await createAiQuota("app", { env: { NODE_ENV: "production", KV_REST_API_URL: "https://kv.example", KV_REST_API_TOKEN: "test-token" }, fetch: fetcher })(request());
    expect(String(fetcher.mock.calls[0][0])).toBe("https://kv.example/");
  });

  it("rejects invalid limits and store URLs", async () => {
    for (const config of [{ AI_IP_DAILY_LIMIT: "0" }, { AI_GLOBAL_DAILY_LIMIT: "NaN" }, { UPSTASH_REDIS_REST_URL: "http://quota.example" }]) {
      await expect(createAiQuota("app", { env: { ...production, ...config } })(request())).rejects.toMatchObject({ status: 503 });
    }
  });

  it("enforces local caps under concurrent requests and resets on the UTC day", async () => {
    let now = Date.parse("2026-10-05T23:59:00Z");
    for (const caps of [{ AI_IP_DAILY_LIMIT: "2", AI_GLOBAL_DAILY_LIMIT: "9" }, { AI_IP_DAILY_LIMIT: "9", AI_GLOBAL_DAILY_LIMIT: "2" }]) {
      const quota = createAiQuota("app", { env: { NODE_ENV: "development", ...caps }, now: () => now });
      const results = await Promise.allSettled(Array.from({ length: 10 }, () => quota(request())));
      expect(results.filter(r => r.status === "fulfilled")).toHaveLength(2);
      now += 86_400_000;
      await expect(quota(request())).resolves.toBeUndefined();
    }
  });

  it("ignores spoofed forwarding headers on untrusted hosts", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ result: 1 }));
    const quota = createAiQuota("app", { env: { ...production, VERCEL: undefined }, fetch: fetcher });
    await quota(request("192.0.2.1"));
    await quota(request("192.0.2.2"));
    expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string)[3]).toBe(JSON.parse(fetcher.mock.calls[1][1]!.body as string)[3]);
  });
});

describe("bounded JSON", () => {
  it("parses a valid body", async () => {
    expect(await readAiJson(new Request("https://app.example", { method: "POST", body: '{"query":"tools"}' }))).toEqual({ query: "tools" });
  });
  it("rejects malformed and missing bodies", async () => {
    for (const body of [undefined, "{"]){
      await expect(readAiJson(new Request("https://app.example", { method: "POST", body }))).rejects.toMatchObject({ status: 400 });
    }
  });
  it("rejects oversized UTF-8 bodies without relying on Content-Length", async () => {
    await expect(readAiJson(new Request("https://app.example", { method: "POST", body: JSON.stringify({ query: "é".repeat(MAX_AI_BODY_BYTES) }) }))).rejects.toBeInstanceOf(AiRequestError);
  });
});
