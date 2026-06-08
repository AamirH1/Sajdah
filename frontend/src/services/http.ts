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

export const assertApiSuccess = (payload: unknown, fallbackMessage: string) => {
  if (!isRecord(payload)) return;

  const code = typeof payload.code === 'number' ? payload.code : undefined;
  const status = typeof payload.status === 'string' ? payload.status.toLowerCase() : undefined;
  const success = typeof payload.success === 'boolean' ? payload.success : undefined;

  if ((typeof code === 'number' && code >= 400) || status === 'error' || success === false) {
    throw new ApiError(extractErrorMessage(payload, fallbackMessage), code, payload);
  }
};

export const fetchJson = async <T = unknown>(url: string, timeoutMs: number): Promise<T> => {
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
      return await response.json() as T;
    } catch {
      throw new ApiError('Failed to parse API response');
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
