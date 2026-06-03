import type { AuthSession, AuthSessionStore } from '../auth/session'
import { currentAppPathname } from '../../runtimePaths'
import {
  normalizeSessionRoleView,
  PRODUCT_GROUPS_PATH,
  PRODUCT_SPECS_PATH,
  PRODUCT_WORKSPACE_PATH,
  PRODUCT_MANUAL_SELECTION_PATH,
  PURCHASE_1688_COLLECTION_PATH,
  DATA_SALES_ANALYTICS_PATH,
  DATA_SALES_FORECAST_PATH,
  NOON_CALL_STORE_DATA_PATH,
  SYSTEM_REPORT_NOON_DATA_COMPLETENESS_PATH,
  SYSTEM_REPORT_NOON_DATA_GAPS_PATH,
  OPERATIONS_CONFIG_VERSIONS_PATH,
  DATA_ACTIVITY_CONFIG_PATH,
  OPERATIONS_LIFECYCLE_RULES_PATH,
  PURCHASE_LOGISTICS_QUOTE_PATH,
  SYSTEM_FILE_MANAGEMENT_PATH
} from './WorkspaceRouting'

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

function shouldSkipStoredSessionRestore() {
  if (typeof window === 'undefined') {
    return false
  }

  return currentAppPathname().startsWith('/login')
}

function readStoredCurrentStore() {
  try {
    const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!rawValue) {
      return null
    }
    const storedSession = JSON.parse(rawValue) as AuthSession
    return storedSession.currentStore ?? null
  } catch {
    return null
  }
}

function resolveDevCurrentStore(devStores: AuthSessionStore[]) {
  const storedCurrentStore = readStoredCurrentStore()
  if (!storedCurrentStore?.storeCode) {
    return devStores[0]
  }

  return (
    devStores.find(
      (store) =>
        store.storeCode === storedCurrentStore.storeCode &&
        String(store.site || '') === String(storedCurrentStore.site || '')
    ) ??
    devStores.find((store) => store.storeCode === storedCurrentStore.storeCode) ??
    devStores[0]
  )
}

