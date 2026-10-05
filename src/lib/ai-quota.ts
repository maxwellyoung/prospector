import { createHash } from "node:crypto";
import { isIP } from "node:net";

export const MAX_AI_BODY_BYTES = 16_384;
export const MAX_AI_OUTPUT_TOKENS = 2_000;

type Environment = Record<string, string | undefined>;
type Options = { env?: Environment; fetch?: typeof fetch; now?: () => number };

export class AiRequestError extends Error {
  constructor(message: string, public status: number, public retryAfter?: number) {
    super(message);
  }
}

// A single reservation checks and increments BOTH caps atomically. Failed model
// attempts keep their reservation; ambiguous network failures never retry it.
export const RESERVE_QUOTA_SCRIPT = `
local ip = tonumber(redis.call('GET', KEYS[1]) or '0')
local total = tonumber(redis.call('GET', KEYS[2]) or '0')
if ip >= tonumber(ARGV[1]) or total >= tonumber(ARGV[2]) then return 0 end
redis.call('INCR', KEYS[1])
redis.call('EXPIREAT', KEYS[1], ARGV[3])
redis.call('INCR', KEYS[2])
redis.call('EXPIREAT', KEYS[2], ARGV[3])
return 1`;

function positiveLimit(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) {
    throw new AiRequestError("AI is unavailable: invalid daily quota configuration.", 503);
  }
  return n;
}

function clientIdentity(request: Request, env: Environment): string {
  // Vercel overwrites this header. Elsewhere do not trust user-supplied IP headers:
  // all clients share one conservative bucket until a trusted platform is added.
  const forwarded = env.VERCEL === "1" ? request.headers.get("x-forwarded-for") : null;
  const ip = forwarded?.split(",")[0].trim();
  return ip && isIP(ip) ? ip : "unidentified-client";
}

export function createAiQuota(namespace: string, options: Options = {}) {
  const memory = new Map<string, number>();
  let memoryDay = "";
  return async (request: Request): Promise<void> => {
    const env = options.env ?? process.env;
    const ipLimit = positiveLimit(env.AI_IP_DAILY_LIMIT, 20);
    const globalLimit = positiveLimit(env.AI_GLOBAL_DAILY_LIMIT, 500);
    const now = (options.now ?? Date.now)();
    const day = new Date(now).toISOString().slice(0, 10);
    const reset = Math.floor(Date.parse(`${day}T00:00:00Z`) / 1_000) + 86_400;
    const retryAfter = Math.max(1, reset - Math.floor(now / 1_000));
    const hash = createHash("sha256").update(clientIdentity(request, env)).digest("hex");
    const prefix = `{${namespace}:ai}`;
    const ipKey = `${prefix}:${day}:ip:${hash}`;
    const globalKey = `${prefix}:${day}:global`;
    const hasUpstash = env.UPSTASH_REDIS_REST_URL !== undefined || env.UPSTASH_REDIS_REST_TOKEN !== undefined;
    const url = hasUpstash ? env.UPSTASH_REDIS_REST_URL : env.KV_REST_API_URL;
    const token = hasUpstash ? env.UPSTASH_REDIS_REST_TOKEN : env.KV_REST_API_TOKEN;
    const hasStore = hasUpstash || env.KV_REST_API_URL !== undefined || env.KV_REST_API_TOKEN !== undefined;

    let allowed: boolean;
    if (!hasStore && env.NODE_ENV === "development" && !env.VERCEL) {
      // Development only. Production, previews, and unknown environments fail closed.
      if (memoryDay !== day) { memory.clear(); memoryDay = day; }
      const ipCount = memory.get(ipKey) ?? 0;
      const globalCount = memory.get(globalKey) ?? 0;
      allowed = ipCount < ipLimit && globalCount < globalLimit;
      if (allowed) {
        memory.set(ipKey, ipCount + 1);
        memory.set(globalKey, globalCount + 1);
      }
    } else {
      if (!url || !token) {
        throw new AiRequestError("AI is unavailable: configure a durable quota store (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN).", 503);
      }
      try {
        const endpoint = new URL(url);
        if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) throw new Error("Invalid quota URL");
        const response = await (options.fetch ?? fetch)(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(["EVAL", RESERVE_QUOTA_SCRIPT, 2, ipKey, globalKey, ipLimit, globalLimit, reset]),
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) throw new Error("Quota store HTTP error");
        const payload = await response.json();
        if (payload.error || (payload.result !== 0 && payload.result !== 1)) throw new Error("Invalid quota response");
        allowed = payload.result === 1;
      } catch {
        throw new AiRequestError("AI is temporarily unavailable: durable quota store could not be reached.", 503);
      }
    }
    if (!allowed) throw new AiRequestError("Daily AI limit reached. Try again after the next UTC reset.", 429, retryAfter);
  };
}

// Bound the stream itself, including chunked bodies with no Content-Length.
export async function readAiJson(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_AI_BODY_BYTES) throw new AiRequestError("AI request is too large.", 413);
  if (!request.body) throw new AiRequestError("A JSON body is required.", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_AI_BODY_BYTES) {
        await reader.cancel();
        throw new AiRequestError("AI request is too large.", 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof AiRequestError) throw error;
    throw new AiRequestError("Invalid JSON body.", 400);
  } finally {
    reader.releaseLock();
  }
}

export function aiErrorResponse(error: unknown): Response {
  const known = error instanceof AiRequestError;
  return Response.json({ error: known ? error.message : "AI request failed." }, {
    status: known ? error.status : 500,
    headers: { "Cache-Control": "no-store", ...(known && error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {}) },
  });
}
