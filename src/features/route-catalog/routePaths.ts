import { currentAppPathname } from '../../runtimePaths'
import {
  WORKSPACE_MENU_DEFINITIONS,
  workspaceMenuPath
} from './RouteCatalog'
import type { AppMenuKey } from './routeDefinitions'

export const PRODUCT_WORKSPACE_PATH = workspaceMenuPath('product-manage')
export const PRODUCT_GROUPS_PATH = workspaceMenuPath('product-groups')
export const PRODUCT_SPECS_PATH = workspaceMenuPath('product-specs')
export const PRODUCT_IMAGE_PROFILE_PATH = workspaceMenuPath('product-image-profile')
export const PRODUCT_IMAGE_MATCH_PATH = workspaceMenuPath('product-image-match')
export const PRODUCT_MANUAL_SELECTION_PATH = workspaceMenuPath('product-manual-selection')
export const PURCHASE_1688_COLLECTION_PATH = workspaceMenuPath('purchase-ali1688-collection')
export const PURCHASE_ALI1688_HISTORICAL_ORDERS_PATH = workspaceMenuPath('purchase-ali1688-historical-orders')
export const PURCHASE_ALI1688_SKU_PURCHASE_HISTORY_PATH = workspaceMenuPath('purchase-ali1688-sku-purchase-history')
export const PURCHASE_LISTING_PATH = workspaceMenuPath('purchase-listing')
export const PURCHASE_ORDER_PATH = workspaceMenuPath('purchase-order')
export const PURCHASE_PROFIT_PATH = workspaceMenuPath('purchase-profit')
export const PURCHASE_LOGISTICS_QUOTE_PATH = workspaceMenuPath('purchase-logistics-quote')
export const PURCHASE_PRODUCT_LOGISTICS_COSTS_PATH = workspaceMenuPath('purchase-product-logistics-costs')
export const PURCHASE_IN_TRANSIT_GOODS_PATH = workspaceMenuPath('purchase-in-transit-goods')
export const WAREHOUSE_SHIPPING_ORDER_PATH = workspaceMenuPath('warehouse-shipping-order')
export const WAREHOUSE_LOGISTICS_BILL_PATH = workspaceMenuPath('warehouse-logistics-bill')
export const WAREHOUSE_DISPATCH_PATH = workspaceMenuPath('warehouse-dispatch')
export const OFFICIAL_WAREHOUSE_PATH = workspaceMenuPath('official-warehouse')
export const OPERATIONS_COMPETITOR_ANALYSIS_PATH = workspaceMenuPath('operations-competitor-analysis')
export const OPERATIONS_SKIN_MANAGEMENT_PATH = workspaceMenuPath('operations-skin-management')
export const OPERATIONS_NOON_ADS_PATH = workspaceMenuPath('operations-noon-ads')
export const OPERATIONS_PRODUCT_KEYWORDS_PATH = workspaceMenuPath('operations-product-keywords')
export const DATA_SALES_ANALYTICS_PATH = workspaceMenuPath('data-sales-analysis')
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

export function normalizeWorkspacePath(path?: string | null) {
  return (path || '').trim().toLowerCase().replace(/\/+$/, '') || '/'
}

function isSameOrChildPath(pathname: string, routePath: string) {
  const normalizedRoutePath = normalizeWorkspacePath(routePath)
  return pathname === normalizedRoutePath || pathname.startsWith(`${normalizedRoutePath}/`)
}

export function resolveWorkspaceMenuKeyFromLocation(pathname?: string): AppMenuKey | null {
  if (!pathname) {
    return null
  }

  const normalizedPath = normalizeWorkspacePath(pathname)
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

export function readInitialWorkspaceMenuKey() {
  if (typeof window === 'undefined') {
    return 'purchase-order' as AppMenuKey
  }

  return resolveWorkspaceMenuKeyFromLocation(currentAppPathname()) ?? ('purchase-order' as AppMenuKey)
}
