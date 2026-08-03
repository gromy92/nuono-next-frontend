import { strict as assert } from 'node:assert'
import type { OfficialWarehouseShippingBatchCandidate } from './api'
import {
  readOfficialWarehouseShippingBatchCache,
  SHIPPING_BATCH_CACHE_MAX_AGE_MS,
  writeOfficialWarehouseShippingBatchCache
} from './officialWarehouseShippingBatchCache'

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

const now = Date.UTC(2026, 6, 31, 8, 0, 0)
const storage = new MemoryStorage()
const rows: OfficialWarehouseShippingBatchCandidate[] = [{
  id: 'batch-1',
  batchNo: 'YT2605793678',
  status: 'IN_TRANSIT',
  totalQuantity: 3016
}]

writeOfficialWarehouseShippingBatchCache('307', 'STR108065-NSA', 'sa', rows, storage, now)

assert.deepEqual(
  readOfficialWarehouseShippingBatchCache('307', 'STR108065-NSA', 'SA', storage, now + 1000)?.rows,
  rows,
  'the same store/site should reuse its successful batch list'
)
assert.equal(
  readOfficialWarehouseShippingBatchCache('307', 'STR69486-NSA', 'SA', storage, now + 1000),
  undefined,
  'one store must not see another store cache'
)
assert.equal(
  readOfficialWarehouseShippingBatchCache(
    '307',
    'STR108065-NSA',
    'SA',
    storage,
    now + SHIPPING_BATCH_CACHE_MAX_AGE_MS + 1
  ),
  undefined,
  'expired batch data must not be reused'
)
assert.equal(
  readOfficialWarehouseShippingBatchCache('90003', 'STR108065-NSA', 'SA', storage, now + 1000),
  undefined,
  'one signed-in user must not see another user cache'
)
