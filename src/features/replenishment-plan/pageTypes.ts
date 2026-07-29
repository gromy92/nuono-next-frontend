import type { AuthSession } from '../auth/session'
import type { PurchaseSiteCode, PurchaseTransportMode } from '../purchase-order/types'

export const BATCH_PURCHASE_OPENING_KEY = '__batch__'
export const SEA_ETA_UNCERTAIN_AIR_WINDOW_WARNING = 'sea_eta_uncertain_air_window_coverage'
export const SEA_ETA_UNCERTAIN_AIR_WINDOW_TOOLTIP = '海运到货时间具有不确定性 谨慎评判'
export const BLOCKING_WARNING_LABELS: Record<string, string> = {
  daily_forecast_missing: '缺少日级预测',
  daily_forecast_gap: '未来 1-100 天预测不完整',
  stock_fact_missing: '缺少库存事实',
  fbn_stock_fact_missing: '缺少 FBN 库存',
  forecast_fact_expired: '预测事实已过期',
  inbound_site_unresolved: '在途目的站点无法确认'
}
export type ReplenishmentPlanTabProps = {
  session?: AuthSession | null
  purchaseOrdersRevision?: number
  onPurchaseOrdersChanged?: () => void | Promise<void>
}

export type ProductImagePreview = {
  url: string
  title: string
}

export type PurchaseDraftTransportKey = 'air' | 'sea'

export type PurchaseDraftLine = {
  partnerSku: string
  site: PurchaseSiteCode
  transportMode: PurchaseTransportMode
  quantity: number
}

export type PurchaseTransportSource = {
  orderTitle?: string
  orderNo?: string
  orderStatus?: string
  quantity?: number
}

export type SuggestionFilter = 'all' | 'needed' | 'air' | 'sea'

export function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase()
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) return 'SA'
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) return 'AE'
  if (normalized.endsWith('-EG')) return 'EG'
  return ''
}
