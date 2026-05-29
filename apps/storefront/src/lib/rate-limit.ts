// Lightweight rate limiter.
//
// Production path: Upstash Redis REST (set UPSTASH_REDIS_REST_URL +
// UPSTASH_REDIS_REST_TOKEN). Uses INCR + EXPIRE so it requires no extra deps.
//
// Fallback path: in-process Map. Only useful in single-instance dev/local.
// In Vercel serverless this will not share state across instances — treat as
// best-effort dev safety, not real protection. Production MUST set Upstash.
//
// All functions are safe to call from edge or node route handlers.

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  limit: number;
  resetSeconds: number;
};

type RateLimitOptions = {
  limit: number;
  windowSeconds: number;
  key: string;
};

const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function fromMemory({ limit, windowSeconds, key }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${key}`;
  const existing = memoryStore.get(bucketKey);

  if (!existing || existing.expiresAt <= now) {
    memoryStore.set(bucketKey, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { ok: true, remaining: limit - 1, limit, resetSeconds: windowSeconds };
  }

  existing.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));

  return {
    ok: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    limit,
    resetSeconds,
  };
}

async function fromUpstash(
  url: string,
  token: string,
  { limit, windowSeconds, key }: RateLimitOptions
): Promise<RateLimitResult> {
  // Pipeline: INCR key, EXPIRE key seconds NX, TTL key
  const body = JSON.stringify([
    ["INCR", key],
    ["EXPIRE", key, String(windowSeconds), "NX"],
    ["TTL", key],
  ]);

  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash rate-limit pipeline failed: ${response.status}`);
  }

  const payload = (await response.json()) as Array<{ result?: number; error?: string }>;
  const count = Number(payload[0]?.result ?? 0);
  const ttl = Number(payload[2]?.result ?? windowSeconds);
  const resetSeconds = ttl > 0 ? ttl : windowSeconds;

  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    limit,
    resetSeconds,
  };
}

export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (url && token) {
    try {
      return await fromUpstash(url, token, options);
    } catch (error) {
      console.warn("[rate-limit] Upstash failure, falling back to in-memory:", error);
    }
  }

  return fromMemory(options);
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-vercel-forwarded-for") ||
    "unknown"
  );
}

export function rateLimitResponse(result: RateLimitResult, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(result.resetSeconds),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(result.resetSeconds),
    },
  });
}