function readDevSessionOverride(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const hostname = window.location.hostname
  if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
    return null
  }

  const search = new URLSearchParams(window.location.search)
  if (search.get('devSession') !== '1') {
    return null
  }
  const pathname = currentAppPathname()
  const includeProductDevMenu =
    pathname.startsWith('/product-manage') ||
    pathname.startsWith(PRODUCT_WORKSPACE_PATH) ||
    pathname.startsWith(PRODUCT_GROUPS_PATH) ||
    pathname.startsWith(PRODUCT_SPECS_PATH)
  const includeProductManualSelectionDevMenu =
    pathname.startsWith(PRODUCT_MANUAL_SELECTION_PATH) ||
    search.get('grantManualSelection') === '1'
  const includePurchaseDevMenu =
    pathname.startsWith('/purchase/order') ||
    pathname.startsWith(PURCHASE_1688_COLLECTION_PATH) ||
    search.get('grantPurchase') === '1'
  const includeLogisticsQuoteDevMenu =
    pathname.startsWith(PURCHASE_LOGISTICS_QUOTE_PATH) ||
    search.get('grantLogisticsQuote') === '1'
  const includeSystemReportsDevMenu =
    pathname.startsWith(NOON_CALL_STORE_DATA_PATH) ||
    pathname.startsWith(SYSTEM_REPORT_NOON_DATA_COMPLETENESS_PATH) ||
    pathname.startsWith(SYSTEM_REPORT_NOON_DATA_GAPS_PATH) ||
    search.get('grantSystemReports') === '1'
  const includeSalesAnalyticsDevMenu =
    pathname.startsWith(DATA_SALES_ANALYTICS_PATH) ||
    pathname.startsWith(DATA_SALES_FORECAST_PATH) ||
    search.get('grantSalesAnalytics') === '1' ||
    search.get('grantSalesForecast') === '1'
  const includeOperationsConfigDevMenu =
    pathname.startsWith(OPERATIONS_CONFIG_VERSIONS_PATH) ||
    pathname.startsWith(DATA_ACTIVITY_CONFIG_PATH) ||
    pathname.startsWith(OPERATIONS_LIFECYCLE_RULES_PATH) ||
    pathname.startsWith('/operation-config/holiday') ||
    search.get('grantOperationsConfig') === '1'
  const includeFileManagementDevMenu =
    pathname.startsWith(SYSTEM_FILE_MANAGEMENT_PATH) ||
    pathname.startsWith('/system/ai-file-parse') ||
    search.get('grantFileManagement') === '1' ||
    search.get('grantAiFileParse') === '1'
  const includeRoleAssignmentDevMenu = search.get('grantRoleAssignment') === '1'
  const includeSystemRoleDevMenu = search.get('grantSystemRole') === '1'
  const devRole = (search.get('devRole') || search.get('role') || '').trim().toLowerCase()
  const useBossDevSession = devRole === 'boss' || devRole === 'laoban' || devRole === '老板'

  const adminDevStores: AuthSessionStore[] = [
    {
      id: 101,
      orgCode: 'ORG-XY',
      orgName: '星耀运营中心',
      projectCode: 'PRJ245027',
      projectName: 'xingyao',
      storeCode: 'STR245027-NAE',
      site: 'AE',
      authorized: true
    },
    {
      id: 102,
      orgCode: 'ORG-XY',
      orgName: '星耀运营中心',
      projectCode: 'PRJ245027',
      projectName: 'xingyao',
      storeCode: 'STR245027-NSA',
      site: 'SA',
      authorized: true
    },
    {
      id: 103,
      orgCode: 'ORG-MZ',
      orgName: '暮舟运营中心',
      projectCode: 'muzhou',
      projectName: '暮舟',
      storeCode: 'muzhou-AE',
      site: 'AE',
      authorized: true
    }
  ]

  const bossDevStores: AuthSessionStore[] = [
    {
      id: 301,
      orgCode: 'ORG-CANMAN',
      orgName: '毕翠红运营中心',
      projectCode: 'PRJ108065',
      projectName: 'canman',
      storeCode: 'STR108065-NAE',
      site: 'AE',
      authorized: true
    },
    {
      id: 302,
      orgCode: 'ORG-CANMAN',
      orgName: '毕翠红运营中心',
      projectCode: 'PRJ108065',
      projectName: 'canman',
      storeCode: 'STR108065-NSA',
      site: 'SA',
      authorized: true
    }
  ]

  const devStores = useBossDevSession ? bossDevStores : adminDevStores
  const grantedMenus: NonNullable<AuthSession['grantedMenus']> = useBossDevSession
    ? [
        { menuId: 10, menuName: '用户管理', urlPath: '/api/user/manage' },
        { menuId: 25, menuName: '角色分配', urlPath: '/api/user/role' }
      ]
    : [
        { menuId: 10, menuName: '用户管理', urlPath: '/api/user/manage' },
        { menuId: 9002, menuName: '菜单维护', urlPath: '/system/menu' }
      ]
  if (includeRoleAssignmentDevMenu) {
    grantedMenus.push({ menuId: 25, menuName: '角色分配', urlPath: '/api/user/role' })
  }
  if (includeSystemRoleDevMenu) {
    grantedMenus.push({ menuId: 9001, menuName: '角色管理', urlPath: '/system/role' })
  }
  if (includeProductDevMenu) {
    grantedMenus.push({ menuId: 9100, menuName: '商品管理', urlPath: '/api/sku/manage' })
    grantedMenus.push({ menuId: 9103, menuName: '商品分组', urlPath: PRODUCT_GROUPS_PATH })
    grantedMenus.push({ menuId: 9104, menuName: '商品规格', urlPath: PRODUCT_SPECS_PATH })
  }
  if (includeProductManualSelectionDevMenu) {
    grantedMenus.push({ menuId: 9102, menuName: '人工选品', urlPath: PRODUCT_MANUAL_SELECTION_PATH })
  }
  if (includePurchaseDevMenu) {
    grantedMenus.push({ menuId: 24, menuName: '采购', urlPath: '/api/purchase/order' })
  }
  if (includeLogisticsQuoteDevMenu) {
    grantedMenus.push({ menuId: 9201, menuName: '货代管理', urlPath: PURCHASE_LOGISTICS_QUOTE_PATH })
  }
  if (includeSystemReportsDevMenu) {
    grantedMenus.push({ menuId: 9600, menuName: '系统报表', urlPath: NOON_CALL_STORE_DATA_PATH })
    grantedMenus.push({ menuId: 9602, menuName: '数据完整度', urlPath: SYSTEM_REPORT_NOON_DATA_COMPLETENESS_PATH })
    grantedMenus.push({ menuId: 9603, menuName: '数据缺口巡检', urlPath: SYSTEM_REPORT_NOON_DATA_GAPS_PATH })
  }
  if (includeSalesAnalyticsDevMenu) {
    grantedMenus.push({ menuId: 9401, menuName: '销量分析', urlPath: DATA_SALES_ANALYTICS_PATH })
    grantedMenus.push({ menuId: 9402, menuName: '销量预测', urlPath: DATA_SALES_FORECAST_PATH })
  }
  if (includeOperationsConfigDevMenu) {
    grantedMenus.push({ menuId: 9503, menuName: '运营配置版本', urlPath: OPERATIONS_CONFIG_VERSIONS_PATH })
    grantedMenus.push({ menuId: 9501, menuName: '业务日历', urlPath: DATA_ACTIVITY_CONFIG_PATH })
    grantedMenus.push({ menuId: 9502, menuName: '生命周期配置', urlPath: OPERATIONS_LIFECYCLE_RULES_PATH })
  }
  if (includeFileManagementDevMenu && !useBossDevSession) {
    grantedMenus.push({ menuId: 9202, menuName: '文件管理', urlPath: SYSTEM_FILE_MANAGEMENT_PATH })
  }
  const adminDevUserId = 10003
  const currentStore = resolveDevCurrentStore(devStores)

  return {
    userId: useBossDevSession ? 307 : adminDevUserId,
    accountNo: useBossDevSession ? '毕翠红' : 'adminBI',
    realName: useBossDevSession ? '毕翠红' : 'adminBI',
    roleId: useBossDevSession ? 2 : 1,
    roleName: useBossDevSession ? '老板' : '管理员',
    companyName: useBossDevSession ? 'canman' : 'Nuono',
    status: 1,
    level: useBossDevSession ? 1 : 0,
    storeCount: devStores.length,
    authorizedStoreCount: devStores.filter((store) => store.authorized).length,
    bindingStatus: 'PROJECT_BOUND',
    defaultOwnerUserId: useBossDevSession ? 307 : 10002,
    activeRoleView: useBossDevSession ? 'boss' : undefined,
    currentStore,
    userStores: devStores,
    grantedMenus
  }
}

export function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const devSession = readDevSessionOverride()
  if (devSession) {
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(devSession))
    } catch {
      // Ignore localStorage write failures in local preview mode.
    }
    return devSession
  }

  if (shouldSkipStoredSessionRestore()) {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!rawValue) {
      return null
    }
    return normalizeSessionRoleView(JSON.parse(rawValue) as AuthSession)
  } catch {
    return null
  }
}
