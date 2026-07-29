import type {
  OfficialWarehouseStockStatisticsRow,
  OfficialWarehouseStockStatisticsView,
  OfficialWarehouseStockWarehouse
} from './statisticsTypes'
import { nonNegativeInteger } from './statisticsDomainUtils'

export function stockStatisticsInventoryNotice(stats?: OfficialWarehouseStockStatisticsView | null) {
  if (!stats) {
    return ''
  }
  const hasClassifiedInventory = stats.rows.some(
    (row) => row.inventoryConfidence === 'CLASSIFIED_INVENTORY' || row.sourceType === 'FBN_INVENTORY_API'
  )
  const hasPendingFallback =
    stats.rows.some((row) => row.inventoryConfidence === 'PENDING_CONFIRMATION_ONLY') ||
    (!hasClassifiedInventory && stats.summary.pendingConfirmationStock > 0)
  if (!hasPendingFallback) {
    return ''
  }
  return 'Noon Inventory 分类报表未接入，当前库存来自 FBN + Supermall 摘要，默认全部待确认。'
}

export function stockRowNeedsReview(row: OfficialWarehouseStockStatisticsRow) {
  return Boolean(row.pendingConfirmationStock > 0 || row.anomalyFlags?.length)
}

export type CurrentStockWarehouseType = 'FBN' | 'SUPERMALL' | 'UNKNOWN'

export type CurrentStockWarehouseBreakdownRow = {
  key: string
  warehouseCode: string
  warehouseType: CurrentStockWarehouseType
  warehouseTypeLabel: string
  currentStock: number
  effectiveStock: number
  returnStock: number
  failedOrExceptionStock: number
  pendingConfirmationStock: number
}

export type CurrentStockWarehouseBreakdown = {
  totalStock: number
  fbnEffectiveStock: number
  supermallEffectiveStock: number
  otherEffectiveStock: number
  rows: CurrentStockWarehouseBreakdownRow[]
}

export function buildCurrentStockWarehouseBreakdown(
  totalStock: number,
  warehouseStocks?: OfficialWarehouseStockWarehouse[] | null
): CurrentStockWarehouseBreakdown {
  const rows = (warehouseStocks || [])
    .map((stock, index) => {
      const warehouseCode = (stock.warehouseCode || '').trim() || '未标仓'
      const warehouseType = currentStockWarehouseType(warehouseCode)
      return {
        key: `${warehouseCode}-${index}`,
        warehouseCode,
        warehouseType,
        warehouseTypeLabel: currentStockWarehouseTypeLabel(warehouseType),
        currentStock: nonNegativeInteger(stock.currentStock),
        effectiveStock: nonNegativeInteger(stock.effectiveStock),
        returnStock: nonNegativeInteger(stock.returnStock),
        failedOrExceptionStock: nonNegativeInteger(stock.failedOrExceptionStock),
        pendingConfirmationStock: nonNegativeInteger(stock.pendingConfirmationStock)
      }
    })
    .filter((stock) => stock.currentStock > 0)
    .sort((left, right) => {
      if (right.effectiveStock !== left.effectiveStock) {
        return right.effectiveStock - left.effectiveStock
      }
      if (right.currentStock !== left.currentStock) {
        return right.currentStock - left.currentStock
      }
      return left.warehouseCode.localeCompare(right.warehouseCode)
    })

  return {
    totalStock: nonNegativeInteger(totalStock),
    fbnEffectiveStock: sumEffectiveStock(rows, 'FBN'),
    supermallEffectiveStock: sumEffectiveStock(rows, 'SUPERMALL'),
    otherEffectiveStock: sumEffectiveStock(rows, 'UNKNOWN'),
    rows
  }
}

function sumEffectiveStock(
  rows: CurrentStockWarehouseBreakdownRow[],
  warehouseType: CurrentStockWarehouseType
) {
  return rows
    .filter((stock) => stock.warehouseType === warehouseType)
    .reduce((sum, stock) => sum + stock.effectiveStock, 0)
}

function currentStockWarehouseType(warehouseCode: string): CurrentStockWarehouseType {
  const normalized = warehouseCode.trim().toUpperCase()
  if (!normalized || normalized === '未标仓') {
    return 'UNKNOWN'
  }
  return normalized === 'RUH01S' ? 'FBN' : 'SUPERMALL'
}

function currentStockWarehouseTypeLabel(type: CurrentStockWarehouseType) {
  if (type === 'FBN') {
    return '仓'
  }
  if (type === 'SUPERMALL') {
    return 'Supermall'
  }
  return '未标仓'
}

export function normalizeOfficialWarehouseProductImageUrl(value?: string | null) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  let normalized = raw
  if (/^original\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(/^original\/pzsku\//i, 'https://f.nooncdn.com/p/pzsku/')
  } else if (/^pzsku\//i.test(normalized)) {
    normalized = `https://f.nooncdn.com/p/${normalized}`
  } else if (/^https:\/\/f\.nooncdn\.com\/p\/original\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(
      /^https:\/\/f\.nooncdn\.com\/p\/original\/pzsku\//i,
      'https://f.nooncdn.com/p/pzsku/'
    )
  } else if (/^https:\/\/f\.nooncdn\.com\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(/^https:\/\/f\.nooncdn\.com\/pzsku\//i, 'https://f.nooncdn.com/p/pzsku/')
  }

  if (/^https:\/\/f\.nooncdn\.com\/p\/pzsku\//i.test(normalized) && !hasImageExtension(normalized)) {
    return `${normalized}.jpg`
  }
  return normalized
}

export function stockCorrectionActionLabel() {
  return '订正分类'
}

export function stockSourceLabel(sourceType?: string) {
  if (sourceType === 'MANUAL_CORRECTION') {
    return '人工订正'
  }
  if (sourceType === 'FBN_INVENTORY_API') {
    return 'FBN库存'
  }
  return '库存摘要'
}

export function stockBucketLabel(bucket?: string) {
  switch (bucket) {
    case 'SELLABLE':
      return '有效在仓'
    case 'RETURNED':
      return '退货'
    case 'RECEIVING_EXCEPTION':
      return '入仓异常'
    case 'DAMAGED':
      return '破损'
    case 'QUALITY_HOLD':
      return '质量冻结'
    default:
      return '待确认'
  }
}

function hasImageExtension(value: string) {
  return /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(value)
}
