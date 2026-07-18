import type { AuthRoleView, AuthSession } from '../auth/session'
import {
  ALL_WORKSPACE_MENU_KEYS,
  BOSS_OPERATOR_MENU_KEYS,
  MANAGEMENT_MENU_KEYS,
  WORKSPACE_GRANTED_MENU_RULES
} from './RouteCatalog'
import { normalizeWorkspacePath } from './routePaths'
import type { AppMenuKey } from './routeDefinitions'

function normalizeGrantedMenuName(menuName?: string | null) {
  return (menuName || '').trim()
}

export function matchGrantedMenuToWorkspaceMenuKeys(
  menu: NonNullable<AuthSession['grantedMenus']>[number]
) {
  const normalizedPath = normalizeWorkspacePath(menu.urlPath)
  const normalizedName = normalizeGrantedMenuName(menu.menuName)
  const matchedKeys = WORKSPACE_GRANTED_MENU_RULES.flatMap((rule) => {
    const hasPathMatch = rule.urlPaths?.some(
      (urlPath) => normalizeWorkspacePath(urlPath) === normalizedPath
    )
    const hasPathPrefixMatch = rule.urlPathPrefixes?.some((urlPathPrefix) =>
      normalizedPath.startsWith(normalizeWorkspacePath(urlPathPrefix))
    )
    const hasNameMatch = rule.menuNames?.includes(normalizedName)
    return hasPathMatch || hasPathPrefixMatch || hasNameMatch ? rule.keys : []
  })

  return Array.from(new Set(matchedKeys))
}

export function isSystemAdminSession(session: AuthSession | null) {
  const roleName = (session?.roleName || '').trim()
  return Boolean(
    session &&
      (session.level === 0 ||
        session.roleId === 1 ||
        session.accountNo === 'admin' ||
        session.accountNo === 'adminBI' ||
        roleName === '系统管理员' ||
        roleName === '管理员')
  )
}

function isBossSession(session: AuthSession | null) {
  const roleName = (session?.roleName || '').trim()
  return Boolean(session && (session.level === 1 || roleName === '老板'))
}

export function activeRoleView(session: AuthSession | null): AuthRoleView {
  return isBossSession(session) && session?.activeRoleView === 'operator' ? 'operator' : 'boss'
}

export function isBossManagementSession(session: AuthSession | null) {
  return isBossSession(session) && activeRoleView(session) === 'boss'
}

export function isBossOperatorView(session: AuthSession | null) {
  return isBossSession(session) && activeRoleView(session) === 'operator'
}

export function canSwitchBossRoleView(session: AuthSession | null) {
  return isBossSession(session) && !isSystemAdminSession(session)
}

export function normalizeSessionRoleView(session: AuthSession): AuthSession {
  if (!isBossSession(session)) {
    if (!session.activeRoleView) {
      return session
    }
    const restSession = { ...session }
    delete restSession.activeRoleView
    return restSession
  }
  const nextRoleView: AuthRoleView = session.activeRoleView === 'operator' ? 'operator' : 'boss'
  return session.activeRoleView === nextRoleView ? session : { ...session, activeRoleView: nextRoleView }
}

export function resolveSessionAllowedMenuKeys(session: AuthSession | null) {
  if (!session) {
    return [] as AppMenuKey[]
  }

  const grantedMenus = session.grantedMenus ?? []
  if (!grantedMenus.length && !isBossSession(session)) {
    return [] as AppMenuKey[]
  }

  const keySet = new Set<AppMenuKey>()
  grantedMenus.forEach((menu) => {
    matchGrantedMenuToWorkspaceMenuKeys(menu).forEach((key) => keySet.add(key))
  })
  if (isSystemAdminSession(session)) {
    keySet.add('user-account')
    keySet.add('system-role')
    keySet.add('system-file-management')
    keySet.delete('product-manual-selection')
    keySet.delete('user-role')
    keySet.delete('user-store-noon')
  } else if (isBossManagementSession(session)) {
    keySet.add('user-role')
    keySet.add('user-store-noon')
    keySet.delete('user-account')
    keySet.delete('system-role')
    keySet.delete('system-file-management')
  } else if (isBossOperatorView(session)) {
    MANAGEMENT_MENU_KEYS.forEach((key) => keySet.delete(key))
    BOSS_OPERATOR_MENU_KEYS.forEach((key) => keySet.add(key))
  } else {
    keySet.delete('system-file-management')
  }

  return ALL_WORKSPACE_MENU_KEYS.filter((key) => keySet.has(key))
}

