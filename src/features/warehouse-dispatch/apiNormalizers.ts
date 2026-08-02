import type {
  DispatchPlanStatus,
  ProductSpecStatus,
  ReadyShipmentItem,
  WarehouseFulfillmentType,
  WarehouseSiteCode,
  WarehouseTransportMode
} from './types'

export function optionalNumber(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function normalizeSiteCode(value?: string): WarehouseSiteCode {
  return value === 'AE' ? 'AE' : 'SA'
}

export function normalizeTransportMode(value?: string): WarehouseTransportMode {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'SEA') return 'SEA'
  if (normalized === 'UNSPECIFIED') return 'UNSPECIFIED'
  return 'AIR'
}

export function normalizeFulfillmentType(value?: string): WarehouseFulfillmentType {
  return String(value || '').toUpperCase() === 'FACTORY_DIRECT'
    ? 'FACTORY_DIRECT'
    : 'WAREHOUSE_RECEIPT'
}

export function normalizeSpecStatus(value?: string): ProductSpecStatus {
  const normalized = String(value || '').toUpperCase()
  return normalized === 'SPEC_MISSING' || normalized === 'MISSING' ? 'missing' : 'complete'
}

export function normalizeLogisticsQuoteStatus(value?: string) {
  return String(value || '').toUpperCase() === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING_QUOTE'
}

export function normalizeLogisticsShippingSubmitStatus(value?: string) {
  return String(value || '').toUpperCase() === 'SUBMITTED' ? 'SUBMITTED' : 'NOT_SUBMITTED'
}

export function mergeLogisticsQuoteStatus(values: Array<string | undefined>) {
  return values.some((value) => normalizeLogisticsQuoteStatus(value) !== 'CONFIRMED')
    ? 'PENDING_QUOTE'
    : 'CONFIRMED'
}

export function mergeLogisticsShippingSubmitStatus(values: Array<string | undefined>) {
  return values.some((value) => normalizeLogisticsShippingSubmitStatus(value) !== 'SUBMITTED')
    ? 'NOT_SUBMITTED'
    : 'SUBMITTED'
}

export function normalizeDispatchStatus(value?: string): DispatchPlanStatus {
  const statuses: Record<string, DispatchPlanStatus> = {
    READY_FOR_LOGISTICS: 'ready_for_logistics',
    HANDOFF_FAILED: 'handoff_failed',
    LOGISTICS_REQUESTED: 'logistics_requested',
    CANCELLED: 'cancelled'
  }
  return statuses[String(value || '').toUpperCase()] || 'draft'
}

export function inferDominantTransport(items: ReadyShipmentItem[]): WarehouseTransportMode {
  const quantity = (mode: WarehouseTransportMode) => items.filter((item) => item.transportMode === mode)
    .reduce((total, item) => total + item.availableQty, 0)
  return quantity('SEA') > quantity('AIR') ? 'SEA' : 'AIR'
}
