import type {
  DispatchPlan,
  ShippingBatch,
  ShippingCostComponent,
  ShippingSuggestionLine,
  ShippingSuggestionOption
} from './types'
import type {
  ShippingAmountTotal,
  ShippingForwarderCostBreakdown
} from './workbenchModels'
import { sum } from './workbenchUtils'

type MutableForwarderBreakdown = {
  key: string
  forwarderCode?: string
  forwarderName?: string
  routeNames: Set<string>
  lines: ShippingSuggestionLine[]
  amounts: Map<string, number>
  pendingAmountLineCount: number
  costComponents: Map<string, {
    key: string
    componentType?: string
    componentName: string
    amounts: Map<string, number>
  }>
}

export function buildShippingForwarderCostBreakdowns(
  option: ShippingSuggestionOption
): ShippingForwarderCostBreakdown[] {
  const breakdowns: MutableForwarderBreakdown[] = []
  const byCode = new Map<string, MutableForwarderBreakdown>()
  const byName = new Map<string, MutableForwarderBreakdown>()
  const ensure = (forwarderCode?: string, forwarderName?: string) => {
    const code = normalizeForwarderIdentity(forwarderCode)
    const name = normalizeForwarderIdentity(forwarderName)
    let breakdown = code ? byCode.get(code) : undefined
    breakdown = breakdown || (name ? byName.get(name) : undefined)
    if (!breakdown) {
      breakdown = {
        key: code ? `code:${code}` : name ? `name:${name}` : 'unassigned',
        forwarderCode: forwarderCode?.trim() || undefined,
        forwarderName: forwarderName?.trim() || undefined,
        routeNames: new Set(),
        lines: [],
        amounts: new Map(),
        pendingAmountLineCount: 0,
        costComponents: new Map()
      }
      breakdowns.push(breakdown)
    }
    breakdown.forwarderCode = breakdown.forwarderCode || forwarderCode?.trim() || undefined
    breakdown.forwarderName = breakdown.forwarderName || forwarderName?.trim() || undefined
    if (code) byCode.set(code, breakdown)
    if (name) byName.set(name, breakdown)
    return breakdown
  }

  const declaredCount = Math.max(option.targetForwarderCodes.length, option.targetForwarderNames.length)
  for (let index = 0; index < declaredCount; index += 1) {
    ensure(option.targetForwarderCodes[index], option.targetForwarderNames[index])
  }
  option.lines.forEach((line) => addLineToBreakdown(ensure(
    line.targetForwarderCode,
    line.targetForwarderName
  ), line, option.currency))

  return breakdowns.map((breakdown) => ({
    key: breakdown.key,
    forwarderCode: breakdown.forwarderCode,
    forwarderName: breakdown.forwarderName,
    routeNames: [...breakdown.routeNames],
    lines: breakdown.lines,
    pskuCount: new Set(breakdown.lines.map((line) => normalizeForwarderIdentity(line.partnerSku))).size,
    totalQuantity: sum(breakdown.lines.map((line) => line.quantity)),
    actualWeightKg: sumCompleteMetric(breakdown.lines, (line) => line.actualWeightKg),
    volumeCbm: sumCompleteMetric(breakdown.lines, (line) => line.volumeCbm),
    chargeableWeightKg: sumCompleteMetric(breakdown.lines, (line) => line.chargeableWeightKg),
    amounts: amountTotals(breakdown.amounts),
    pendingAmountLineCount: breakdown.pendingAmountLineCount,
    costComponents: [...breakdown.costComponents.values()].map((component) => ({
      key: component.key,
      componentType: component.componentType,
      componentName: component.componentName,
      amounts: amountTotals(component.amounts)
    }))
  }))
}

export function isCombinationShippingOption(option: ShippingSuggestionOption) {
  const declaredCount = Math.max(
    option.targetForwarderCodes.filter(Boolean).length,
    option.targetForwarderNames.filter(Boolean).length
  )
  const assignedCount = buildShippingForwarderCostBreakdowns(option)
    .filter((breakdown) => breakdown.lines.length > 0).length
  return option.optionType?.toUpperCase() === 'COMBINATION' || declaredCount > 1 || assignedCount > 1
}

export function formatShippingAmountTotals(amounts: ShippingAmountTotal[]) {
  return amounts.length
    ? amounts.map(({ amount, currency }) => formatShippingMoney(amount, currency)).join(' + ')
    : '费用待复核'
}

export function shippingCostTypeLabel(componentType?: string) {
  if (componentType === 'HEADHAUL') return '干线费'
  if (componentType === 'LAST_MILE' || componentType === 'FBN_DELIVERY') return '送仓费'
  if (componentType === 'WAREHOUSE_PICKING') return '拣货费'
  if (componentType === 'WAREHOUSE_INBOUND') return '上架费'
  return '附加费'
}

export function formatShippingUnitQuote(component: ShippingCostComponent) {
  return component.unitPrice === undefined
    ? '-'
    : `${formatShippingMoney(component.unitPrice, component.currency)} / ${shippingBillingUnitLabel(component.billingUnit)}`
}

