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
  assert.match(content, /matchesLogisticsPartition/, `${name} 必须实际应用物流分区筛选`)
}

assert.match(warehouseOrders, /LogisticsPartitionCombinationTags/)
assert.doesNotMatch(warehouseOrders, /LogisticsPartitionTags/)
assert.match(dispatchPlans, /LogisticsPartitionTags/)
assert.match(shippingExecution, /LogisticsPartitionTags/)
assert.match(shippingExecution, /batch\.siteCodes/)
assert.match(shippingExecution, /batch\.transportModes/)
assert.match(
  warehouseOrders,
  /segments\.map[\s\S]*WarehouseOrderPartitionRow[\s\S]*<LogisticsPartitionCombinationTags points=\{\[\{/,
  '父仓库单必须按子计划的真实站点+运输方式组合逐项展示'
)
assert.match(
  warehouseOrders,
  /title: '分区明细'[\s\S]*segment\.purchaseOrderNames[\s\S]*segment\.lineCount[\s\S]*segment\.skuCount[\s\S]*segment\.totalQuantity/,
  '每个分区必须在同一列展示来源采购单名、商品行、SKU 和件数'
)
assert.match(
  warehouseOrders,
  /title: '总SKU \/ 总件数'[\s\S]*order\.skuCount[\s\S]*order\.totalQuantity/,
  '仓库单必须另列展示整单去重 SKU 和总件数'
)
assert.doesNotMatch(
  warehouseOrders,
  /title: '站点 \/ 运输方式'|title: '来源采购单'|title: '商品行'|title: 'SKU'|title: '数量'/,
  '旧的五个独立统计列必须收口为分区明细与整单合计'
)
assert.match(warehouseOrders, /className="warehouse-shipping-order-title-button"[\s\S]*data\.openEditModal\(order\)/)
assert.doesNotMatch(warehouseOrders, /\{order\.shippingOrderNo\}[\s\S]*>改名<\/Button>/)
assert.match(
  partitionViews,
  /LogisticsPartitionCombinationTags[\s\S]*summary\.combinations\.map[\s\S]*siteCode[\s\S]*空运[\s\S]*海运/,
  '组合标签必须按真实组合显示站点与运输方式'
)
assert.match(
  partitionViews,
  /showHistoricalMixed = true[\s\S]*showHistoricalMixed && summary\.historicalMixed/,
  '共享分区标签必须默认保留真实历史混合记录的提示'
)
assert.doesNotMatch(dispatchPlans, /showHistoricalMixed=\{false\}/)
assert.doesNotMatch(shippingExecution, /showHistoricalMixed=\{false\}/)
