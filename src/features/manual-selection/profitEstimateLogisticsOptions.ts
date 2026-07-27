import type { LogisticsQuoteOperationPriceItemDto } from '../logistics-quote/types'
import { normalizeLogisticsQuoteText } from './profitEstimateLogisticsEncoding'

export type LogisticsQuoteOption = {
  value: string
  providerValue: string
  targetId: number
  quoteVersionId?: number
  forwarderId?: number
  forwarderName: string
  serviceCode?: string
  serviceName: string
  transportMode: 'AIR' | 'SEA'
  cargoCategoryCode?: string
  cargoCategoryName?: string
  quoteVersionNo?: string
  unitPrice: number
  pricingModel?: string
  currency?: string
  billingUnit?: string
  minCharge?: number | null
  minBillableUnit?: number | null
  sourceFileName?: string
}

export type LogisticsProviderOption = {
  value: string
  forwarderId?: number
  forwarderName: string
  airQuotes: LogisticsQuoteOption[]
  seaQuotes: LogisticsQuoteOption[]
}

export function transportModeLabel(value?: string) {
  if (value === 'AIR') {
    return '空运'
  }
  if (value === 'SEA') {
    return '海运'
  }
  return value || '-'
}

export function billingUnitLabel(value?: string) {
  if (value === 'KG') {
    return 'kg'
  }
  if (value === 'CBM') {
    return 'CBM'
  }
  return value || '-'
}

function logisticsQuoteValue(item: LogisticsQuoteOperationPriceItemDto) {
  return `${item.targetType}:${item.targetId}`
}

function logisticsProviderValue(item: LogisticsQuoteOperationPriceItemDto, forwarderName: string) {
  if (typeof item.forwarderId === 'number' && Number.isFinite(item.forwarderId)) {
    return `FORWARDER:${item.forwarderId}`
  }
  return `FORWARDER_NAME:${forwarderName.toLocaleLowerCase()}`
}

function isRmbCurrency(value?: string) {
  const normalized = value?.trim().toUpperCase()
  return normalized === 'RMB' || normalized === 'CNY'
}

function isSupportedMainFreightItem(item: LogisticsQuoteOperationPriceItemDto) {
  if (item.targetType !== 'BASE_PRICE' || item.priceStatus !== 'NORMAL') {
    return false
  }
  if (typeof item.effectiveValue !== 'number' || !Number.isFinite(item.effectiveValue) || item.effectiveValue <= 0) {
    return false
  }
  if (!isRmbCurrency(item.currency)) {
    return false
  }
  const transportMode = item.transportMode?.toUpperCase()
  const pricingModel = item.pricingModel?.toUpperCase()
  const billingUnit = item.billingUnit?.toUpperCase()
  return (
    (transportMode === 'AIR' && pricingModel === 'PER_KG' && billingUnit === 'KG') ||
    (transportMode === 'SEA' && pricingModel === 'PER_CBM' && billingUnit === 'CBM')
  )
}

function itemSiteSearchText(item: LogisticsQuoteOperationPriceItemDto) {
  return [
    item.forwarderName,
    item.serviceCode,
    item.serviceName,
    item.targetPlatform,
    item.deliveryCity,
    item.cargoCategoryCode,
    item.cargoCategoryName,
    item.categoryLevel1,
    item.categoryLevel2,
    item.sourceFileName,
    item.remark
  ].map((value) => normalizeLogisticsQuoteText(value)).filter(Boolean).join(' ')
}

function hasSiteCodeToken(text: string, tokens: string[]) {
  return new RegExp(`(^|[^A-Z0-9])(${tokens.join('|')})([^A-Z0-9]|$)`).test(text)
}

