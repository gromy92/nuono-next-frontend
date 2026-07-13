import type { PurchaseSiteCode, PurchaseTransportMode } from '../purchase-order/types'
import type { ReplenishmentPlanItem, ReplenishmentQuantity } from './types'

export type PurchaseDraftQuantity = {
  transportMode: PurchaseTransportMode
  quantity: number
  calculatedQuantity: number
  suggestedQuantity: number
}

export type PurchaseDraftRow = {
  key: string
  partnerSku: string
  sku?: string | null
  productTitle?: string | null
  site: PurchaseSiteCode
  air: PurchaseDraftQuantity
  sea: PurchaseDraftQuantity
}

export function buildPurchaseDrafts(item: ReplenishmentPlanItem, site: string): PurchaseDraftRow[] {
  const airSuggestedQuantity = positiveCeilQuantity(item.airSuggestedUnits)
  const seaSuggestedQuantity = positiveCeilQuantity(item.seaSuggestedUnits)
  return [
    {
      key: `${item.partnerSku}:${site}`,
      partnerSku: item.partnerSku,
      sku: item.sku,
      productTitle: item.productTitle,
      site,
      air: buildPurchaseDraftQuantity('AIR', airSuggestedQuantity, positiveCeilQuantity(item.airCalculatedUnits)),
      sea: buildPurchaseDraftQuantity('SEA', seaSuggestedQuantity, positiveCeilQuantity(item.seaCalculatedUnits))
    }
  ]
}

export function filterBatchPurchaseDrafts(drafts: PurchaseDraftRow[]) {
  return drafts.filter((draft) => draft.air.quantity > 0 || draft.sea.quantity > 0)
}

export function pskuSiteTransportKey(psku: string, site: string, transportMode?: string | null) {
  return `${psku.trim().toUpperCase()}:${site.trim().toUpperCase()}:${(transportMode || '').trim().toUpperCase()}`
}

function buildPurchaseDraftQuantity(
  transportMode: PurchaseTransportMode,
  suggestedQuantityValue: number,
  calculatedQuantity: number
): PurchaseDraftQuantity {
  return {
    transportMode,
    quantity: suggestedQuantityValue,
    calculatedQuantity,
    suggestedQuantity: suggestedQuantityValue
  }
}

function positiveCeilQuantity(value?: ReplenishmentQuantity | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 0
}
