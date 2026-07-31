import type { OfficialWarehouseShippingBatchCandidate } from './api'

const CACHE_VERSION = 1
export const SHIPPING_BATCH_CACHE_FRESH_MS = 3 * 60 * 1000
export const SHIPPING_BATCH_CACHE_MAX_AGE_MS = 15 * 60 * 1000

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type OfficialWarehouseShippingBatchCacheEntry = {
  savedAt: number
  rows: OfficialWarehouseShippingBatchCandidate[]
}

function cacheKey(sessionUserId: string, storeCode: string, siteCode: string) {
  return [
    'nuono',
    'official-warehouse',
    'shipping-batches',
    CACHE_VERSION,
    sessionUserId.trim(),
    storeCode.trim(),
    siteCode.trim().toUpperCase()
  ].join(':')
}

function browserSessionStorage(): StorageLike | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage
  } catch {
    return undefined
  }
}

export function readOfficialWarehouseShippingBatchCache(
  sessionUserId: string,
  storeCode: string,
  siteCode: string,
  storage: StorageLike | undefined = browserSessionStorage(),
  now = Date.now()
): OfficialWarehouseShippingBatchCacheEntry | undefined {
  if (!storage || !sessionUserId.trim() || !storeCode.trim() || !siteCode.trim()) return undefined
  const key = cacheKey(sessionUserId, storeCode, siteCode)
  try {
    const raw = storage.getItem(key)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as {
      version?: number
      savedAt?: number
      rows?: OfficialWarehouseShippingBatchCandidate[]
    }
    if (
      parsed.version !== CACHE_VERSION ||
      !Number.isFinite(parsed.savedAt) ||
      !Array.isArray(parsed.rows) ||
      now - Number(parsed.savedAt) > SHIPPING_BATCH_CACHE_MAX_AGE_MS
    ) {
      storage.removeItem(key)
      return undefined
    }
    return {
      savedAt: Number(parsed.savedAt),
      rows: parsed.rows.filter((row) => Boolean(row?.id && row?.batchNo))
    }
  } catch {
    try {
      storage.removeItem(key)
    } catch {
      // Ignore storage cleanup failures and fall back to the live request.
    }
    return undefined
  }
}

export function writeOfficialWarehouseShippingBatchCache(
  sessionUserId: string,
  storeCode: string,
  siteCode: string,
  rows: OfficialWarehouseShippingBatchCandidate[],
  storage: StorageLike | undefined = browserSessionStorage(),
  now = Date.now()
) {
  if (!storage || !sessionUserId.trim() || !storeCode.trim() || !siteCode.trim()) return
  try {
    storage.setItem(cacheKey(sessionUserId, storeCode, siteCode), JSON.stringify({
      version: CACHE_VERSION,
      savedAt: now,
      rows
    }))
  } catch {
    // A full or unavailable session store must not block the live request.
  }
}
