const rawBasePath = import.meta.env?.BASE_URL || '/';
const SESSION_STORAGE_KEY = 'nuono-next-session';
const LOCAL_DEV_SESSION_USER_HEADER = 'X-Nuono-Dev-Session-User-Id';
const LOCAL_DEV_SESSION_ROLE_HEADER = 'X-Nuono-Dev-Session-Role-Id';
const LOCAL_DEV_SESSION_LEVEL_HEADER = 'X-Nuono-Dev-Session-Level';
const ROLE_VIEW_HEADER = 'X-Nuono-Role-View';

export const SESSION_EXPIRED_EVENT = 'nuono-next-session-expired';

function normalizeBasePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

export const publicBasePath = normalizeBasePath(rawBasePath);

export function stripPublicBasePath(pathname: string) {
  if (!publicBasePath) {
    return pathname || '/';
  }
  if (pathname === publicBasePath) {
    return '/';
  }
  if (pathname.startsWith(`${publicBasePath}/`)) {
    return pathname.slice(publicBasePath.length) || '/';
  }
  return pathname || '/';
}

export function currentAppPathname() {
  if (typeof window === 'undefined') {
    return '/';
  }
  return stripPublicBasePath(window.location.pathname);
}

export function withPublicBasePath(path: string | null | undefined) {
  if (!path || !publicBasePath) {
    return path || '';
  }
  if (
    path.startsWith(publicBasePath + '/') ||
    path === publicBasePath ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('mailto:') ||
    path.startsWith('tel:') ||
    path.startsWith('#')
  ) {
    return path;
  }
  if (path === '/') {
    return `${publicBasePath}/`;
  }
  if (path.startsWith('/')) {
    return `${publicBasePath}${path}`;
  }
  return path;
}

function shouldPrefixRootPath(pathname: string) {
  return (
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname === '/actuator' ||
    pathname.startsWith('/actuator/') ||
    pathname === '/templates' ||
    pathname.startsWith('/templates/')
  );
}

function isSessionContextPath(pathname: string) {
  return shouldPrefixRootPath(stripPublicBasePath(pathname));
}

function prefixUrlForFetch(input: string) {
  if (!publicBasePath) {
    return input;
  }
  if (input.startsWith('/')) {
    return shouldPrefixRootPath(input) ? withPublicBasePath(input) : input;
  }
  try {
    const url = new URL(input);
    if (url.origin === window.location.origin && isSessionContextPath(url.pathname)) {
      url.pathname = withPublicBasePath(url.pathname);
      return url.toString();
    }
  } catch {
    return input;
  }
  return input;
}

function hasStoredSession() {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return Boolean(window.localStorage.getItem(SESSION_STORAGE_KEY));
  } catch {
    return false;
  }
}

function shouldNotifySessionExpired(response: Response) {
  if (response.status !== 401 || !hasStoredSession()) {
    return false;
  }
  try {
    const url = new URL(response.url, window.location.origin);
    if (url.origin !== window.location.origin) {
      return false;
    }
    const appPath = stripPublicBasePath(url.pathname);
    return appPath.startsWith('/api/')
      && appPath !== '/api/auth/login'
      && appPath !== '/api/auth/email-code/request'
      && appPath !== '/api/auth/email-code/login'
      && appPath !== '/api/auth/logout';
  } catch {
    return false;
  }
}

function handleFetchResponse(response: Response) {
  if (shouldNotifySessionExpired(response)) {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
  return response;
}

function isLocalBrowserHost() {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '::1';
}

function shouldAttachSessionContext(input: RequestInfo | URL) {
  const rawUrl = input instanceof Request ? input.url : input.toString();
  if (rawUrl.startsWith('/')) {
    return shouldPrefixRootPath(rawUrl);
  }
  try {
    const url = new URL(rawUrl, window.location.origin);
    return url.origin === window.location.origin && isSessionContextPath(url.pathname);
  } catch {
    return false;
  }
}

function readStoredSessionForHeaders() {
  try {
    const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }
    return JSON.parse(rawValue) as {
      userId?: unknown;
      roleId?: unknown;
      level?: unknown;
      activeRoleView?: unknown;
    };
  } catch {
    return null;
  }
}

function withSessionContextHeaders(input: RequestInfo | URL, init?: RequestInit) {
  if (!shouldAttachSessionContext(input)) {
    return init;
  }
  const session = readStoredSessionForHeaders();
  if (!session) {
    return init;
  }
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }

  if (
    (session.activeRoleView === 'boss' || session.activeRoleView === 'operator') &&
    !headers.has(ROLE_VIEW_HEADER)
  ) {
    headers.set(ROLE_VIEW_HEADER, session.activeRoleView);
  }

  if (
    isLocalBrowserHost() &&
    typeof session.userId === 'number' &&
    !headers.has(LOCAL_DEV_SESSION_USER_HEADER) &&
    !headers.has('Authorization')
  ) {
    headers.set(LOCAL_DEV_SESSION_USER_HEADER, String(session.userId));
    if (typeof session.roleId === 'number') {
      headers.set(LOCAL_DEV_SESSION_ROLE_HEADER, String(session.roleId));
    }
    if (typeof session.level === 'number') {
      headers.set(LOCAL_DEV_SESSION_LEVEL_HEADER, String(session.level));
    }
  }
  return {
    ...init,
    headers
  };
}

function prefixHistoryUrl(url?: string | URL | null) {
  if (!publicBasePath || typeof url !== 'string') {
    return url;
  }
  return url.startsWith('/') ? withPublicBasePath(url) : url;
}

export function installPublicPathRuntime() {
  if (typeof window === 'undefined') {
    return;
  }
  const marker = '__nuonoPublicPathRuntimeInstalled';
  const runtimeWindow = window as typeof window & { [marker]?: boolean };
  if (runtimeWindow[marker]) {
    return;
  }
  runtimeWindow[marker] = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') {
      return originalFetch(prefixUrlForFetch(input), withSessionContextHeaders(input, init)).then(handleFetchResponse);
    }
    if (input instanceof URL) {
      return originalFetch(prefixUrlForFetch(input.toString()), withSessionContextHeaders(input, init)).then(handleFetchResponse);
    }
    if (input instanceof Request) {
      const nextRequest = new Request(prefixUrlForFetch(input.url), input);
      return originalFetch(nextRequest, withSessionContextHeaders(nextRequest, init)).then(handleFetchResponse);
    }
    return originalFetch(input, init).then(handleFetchResponse);
  }) as typeof window.fetch;

  const originalPushState = window.history.pushState.bind(window.history);
  window.history.pushState = (data: unknown, unused: string, url?: string | URL | null) =>
    originalPushState(data, unused, prefixHistoryUrl(url));

  const originalReplaceState = window.history.replaceState.bind(window.history);
  window.history.replaceState = (data: unknown, unused: string, url?: string | URL | null) =>
    originalReplaceState(data, unused, prefixHistoryUrl(url));
}
