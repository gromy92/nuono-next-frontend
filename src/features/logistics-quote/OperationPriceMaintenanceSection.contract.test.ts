import { strict as assert } from 'node:assert'
import { requireReadyOperationPriceItems } from './operationPriceItemsDomain'

const response = {
  mode: 'mock-demo',
  ready: false,
  message: 'interface failed',
  summary: {
    totalItems: 1,
    airItemCount: 1,
    seaItemCount: 0,
    warehouseItemCount: 0
  },
  items: [{
    targetId: -101,
    targetType: 'QUOTE_TIER',
    numericField: 'unitPrice',
    effectiveValue: 65
  }]
}
assert.throws(
  () => requireReadyOperationPriceItems(response),
  /interface failed/,
  '接口失败携带的样例价格绝不能进入正式报价 success 状态'
)

const readyResponse = { ...response, mode: 'local-db', ready: true }
assert.equal(requireReadyOperationPriceItems(readyResponse), readyResponse)
