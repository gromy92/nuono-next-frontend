const rawBasePath = import.meta.env?.BASE_URL || '/';

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

  const originalPushState = window.history.pushState.bind(window.history);
  window.history.pushState = (data: unknown, unused: string, url?: string | URL | null) =>
    originalPushState(data, unused, prefixHistoryUrl(url));

  const originalReplaceState = window.history.replaceState.bind(window.history);
  window.history.replaceState = (data: unknown, unused: string, url?: string | URL | null) =>
    originalReplaceState(data, unused, prefixHistoryUrl(url));
}
