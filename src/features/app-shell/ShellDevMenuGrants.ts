import type { AuthSession } from '../auth/session'
import {
  DATA_ACTIVITY_CONFIG_PATH,
  DATA_SALES_ANALYTICS_PATH,
  NOON_CALL_STORE_DATA_PATH,
  OFFICIAL_WAREHOUSE_PATH,
  OPERATIONS_COMPETITOR_ANALYSIS_PATH,
  OPERATIONS_CONFIG_VERSIONS_PATH,
  OPERATIONS_NOON_ADS_PATH,
  OPERATIONS_PRODUCT_KEYWORDS_PATH,
  OPERATIONS_SKIN_MANAGEMENT_PATH,
  PRODUCT_GROUPS_PATH,
  PRODUCT_IMAGE_MATCH_PATH,
  PRODUCT_IMAGE_PROFILE_PATH,
  PRODUCT_MANUAL_SELECTION_PATH,
  PRODUCT_SPECS_PATH,
  PRODUCT_WORKSPACE_PATH,
  PURCHASE_1688_COLLECTION_PATH,
  PURCHASE_ALI1688_HISTORICAL_ORDERS_PATH,
  PURCHASE_ALI1688_SKU_PURCHASE_HISTORY_PATH,
  PURCHASE_IN_TRANSIT_GOODS_PATH,
  PURCHASE_LISTING_PATH,
  PURCHASE_LOGISTICS_QUOTE_PATH,
  PURCHASE_PRODUCT_LOGISTICS_COSTS_PATH,
  PURCHASE_PROFIT_PATH,
  SYSTEM_FILE_MANAGEMENT_PATH,
  SYSTEM_REPORT_NOON_DATA_COMPLETENESS_PATH,
  SYSTEM_REPORT_NOON_DATA_GAPS_PATH,
  WAREHOUSE_DISPATCH_PATH,
  WAREHOUSE_LOGISTICS_BILL_PATH,
  WAREHOUSE_SHIPPING_ORDER_LEGACY_PATH
} from '../route-catalog/routePaths'
import type { DevRoleContext } from './ShellDevSessionFixtures'

type GrantedMenu = NonNullable<AuthSession['grantedMenus']>[number]

