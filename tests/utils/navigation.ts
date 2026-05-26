import { e2eEnv } from './env';

export function appPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = baseUrlPath();
  if (!basePath || normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`)) {
    return normalizedPath;
  }
  return `${basePath}${normalizedPath}`;
}

function baseUrlPath(): string {
  try {
    const pathname = new URL(e2eEnv.baseURL).pathname.replace(/\/$/, '');
    return pathname === '' ? '' : pathname;
  } catch {
    return '';
  }
}
