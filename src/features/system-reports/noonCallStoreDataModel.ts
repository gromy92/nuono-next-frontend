import type { DistributionPoint } from '../../shared/charts'
import { statusLabel } from './NoonDataReportBlocks'
import type {
  NoonCallStoreCategoryCell,
  NoonCallStoreDataRow
} from './types'

export const NOON_CALL_CATEGORY_ORDER = ['PRODUCT_LIST', 'PRODUCT_DETAIL', 'SALES_ORDER', 'SALES_PRODUCT_VIEWS']

export function rowCategoryKey(
  row: NoonCallStoreDataRow,
  cell: Pick<NoonCallStoreCategoryCell, 'category'>
) {
  return `${row.ownerUserId}:${row.storeCode}:${row.siteCode}:${cell.category}`
}

export function addSyncingKey(current: Set<string>, key: string) {
  const next = new Set(current)
  next.add(key)
  return next
}

export function removeSyncingKey(current: Set<string>, key: string) {
  const next = new Set(current)
  next.delete(key)
  return next
}

export function applyOptimisticSyncing(
  rows: NoonCallStoreDataRow[],
  syncingKeys: Set<string>
): NoonCallStoreDataRow[] {
  if (!syncingKeys.size) {
    return rows
  }
  return rows.map((row) => {
    let changed = false
    const categories = row.categories.map((cell) => {
      if (!syncingKeys.has(rowCategoryKey(row, cell))) {
        return cell
      }
      changed = true
      return {
        ...cell,
        marker: 'SYNCING',
        latestTaskStatus: cell.latestTaskStatus || 'QUEUED'
      }
    })
    return changed ? { ...row, overallMarker: 'SYNCING', categories } : row
  })
}

function uniqueStatuses(...values: Array<string | null | undefined>) {
  const seen = new Set<string>()
  const statuses: string[] = []
  values.forEach((value) => {
    const normalized = (value || '').trim()
    if (!normalized || seen.has(normalized)) {
      return
    }
    seen.add(normalized)
    statuses.push(normalized)
  })
  return statuses
}

export function displayStatuses(cell: NoonCallStoreCategoryCell, markerText: string) {
  return uniqueStatuses(cell.latestStatus, cell.historyStatus).filter((status) => {
    if (statusLabel(status) === markerText || status === 'NOT_REQUIRED') {
      return false
    }
    if (cell.marker === 'COMPLETE' && (status === 'READY' || status === 'COMPLETE')) {
      return false
    }
    return true
  })
}

export function categoryTitle(category?: string | null) {
  const labels: Record<string, string> = {
    PRODUCT_LIST: '商品列表信息',
    PRODUCT_DETAIL: '商品信息',
    SALES_ORDER: '订单数据',
    SALES_PRODUCT_VIEWS: '销量数据'
  }
  return labels[category || ''] || category || '未知'
}

export function markerLabel(value?: string | null) {
  const normalized = (value || '').trim()
  const labels: Record<string, string> = {
    COMPLETE: '完整',
    PENDING_SYNC: '待同步',
    SYNCING: '同步中',
    FAILED: '失败',
    MANUAL_ACTION: '需人工处理',
    NOT_INTEGRATED: '未接入',
    PENDING_CONFIRMATION: '待确认'
  }
  return labels[normalized] || normalized || '未知'
}

export function buildMarkerDistribution(rows: NoonCallStoreDataRow[]): DistributionPoint[] {
  const counts = new Map<string, number>()
  rows.forEach((row) => increment(counts, row.overallMarker || 'UNKNOWN'))
  return mapCounts(counts, markerLabel)
}

export function buildCategoryMarkerDistribution(rows: NoonCallStoreDataRow[]): DistributionPoint[] {
  const counts = new Map<string, number>()
  rows.forEach((row) => {
    row.categories.forEach((cell) => increment(counts, cell.marker || cell.latestStatus || 'UNKNOWN'))
  })
  return mapCounts(counts, markerLabel)
}

export function buildCategoryGapDistribution(rows: NoonCallStoreDataRow[]): DistributionPoint[] {
  return NOON_CALL_CATEGORY_ORDER.map((category) => ({
    key: category,
    label: categoryTitle(category),
    value: rows.reduce((total, row) => {
      const cell = row.categories.find((item) => item.category === category)
      return total + Number(cell?.activeGapCount || 0)
    }, 0)
  }))
}

function increment(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) || 0) + 1)
}

function mapCounts(
  counts: Map<string, number>,
  label: (value: string) => string
): DistributionPoint[] {
  return Array.from(counts.entries()).map(([key, value]) => ({
    key,
    label: label(key),
    value
  }))
}
