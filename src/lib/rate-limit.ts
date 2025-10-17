import { LRUCache } from "lru-cache";

interface RateLimitOptions {
  interval: number;
  uniqueTokenPerInterval: number;
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number>({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) || 0) + 1;
        tokenCache.set(token, tokenCount);

        if (tokenCount > limit) {
          reject();
        } else {
          resolve();
        }
      }),
  };
}
