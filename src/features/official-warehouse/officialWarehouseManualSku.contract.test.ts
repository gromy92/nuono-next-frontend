import { strict as assert } from 'node:assert'
import type { OfficialWarehouseProductCandidate } from './api'
import { asnLineBatchReferenceText, asnLineSourceTags } from './asnLineSourcePresentation'
import {
  initialAsnLineSelectionState,
  officialWarehouseAsnLineSelectionReducer,
  selectedAsnLineQuantities
} from './hooks/useOfficialWarehouseAsnLineSelection'

const mixed = selectedAsnLineQuantities({
  key: 'PSKU-001',
  batchKeys: ['PSKU-001'],
  manualKeys: ['PSKU-001'],
  batchQuantities: { 'PSKU-001': 5 },
  manualQuantities: { 'PSKU-001': 3 }
})
assert.deepEqual(mixed, { quantity: 8, manualQuantity: 3 }, 'same SKU should merge while preserving source quantities')

const unrelatedManual = selectedAsnLineQuantities({
  key: 'PSKU-OTHER',
  batchKeys: ['PSKU-BATCH'],
  manualKeys: ['PSKU-OTHER'],
  batchQuantities: { 'PSKU-BATCH': 5 },
  manualQuantities: { 'PSKU-OTHER': 4 }
})
assert.deepEqual(unrelatedManual, { quantity: 4, manualQuantity: 4 }, 'unrelated SKU should be entirely manual')

const candidate = {
  productVariantId: '1',
  storeCode: 'STR108065-NSA',
  siteCode: 'SA',
  partnerSku: 'PSKU-001',
  pskuCode: 'Z-001',
  noonSku: 'N-001',
  storageTypeCode: 'standard',
  batchAvailableQuantity: 5
} satisfies OfficialWarehouseProductCandidate
let state = officialWarehouseAsnLineSelectionReducer(initialAsnLineSelectionState, {
  type: 'prepare', mode: 'batch', rows: [candidate]
})
state = officialWarehouseAsnLineSelectionReducer(state, {
  type: 'selection', mode: 'batch', keys: ['PSKU-001'], rows: [candidate]
})
state = officialWarehouseAsnLineSelectionReducer(state, { type: 'mode', mode: 'manual' })
state = officialWarehouseAsnLineSelectionReducer(state, {
  type: 'prepare', mode: 'manual', rows: [candidate]
})
state = officialWarehouseAsnLineSelectionReducer(state, {
  type: 'selection', mode: 'manual', keys: ['PSKU-001'], rows: [candidate]
})
state = officialWarehouseAsnLineSelectionReducer(state, { type: 'clear-batch' })
assert.deepEqual(state.batchKeys, [], 'changing the shipping batch should remove only batch selections')
assert.deepEqual(state.manualKeys, ['PSKU-001'], 'changing the shipping batch should retain manual selections')
state = officialWarehouseAsnLineSelectionReducer(state, { type: 'clear-all' })
assert.deepEqual(state.manualQuantityByKey, {}, 'clear all should remove stale manual quantities')
assert.deepEqual(state.selectedCandidateByKey, {}, 'clear all should remove retained candidate snapshots')

assert.deepEqual(asnLineSourceTags({
  id: 'line-1', productVariantId: '1', pskuCode: 'Z-001', noonSku: 'N-001',
  quantity: 8, shippingBatchQuantity: 5, manualQuantity: 3, sourceType: 'MIXED',
  storageTypeCode: 'standard', lineStatus: 'CREATED'
}), [
  { kind: 'shipping', text: '物流单 5 件' },
  { kind: 'manual', text: '手工添加 3 件' }
], 'mixed source detail should show both proven quantities')

const unknownLine = {
  id: 'line-2', productVariantId: '2', pskuCode: 'Z-002', noonSku: 'N-002',
  quantity: 4, shippingBatchQuantity: 0, unknownQuantity: 4, sourceType: 'UNKNOWN' as const,
  storageTypeCode: 'standard', lineStatus: 'CREATED'
}
assert.deepEqual(
  asnLineSourceTags(unknownLine),
  [{ kind: 'unknown', text: '来源待确认 4 件' }],
  'legacy source must remain unknown instead of being labelled manual'
)
assert.equal(
  asnLineBatchReferenceText(unknownLine),
  '未记录物流单',
  'unknown source must not claim it is unrelated to logistics'
)
