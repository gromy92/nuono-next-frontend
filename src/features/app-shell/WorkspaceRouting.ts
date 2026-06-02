import type { AuthRoleView, AuthSession } from '../auth/session'
import { currentAppPathname } from '../../runtimePaths'
import {
  ALL_WORKSPACE_MENU_KEYS,
  BOSS_OPERATOR_MENU_KEYS,
  MANAGEMENT_MENU_KEYS,
  WORKSPACE_GRANTED_MENU_RULES,
  WORKSPACE_MENU_DEFINITIONS,
  workspaceMenuPath,
  type AppMenuKey
} from './WorkspaceMenuRegistry'

export type { AppMenuKey } from './WorkspaceMenuRegistry'

export const PRODUCT_WORKSPACE_PATH = workspaceMenuPath('product-manage')
export const PRODUCT_GROUPS_PATH = workspaceMenuPath('product-groups')
export const PRODUCT_SPECS_PATH = workspaceMenuPath('product-specs')
export const PRODUCT_MANUAL_SELECTION_PATH = workspaceMenuPath('product-manual-selection')
export const PURCHASE_1688_COLLECTION_PATH = workspaceMenuPath('purchase-ali1688-collection')
export const PURCHASE_ORDER_PATH = workspaceMenuPath('purchase-order')
export const PURCHASE_PROFIT_PATH = workspaceMenuPath('purchase-profit')
export const PURCHASE_LOGISTICS_QUOTE_PATH = workspaceMenuPath('purchase-logistics-quote')
export const DATA_SALES_ANALYTICS_PATH = workspaceMenuPath('data-sales-analysis')
export const DATA_SALES_FORECAST_PATH = workspaceMenuPath('data-sales-forecast')
export const NOON_CALL_STORE_DATA_PATH = workspaceMenuPath('noon-call-store-data')
export const SYSTEM_REPORT_NOON_DATA_COMPLETENESS_PATH = workspaceMenuPath('system-report-noon-data-completeness')
export const SYSTEM_REPORT_NOON_DATA_GAPS_PATH = workspaceMenuPath('system-report-noon-data-gaps')
export const OPERATIONS_CONFIG_VERSIONS_PATH = workspaceMenuPath('operations-config-versions')
export const DATA_ACTIVITY_CONFIG_PATH = workspaceMenuPath('data-activity-config')
export const OPERATIONS_LIFECYCLE_RULES_PATH = workspaceMenuPath('operations-lifecycle-rules')
export const SYSTEM_FILE_MANAGEMENT_PATH = workspaceMenuPath('system-file-management')
export const USER_ACCOUNT_PATH = workspaceMenuPath('user-account')
export const USER_STORE_NOON_PATH = workspaceMenuPath('user-store-noon')
export const USER_ROLE_PATH = workspaceMenuPath('user-role')
export const SYSTEM_MENU_PATH = workspaceMenuPath('system-menu')
export const SYSTEM_ROLE_PATH = workspaceMenuPath('system-role')

function normalizePath(path?: string | null) {
  return (path || '').trim().toLowerCase().replace(/\/+$/, '') || '/'
}

function isSameOrChildPath(pathname: string, routePath: string) {
  const normalizedRoutePath = normalizePath(routePath)
  return pathname === normalizedRoutePath || pathname.startsWith(`${normalizedRoutePath}/`)
}

export function resolveWorkspaceMenuKeyFromLocation(pathname?: string): AppMenuKey | null {
  if (!pathname) {
    return null
  }

  const normalizedPath = normalizePath(pathname)
  const matchedDefinition = Object.values(WORKSPACE_MENU_DEFINITIONS).find((definition) => {
    if (isSameOrChildPath(normalizedPath, definition.path)) {
      return true
    }
    return definition.routeAliases?.some((routeAlias) => isSameOrChildPath(normalizedPath, routeAlias))
  })
  return matchedDefinition?.key ?? null
}

export function resolveWorkspacePathForMenuKey(menuKey: AppMenuKey) {
  return workspaceMenuPath(menuKey) || PURCHASE_ORDER_PATH
}

