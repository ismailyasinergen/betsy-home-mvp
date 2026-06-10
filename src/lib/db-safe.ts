type RetryOptions = {
  attempts?: number;
  delayMs?: number;
  label?: string;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function summarizeDbError(error: unknown) {
  if (!error) return "Unknown database error";
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function isLikelyDatabaseConnectionError(error: unknown) {
  const message = summarizeDbError(error).toLowerCase();

  return (
    message.includes("p1001") ||
    message.includes("can't reach database server") ||
    message.includes("timed out fetching a new connection") ||
    message.includes("connection pool") ||
    message.includes("connection terminated") ||
    message.includes("server has closed the connection") ||
    message.includes("network error") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("enotfound")
  );
}

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 750;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isLikelyDatabaseConnectionError(error) || attempt === attempts) {
        break;
      }

      await delay(delayMs * attempt);
    }
  }

  throw lastError;
}

export async function safeDb<T>(
  label: string,
  operation: () => Promise<T>,
  fallback: T,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await withDbRetry(operation, {
      attempts: options.attempts ?? 2,
      delayMs: options.delayMs ?? 750,
      label,
    });
  } catch (error) {
    console.warn(
      `[db-safe] ${label} failed; using fallback data. ${summarizeDbError(error)}`
    );
    return fallback;
  }
}
