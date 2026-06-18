export async function readApiErrorMessage(response: Response, fallback?: string) {
  let message = fallback || `后端返回 ${response.status}`;
  try {
    const text = (await response.text()).trim();
    if (!text) {
      return message;
    }
    try {
      const payload = JSON.parse(text) as { message?: string; error?: string };
      const payloadMessage = normalizeApiMessage(payload.message);
      if (payloadMessage && !isBackendDefaultEmptyMessage(payloadMessage)) {
        return payloadMessage;
      }
      if (payloadMessage && isBackendDefaultEmptyMessage(payloadMessage)) {
        return message;
      }
      return normalizeApiMessage(payload.error) || message;
    } catch {
      if (isBackendDefaultEmptyMessage(text)) {
        return message;
      }
      return text;
    }
  } catch {
    return message;
  }
}

function normalizeApiMessage(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isBackendDefaultEmptyMessage(messageText: string) {
  return messageText === 'No message available';
}

const SESSION_STORAGE_KEY = 'nuono-next-session';

export function devSessionHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  if (window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost') {
    return {};
  }
  const urlHeaders = devSessionHeadersFromUrl();
  if (urlHeaders) {
    return urlHeaders;
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

function devSessionHeadersFromUrl() {
  const search = new URLSearchParams(window.location.search);
  if (search.get('devSession') !== '1') {
    return undefined;
  }
  const devRole = (search.get('devRole') || search.get('role') || '').trim().toLowerCase();
  if (['admin', 'system-admin', 'administrator', '管理员', '系统管理员'].includes(devRole)) {
    return buildDevSessionHeaders(10003, 1, 0);
  }
  if (['ops-manager', 'operation-manager', 'operations-manager', '运营主管', '运营管理'].includes(devRole)) {
    return buildDevSessionHeaders(90005, 3, 2);
  }
  if (['operator', 'ops', 'operation', '运营'].includes(devRole)) {
    return buildDevSessionHeaders(90003, 4, 3);
  }
  if (['procurement', 'purchase', 'purchasing', 'buyer', '采购'].includes(devRole)) {
    return buildDevSessionHeaders(90001, 5, 3);
  }
  if (['warehouse', 'stock', 'storekeeper', '仓管'].includes(devRole)) {
    return buildDevSessionHeaders(90004, 6, 3);
  }
  return buildDevSessionHeaders(307, 2, 1);
}

function buildDevSessionHeaders(userId: number, roleId: number, level: number) {
  return {
    'X-Nuono-Dev-Session-User-Id': String(userId),
    'X-Nuono-Dev-Session-Role-Id': String(roleId),
    'X-Nuono-Dev-Session-Level': String(level)
  };
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