const WORKSPACE_DEV_QUERY_KEYS = new Set([
  'devSession',
  'devRole',
  'role',
  'devOwner',
  'devAccount',
  'previewAli1688',
  'grantAiFileParse',
  'grantFileManagement',
  'grantLogisticsQuote',
  'grantManualSelection',
  'grantPurchase',
  'grantSalesAnalytics',
  'grantSalesForecast',
  'grantSystemReports',
  'grantOperationsConfig',
  'grantRoleAssignment',
  'grantSystemRole'
])

export function withCurrentWorkspaceDevQuery(path: string) {
  if (typeof window === 'undefined' || !path || path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const currentSearch = new URLSearchParams(window.location.search)
  const preservedSearch = new URLSearchParams()
  currentSearch.forEach((value, key) => {
    if (WORKSPACE_DEV_QUERY_KEYS.has(key)) {
      preservedSearch.append(key, value)
    }
  })

  const preservedSearchText = preservedSearch.toString()
  if (!preservedSearchText) {
    return path
  }

  const hashIndex = path.indexOf('#')
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : ''
  const separator = pathWithoutHash.includes('?') ? '&' : '?'
  return `${pathWithoutHash}${separator}${preservedSearchText}${hash}`
}

function normalizeGrantedMenuUrlPath(urlPath?: string | null) {
  return normalizePath(urlPath)
}

function normalizeGrantedMenuName(menuName?: string | null) {
  return (menuName || '').trim()
}

function mapGrantedMenuToWorkspaceMenuKeys(menu: NonNullable<AuthSession['grantedMenus']>[number]) {
  const normalizedPath = normalizeGrantedMenuUrlPath(menu.urlPath)
  const normalizedName = normalizeGrantedMenuName(menu.menuName)
  const matchedKeys = WORKSPACE_GRANTED_MENU_RULES.flatMap((rule) => {
    const hasPathMatch = rule.urlPaths?.some((urlPath) => normalizePath(urlPath) === normalizedPath)
    const hasPathPrefixMatch = rule.urlPathPrefixes?.some((urlPathPrefix) =>
      normalizedPath.startsWith(normalizePath(urlPathPrefix))
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
    mapGrantedMenuToWorkspaceMenuKeys(menu).forEach((key) => keySet.add(key))
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
    ? ([
        'system-role',
        'system-file-management',
        'user-account',
        'system-menu',
        'purchase-profit',
        'purchase-order',
        'data-sales-analysis',
        'data-sales-forecast',
        'noon-call-store-data',
        'system-report-noon-data-completeness',
        'system-report-noon-data-gaps',
        'data-activity-config',
        'operations-lifecycle-rules',
        'product-manual-selection',
        'product-specs',
        'product-manage'
      ] as AppMenuKey[])
    : isBossManagementSession(session)
      ? ([
          'user-role',
          'purchase-ali1688-collection',
          'purchase-order',
          'product-manage',
          'product-specs',
          'purchase-profit',
          'purchase-logistics-quote',
          'data-sales-analysis',
          'data-sales-forecast',
          'noon-call-store-data',
          'system-report-noon-data-completeness',
          'system-report-noon-data-gaps',
          'data-activity-config',
          'operations-lifecycle-rules',
          'product-manual-selection'
        ] as AppMenuKey[])
      : ([
          'purchase-ali1688-collection',
          'purchase-order',
          'product-manage',
          'product-specs',
          'user-role',
          'purchase-profit',
          'purchase-logistics-quote',
          'data-sales-analysis',
          'data-sales-forecast',
          'noon-call-store-data',
          'system-report-noon-data-completeness',
          'system-report-noon-data-gaps',
          'data-activity-config',
          'operations-lifecycle-rules',
          'product-manual-selection'
        ] as AppMenuKey[])

  for (const menuKey of preferredOrder) {
    if (allowedMenuKeys.includes(menuKey)) {
      return menuKey
    }
  }

  return allowedMenuKeys[0]
}

export function readInitialWorkspaceMenuKey() {
  if (typeof window === 'undefined') {
    return 'purchase-order' as AppMenuKey
  }

  return resolveWorkspaceMenuKeyFromLocation(currentAppPathname()) ?? ('purchase-order' as AppMenuKey)
}
