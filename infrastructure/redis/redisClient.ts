/**
 * Upstash Redis REST Client (Zero AWS, lightweight fetch-based implementation)
 * Supports caching, expiration, and rate limiting with local in-memory fallback.
 */

// In-memory cache fallback for demo / offline development
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
 * Gets a cached value by key.
 */
export async function redisGet<T = any>(key: string): Promise<T | null> {
  const { url, token, isValid } = getRedisConfig();

  if (!isValid) {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.result) return null;
    try {
      return JSON.parse(json.result);
    } catch {
      return json.result;
    }
  } catch {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value as T;
  }
}

/**
 * Sets a cached value with TTL (expiration in seconds).
 */
export async function redisSet(
  key: string,
  value: any,
  exSeconds: number = 60
): Promise<boolean> {
  const { url, token, isValid } = getRedisConfig();
  const serialized = typeof value === "string" ? value : JSON.stringify(value);

  if (!isValid) {
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + exSeconds * 1000,
    });
    return true;
  }

  try {
    const res = await fetch(
      `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(serialized)}?EX=${exSeconds}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    return res.ok;
  } catch {
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + exSeconds * 1000,
    });
    return true;
  }
}

/**
 * Deletes a cached key.
 */
export async function redisDel(key: string): Promise<boolean> {
  const { url, token, isValid } = getRedisConfig();

  if (!isValid) {
    memoryCache.delete(key);
    return true;
  }

  try {
    const res = await fetch(`${url}/del/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Invalidates cached dashboard data for an organization or team.
 */
export async function invalidateOrgDashboardCache(orgId: string, teamId?: string | null) {
  const baseKey = `dashboard:admin:${orgId}`;
  await redisDel(baseKey);
  if (teamId) {
    await redisDel(`${baseKey}:team:${teamId}`);
  }
}

/**
 * Rate Limiter checking Upstash Redis REST with window expiration in seconds.
 */
export async function checkRateLimit(
  key: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number; resetInSeconds: number }> {
  const { url, token, isValid } = getRedisConfig();
  const now = Date.now();

  if (!isValid) {
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

  try {
    const res = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json();
    const current = Number(json.result) || 1;

    if (current === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSeconds}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    return {
      success: current <= limit,
      remaining: Math.max(0, limit - current),
      resetInSeconds: windowSeconds,
    };
  } catch {
    return { success: true, remaining: limit - 1, resetInSeconds: windowSeconds };
  }
}
