import { redisConnection } from "../config/redis";

export async function getOrSet<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await redisConnection.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const freshData = await fetchFn();

    await redisConnection.setex(key, ttl, JSON.stringify(freshData));

    return freshData;
  } catch (err) {
    console.error("Cache error:", err);

    // NEVER break app because of cache
    return fetchFn();
  }
}

export async function invalidatePattern(pattern: string) {
  const keys: string[] = [];

  const stream = redisConnection.scanStream({
    match: pattern,
    count: 100,
  });

  for await (const resultKeys of stream) {
    keys.push(...resultKeys);
  }

  if (keys.length > 0) {
    await redisConnection.del(keys);
  }
}
