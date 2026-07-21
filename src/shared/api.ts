export type ApiProblem = {
  code: string
  message: string
  category?: string
  operation?: string
  retryable?: boolean
  partialSuccess?: boolean
  reference?: string
  details?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly status: number
  readonly problem?: ApiProblem

  constructor(status: number, message: string, problem?: ApiProblem) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

export async function readApiError(response: Response, fallback?: string) {
  let message = fallback || `后端返回 ${response.status}`;
  try {
    const text = (await response.text()).trim();
    if (!text) {
      return new ApiError(response.status, message);
    }
    try {
      const payload = JSON.parse(text) as Partial<ApiProblem> & { error?: string };
      const payloadMessage = normalizeApiMessage(payload.message);
      if (payloadMessage && !isBackendDefaultEmptyMessage(payloadMessage)) {
        message = payloadMessage;
      } else if (!payloadMessage) {
        message = normalizeApiMessage(payload.error) || message;
      }
      const code = normalizeApiMessage(payload.code);
      const problem = code
        ? {
            code,
            message,
            category: normalizeApiMessage(payload.category) || undefined,
            operation: normalizeApiMessage(payload.operation) || undefined,
            retryable: typeof payload.retryable === 'boolean' ? payload.retryable : undefined,
            partialSuccess: typeof payload.partialSuccess === 'boolean' ? payload.partialSuccess : undefined,
            reference: normalizeApiMessage(payload.reference) || undefined,
            details: isRecord(payload.details) ? payload.details : undefined
          }
        : undefined;
      return new ApiError(response.status, message, problem);
    } catch {
      if (!isBackendDefaultEmptyMessage(text)) {
        message = text;
      }
      return new ApiError(response.status, message);
    }
  } catch {
    return new ApiError(response.status, message);
  }
}

export async function readApiErrorMessage(response: Response, fallback?: string) {
  return (await readApiError(response, fallback)).message;
}

function normalizeApiMessage(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isBackendDefaultEmptyMessage(messageText: string) {
  return messageText === 'No message available';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const SESSION_STORAGE_KEY = 'nuono-next-session';

export function devSessionHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  if (window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost') {
    return {};
  }
  try {
    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) {
      return {};
    }
    const session = JSON.parse(rawSession) as {
      userId?: number | string;
      roleId?: number | string | null;
      level?: number | string | null;
    };
    if (!session.userId) {
      return {};
    }
    return {
      'X-Nuono-Dev-Session-User-Id': String(session.userId),
      ...(session.roleId ? { 'X-Nuono-Dev-Session-Role-Id': String(session.roleId) } : {}),
      ...(session.level !== undefined && session.level !== null
        ? { 'X-Nuono-Dev-Session-Level': String(session.level) }
        : {})
    };
  } catch {
    return {};
  }
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  Object.entries(devSessionHeaders()).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });
  return fetch(input, { ...init, headers });
}

export async function parseApiResponse<T>(response: Response, fallback?: string): Promise<T> {
  if (!response.ok) {
    throw await readApiError(response, fallback);
  }
  return (await response.json()) as T;
}

export function normalizeError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function firstFormValidationMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('errorFields' in error)) {
    return undefined;
  }
  const errorFields = (error as { errorFields?: Array<{ errors?: string[] }> }).errorFields;
  return errorFields?.flatMap((field) => field.errors ?? []).find(Boolean) || '请检查表单必填项。';
}
