import type { PurchaseOrder, PurchaseSiteCode, PurchaseTransportMode, SiteAllocation } from '../purchase-order/types'
import type { PurchaseDraftRow } from './purchaseDrafts'
import type { ReplenishmentQuantity } from './types'

type PurchaseDraftLine = {
  partnerSku: string
  site: PurchaseSiteCode
  transportMode: PurchaseTransportMode
  quantity: number
}

type PurchaseTransportSource = {
  orderTitle?: string
  orderNo?: string
  orderStatus?: string
  quantity?: number
}

export function formatPurchaseDuplicateNotice(drafts: PurchaseDraftRow[], orders: PurchaseOrder[]) {
  const entries: string[] = []
  const seen = new Set<string>()
  for (const draft of purchaseDraftNoticeLines(drafts)) {
    for (const order of orders) {
      const existingItem = (order.items || []).find((item) => sameText(item.partnerSku, draft.partnerSku))
      if (!existingItem) {
        continue
      }
      for (const allocation of existingItem.allocations || []) {
        if (!sameText(allocation.site, draft.site) || !sameText(allocation.transportMode, draft.transportMode)) {
          continue
        }
        const key = [
          order.id,
          draft.partnerSku,
          draft.site,
          draft.transportMode,
          allocation.quantity
        ].join(':')
        if (seen.has(key)) {
          continue
        }
        seen.add(key)
        const source = purchaseTransportSourceFromAllocation(order, allocation)
        entries.push(`${draft.partnerSku} ${draft.site} / ${transportModeLabel(draft.transportMode)} 已在 ${formatPurchaseTransportSource(source)}`)
      }
    }
  }
  if (!entries.length) {
    return ''
  }
  const visibleEntries = entries.slice(0, 6)
  const remainingText = entries.length > visibleEntries.length
    ? `；另有 ${entries.length - visibleEntries.length} 条`
    : ''
  return `已加入采购单：${visibleEntries.join('；')}${remainingText}。可继续重复加入。`
}

function purchaseDraftNoticeLines(drafts: PurchaseDraftRow[]): PurchaseDraftLine[] {
  return drafts.flatMap((draft) => [draft.air, draft.sea]
    .map((quantityDraft) => ({
      partnerSku: draft.partnerSku,
      site: draft.site,
      transportMode: quantityDraft.transportMode,
      quantity: quantityDraft.quantity
    })))
}

function purchaseTransportSourceFromAllocation(order: PurchaseOrder, allocation: SiteAllocation): PurchaseTransportSource {
  return {
    orderTitle: order.title,
    orderNo: order.orderNo,
    orderStatus: order.status,
    quantity: allocation.quantity
  }
}

function transportModeLabel(value?: string | null) {
  if (value === 'AIR') return '空运'
  if (value === 'SEA') return '海运'
  return value || '-'
}

function purchaseOrderStatusLabel(value?: string | null) {
  if (value === 'draft') return '草稿'
  if (value === 'pending_collection') return '待采集'
  if (value === 'collecting') return '采集中'
  if (value === 'partial_done') return '部分完成'
  if (value === 'done') return '完成'
  if (value === 'exception') return '异常'
  if (value === 'submitted') return '已封存'
  if (value === 'deleted') return '已删除'
  return value || '-'
}

function formatPurchaseTransportSource(source: PurchaseTransportSource) {
  const orderText = [source.orderTitle, source.orderNo].filter(Boolean).join(' / ') || '采购单'
  const statusText = source.orderStatus ? `（${purchaseOrderStatusLabel(source.orderStatus)}）` : ''
  const quantityText = source.quantity === undefined ? '' : `，数量 ${formatQuantity(source.quantity)}`
  return `${orderText}${statusText}${quantityText}`
}

function sameText(left?: string | null, right?: string | null) {
  return (left || '').trim().toUpperCase() === (right || '').trim().toUpperCase()
}

function formatQuantity(value?: ReplenishmentQuantity | null) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? String(parsed) : String(value)
}
