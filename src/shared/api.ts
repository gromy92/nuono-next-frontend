export async function readApiErrorMessage(response: Response, fallback?: string) {
  let message = fallback || `后端返回 ${response.status}`;
  try {
    const text = (await response.text()).trim();
    if (!text) {
      return message;
    }
    try {
      const payload = JSON.parse(text) as { message?: string; error?: string };
      return payload.message || payload.error || text;
    } catch {
      return text;
    }
  } catch {
    return message;
  }
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
    const session = JSON.parse(rawSession) as { userId?: number; roleId?: number; level?: number };
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

  return fetch(input, {
    ...init,
    headers
  });
}

export async function parseApiResponse<T>(response: Response, fallback?: string): Promise<T> {
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, fallback));
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
