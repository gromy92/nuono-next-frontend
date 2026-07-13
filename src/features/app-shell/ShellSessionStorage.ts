import type { AuthSession, AuthSessionStore } from '../auth/session'
import { currentAppPathname } from '../../runtimePaths'
import {
  normalizeSessionRoleView,
  PRODUCT_GROUPS_PATH,
  PRODUCT_IMAGE_PROFILE_PATH,
  PRODUCT_IMAGE_MATCH_PATH,
  PRODUCT_SPECS_PATH,
  PRODUCT_WORKSPACE_PATH,
  PRODUCT_MANUAL_SELECTION_PATH,
  PURCHASE_PROFIT_PATH,
  PURCHASE_1688_COLLECTION_PATH,
  PURCHASE_LISTING_PATH,
  DATA_SALES_ANALYTICS_PATH,
  OPERATIONS_COMPETITOR_ANALYSIS_PATH,
  OPERATIONS_SKIN_MANAGEMENT_PATH,
  OPERATIONS_NOON_ADS_PATH,
  OPERATIONS_PRODUCT_KEYWORDS_PATH,
  NOON_CALL_STORE_DATA_PATH,
  SYSTEM_REPORT_NOON_DATA_COMPLETENESS_PATH,
  SYSTEM_REPORT_NOON_DATA_GAPS_PATH,
  OPERATIONS_CONFIG_VERSIONS_PATH,
  DATA_ACTIVITY_CONFIG_PATH,
  OPERATIONS_LIFECYCLE_RULES_PATH,
  PURCHASE_ALI1688_HISTORICAL_ORDERS_PATH,
  PURCHASE_ALI1688_SKU_PURCHASE_HISTORY_PATH,
  PURCHASE_IN_TRANSIT_GOODS_PATH,
  PURCHASE_LOGISTICS_QUOTE_PATH,
  PURCHASE_PRODUCT_LOGISTICS_COSTS_PATH,
  WAREHOUSE_LOGISTICS_BILL_PATH,
  WAREHOUSE_SHIPPING_ORDER_PATH,
  WAREHOUSE_DISPATCH_PATH,
  OFFICIAL_WAREHOUSE_PATH,
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

function resolveDevCurrentStore(
  devStores: AuthSessionStore[],
  options: { restoreStored?: boolean; storeCode?: string | null; siteCode?: string | null } = {}
) {
  const requestedStoreCode = options.storeCode?.trim()
  const requestedSiteCode = options.siteCode?.trim().toUpperCase()
  if (requestedStoreCode) {
    return (
      devStores.find(
        (store) =>
          store.storeCode === requestedStoreCode &&
          (!requestedSiteCode || String(store.site || '').toUpperCase() === requestedSiteCode)
      ) ??
      devStores.find((store) => store.storeCode === requestedStoreCode) ??
      devStores[0]
    )
  }

  if (!options.restoreStored) {
    return devStores[0]
  }

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
    pathname.startsWith(PRODUCT_SPECS_PATH) ||
    pathname.startsWith(PRODUCT_IMAGE_PROFILE_PATH) ||
    pathname.startsWith(PRODUCT_IMAGE_MATCH_PATH) ||
    search.get('grantProductImages') === '1' ||
    search.get('grantImageMatch') === '1'
  const includeProductManualSelectionDevMenu =
    pathname.startsWith(PRODUCT_MANUAL_SELECTION_PATH) ||
    search.get('grantManualSelection') === '1'
  const includePurchaseDevMenu =
    pathname.startsWith('/purchase/order') ||
    pathname.startsWith(PURCHASE_1688_COLLECTION_PATH) ||
    pathname.startsWith(PURCHASE_LISTING_PATH) ||
    search.get('grantPurchase') === '1'
  const includeInTransitGoodsDevMenu =
    pathname.startsWith(PURCHASE_IN_TRANSIT_GOODS_PATH) ||
    search.get('grantInTransitGoods') === '1' ||
    search.get('grantPurchase') === '1'
  const includeProfitDevMenu =
    pathname.startsWith(PURCHASE_PROFIT_PATH) ||
    search.get('grantProfit') === '1'
  const includeLogisticsQuoteDevMenu =
    pathname.startsWith(PURCHASE_LOGISTICS_QUOTE_PATH) ||
    search.get('grantLogisticsQuote') === '1'
  const includeProductLogisticsCostsDevMenu =
    pathname.startsWith(PURCHASE_PRODUCT_LOGISTICS_COSTS_PATH) ||
    search.get('grantProductLogisticsCosts') === '1'
  const includeWarehouseDevMenu =
    pathname.startsWith(WAREHOUSE_SHIPPING_ORDER_PATH) ||
    pathname.startsWith(WAREHOUSE_DISPATCH_PATH) ||
    pathname.startsWith(OFFICIAL_WAREHOUSE_PATH) ||
    search.get('grantWarehouse') === '1'
  const includeSystemReportsDevMenu =
    pathname.startsWith(NOON_CALL_STORE_DATA_PATH) ||
    pathname.startsWith(SYSTEM_REPORT_NOON_DATA_COMPLETENESS_PATH) ||
    pathname.startsWith(SYSTEM_REPORT_NOON_DATA_GAPS_PATH) ||
    search.get('grantSystemReports') === '1'
  const includeSalesAnalyticsDevMenu =
    pathname.startsWith(DATA_SALES_ANALYTICS_PATH) ||
    search.get('grantSalesAnalytics') === '1' ||
    search.get('grantSalesForecast') === '1'
  const includeOperationsCompetitorDevMenu =
    pathname.startsWith(OPERATIONS_COMPETITOR_ANALYSIS_PATH) ||
    search.get('grantCompetitorAnalysis') === '1'
  const includeOperationsSkinDevMenu =
    pathname.startsWith(OPERATIONS_SKIN_MANAGEMENT_PATH) ||
    search.get('grantOperationsSkin') === '1'
  const includeOperationsNoonAdsDevMenu =
    pathname.startsWith(OPERATIONS_NOON_ADS_PATH) ||
    search.get('grantNoonAds') === '1' ||
    search.get('grantOperationsNoonAds') === '1'
  const includeOperationsProductKeywordsDevMenu =
    pathname.startsWith(OPERATIONS_PRODUCT_KEYWORDS_PATH) ||
    search.get('grantProductKeywords') === '1'
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
  const useAdminDevSession = ['admin', 'system-admin', 'administrator', '管理员', '系统管理员'].includes(devRole)
  const useBossDevSession = !useAdminDevSession && (devRole === '' || devRole === 'boss' || devRole === 'laoban' || devRole === '老板')
  const useOpsManagerDevSession = ['ops-manager', 'operation-manager', 'operations-manager', '运营主管', '运营管理'].includes(devRole)
  const useOperatorDevSession = ['operator', 'ops', 'operation', '运营'].includes(devRole)
  const useProcurementDevSession = ['procurement', 'purchase', 'purchasing', 'buyer', '采购'].includes(devRole)
  const useWarehouseDevSession = ['warehouse', 'stock', 'storekeeper', '仓管'].includes(devRole)
  const useBusinessDevSession =
    useBossDevSession ||
    useOpsManagerDevSession ||
    useOperatorDevSession ||
    useProcurementDevSession ||
    useWarehouseDevSession

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
      id: 305,
      orgCode: 'ORG-CANMAN',
      orgName: '毕翠红运营中心',
      projectCode: 'PRJ108065',
      projectName: 'canman',
      storeCode: 'STR108065-NSA',
      site: 'SA',
      authorized: true
    },
    {
      id: 302,
      orgCode: 'ORG-XINGYAO',
      orgName: '毕翠红运营中心',
      projectCode: 'PRJ245027',
      projectName: 'xingyao',
      storeCode: 'STR245027-NAE',
      site: 'AE',
      authorized: true
    },
    {
      id: 303,
      orgCode: 'ORG-CHENWU',
      orgName: '毕翠红运营中心',
      projectCode: 'PRJ244978',
      projectName: 'chenwu',
      storeCode: 'STR244978-NAE',
      site: 'AE',
      authorized: true
    },
    {
      id: 304,
      orgCode: 'ORG-SGG',
      orgName: '毕翠红运营中心',
      projectCode: 'PRJ69486',
      projectName: 'YI WU SHI SONG GUO GUO ER DIAN ZI SHANG WU YOU XIAN GONG SI',
      storeCode: 'STR69486-NSA',
      site: 'SA',
      authorized: true
    }
  ]

  const devStores = useBusinessDevSession ? bossDevStores : adminDevStores
  const grantedMenus: NonNullable<AuthSession['grantedMenus']> = useBossDevSession
    ? [
        { menuId: 10, menuName: '用户管理', urlPath: '/api/user/manage' },
        { menuId: 25, menuName: '角色分配', urlPath: '/api/user/role' }
      ]
    : useBusinessDevSession
      ? []
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
    grantedMenus.push({ menuId: 9106, menuName: '商品图', urlPath: PRODUCT_IMAGE_PROFILE_PATH })
    grantedMenus.push({ menuId: 9105, menuName: '图片匹配', urlPath: PRODUCT_IMAGE_MATCH_PATH })
  }
  if (includeProductManualSelectionDevMenu) {
    grantedMenus.push({ menuId: 9102, menuName: '人工选品', urlPath: PRODUCT_MANUAL_SELECTION_PATH })
  }
  if (includePurchaseDevMenu) {
    grantedMenus.push({ menuId: 24, menuName: '采购', urlPath: '/api/purchase/order' })
  }
  if (includeInTransitGoodsDevMenu) {
    grantedMenus.push({ menuId: 9302, menuName: '在途商品', urlPath: PURCHASE_IN_TRANSIT_GOODS_PATH })
  }
  if (
    currentAppPathname().startsWith(PURCHASE_ALI1688_HISTORICAL_ORDERS_PATH) ||
    currentAppPathname().startsWith(PURCHASE_ALI1688_SKU_PURCHASE_HISTORY_PATH) ||
    search.get('grantAli1688HistoricalOrders') === '1' ||
    search.get('grantPurchase') === '1'
  ) {
    grantedMenus.push({
      menuId: 9401,
      menuName: '1688 历史订单',
      urlPath: PURCHASE_ALI1688_HISTORICAL_ORDERS_PATH
    })
    grantedMenus.push({
      menuId: 9402,
      menuName: 'SKU 采购历史',
      urlPath: PURCHASE_ALI1688_SKU_PURCHASE_HISTORY_PATH
    })
  }
  if (includeProfitDevMenu) {
    grantedMenus.push({ menuId: 6, menuName: '利润计算', urlPath: PURCHASE_PROFIT_PATH })
  }
  if (includeLogisticsQuoteDevMenu) {
    grantedMenus.push({ menuId: 9201, menuName: '货代管理', urlPath: PURCHASE_LOGISTICS_QUOTE_PATH })
  }
  if (includeProductLogisticsCostsDevMenu) {
    grantedMenus.push({ menuId: 9304, menuName: '商品物流价格', urlPath: PURCHASE_PRODUCT_LOGISTICS_COSTS_PATH })
  }
  if (includeWarehouseDevMenu) {
    grantedMenus.push({ menuId: 9250, menuName: '仓库发货单', urlPath: WAREHOUSE_SHIPPING_ORDER_PATH })
    grantedMenus.push({ menuId: 9251, menuName: '物流账单', urlPath: WAREHOUSE_LOGISTICS_BILL_PATH })
    grantedMenus.push({ menuId: 9252, menuName: '仓库发运', urlPath: WAREHOUSE_DISPATCH_PATH })
    grantedMenus.push({ menuId: 9253, menuName: 'Noon官方仓', urlPath: OFFICIAL_WAREHOUSE_PATH })
  }
  if (includeSystemReportsDevMenu) {
    grantedMenus.push({ menuId: 9600, menuName: '系统报表', urlPath: NOON_CALL_STORE_DATA_PATH })
    grantedMenus.push({ menuId: 9602, menuName: '数据完整度', urlPath: SYSTEM_REPORT_NOON_DATA_COMPLETENESS_PATH })
    grantedMenus.push({ menuId: 9603, menuName: '数据缺口巡检', urlPath: SYSTEM_REPORT_NOON_DATA_GAPS_PATH })
  }
  if (includeSalesAnalyticsDevMenu) {
    grantedMenus.push({ menuId: 9401, menuName: '销量分析', urlPath: DATA_SALES_ANALYTICS_PATH })
  }
  if (includeOperationsCompetitorDevMenu) {
    grantedMenus.push({ menuId: 9801, menuName: '竞品分析', urlPath: OPERATIONS_COMPETITOR_ANALYSIS_PATH })
  }
  if (includeOperationsSkinDevMenu) {
    grantedMenus.push({ menuId: 9802, menuName: '皮肤管理', urlPath: OPERATIONS_SKIN_MANAGEMENT_PATH })
  }
  if (includeOperationsNoonAdsDevMenu) {
    grantedMenus.push({ menuId: 9803, menuName: '广告投放经营台', urlPath: OPERATIONS_NOON_ADS_PATH })
  }
  if (includeOperationsProductKeywordsDevMenu) {
    grantedMenus.push({ menuId: 9804, menuName: '关键词数据', urlPath: OPERATIONS_PRODUCT_KEYWORDS_PATH })
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
  const devProfile = useBossDevSession
    ? {
        userId: 307,
        accountNo: '毕翠红',
        realName: '毕翠红',
        roleId: 2,
        roleName: '老板',
        companyName: 'canman',
        level: 1
      }
    : useOpsManagerDevSession
      ? {
          userId: 90005,
          accountNo: 'operations.manager.demo',
          realName: '运营主管演示账号',
          roleId: 3,
          roleName: '运营主管',
          companyName: 'canman',
          level: 2
        }
      : useOperatorDevSession
        ? {
            userId: 90003,
            accountNo: 'operation.demo',
            realName: '运营演示账号',
            roleId: 4,
            roleName: '运营',
            companyName: 'canman',
            level: 3
          }
        : useProcurementDevSession
          ? {
              userId: 90001,
              accountNo: 'procurement.demo',
              realName: '采购演示账号',
              roleId: 5,
              roleName: '采购',
              companyName: 'canman',
              level: 3
            }
          : useWarehouseDevSession
            ? {
                userId: 90004,
                accountNo: 'warehouse.demo',
                realName: '仓管演示账号',
                roleId: 6,
                roleName: '仓管',
                companyName: 'canman',
                level: 3
              }
            : {
                userId: adminDevUserId,
                accountNo: 'adminBI',
                realName: 'adminBI',
                roleId: 1,
                roleName: '管理员',
                companyName: 'Nuono',
                level: 0
              };
  const currentStore = resolveDevCurrentStore(devStores, {
    restoreStored: search.get('preserveDevStore') === '1',
    storeCode: search.get('devStore') || search.get('storeCode'),
    siteCode: search.get('devSite') || search.get('siteCode') || search.get('site')
  })

  return {
    userId: devProfile.userId,
    accountNo: devProfile.accountNo,
    realName: devProfile.realName,
    roleId: devProfile.roleId,
    roleName: devProfile.roleName,
    companyName: devProfile.companyName,
    status: 1,
    level: devProfile.level,
    storeCount: devStores.length,
    authorizedStoreCount: devStores.filter((store) => store.authorized).length,
    bindingStatus: 'PROJECT_BOUND',
    defaultOwnerUserId: useBusinessDevSession ? 307 : 10002,
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