export function buildDevGrantedMenus(
  pathname: string,
  search: URLSearchParams,
  role: DevRoleContext
): NonNullable<AuthSession['grantedMenus']> {
  const menus: GrantedMenu[] = role.boss
    ? [
        { menuId: 10, menuName: '用户管理', urlPath: '/api/user/manage' },
        { menuId: 25, menuName: '角色分配', urlPath: '/api/user/role' }
      ]
    : role.business
      ? []
      : [
          { menuId: 10, menuName: '用户管理', urlPath: '/api/user/manage' },
          { menuId: 9002, menuName: '菜单维护', urlPath: '/system/menu' }
        ]

  addWhen(menus, search.get('grantRoleAssignment') === '1', 25, '角色分配', '/api/user/role')
  addWhen(menus, search.get('grantSystemRole') === '1', 9001, '角色管理', '/system/role')

  const product = startsWithAny(pathname, [
    '/product-manage',
    PRODUCT_WORKSPACE_PATH,
    PRODUCT_GROUPS_PATH,
    PRODUCT_SPECS_PATH,
    PRODUCT_IMAGE_PROFILE_PATH,
    PRODUCT_IMAGE_MATCH_PATH
  ]) || hasGrant(search, 'grantProductImages', 'grantImageMatch')
  if (product) {
    add(menus, 9100, '商品管理', '/api/sku/manage')
    add(menus, 9103, '商品分组', PRODUCT_GROUPS_PATH)
    add(menus, 9104, '商品规格', PRODUCT_SPECS_PATH)
    add(menus, 9106, '商品图', PRODUCT_IMAGE_PROFILE_PATH)
    add(menus, 9105, '图片匹配', PRODUCT_IMAGE_MATCH_PATH)
  }

  addWhen(
    menus,
    pathname.startsWith(PRODUCT_MANUAL_SELECTION_PATH) || hasGrant(search, 'grantManualSelection'),
    9102,
    '人工选品',
    PRODUCT_MANUAL_SELECTION_PATH
  )
  const purchase = startsWithAny(pathname, ['/purchase/order', PURCHASE_1688_COLLECTION_PATH, PURCHASE_LISTING_PATH])
    || hasGrant(search, 'grantPurchase')
  if (purchase) {
    add(menus, 24, '采购', '/api/purchase/order')
    add(menus, 2401, '商品上架', PURCHASE_LISTING_PATH)
  }
  addWhen(
    menus,
    pathname.startsWith(PURCHASE_IN_TRANSIT_GOODS_PATH) || hasGrant(search, 'grantInTransitGoods', 'grantPurchase'),
    9302,
    '在途商品',
    PURCHASE_IN_TRANSIT_GOODS_PATH
  )
  if (
    startsWithAny(pathname, [PURCHASE_ALI1688_HISTORICAL_ORDERS_PATH, PURCHASE_ALI1688_SKU_PURCHASE_HISTORY_PATH])
    || hasGrant(search, 'grantAli1688HistoricalOrders', 'grantPurchase')
  ) {
    add(menus, 9401, '1688 历史订单', PURCHASE_ALI1688_HISTORICAL_ORDERS_PATH)
    add(menus, 9402, 'SKU 采购历史', PURCHASE_ALI1688_SKU_PURCHASE_HISTORY_PATH)
  }
  addPathGrant(menus, pathname, search, PURCHASE_PROFIT_PATH, 'grantProfit', 6, '利润计算')
  addPathGrant(menus, pathname, search, PURCHASE_LOGISTICS_QUOTE_PATH, 'grantLogisticsQuote', 9201, '货代管理')
  addPathGrant(menus, pathname, search, PURCHASE_PRODUCT_LOGISTICS_COSTS_PATH, 'grantProductLogisticsCosts', 9304, '商品物流价格')

  if (
    startsWithAny(pathname, [WAREHOUSE_SHIPPING_ORDER_LEGACY_PATH, WAREHOUSE_DISPATCH_PATH, OFFICIAL_WAREHOUSE_PATH])
    || hasGrant(search, 'grantWarehouse')
  ) {
    add(menus, 9250, '仓库发货单', WAREHOUSE_SHIPPING_ORDER_LEGACY_PATH)
    add(menus, 9251, '物流账单', WAREHOUSE_LOGISTICS_BILL_PATH)
    add(menus, 9252, '仓库发运', WAREHOUSE_DISPATCH_PATH)
    add(menus, 9253, 'Noon官方仓', OFFICIAL_WAREHOUSE_PATH)
  }

  if (
    startsWithAny(pathname, [NOON_CALL_STORE_DATA_PATH, SYSTEM_REPORT_NOON_DATA_COMPLETENESS_PATH, SYSTEM_REPORT_NOON_DATA_GAPS_PATH])
    || hasGrant(search, 'grantSystemReports')
  ) {
    add(menus, 9600, '系统报表', NOON_CALL_STORE_DATA_PATH)
    add(menus, 9602, '数据完整度', SYSTEM_REPORT_NOON_DATA_COMPLETENESS_PATH)
    add(menus, 9603, '数据缺口巡检', SYSTEM_REPORT_NOON_DATA_GAPS_PATH)
  }

  addWhen(menus, pathname.startsWith(DATA_SALES_ANALYTICS_PATH) || hasGrant(search, 'grantSalesAnalytics', 'grantSalesForecast'), 9401, '销量分析', DATA_SALES_ANALYTICS_PATH)
  addPathGrant(menus, pathname, search, OPERATIONS_COMPETITOR_ANALYSIS_PATH, 'grantCompetitorAnalysis', 9801, '竞品分析')
  addPathGrant(menus, pathname, search, OPERATIONS_SKIN_MANAGEMENT_PATH, 'grantOperationsSkin', 9802, '皮肤管理')
  addWhen(menus, pathname.startsWith(OPERATIONS_NOON_ADS_PATH) || hasGrant(search, 'grantNoonAds', 'grantOperationsNoonAds'), 9803, '广告投放经营台', OPERATIONS_NOON_ADS_PATH)
  addPathGrant(menus, pathname, search, OPERATIONS_PRODUCT_KEYWORDS_PATH, 'grantProductKeywords', 9804, '关键词数据')

  if (
    startsWithAny(pathname, [OPERATIONS_CONFIG_VERSIONS_PATH, DATA_ACTIVITY_CONFIG_PATH, '/operation-config/holiday'])
    || hasGrant(search, 'grantOperationsConfig')
  ) {
    add(menus, 9503, '运营配置版本', OPERATIONS_CONFIG_VERSIONS_PATH)
    add(menus, 9501, '业务日历', DATA_ACTIVITY_CONFIG_PATH)
  }
  if (
    !role.boss
    && (startsWithAny(pathname, [SYSTEM_FILE_MANAGEMENT_PATH, '/system/ai-file-parse'])
      || hasGrant(search, 'grantFileManagement', 'grantAiFileParse'))
  ) {
    add(menus, 9202, '文件管理', SYSTEM_FILE_MANAGEMENT_PATH)
  }
  return menus
}

function addPathGrant(
  menus: GrantedMenu[],
  pathname: string,
  search: URLSearchParams,
  path: string,
  grant: string,
  menuId: number,
  menuName: string
) {
  addWhen(menus, pathname.startsWith(path) || hasGrant(search, grant), menuId, menuName, path)
}

function addWhen(menus: GrantedMenu[], condition: boolean, menuId: number, menuName: string, urlPath: string) {
  if (condition) add(menus, menuId, menuName, urlPath)
}

function add(menus: GrantedMenu[], menuId: number, menuName: string, urlPath: string) {
  menus.push({ menuId, menuName, urlPath })
}

function hasGrant(search: URLSearchParams, ...keys: string[]) {
  return keys.some((key) => search.get(key) === '1')
}

function startsWithAny(pathname: string, paths: string[]) {
  return paths.some((path) => pathname.startsWith(path))
}
