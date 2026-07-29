import {
  publicBasePath,
  stripPublicBasePath
} from '../runtimePaths'

const SESSION_STORAGE_KEY = 'nuono-next-session'
const LOCAL_DEV_SESSION_USER_HEADER = 'X-Nuono-Dev-Session-User-Id'
const LOCAL_DEV_SESSION_ROLE_HEADER = 'X-Nuono-Dev-Session-Role-Id'
const LOCAL_DEV_SESSION_LEVEL_HEADER = 'X-Nuono-Dev-Session-Level'
const ROLE_VIEW_HEADER = 'X-Nuono-Role-View'
const RELATIVE_URL_BASE = 'http://nuono-transport.local'

export const SESSION_EXPIRED_EVENT = 'nuono-next-session-expired'

type StoredSessionContext = {
  userId?: unknown
  roleId?: unknown
  level?: unknown
  activeRoleView?: unknown
}

function normalizeBasePath(value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '/') {
    return ''
  }
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`
}

function stripBasePath(pathname: string, basePath: string) {
  const normalizedBasePath = normalizeBasePath(basePath)
  if (!normalizedBasePath) {
    return pathname || '/'
  }
  if (pathname === normalizedBasePath) {
    return '/'
  }
  if (pathname.startsWith(`${normalizedBasePath}/`)) {
    return pathname.slice(normalizedBasePath.length) || '/'
  }
  return pathname || '/'
}

function isTransportPath(pathname: string, basePath: string) {
  const appPath = stripBasePath(pathname, basePath)
  return (
    appPath === '/api'
    || appPath.startsWith('/api/')
    || appPath === '/actuator'
    || appPath.startsWith('/actuator/')
    || appPath === '/templates'
    || appPath.startsWith('/templates/')
  )
}

function prefixRootPath(pathname: string, basePath: string) {
  const normalizedBasePath = normalizeBasePath(basePath)
  if (!normalizedBasePath || pathname === normalizedBasePath || pathname.startsWith(`${normalizedBasePath}/`)) {
    return pathname
  }
  return `${normalizedBasePath}${pathname}`
}

export function prefixTransportUrlForBase(input: string, basePath: string, origin: string) {
  if (!normalizeBasePath(basePath)) {
    return input
  }
  if (input.startsWith('/') && !input.startsWith('//')) {
    const url = new URL(input, RELATIVE_URL_BASE)
    return isTransportPath(url.pathname, basePath)
      ? `${prefixRootPath(url.pathname, basePath)}${url.search}${url.hash}`
      : input
  }
  try {
    const url = new URL(input)
    if (url.origin === origin && isTransportPath(url.pathname, basePath)) {
      url.pathname = prefixRootPath(url.pathname, basePath)
      return url.toString()
    }
  } catch {
    return input
  }
  return input
}

export function shouldAttachSessionContextForUrl(
  input: string,
  basePath: string,
  origin: string
) {
  if (input.startsWith('/') && !input.startsWith('//')) {
    return isTransportPath(new URL(input, RELATIVE_URL_BASE).pathname, basePath)
  }
  try {
    const url = new URL(input)
    return url.origin === origin && isTransportPath(url.pathname, basePath)
  } catch {
    return false
  }
}

function browserOrigin() {
  return typeof window === 'undefined' ? '' : window.location.origin
}

function inputUrl(input: RequestInfo | URL) {
  return input instanceof Request ? input.url : input.toString()
}

export function prefixTransportInputForBase(
  input: RequestInfo | URL,
  basePath: string,
  origin: string
) {
  const prefixedUrl = prefixTransportUrlForBase(inputUrl(input), basePath, origin)
  if (input instanceof Request) {
    return prefixedUrl === input.url ? input : new Request(prefixedUrl, input)
  }
  if (input instanceof URL) {
    return prefixedUrl === input.toString() ? input : new URL(prefixedUrl)
  }
  return prefixedUrl
}

function prefixTransportInput(input: RequestInfo | URL) {
  return typeof window === 'undefined'
    ? input
    : prefixTransportInputForBase(input, publicBasePath, browserOrigin())
}

function readStoredSession() {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) as StoredSessionContext : null
  } catch {
    return null
  }
}

function isLocalBrowserHost() {
  if (typeof window === 'undefined') {
    return false
  }
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

function requestInitWithSession(
  input: RequestInfo | URL,
  init: RequestInit | undefined
) {
  if (
    typeof window === 'undefined'
    || !shouldAttachSessionContextForUrl(inputUrl(input), publicBasePath, browserOrigin())
  ) {
    return init
  }
  const session = readStoredSession()
  if (!session) {
    return init
  }
  const headers = new Headers(input instanceof Request ? input.headers : undefined)
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value))
  }
  if (
    (session.activeRoleView === 'boss' || session.activeRoleView === 'operator')
    && !headers.has(ROLE_VIEW_HEADER)
  ) {
    headers.set(ROLE_VIEW_HEADER, session.activeRoleView)
  }
  if (
    isLocalBrowserHost()
    && typeof session.userId === 'number'
    && !headers.has('Authorization')
  ) {
    if (!headers.has(LOCAL_DEV_SESSION_USER_HEADER)) {
      headers.set(LOCAL_DEV_SESSION_USER_HEADER, String(session.userId))
    }
    if (typeof session.roleId === 'number' && !headers.has(LOCAL_DEV_SESSION_ROLE_HEADER)) {
      headers.set(LOCAL_DEV_SESSION_ROLE_HEADER, String(session.roleId))
    }
    if (typeof session.level === 'number' && !headers.has(LOCAL_DEV_SESSION_LEVEL_HEADER)) {
      headers.set(LOCAL_DEV_SESSION_LEVEL_HEADER, String(session.level))
    }
  }
  return { ...init, headers }
}

function shouldNotifySessionExpired(response: Response) {
  if (typeof window === 'undefined' || response.status !== 401 || !readStoredSession()) {
    return false
  }
  try {
    const url = new URL(response.url, browserOrigin())
    if (url.origin !== browserOrigin()) {
      return false
    }
    const appPath = stripPublicBasePath(url.pathname)
    return appPath.startsWith('/api/')
      && appPath !== '/api/auth/login'
      && appPath !== '/api/auth/logout'
  } catch {
    return false
  }
}

function handleTransportResponse(response: Response) {
  if (shouldNotifySessionExpired(response)) {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
  }
  return response
}

export async function executeApiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const prefixedInput = prefixTransportInput(input)
  const response = await globalThis.fetch(
    prefixedInput,
    requestInitWithSession(prefixedInput, init)
  )
  return handleTransportResponse(response)
}
