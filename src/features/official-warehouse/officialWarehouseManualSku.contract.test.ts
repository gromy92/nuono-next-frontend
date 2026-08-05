import { strict as assert } from 'node:assert'
import {
  officialWarehouseApiContractSource,
  officialWarehousePageContractSource
} from './officialWarehouseContractSources'
import { selectedAsnLineQuantities } from './hooks/useOfficialWarehouseAsnLineSelection'

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

assert.match(officialWarehouseApiContractSource, /manualQuantity\?: number/, 'create API must declare manual quantity')
assert.match(officialWarehouseApiContractSource, /sourceType\?: 'SHIPPING_BATCH' \| 'MANUAL' \| 'MIXED'/, 'detail API must expose source type')
assert.match(officialWarehousePageContractSource, /添加其他 SKU（已选/, 'create flow must expose unrelated SKU selection')
assert.match(officialWarehousePageContractSource, /不会占用或伪造所选物流单的商品数量/, 'manual source boundary must be visible')
assert.match(officialWarehousePageContractSource, /物流单 \{Number\(line\.shippingBatchQuantity\)/, 'detail must show logistics quantity')
assert.match(officialWarehousePageContractSource, /手工添加 \{Number\(line\.manualQuantity\)/, 'detail must show manual quantity')
