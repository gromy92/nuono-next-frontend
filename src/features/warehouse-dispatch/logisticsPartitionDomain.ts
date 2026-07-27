export type LogisticsSiteCode = 'SA' | 'AE'
export type LogisticsTransportMode = 'AIR' | 'SEA'
export type LogisticsSiteFilter = 'all' | LogisticsSiteCode
export type LogisticsTransportFilter = 'all' | LogisticsTransportMode

export type LogisticsPartitionPoint = {
  siteCode?: string
  transportMode?: string
}

export type LogisticsPartitionSummary = {
  siteCodes: LogisticsSiteCode[]
  transportModes: LogisticsTransportMode[]
  historicalMixed: boolean
  incomplete: boolean
}

const SITE_ORDER: LogisticsSiteCode[] = ['SA', 'AE']
const TRANSPORT_ORDER: LogisticsTransportMode[] = ['AIR', 'SEA']

export function summarizeLogisticsPartitions(
  points: LogisticsPartitionPoint[]
): LogisticsPartitionSummary {
  const siteCodes = uniqueInOrder(points.map((point) => normalizeSiteCode(point.siteCode)), SITE_ORDER)
  const transportModes = uniqueInOrder(
    points.map((point) => normalizeTransportMode(point.transportMode)),
    TRANSPORT_ORDER
  )
  return {
    siteCodes,
    transportModes,
    historicalMixed: siteCodes.length > 1 || transportModes.length > 1,
    incomplete: points.length === 0
      || points.some((point) => !normalizeSiteCode(point.siteCode)
        || !normalizeTransportMode(point.transportMode))
  }
}

export function summarizeLogisticsPartitionValues(
  siteCodes: string[] = [],
  transportModes: string[] = []
): LogisticsPartitionSummary {
  const normalizedSites = uniqueInOrder(siteCodes.map(normalizeSiteCode), SITE_ORDER)
  const normalizedTransports = uniqueInOrder(transportModes.map(normalizeTransportMode), TRANSPORT_ORDER)
  return {
    siteCodes: normalizedSites,
    transportModes: normalizedTransports,
    historicalMixed: normalizedSites.length > 1 || normalizedTransports.length > 1,
    incomplete: normalizedSites.length === 0 || normalizedTransports.length === 0
  }
}

export function matchesLogisticsPartition(
  summary: LogisticsPartitionSummary,
  siteFilter: LogisticsSiteFilter,
  transportFilter: LogisticsTransportFilter
) {
  return (siteFilter === 'all' || summary.siteCodes.includes(siteFilter))
    && (transportFilter === 'all' || summary.transportModes.includes(transportFilter))
}

function normalizeSiteCode(value?: string): LogisticsSiteCode | undefined {
  const normalized = value?.trim().toUpperCase()
  return normalized === 'SA' || normalized === 'AE' ? normalized : undefined
}

function normalizeTransportMode(value?: string): LogisticsTransportMode | undefined {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'AIR' || normalized === '空' || normalized === '空运') return 'AIR'
  if (normalized === 'SEA' || normalized === '海' || normalized === '海运') return 'SEA'
  return undefined
}

function uniqueInOrder<T>(values: Array<T | undefined>, order: T[]) {
  const unique = new Set(values.filter((value): value is T => value !== undefined))
  return order.filter((value) => unique.has(value))
}
