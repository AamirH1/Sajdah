import AsyncStorage from '@react-native-async-storage/async-storage';

export class ApiError extends Error {
  status?: number;
  payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const isRecord = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object';

const extractErrorMessage = (payload: unknown, fallback: string) => {
  if (!isRecord(payload)) return fallback;
  const message =
    payload.message ??
    payload.error ??
    payload.detail ??
    payload.details ??
    payload.status_message;
  return typeof message === 'string' && message.trim() ? message.trim() : fallback;
};

type FetchJsonOptions = {
  cacheKey?: string;
  cacheTtlMs?: number;
  staleWhileRevalidate?: boolean;
};

type CachedPayload = {
  timestamp: number;
  payload: unknown;
};

const memoryCache = new Map<string, CachedPayload>();
const inFlightRequests = new Map<string, Promise<unknown>>();

const readCachedPayload = async (cacheKey: string): Promise<CachedPayload | null> => {
  const now = Date.now();
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry) {
    return memoryEntry;
  }

  const raw = await AsyncStorage.getItem(cacheKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedPayload;
    if (!parsed || typeof parsed.timestamp !== 'number') {
      return null;
    }

    if (parsed.timestamp > now + 1_000) {
      return null;
    }

    memoryCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    return null;
  }
};

const writeCachedPayload = async (cacheKey: string, payload: unknown) => {
  const entry: CachedPayload = {
    timestamp: Date.now(),
    payload,
  };

  memoryCache.set(cacheKey, entry);
  await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
};

export const assertApiSuccess = (payload: unknown, fallbackMessage: string) => {
  if (!isRecord(payload)) return;

  const code = typeof payload.code === 'number' ? payload.code : undefined;
  const status = typeof payload.status === 'string' ? payload.status.toLowerCase() : undefined;
  const success = typeof payload.success === 'boolean' ? payload.success : undefined;

  if ((typeof code === 'number' && code >= 400) || status === 'error' || success === false) {
    throw new ApiError(extractErrorMessage(payload, fallbackMessage), code, payload);
  }
};

export const fetchJson = async <T = unknown>(
  url: string,
  timeoutMs: number,
  options: FetchJsonOptions = {}
): Promise<T> => {
  const { cacheKey, cacheTtlMs = 0, staleWhileRevalidate = true } = options;
  const now = Date.now();

  if (cacheKey && cacheTtlMs > 0) {
    const cached = await readCachedPayload(cacheKey);
    if (cached && now - cached.timestamp <= cacheTtlMs) {
      return cached.payload as T;
    }
  }

  if (cacheKey && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  const request = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
          const payload = await response.json();
          message = extractErrorMessage(payload, message);
          throw new ApiError(message, response.status, payload);
        } catch (parseError) {
          if (parseError instanceof ApiError) {
            throw parseError;
          }
          throw new ApiError(message, response.status);
        }
      }

      try {
        const payload = await response.json() as T;
        if (cacheKey && cacheTtlMs > 0) {
          await writeCachedPayload(cacheKey, payload);
        }
        return payload;
      } catch {
        throw new ApiError('Failed to parse API response');
      }
    } catch (error) {
      if (cacheKey) {
        const cached = await readCachedPayload(cacheKey);
        if (cached && staleWhileRevalidate) {
          return cached.payload as T;
        }
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      if (cacheKey) {
        inFlightRequests.delete(cacheKey);
      }
    }
  })();

  if (cacheKey) {
    inFlightRequests.set(cacheKey, request);
  }

  return request;
};
