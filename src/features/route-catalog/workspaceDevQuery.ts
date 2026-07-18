import { currentAppPathname } from '../../runtimePaths'
import { OFFICIAL_WAREHOUSE_PATH, normalizeWorkspacePath } from './routePaths'

const WORKSPACE_DEV_QUERY_KEYS = new Set([
  'devSession',
  'devRole',
  'role',
  'devOwner',
  'devAccount',
  'devStore',
  'devSite',
  'previewAli1688',
  'grantAiFileParse',
  'grantFileManagement',
  'grantProfit',
  'grantLogisticsQuote',
  'grantProductLogisticsCosts',
  'grantInTransitGoods',
  'grantWarehouse',
  'grantAli1688HistoricalOrders',
  'grantManualSelection',
  'grantProductImages',
  'grantCompetitorAnalysis',
  'grantOperationsSkin',
  'grantProductKeywords',
  'grantImageMatch',
  'grantPurchase',
  'grantSalesAnalytics',
  'grantSalesForecast',
  'grantSystemReports',
  'grantOperationsConfig',
  'grantRoleAssignment',
  'grantSystemRole'
])

const OFFICIAL_WAREHOUSE_TAB_QUERY_KEY = 'officialWarehouseTab'
const OFFICIAL_WAREHOUSE_STOCK_ALIAS_PATH = '/warehouse/official-warehouse-stock'
const SESSION_STORAGE_KEY = 'nuono-next-session'

type StoredWorkspaceSession = {
  currentStore?: {
    projectName?: string | null
    projectCode?: string | null
    orgName?: string | null
    storeCode?: string | null
    site?: string | null
  } | null
}

function stripPathSearchAndHash(path: string) {
  const hashIndex = path.indexOf('#')
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path
  const searchIndex = pathWithoutHash.indexOf('?')
  return searchIndex >= 0 ? pathWithoutHash.slice(0, searchIndex) : pathWithoutHash
}

function shouldCarryOfficialWarehouseStockTab(path: string, currentSearch: URLSearchParams) {
  if (normalizeWorkspacePath(stripPathSearchAndHash(path)) !== OFFICIAL_WAREHOUSE_PATH) {
    return false
  }
  return (
    normalizeWorkspacePath(currentAppPathname()) === OFFICIAL_WAREHOUSE_STOCK_ALIAS_PATH ||
    currentSearch.get(OFFICIAL_WAREHOUSE_TAB_QUERY_KEY) === 'stock'
  )
}

function normalizeWorkspaceDevQueryValue(value?: string | null) {
  const normalized = (value || '').trim()
  return normalized || null
}

function storedCurrentWorkspaceDevQuery(currentSearch: URLSearchParams) {
  if (typeof window === 'undefined' || currentSearch.get('devSession') !== '1') {
    return null
  }

  try {
    const rawValue = window.localStorage?.getItem(SESSION_STORAGE_KEY)
    if (!rawValue) {
      return null
    }
    const storedSession = JSON.parse(rawValue) as StoredWorkspaceSession
    const currentStore = storedSession.currentStore
    if (!currentStore?.storeCode) {
      return null
    }

    const search = new URLSearchParams()
    const account =
      normalizeWorkspaceDevQueryValue(currentStore.projectName) ??
      normalizeWorkspaceDevQueryValue(currentStore.projectCode) ??
      normalizeWorkspaceDevQueryValue(currentStore.orgName)
    if (account) {
      search.set('devAccount', account)
    }
    search.set('devStore', currentStore.storeCode.trim())
    const site = normalizeWorkspaceDevQueryValue(currentStore.site)
    if (site) {
      search.set('devSite', site)
    }
    return search
  } catch {
    return null
  }
}

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
  storedCurrentWorkspaceDevQuery(currentSearch)?.forEach((value, key) => {
    preservedSearch.set(key, value)
  })
  if (shouldCarryOfficialWarehouseStockTab(path, currentSearch)) {
    preservedSearch.set(OFFICIAL_WAREHOUSE_TAB_QUERY_KEY, 'stock')
  }

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
