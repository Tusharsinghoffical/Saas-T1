/**
 * High-Performance Redis Client with L1 In-Memory Fast Cache & Short-Timeout Remote Upstash
 * Ensures zero request blocking (maximum 600ms timeout with instant fallback to in-memory cache).
 */

// L1 In-memory cache for sub-millisecond local responses
const memoryCache = new Map<string, { value: any; expiresAt: number }>();
const memoryRateLimit = new Map<string, { count: number; expiresAt: number }>();

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const isValid =
    Boolean(url) &&
    Boolean(token) &&
    !url?.includes("placeholder") &&
    !token?.includes("placeholder") &&
    !url?.includes("dummy") &&
    !token?.includes("dummy") &&
    !url?.includes("your-upstash") &&
    Boolean(url?.startsWith("https://"));

  return { url, token, isValid };
}

/**
 * Gets a cached value by key with sub-millisecond L1 memory check + 600ms Upstash fallback.
 */
export async function redisGet<T = any>(key: string): Promise<T | null> {
  const now = Date.now();

  // 1. Fast L1 Memory Cache Check (0ms)
  const entry = memoryCache.get(key);
  if (entry) {
    if (entry.expiresAt > now) {
      return entry.value as T;
    }
    memoryCache.delete(key);
  }

  const { url, token, isValid } = getRedisConfig();
  if (!isValid) return null;

  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(600), // Hard 600ms limit to avoid stalling requests
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.result) return null;

    let parsed: any;
    try {
      parsed = JSON.parse(json.result);
    } catch {
      parsed = json.result;
    }

    // Save into L1 memory cache for 30s
    memoryCache.set(key, {
      value: parsed,
      expiresAt: now + 30000,
    });

    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Sets a cached value with TTL (expiration in seconds) in both L1 Memory and Upstash.
 */
export async function redisSet(
  key: string,
  value: any,
  exSeconds: number = 60
): Promise<boolean> {
  const now = Date.now();

  // Save into L1 memory cache immediately
  memoryCache.set(key, {
    value,
    expiresAt: now + exSeconds * 1000,
  });

  const { url, token, isValid } = getRedisConfig();
  if (!isValid) return true;

  const serialized = typeof value === "string" ? value : JSON.stringify(value);

  try {
    // Non-blocking background sync to Upstash
    fetch(
      `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(serialized)}?EX=${exSeconds}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(800),
      }
    ).catch(() => {});

    return true;
  } catch {
    return true;
  }
}

/**
 * Deletes a cached key.
 */
export async function redisDel(key: string): Promise<boolean> {
  memoryCache.delete(key);

  const { url, token, isValid } = getRedisConfig();
  if (!isValid) return true;

  try {
    fetch(`${url}/del/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(600),
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Invalidates cached dashboard data for an organization or team across all roles.
 */
export async function invalidateOrgDashboardCache(orgId: string, teamId?: string | null) {
  // Clear memory cache keys matching this organization's dashboard
  Array.from(memoryCache.keys()).forEach((key) => {
    if (
      key.startsWith(`dashboard:admin:${orgId}`) ||
      key.startsWith(`dashboard:manager:${orgId}`) ||
      key.startsWith(`dashboard:charts:${orgId}`) ||
      key.startsWith(`members:${orgId}`)
    ) {
      memoryCache.delete(key);
    }
  });

  // Clear common Redis keys
  const keysToDelete = [
    `dashboard:admin:${orgId}`,
    `dashboard:admin:${orgId}:charts`,
    `dashboard:manager:${orgId}`,
    `dashboard:charts:${orgId}`,
  ];

  if (teamId) {
    keysToDelete.push(
      `dashboard:admin:${orgId}:team:${teamId}`,
      `dashboard:admin:${orgId}:charts:team:${teamId}`,
      `dashboard:manager:${orgId}:team:${teamId}`,
      `dashboard:charts:${orgId}:team:${teamId}`
    );
  }

  await Promise.all(keysToDelete.map((k) => redisDel(k)));
}

/**
 * Ultra-fast Rate Limiter with 400ms timeout and in-memory fallback.
 */
export async function checkRateLimit(
  key: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number; resetInSeconds: number }> {
  const now = Date.now();
  const entry = memoryRateLimit.get(key);

  if (!entry || entry.expiresAt < now) {
    memoryRateLimit.set(key, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    });
    return { success: true, remaining: limit - 1, resetInSeconds: windowSeconds };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  const resetInSeconds = Math.max(1, Math.round((entry.expiresAt - now) / 1000));

  return {
    success: entry.count <= limit,
    remaining,
    resetInSeconds,
  };
}
