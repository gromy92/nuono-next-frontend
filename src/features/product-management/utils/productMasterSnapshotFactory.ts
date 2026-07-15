import type { ProductMasterSnapshotPayload } from '../types'

export function createProductMasterSnapshotPayload(
  payload: Partial<ProductMasterSnapshotPayload> = {}
): ProductMasterSnapshotPayload {
  const snapshot: ProductMasterSnapshotPayload = {
    mode: typeof payload.mode === 'string' && payload.mode ? payload.mode : 'product-snapshot',
    ready: payload.ready ?? true,
    message: payload.message,
    warnings: cloneStringList(payload.warnings),
    missingCoreTables: cloneStringList(payload.missingCoreTables),
    storeContext: cloneRecord(payload.storeContext),
    identity: cloneRecord(payload.identity),
    taxonomy: cloneRecord(payload.taxonomy),
    content: cloneRecord(payload.content),
    platformSignals: cloneRecord(payload.platformSignals),
    keyAttributes: cloneRecordList(payload.keyAttributes),
    group: {
      axes: [],
      ...cloneRecord(payload.group)
    },
    variants: cloneRecordList(payload.variants),
    pricing: cloneRecord(payload.pricing),
    stock: cloneRecord(payload.stock),
    siteOffers: cloneRecordList(payload.siteOffers)
  }

  if (payload.degraded !== undefined) {
    snapshot.degraded = payload.degraded
  }
  if (payload.missingOperationalKeys !== undefined) {
    snapshot.missingOperationalKeys = cloneStringList(payload.missingOperationalKeys)
  }

  return snapshot
}

function cloneStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map((item) => String(item ?? '').trim()).filter(Boolean)
}

function cloneRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

function cloneRecordList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter((item) => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .map((item) => cloneRecord(item))
}
