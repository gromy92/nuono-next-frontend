import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  'utf8'
)

const warehouseOrders = source('../warehouse-shipping-order/WarehouseShippingOrderList.tsx')
const dispatchPlans = source('./WarehouseDispatchPlanPanel.tsx')
const shippingExecution = source('./WarehousePackingListPanel.tsx')

for (const [name, content] of Object.entries({ warehouseOrders, dispatchPlans, shippingExecution })) {
  assert.match(content, /LogisticsPartitionFilters/, `${name} 必须提供站点和运输方式筛选`)
  assert.match(content, /LogisticsPartitionTags/, `${name} 必须展示物流分区`)
  assert.match(content, /matchesLogisticsPartition/, `${name} 必须实际应用物流分区筛选`)
}

assert.match(shippingExecution, /batch\.siteCodes/)
assert.match(shippingExecution, /batch\.transportModes/)
