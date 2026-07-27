import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  'utf8'
)

const warehouseOrders = source('./warehouse-order/WarehouseShippingOrderList.tsx')
const dispatchPlans = source('./WarehouseDispatchPlanPanel.tsx')
const shippingExecution = source('./WarehousePackingListPanel.tsx')
const partitionViews = source('./LogisticsPartitionViews.tsx')

for (const [name, content] of Object.entries({ warehouseOrders, dispatchPlans, shippingExecution })) {
  assert.match(content, /LogisticsPartitionFilters/, `${name} 必须提供站点和运输方式筛选`)
  assert.match(content, /LogisticsPartitionTags/, `${name} 必须展示物流分区`)
  assert.match(content, /matchesLogisticsPartition/, `${name} 必须实际应用物流分区筛选`)
}

assert.match(shippingExecution, /batch\.siteCodes/)
assert.match(shippingExecution, /batch\.transportModes/)
assert.match(
  warehouseOrders,
  /<LogisticsPartitionTags[\s\S]*showHistoricalMixed=\{false\}/,
  '父仓库单合法聚合多个子分区时不得标记为历史混合'
)
assert.match(
  partitionViews,
  /showHistoricalMixed = true[\s\S]*showHistoricalMixed && summary\.historicalMixed/,
  '共享分区标签必须默认保留真实历史混合记录的提示'
)
assert.doesNotMatch(dispatchPlans, /showHistoricalMixed=\{false\}/)
assert.doesNotMatch(shippingExecution, /showHistoricalMixed=\{false\}/)
