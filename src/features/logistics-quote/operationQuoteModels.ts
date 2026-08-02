import type { LogisticsQuoteOperationPriceItemDto } from './types'
import { formatOperationPrice, operationPriceTargetTypeLabel, transportModeLabel } from './utils'

export type OperationQuotePriceTierRow = {
  key: string
  sourceItem: LogisticsQuoteOperationPriceItemDto
  forwarderName: string
  quoteVersionNo: string
  transportMode: string
  transportModeText: string
  cargoCategoryName: string
  applicableDescription: string
  standardPriceText: string
  effectivePriceText: string
  transitTimeText: string
  singleBoxPolicy: string
  minShipmentRule: string
  remark: string
  hasAdjustment: boolean
  adjustmentReason?: string
  priceStatus?: string
}

export type OperationQuoteFeeItemRow = {
  key: string
  sourceItem: LogisticsQuoteOperationPriceItemDto
  forwarderName: string
  quoteVersionNo: string
  transportMode: string
  transportModeText: string
  feeType: string
  feeName: string
  standardPriceText: string
  effectivePriceText: string
  billingUnitText: string
  minChargeRule: string
  conditionText: string
  remark: string
  hasAdjustment: boolean
  adjustmentReason?: string
  priceStatus?: string
}

export type OperationQuoteViewModel = {
  priceTiers: OperationQuotePriceTierRow[]
  feeItems: OperationQuoteFeeItemRow[]
}

function compactText(parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part, index, values) => values.indexOf(part) === index)
    .join('；')
}

function formatMinRule(item: LogisticsQuoteOperationPriceItemDto): string {
  const rules: string[] = []
  if (typeof item.minBillableUnit === 'number' && item.billingUnit) {
    rules.push(`最低计费 ${item.minBillableUnit}${item.billingUnit}`)
  }
  if (typeof item.minCharge === 'number') {
    rules.push(`最低收费 ${item.currency || 'RMB'} ${item.minCharge}/票`)
  }
  return rules.join('；') || '按货代说明'
}

function resolveTransitTimeText(item: LogisticsQuoteOperationPriceItemDto): string {
  const text = compactText([item.serviceName, item.remark])
  const explicitMatch = text.match(/(\d+\s*-\s*\d+\s*天|\d+\s*天)/)
  if (explicitMatch) {
    return explicitMatch[1].replace(/\s/g, '')
  }
  return '待录入'
}

function resolveSingleBoxPolicy(item: LogisticsQuoteOperationPriceItemDto): string {
  const text = compactText([item.categoryLevel2, item.billingBasis, item.remark])
  if (/单箱单一品名/.test(text)) {
    return '单箱单一品名'
  }
  if (/单箱单类/.test(text)) {
    return '单箱单类'
  }
  if (/清装/.test(text)) {
    return '清装'
  }
  if (/单箱/.test(text)) {
    return '按单箱规则'
  }
  return '未说明'
}

function resolveApplicableDescription(item: LogisticsQuoteOperationPriceItemDto): string {
  return (
    compactText([
      item.categoryLevel2 && item.categoryLevel2 !== item.cargoCategoryName ? item.categoryLevel2 : undefined,
      item.remark
    ]) || '按报价版本来源中的适用品类说明维护'
  )
}

function resolveFeeType(item: LogisticsQuoteOperationPriceItemDto): string {
  const name = item.cargoCategoryName || ''
  if (/送仓/.test(name)) {
    return '送仓费'
  }
  if (/派送/.test(name)) {
    return '海外派送费'
  }
  if (/卸货/.test(name)) {
    return '国内卸货费'
  }
  if (/仓储/.test(name)) {
    return '海外仓仓储费'
  }
  if (/拣货|捡货/.test(name)) {
    return '拣货费'
  }
  if (item.categoryLevel1) {
    return item.categoryLevel1
  }
  return operationPriceTargetTypeLabel(item.targetType)
}

function buildPriceTierRow(item: LogisticsQuoteOperationPriceItemDto): OperationQuotePriceTierRow {
  return {
    key: `${item.targetType}-${item.targetId}-${item.numericField}`,
    sourceItem: item,
    forwarderName: item.forwarderName || '-',
    quoteVersionNo: item.quoteVersionNo || '-',
    transportMode: item.transportMode || '',
    transportModeText: transportModeLabel(item.transportMode),
    cargoCategoryName: item.cargoCategoryName || item.cargoCategoryCode || '-',
    applicableDescription: resolveApplicableDescription(item),
    standardPriceText: formatOperationPrice(item.standardValue, item.currency, item.billingUnit),
    effectivePriceText: formatOperationPrice(item.effectiveValue, item.currency, item.billingUnit),
    transitTimeText: resolveTransitTimeText(item),
    singleBoxPolicy: resolveSingleBoxPolicy(item),
    minShipmentRule: formatMinRule(item),
    remark: item.remark || '-',
    hasAdjustment: Boolean(item.hasAdjustment),
    adjustmentReason: item.adjustmentReason,
    priceStatus: item.priceStatus
  }
}

function buildFeeItemRow(item: LogisticsQuoteOperationPriceItemDto): OperationQuoteFeeItemRow {
  return {
    key: `${item.targetType}-${item.targetId}-${item.numericField}`,
    sourceItem: item,
    forwarderName: item.forwarderName || '-',
    quoteVersionNo: item.quoteVersionNo || '-',
    transportMode: item.transportMode || '',
    transportModeText: transportModeLabel(item.transportMode),
    feeType: resolveFeeType(item),
    feeName: item.cargoCategoryName || item.numericField || '-',
    standardPriceText: formatOperationPrice(item.standardValue, item.currency, item.billingUnit),
    effectivePriceText: formatOperationPrice(item.effectiveValue, item.currency, item.billingUnit),
    billingUnitText: item.billingUnit || '-',
    minChargeRule: formatMinRule(item),
    conditionText: compactText([item.categoryLevel2, item.deliveryCity, item.targetPlatform]) || '按费用项说明',
    remark: item.remark || '-',
    hasAdjustment: Boolean(item.hasAdjustment),
    adjustmentReason: item.adjustmentReason,
    priceStatus: item.priceStatus
  }
}

export function buildOperationQuoteView(items: LogisticsQuoteOperationPriceItemDto[]): OperationQuoteViewModel {
  return {
    priceTiers: items.filter((item) => item.targetType === 'BASE_PRICE').map(buildPriceTierRow),
    feeItems: items.filter((item) => item.targetType !== 'BASE_PRICE').map(buildFeeItemRow)
  }
}
