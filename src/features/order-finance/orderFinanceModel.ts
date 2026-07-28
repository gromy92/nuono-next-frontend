import type { AuthSessionStore } from '../auth/session'
import type {
  OrderFinanceOrderGroup,
  OrderFinanceQuery,
  OrderFinanceSkuSummaryRow,
  OrderFinanceSkuSummaryView,
  OrderFinanceSummary,
  OrderFinanceSyncInput,
  OrderFinanceTransactionLine
} from './types'

export type OrderFinanceLineRecord = OrderFinanceTransactionLine & {
  detailKey: string
  orderNr: string
  orderDate?: string | null
  currency: string
}

export type OrderFinanceOrderRecord = {
  detailKey: string
  orderNr: string
  orderDate?: string | null
  transactionDateFrom?: string | null
  transactionDateTo?: string | null
  currency: string
  lines: OrderFinanceLineRecord[]
  totalAmount: number
}

export function amountValue(value: number | null | undefined) {
  const numericValue = Number(value ?? 0)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export function normalizeSummaryGroups(data: OrderFinanceSkuSummaryView, fallbackCurrency?: string): OrderFinanceSummary[] {
  const rawSummary = data.summary
  if (Array.isArray(rawSummary)) {
    return rawSummary.map((summary) => ({ ...summary, currency: summary.currency || fallbackCurrency || '未知' }))
  }
  if (rawSummary) {
    return [{ ...rawSummary, currency: rawSummary.currency || fallbackCurrency || '未知' }]
  }
  return []
}

export function groupOrderFinanceOrders(groups: OrderFinanceOrderGroup[], row: OrderFinanceSkuSummaryRow) {
  const orderGroups = new Map<string, OrderFinanceOrderGroup>()
  groups.forEach((group) => {
    const orderNr = group.orderNr || group.lines?.[0]?.orderNr || 'NA'
    const currency = group.currency || group.lines?.[0]?.currency || row.currency || '未知'
    const partnerSku = group.lines?.[0]?.partnerSku || row.partnerSku || (row.missingPartnerSku ? 'MISSING_PARTNER_SKU' : '')
    const sku = group.lines?.[0]?.sku || row.sku || ''
    const groupKey = [currency, orderNr, partnerSku, sku].join('::')
    const current = orderGroups.get(groupKey)
    if (!current) {
      orderGroups.set(groupKey, {
        ...group,
        orderNr,
        currency,
        lines: [...(group.lines || [])]
      })
      return
    }
    current.lines.push(...(group.lines || []))
    current.netProceeds += group.netProceeds || 0
    current.referralFee += group.referralFee || 0
    current.fulfillmentLogisticsFee += group.fulfillmentLogisticsFee || 0
    current.otherOrderFee += group.otherOrderFee || 0
    current.totalAmount += group.totalAmount || 0
    current.transactionDateFrom = minDate(current.transactionDateFrom, group.transactionDateFrom)
    current.transactionDateTo = maxDate(current.transactionDateTo, group.transactionDateTo)
  })
  return Array.from(orderGroups.values())
}

export function syncInputFromQuery(query: OrderFinanceQuery): OrderFinanceSyncInput {
  return {
    storeCode: query.storeCode,
    siteCode: query.siteCode
  }
}

export function parsePartnerSkuText(text: string) {
  return Array.from(new Set(text.split(/[\s,，;；]+/).map((item) => item.trim()).filter(Boolean)))
}

export function siteCodeFromStoreCode(storeCode: string) {
  const normalized = storeCode.toUpperCase()
  if (normalized.includes('AE') || normalized.includes('UAE') || normalized.includes('DB')) return 'AE'
  return 'SA'
}

export function orderFinanceRowKey(row: OrderFinanceSkuSummaryRow) {
  return [row.currency || 'UNKNOWN', row.partnerSku || 'MISSING_PARTNER_SKU', row.sku || 'NO_SKU'].join('::')
}

export function statusColor(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes('success') || normalized.includes('done') || normalized.includes('completed')) return 'green'
  if (normalized.includes('fail') || normalized.includes('error')) return 'red'
  if (normalized.includes('running') || normalized.includes('pending')) return 'processing'
  return 'default'
}

export function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString('zh-CN')
}

export function formatMoney(value?: number | null, currency?: string | null) {
  const amount = Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return currency ? `${amount} ${currency}` : amount
}

export function formatRate(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(2)}%`
}

export function minDate(left?: string | null, right?: string | null) {
  if (!left) return right || left
  if (!right) return left
  return left <= right ? left : right
}

export function maxDate(left?: string | null, right?: string | null) {
  if (!left) return right || left
  if (!right) return left
  return left >= right ? left : right
}

