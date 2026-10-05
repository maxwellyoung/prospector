import { AiRequestError } from "./ai-quota";

export interface MineRequest {
  query: string;
  niche?: string;
  depth?: "quick" | "deep";
  subreddits?: string[];
}

export function validateMineRequest(value: unknown): MineRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AiRequestError("Invalid mining request.", 400);
  const body = value as Record<string, unknown>;
  if (typeof body.query !== "string" || !body.query.trim() || body.query.length > 200) throw new AiRequestError("Query must be 1–200 characters.", 400);
  if (body.niche !== undefined && (typeof body.niche !== "string" || body.niche.length > 100)) throw new AiRequestError("Niche must be at most 100 characters.", 400);
  if (body.depth !== undefined && body.depth !== "quick" && body.depth !== "deep") throw new AiRequestError("Invalid mining depth.", 400);
  if (body.subreddits !== undefined && (!Array.isArray(body.subreddits) || body.subreddits.length > 10 || body.subreddits.some(s => typeof s !== "string" || !/^[A-Za-z0-9_]{1,21}$/.test(s)))) throw new AiRequestError("Provide at most 10 valid subreddit names.", 400);
  return body as unknown as MineRequest;
}
