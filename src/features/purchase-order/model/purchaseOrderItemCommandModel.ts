import type {
  PurchaseOrder,
  PurchaseOrderFulfillmentType,
  PurchaseOrderItem,
  PurchaseOrderItemCommand,
  PurchaseOrderItemSiteQuantityCommand,
  PurchaseSiteCode
} from '../types'
import {
  DEFAULT_FULFILLMENT_TYPE,
  SITE_OPTIONS
} from './purchaseOrderUiMeta'
import { sameDisplayText } from './purchaseOrderDisplayModel'
import type {
  PskuEntryFormValue,
  SiteQuantityFormValue
} from './purchaseOrderViewTypes'

export function normalizeSiteCode(value?: string) {
  return (value || '').trim().toUpperCase()
}

export function normalizeTransportMode(value?: string) {
  const normalized = (value || '').trim().toUpperCase()
  if (normalized === 'SEA' || normalized === '海' || normalized === '海运') {
    return 'SEA'
  }
  if (normalized === 'EXPRESS' || normalized === '快递') {
    return 'EXPRESS'
  }
  if (normalized === 'UNSPECIFIED' || normalized === '未分配' || normalized === '未指定') {
    return 'UNSPECIFIED'
  }
  return 'AIR'
}

export function transportModeLabel(value?: string) {
  const normalized = normalizeTransportMode(value)
  if (normalized === 'SEA') {
    return '海'
  }
  if (normalized === 'EXPRESS') {
    return '快递'
  }
  if (normalized === 'UNSPECIFIED') {
    return '未分配'
  }
  return '空'
}

export function allocationDisplayLabel(allocation: { site?: string; transportMode?: string; transportModeLabel?: string }) {
  const site = normalizeSiteCode(allocation.site) || '-'
  const modeLabel = allocation.transportModeLabel || transportModeLabel(allocation.transportMode)
  return `${site} ${modeLabel}`
}

export function ensureSiteOption(siteCode: PurchaseSiteCode) {
  const knownOption = SITE_OPTIONS.find((option) => option.value === siteCode)
  if (knownOption) {
    return [knownOption]
  }
  return [{ label: siteCode, value: siteCode }]
}

export function siteOption(siteCode: PurchaseSiteCode) {
  return ensureSiteOption(siteCode)[0]
}

export function normalizePskuEntries(rows?: PskuEntryFormValue[]): PurchaseOrderItemCommand[] {
  return (rows || [])
    .map(normalizePskuEntry)
    .filter((row): row is PurchaseOrderItemCommand => Boolean(row))
}

export function duplicatePskuSiteMessage(items: PurchaseOrderItemCommand[], order?: PurchaseOrder | null) {
  const pending = new Map<string, PurchaseOrderItemCommand>()
  for (const item of items) {
    const site = normalizeSiteCode(item.site)
    const transportMode = normalizeTransportMode(item.transportMode)
    const key = pskuSiteTransportKey(item.psku, site, transportMode)
    if (!key) {
      continue
    }
    if (pending.has(key)) {
      return `${item.psku} 在站点 ${site} / ${transportModeLabel(transportMode)} 重复填写，不能重复添加相同商品相同站点相同运输方式。`
    }
    pending.set(key, item)
  }

  if (!order) {
    return undefined
  }
  for (const item of items) {
    const site = normalizeSiteCode(item.site)
    const transportMode = normalizeTransportMode(item.transportMode)
    const existingItem = (order.items || []).find((orderItem) => purchaseOrderItemMatchesPsku(orderItem, item.psku))
    if (existingItem?.allocations?.some((allocation) => (
      normalizeSiteCode(allocation.site) === site && normalizeTransportMode(allocation.transportMode) === transportMode
    ))) {
      return `${item.psku} 已在站点 ${site} / ${transportModeLabel(transportMode)} 加入采购单，不能重复添加相同商品相同站点相同运输方式。`
    }
  }
  return undefined
}

export function pskuSiteTransportKey(psku?: string, site?: string, transportMode?: string) {
  const normalizedPsku = psku?.trim().toUpperCase()
  const normalizedSite = normalizeSiteCode(site)
  const normalizedTransport = normalizeTransportMode(transportMode)
  return normalizedPsku && normalizedSite && normalizedTransport ? `${normalizedPsku}:${normalizedSite}:${normalizedTransport}` : ''
}

export function purchaseOrderItemMatchesPsku(item: PurchaseOrderItem, psku: string) {
  return sameDisplayText(item.partnerSku, psku)
}

export function normalizePskuEntry(row?: PskuEntryFormValue): PurchaseOrderItemCommand | null {
  const item = {
    psku: row?.psku?.trim() || '',
    site: normalizeSiteCode(row?.site),
    transportMode: normalizeTransportMode(row?.transportMode),
    quantity: row?.quantity || 0,
    fulfillmentType: normalizeFulfillmentType(row?.fulfillmentType),
    fulfillmentSourceName: row?.fulfillmentSourceName?.trim() || undefined
  }
  return item.psku && item.site && item.transportMode && item.quantity > 0 ? item : null
}

export function normalizeFulfillmentType(value?: PurchaseOrderFulfillmentType | null): PurchaseOrderFulfillmentType {
  if (value === 'FACTORY_DIRECT') {
    return 'FACTORY_DIRECT'
  }
  return DEFAULT_FULFILLMENT_TYPE
}

export function fulfillmentTypeLabel(value?: PurchaseOrderFulfillmentType | null) {
  return normalizeFulfillmentType(value) === 'FACTORY_DIRECT' ? '货到货代' : '货到仓库'
}

export function normalizeSiteQuantityEntries(rows?: SiteQuantityFormValue[]): PurchaseOrderItemSiteQuantityCommand[] {
  const merged = new Map<string, PurchaseOrderItemSiteQuantityCommand>()
  ;(rows || []).forEach((row) => {
    const siteCode = normalizeSiteCode(row?.siteCode)
    const transportMode = normalizeTransportMode(row?.transportMode)
    const quantity = row?.quantity || 0
    if (!siteCode || !transportMode || quantity <= 0) {
      return
    }
    const key = `${siteCode}:${transportMode}`
    const current = merged.get(key)
    if (current) {
      current.quantity += quantity
      return
    }
    merged.set(key, { siteCode, transportMode, quantity })
  })
  return Array.from(merged.values())
}