export function formatShippingComponentCalculation(component: ShippingCostComponent) {
  const amount = formatShippingMoney(component.amount, component.currency)
  if (component.unitPrice === undefined || component.billableQuantity === undefined) {
    return amount
  }
  return `${formatShippingNumber(component.unitPrice, 4)} × ${formatBillableQuantity(
    component.billableQuantity,
    component.billingUnit
  )} = ${amount}`
}

export function formatBillableQuantity(value?: number, billingUnit?: string) {
  return value === undefined
    ? '-'
    : `${formatShippingNumber(value, billingUnit === 'KG' ? 3 : 4)} ${shippingBillingUnitLabel(billingUnit)}`
}

export function formatShippingMetric(value: number | undefined, digits: number, unit: string) {
  return value === undefined ? '-' : `${formatShippingNumber(value, digits)} ${unit}`
}

export function formatDispatchPlanBatchMetric(plan: DispatchPlan, metric: 'weight' | 'volume') {
  const batch = plan.currentShippingBatch
  if (!batch) return { status: 'pending' as const, text: '待生成' }
  const value = metric === 'weight' ? batch.actualWeightKg : batch.volumeCbm
  if (value === undefined) return { status: 'missing' as const, text: '规格缺失' }
  return { status: 'ready' as const, text: formatShippingMetric(
    value,
    metric === 'weight' ? 3 : 4,
    metric === 'weight' ? 'kg' : 'm³'
  ) }
}

export function formatShippingMoney(value?: number, currency?: string) {
  return value === undefined
    ? '待复核'
    : `${normalizeShippingCurrency(currency)} ${formatShippingNumber(value, 2)}`
}

export function resolveShippingBatchOption(batch?: ShippingBatch) {
  if (!batch) return undefined
  return batch.options.find((option) => option.id === batch.selectedOptionId)
    || batch.options.find((option) => option.selectedFlag)
    || chooseShippingOption(batch.options)
}

export function formatShippingOptionAmount(option: ShippingSuggestionOption) {
  return option.estimatedTotalAmount === undefined
    ? '费用待复核'
    : `${option.currency || 'CNY'} ${option.estimatedTotalAmount.toLocaleString()}`
}

function addLineToBreakdown(
  breakdown: MutableForwarderBreakdown,
  line: ShippingSuggestionLine,
  fallbackCurrency?: string
) {
  breakdown.lines.push(line)
  const routeName = line.routeName?.trim() || line.routeCode?.trim()
  if (routeName) breakdown.routeNames.add(routeName)
  if (line.estimatedAmount === undefined) {
    breakdown.pendingAmountLineCount += 1
  } else {
    addAmount(breakdown.amounts, line.currency || fallbackCurrency, line.estimatedAmount)
  }
  line.costComponents.forEach((component) => {
    const key = [component.componentType || 'OTHER', component.componentName].join(':')
    let summary = breakdown.costComponents.get(key)
    if (!summary) {
      summary = { key, componentType: component.componentType,
        componentName: component.componentName, amounts: new Map() }
      breakdown.costComponents.set(key, summary)
    }
    if (component.amount !== undefined) {
      addAmount(summary.amounts, component.currency || line.currency || fallbackCurrency, component.amount)
    }
  })
}

function normalizeForwarderIdentity(value?: string) {
  return String(value || '').trim().toUpperCase()
}

function normalizeShippingCurrency(currency?: string) {
  const normalized = String(currency || 'CNY').trim().toUpperCase()
  return normalized === 'RMB' ? 'CNY' : normalized || 'CNY'
}

function addAmount(amounts: Map<string, number>, currency: string | undefined, amount: number) {
  const normalized = normalizeShippingCurrency(currency)
  amounts.set(normalized, (amounts.get(normalized) || 0) + amount)
}

function amountTotals(amounts: Map<string, number>): ShippingAmountTotal[] {
  return [...amounts.entries()].map(([currency, amount]) => ({ currency, amount }))
}

function sumCompleteMetric(lines: ShippingSuggestionLine[], read: (line: ShippingSuggestionLine) => number | undefined) {
  if (!lines.length) return undefined
  const values = lines.map(read)
  return values.some((value) => value === undefined || !Number.isFinite(value))
    ? undefined
    : sum(values as number[])
}

function shippingBillingUnitLabel(billingUnit?: string) {
  const labels: Record<string, string> = { CBM: 'm³', KG: 'kg', PIECE: '件', PCS: '件', SHIPMENT: '票' }
  return labels[String(billingUnit || '').toUpperCase()] || billingUnit || '计费单位'
}

function formatShippingNumber(value: number, maximumFractionDigits: number) {
  return value.toLocaleString('zh-CN', { maximumFractionDigits })
}

function chooseShippingOption(options: ShippingSuggestionOption[]) {
  return options.find((option) => option.autoRecommended && option.estimatedTotalAmount !== undefined)
    || options.find((option) => option.estimatedTotalAmount !== undefined)
    || options[0]
}