function siteMarkerMatched(item: LogisticsQuoteOperationPriceItemDto, site: 'SA' | 'AE') {
  const rawText = itemSiteSearchText(item)
  const upperText = rawText.toUpperCase()
  const lowerText = rawText.toLowerCase()
  if (site === 'AE') {
    return (
      hasSiteCodeToken(upperText, ['AE', 'ARE', 'UAE', 'NAE']) ||
      lowerText.includes('dubai') ||
      rawText.includes('阿联酋') ||
      rawText.includes('迪拜') ||
      rawText.includes('DXB')
    )
  }
  return (
    hasSiteCodeToken(upperText, ['SA', 'SAU', 'KSA', 'NSA']) ||
    lowerText.includes('saudi') ||
    lowerText.includes('riyadh') ||
    lowerText.includes('jeddah') ||
    rawText.includes('沙特') ||
    rawText.includes('利雅得') ||
    rawText.includes('吉达') ||
    rawText.includes('RUH') ||
    rawText.includes('JED')
  )
}

function logisticsItemMatchesSite(item: LogisticsQuoteOperationPriceItemDto, site: 'SA' | 'AE') {
  const matchesCurrentSite = siteMarkerMatched(item, site)
  const matchesOtherSite = siteMarkerMatched(item, site === 'AE' ? 'SA' : 'AE')
  return matchesCurrentSite || !matchesOtherSite
}

export function buildLogisticsQuoteOptions(
  items: LogisticsQuoteOperationPriceItemDto[],
  site: 'SA' | 'AE'
) {
  const seenValues = new Set<string>()
  return items
    .filter(isSupportedMainFreightItem)
    .filter((item) => logisticsItemMatchesSite(item, site))
    .map((item): LogisticsQuoteOption => {
      const forwarderName = normalizeLogisticsQuoteText(item.forwarderName) || '未命名货代'
      return {
        value: logisticsQuoteValue(item),
        providerValue: logisticsProviderValue(item, forwarderName),
        targetId: item.targetId,
        quoteVersionId: item.quoteVersionId,
        forwarderId: item.forwarderId,
        forwarderName,
        serviceCode: normalizeLogisticsQuoteText(item.serviceCode),
        serviceName: normalizeLogisticsQuoteText(item.serviceName || item.serviceCode) || '未命名服务线',
        transportMode: item.transportMode?.toUpperCase() === 'SEA' ? 'SEA' : 'AIR',
        cargoCategoryCode: normalizeLogisticsQuoteText(item.cargoCategoryCode),
        cargoCategoryName: normalizeLogisticsQuoteText(
          item.cargoCategoryName || item.categoryLevel2 || item.categoryLevel1
        ),
        quoteVersionNo: item.quoteVersionNo,
        unitPrice: Number(item.effectiveValue),
        pricingModel: item.pricingModel,
        currency: item.currency,
        billingUnit: item.billingUnit,
        minCharge: item.minCharge,
        minBillableUnit: item.minBillableUnit,
        sourceFileName: normalizeLogisticsQuoteText(item.sourceFileName)
      }
    })
    .filter((item) => {
      if (seenValues.has(item.value)) {
        return false
      }
      seenValues.add(item.value)
      return true
    })
}

export function buildLogisticsProviderOptions(quotes: LogisticsQuoteOption[]) {
  const providers = new Map<string, LogisticsProviderOption>()
  quotes.forEach((quote) => {
    const provider = providers.get(quote.providerValue) || {
      value: quote.providerValue,
      forwarderId: quote.forwarderId,
      forwarderName: quote.forwarderName,
      airQuotes: [],
      seaQuotes: []
    }
    if (quote.transportMode === 'AIR') {
      provider.airQuotes.push(quote)
    } else {
      provider.seaQuotes.push(quote)
    }
    providers.set(quote.providerValue, provider)
  })
  return Array.from(providers.values())
}

export function scenarioMatchesLogisticsQuotes(
  scenarioCode: string,
  airQuote?: LogisticsQuoteOption,
  seaQuote?: LogisticsQuoteOption
) {
  if (scenarioCode.includes('_AIR')) {
    return Boolean(airQuote)
  }
  if (scenarioCode.includes('_OCEAN')) {
    return Boolean(seaQuote)
  }
  return false
}
