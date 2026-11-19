const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 120;
const MAX_CLIENTS = 10_000;

export function createRateLimiter({
  limit = Number(process.env.API_RATE_LIMIT) || DEFAULT_LIMIT,
  windowMs = WINDOW_MS,
  now = Date.now,
} = {}) {
  const clients = new Map();
  const maxRequests = Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT;
  let requestsSinceCleanup = 0;

  return (req, res, next) => {
    const currentTime = now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let record = clients.get(key);

    if (!record || currentTime - record.startedAt >= windowMs) {
      if (!record && clients.size >= MAX_CLIENTS) {
        const oldestClient = clients.keys().next().value;
        if (oldestClient) clients.delete(oldestClient);
      }
      record = { startedAt: currentTime, count: 0 };
      clients.set(key, record);
    }

    record.count += 1;
    requestsSinceCleanup += 1;

    if (requestsSinceCleanup >= 256 || clients.size > MAX_CLIENTS) {
      for (const [client, entry] of clients) {
        if (currentTime - entry.startedAt >= windowMs) {
          clients.delete(client);
        }
      }
      requestsSinceCleanup = 0;
    }

    if (record.count > maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((record.startedAt + windowMs - currentTime) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        success: false,
        message: "Too many requests. Please wait before trying again.",
      });
      return;
    }

    next();
  };
}
