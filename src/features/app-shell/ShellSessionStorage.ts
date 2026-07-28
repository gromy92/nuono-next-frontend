import { currentAppPathname } from '../../runtimePaths'
import type { AuthSession } from '../auth/session'
import { normalizeSessionRoleView } from './WorkspaceRouting'
import { readDevSessionOverride } from './ShellDevSession'

export const SESSION_STORAGE_KEY = 'nuono-next-session'

export const PROCUREMENT_REQUIREMENT_DEMO_SESSION: AuthSession = {
  userId: 90001,
  accountNo: 'procurement.demo',
  realName: '采购演示账号',
  roleId: 5,
  roleName: '采购',
  companyName: 'Nuono Demo',
  status: 1,
  storeCount: 1,
  authorizedStoreCount: 1,
  bindingStatus: 'PROJECT_BOUND',
  defaultOwnerUserId: 10002,
  grantedMenus: []
}

export function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null

  const devSession = readDevSessionOverride(SESSION_STORAGE_KEY)
  if (devSession) {
    persistDevSession(devSession)
    return devSession
  }
  if (currentAppPathname().startsWith('/login')) return null

  try {
    const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
    return rawValue ? normalizeSessionRoleView(JSON.parse(rawValue) as AuthSession) : null
  } catch {
    return null
  }
}

function persistDevSession(session: AuthSession) {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Ignore localStorage write failures in local preview mode.
  }
}
