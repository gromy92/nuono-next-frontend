import type { ShippingOrderLine } from '../purchase-order/types'

type YiteMaterialCellLine = Pick<
  ShippingOrderLine,
  'yiteMaterial' | 'unitPrice' | 'currency' | 'billingUnit' | 'shippingSubmitStatus'
>

export type YiteMaterialCellModel = {
  value?: string
  editable: boolean
  priceText: string
}

export function buildYiteMaterialCellModel(line: YiteMaterialCellLine): YiteMaterialCellModel {
  return {
    value: normalizeYiteMaterialValue(line.yiteMaterial),
    editable: true,
    priceText: formatYiteQuotePrice(line)
  }
}

export function formatYiteQuotePrice(line: Pick<YiteMaterialCellLine, 'unitPrice' | 'currency' | 'billingUnit'>): string {
  const priceText = formatPriceNumber(line.unitPrice)
  if (!priceText) {
    return '-'
  }
  const currency = line.currency?.trim() || 'CNY'
  const billingUnit = line.billingUnit?.trim()
  return `${currency} ${priceText}${billingUnit ? ` / ${billingUnit}` : ''}`
}

function normalizeYiteMaterialValue(value?: string) {
  const normalized = value?.trim()
  return normalized || undefined
}

function formatPriceNumber(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numericValue)) {
    return ''
  }
  if (Number.isInteger(numericValue)) {
    return String(numericValue)
  }
  return numericValue.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}