const SYSTEM_ADMIN_LANDING_ORDER: AppMenuKey[] = [
  'system-role',
  'system-file-management',
  'user-account',
  'system-menu',
  'purchase-profit',
  'purchase-order',
  'purchase-in-transit-goods',
  'warehouse-shipping-order',
  'warehouse-logistics-bill',
  'warehouse-dispatch',
  'official-warehouse',
  'operations-competitor-analysis',
  'operations-skin-management',
  'operations-noon-ads',
  'data-sales-analysis',
  'noon-call-store-data',
  'system-report-noon-data-completeness',
  'system-report-noon-data-gaps',
  'operations-config-versions',
  'data-activity-config',
  'operations-lifecycle-rules',
  'product-manual-selection',
  'product-specs',
  'product-image-profile',
  'product-manage'
]

const BOSS_MANAGEMENT_LANDING_ORDER: AppMenuKey[] = [
  'user-role',
  'purchase-ali1688-historical-orders',
  'purchase-ali1688-sku-purchase-history',
  'purchase-ali1688-collection',
  'purchase-order',
  'purchase-in-transit-goods',
  'product-manage',
  'product-specs',
  'purchase-profit',
  'purchase-logistics-quote',
  'warehouse-shipping-order',
  'warehouse-logistics-bill',
  'warehouse-dispatch',
  'official-warehouse',
  'operations-competitor-analysis',
  'operations-skin-management',
  'operations-noon-ads',
  'data-sales-analysis',
  'noon-call-store-data',
  'system-report-noon-data-completeness',
  'system-report-noon-data-gaps',
  'operations-config-versions',
  'data-activity-config',
  'operations-lifecycle-rules',
  'product-image-profile',
  'product-manual-selection'
]

const OPERATOR_LANDING_ORDER: AppMenuKey[] = [
  'purchase-ali1688-historical-orders',
  'purchase-ali1688-sku-purchase-history',
  'purchase-ali1688-collection',
  'purchase-order',
  'purchase-in-transit-goods',
  'product-manage',
  'product-specs',
  'user-role',
  'purchase-profit',
  'purchase-logistics-quote',
  'warehouse-shipping-order',
  'warehouse-logistics-bill',
  'warehouse-dispatch',
  'official-warehouse',
  'operations-competitor-analysis',
  'operations-skin-management',
  'operations-noon-ads',
  'data-sales-analysis',
  'noon-call-store-data',
  'system-report-noon-data-completeness',
  'system-report-noon-data-gaps',
  'operations-config-versions',
  'data-activity-config',
  'operations-lifecycle-rules',
  'product-image-profile',
  'product-manual-selection'
]

export function resolveSessionLandingMenuKey(
  session: AuthSession | null,
  allowedMenuKeys: AppMenuKey[],
  requestedMenuKey?: AppMenuKey | null
) {
  if (!allowedMenuKeys.length) {
    return null
  }
  if (requestedMenuKey && allowedMenuKeys.includes(requestedMenuKey)) {
    return requestedMenuKey
  }
  if (requestedMenuKey === 'user-store-noon' && allowedMenuKeys.includes('user-role')) {
    return 'user-store-noon'
  }

  const preferredOrder = isSystemAdminSession(session)
    ? SYSTEM_ADMIN_LANDING_ORDER
    : isBossManagementSession(session)
      ? BOSS_MANAGEMENT_LANDING_ORDER
      : OPERATOR_LANDING_ORDER

  return preferredOrder.find((menuKey) => allowedMenuKeys.includes(menuKey)) ?? allowedMenuKeys[0]
}
