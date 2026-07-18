import { strict as assert } from 'node:assert'
import {
  dispatchApi,
  dispatchWorkbench,
  dispatchWorkbenchCss,
  warehouseTypes
} from './warehouseDispatchContractSources'

assert.match(
  warehouseTypes,
  /type OutboundOrderLine = \{[\s\S]*logicalStoreId\?: string[\s\S]*storeCode\?: string[\s\S]*sources: OutboundOrderLineSource\[\]/,
  'outbound order lines returned to the app flow must carry store identity and source details'
)

assert.match(
  warehouseTypes,
  /type PackingList = \{[\s\S]*boxes: PackingBox\[\][\s\S]*type PackingBox = \{[\s\S]*status: string[\s\S]*lengthCm\?: string[\s\S]*grossWeightKg\?: string[\s\S]*items: PackingBoxItem\[\]/,
  'packing lists must carry boxes, box status, specs, and packed items for app acceptance'
)

assert.match(
  dispatchApi,
  /type ApiOutboundOrderLine = \{[\s\S]*logicalStoreId\?: number \| string[\s\S]*sourceStoreCode\?: string[\s\S]*sources\?: ApiOutboundOrderLineSource\[\]/,
  'warehouse-dispatch API must accept outbound line app identity fields from backend'
)

assert.match(
  dispatchApi,
  /type ApiPackingList = \{[\s\S]*boxes\?: ApiPackingBox\[\][\s\S]*type ApiPackingBox = \{[\s\S]*status\?: string[\s\S]*lengthCm\?: string[\s\S]*items\?: ApiPackingBoxItem\[\]/,
  'warehouse-dispatch API must accept packing boxes and items returned by backend'
)

assert.match(
  dispatchApi,
  /sources: \(line\.sources \|\| \[\]\)\.map\(mapOutboundOrderLineSource\)/,
  'warehouse-dispatch API must map outbound line sources for source order and store display'
)

assert.match(
  dispatchApi,
  /boxes: \(packingList\.boxes \|\| \[\]\)\.map\(mapPackingBox\)/,
  'warehouse-dispatch API must map packing list boxes for the app packing flow'
)

assert.match(
  warehouseTypes,
  /currentShippingBatch\?: ShippingBatch/,
  'dispatch request list must carry the current generated logistics plan so refresh keeps the selectable options'
)

assert.match(
  dispatchApi,
  /currentShippingBatch: plan\.currentShippingBatch \? mapShippingBatch\(plan\.currentShippingBatch\) : undefined/,
  'dispatch request API mapper must hydrate the generated shipping batch returned by the backend'
)

assert.match(
  dispatchWorkbench,
  /function handleSelectDispatchPlan\(planId: string\)[\s\S]*plan\?\.currentShippingBatch[\s\S]*hydrateShippingBatch\(plan, 'detail'\)/,
  'dispatch request detail must lazily restore the generated logistics plan when selecting an already-generated request'
)

assert.match(
  warehouseTypes,
  /type ShippingSuggestionLine = \{[\s\S]*rawBillableQuantity\?: number[\s\S]*minimumBillableUnit\?: number[\s\S]*freightAmount\?: number[\s\S]*costComponents: ShippingCostComponent\[\]/,
  'shipping suggestion product lines must expose the quote inputs and component costs saved by the backend'
)

assert.match(
  dispatchApi,
  /costComponents: \(option\.costComponents \|\| \[\]\)\.map\(mapShippingCostComponent\)[\s\S]*lines: \(option\.lines \|\| \[\]\)\.map\(mapShippingSuggestionLine\)/,
  'shipping option API mapping must preserve whole-batch components and per-product costs'
)

assert.match(
  dispatchWorkbench,
  /\{option\.optionName\} 方案明细[\s\S]*整批重量[\s\S]*整批体积[\s\S]*整批费用[\s\S]*整批费用组成[\s\S]*逐商品费用/,
  'selected logistics option must show batch weight, volume, total cost, component totals, and product costs'
)

assert.match(
  dispatchWorkbench,
  /warehouse-dispatch-shipping-selection-bar[\s\S]*aria-label="提交物流方案"[\s\S]*formatShippingOptionAmount\(selectedShippingOption\)[\s\S]*icon=\{<CheckCircleOutlined \/>\}[\s\S]*确认物流并下发发货单/,
  'generated logistics plan modal must keep final selection, price, and submission in one compact action bar'
)

assert.doesNotMatch(
  dispatchWorkbench,
  /generatedShippingBatch\.options\.map\(\(option\)\s*=>\s*renderShippingOption/,
  'generated logistics plans must not duplicate every option in a narrow product-table sidebar'
)

assert.match(
  dispatchWorkbench,
  /title="物流方案费用对比"[\s\S]*open=\{shippingCostDrawerOpen\}[\s\S]*renderShippingOptionCostComparison\([\s\S]*generatedShippingBatch\.options[\s\S]*setShippingCostDetailOptionId[\s\S]*renderShippingCostBreakdown\(shippingCostDetailOption\)/,
  'shipping costs must open in a wide drawer instead of being hidden below the long product table'
)

assert.match(
  dispatchWorkbench,
  /function renderShippingOptionCostComparison\([\s\S]*整批重量[\s\S]*整批体积[\s\S]*整批费用[\s\S]*onView\(option\.id\)[\s\S]*全部物流方案/,
  'cost drawer must compare every logistics option and switch product details without changing the submission selection'
)

assert.match(
  dispatchWorkbench,
  /function selectShippingOptionFromCostComparison\(optionId: string\)[\s\S]*OUTBOUND_CREATED[\s\S]*setSelectedShippingOptionId\(optionId\)[\s\S]*setShippingCostDetailOptionId\(optionId\)/,
  'cost comparison must select an unissued option and show its matching details without allowing issued plans to change'
)

assert.match(
  dispatchWorkbench,
  /onSelect\(option\.id\)[\s\S]*选择此方案[\s\S]*onView\(option\.id\)[\s\S]*查看明细/,
  'each logistics option must expose distinct select and inspect actions'
)

assert.match(
  dispatchWorkbench,
  /warehouse-dispatch-cost-drawer-footer[\s\S]*最终物流方案[\s\S]*formatShippingOptionAmount\(selectedShippingOption\)[\s\S]*方案已锁定[\s\S]*confirmLogisticsAndCreateOutbound/,
  'cost comparison drawer must keep the final selection and atomic issue action visible in its footer'
)

assert.match(
  dispatchWorkbench,
  /issueShippingBatch\(generatedShippingBatch\.id, selectedShippingOptionId\)[\s\S]*setShippingCostDrawerOpen\(false\)/,
  'successful issuing from the cost drawer must close the comparison surface'
)

assert.match(
  dispatchWorkbench,
  /function buildShippingForwarderCostBreakdowns\([\s\S]*targetForwarderCode[\s\S]*pskuCount[\s\S]*actualWeightKg[\s\S]*volumeCbm[\s\S]*chargeableWeightKg[\s\S]*pendingAmountLineCount/,
  'combination logistics options must group backend line snapshots into complete per-forwarder statistics and costs'
)

assert.match(
  dispatchWorkbench,
  /defaultExpandAllRows: true[\s\S]*rowExpandable: isCombinationShippingOption[\s\S]*expandedRowRender: renderShippingForwarderCostBreakdown/,
  'combination rows in the cost comparison must expose their per-forwarder totals by default'
)

assert.match(
  dispatchWorkbench,
  /function renderShippingForwarderCostBreakdown\([\s\S]*货代 \/ 线路[\s\S]*PSKU[\s\S]*商品数量[\s\S]*实际重量[\s\S]*体积[\s\S]*计费重量[\s\S]*货代费用[\s\S]*费用组成[\s\S]*组合货代分项/,
  'combination details must show each forwarder allocation, metrics, total cost, and cost components'
)

assert.match(
  dispatchWorkbench,
  /isCombinationShippingOption\(option\) \? renderShippingForwarderCostBreakdown\(option\) : null/,
  'selected combination details must reuse the same per-forwarder breakdown as the comparison table'
)

assert.match(
  dispatchWorkbench,
  /case 'LAST_MILE':[\s\S]*case 'FBN_DELIVERY':[\s\S]*return '送仓费'[\s\S]*case 'WAREHOUSE_PICKING':[\s\S]*return '拣货费'[\s\S]*case 'WAREHOUSE_INBOUND':[\s\S]*return '上架费'/,
  'shipping cost component labels must identify delivery, picking, and shelving fees'
)

assert.match(
  dispatchWorkbenchCss,
  /\.warehouse-dispatch-cost-summary[\s\S]*\.warehouse-dispatch-forwarder-breakdown[\s\S]*\.warehouse-dispatch-forwarder-cost-components[\s\S]*\.warehouse-dispatch-product-cost-components/,
  'shipping cost details must have stable batch-summary and product-component layouts'
)

assert.match(
  dispatchWorkbenchCss,
  /\.warehouse-dispatch-plan-layout\.is-generated\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/,
  'generated logistics plans must let the product table use the full detail width'
)
