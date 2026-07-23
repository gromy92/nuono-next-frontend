import { strict as assert } from 'node:assert'
import {
  dispatchApi,
  dispatchContractSources,
  packingListPanel
} from './warehouseDispatchContractSources'

const {
  workbench,
  planPanel,
  planDetail,
  shippingWorkspace,
  costDrawer,
  costComparison,
  costDomain
} = dispatchContractSources

assert.match(
  workbench,
  /key: 'dispatch-plan'[\s\S]*label: buildTabLabel\('发货申请单', data\.dispatchPlans\.length, 'operations'/,
  'warehouse dispatch workbench must present dispatch plans as 发货申请单'
)

assert.match(
  planPanel,
  /const columns: ColumnsType<DispatchPlan>[\s\S]*dataSource=\{plans\}/,
  'dispatch requests must render as the primary table list'
)

assert.match(
  planPanel,
  /title: '站点 \/ 运输方式'[\s\S]*buildPlanSiteTransportLabels\(plan\.lines\)[\s\S]*<Tag color="blue"/,
  'dispatch requests must expose every site and transport-mode pair'
)

assert.match(
  planPanel,
  /title: '整批统计'[\s\S]*label="重量"[\s\S]*formatDispatchPlanBatchMetric\(plan, 'weight'\)[\s\S]*label="体积"[\s\S]*formatDispatchPlanBatchMetric\(plan, 'volume'\)/,
  'dispatch requests must show whole-batch weight and volume'
)

assert.match(
  costDomain,
  /function formatDispatchPlanBatchMetric[\s\S]*待生成[\s\S]*actualWeightKg[\s\S]*volumeCbm[\s\S]*规格缺失/,
  'batch metrics must distinguish pending, incomplete, and complete snapshots'
)

assert.match(
  planPanel,
  /icon=\{<EyeOutlined \/>\}[\s\S]*workspace\.selectPlan\(plan\.id\)[\s\S]*查看明细/,
  'dispatch request details must open from each list row'
)

assert.match(
  planPanel,
  /icon=\{<CalculatorOutlined \/>\}[\s\S]*workspace\.openCostComparison\(plan\)[\s\S]*费用对比/,
  'generated logistics plans must expose cost comparison in the list'
)

assert.match(
  shippingWorkspace,
  /function selectPlan\(planId: string\)[\s\S]*setSelectedPlanId\(planId\)[\s\S]*setDetailOpen\(true\)/,
  'selecting a dispatch request must open its explicit detail state'
)

assert.match(
  shippingWorkspace,
  /async function hydrateBatch[\s\S]*loadShippingBatch\(batch\.id\)[\s\S]*purpose === 'cost'[\s\S]*setCostDrawerOpen\(true\)/,
  'full logistics costs must load only when details or comparison are opened'
)

assert.match(
  planDetail,
  /<Modal[\s\S]*发货申请单详情[\s\S]*open=\{workspace\.detailOpen\}[\s\S]*warehouse-dispatch-plan-detail is-modal/,
  'dispatch request products and final logistics selection must render in a modal'
)

assert.match(
  planDetail,
  /selectedRouteGroupKey[\s\S]*提交物流方案[\s\S]*请选择最终提交方案/,
  'dispatch request details must retain an explicit final logistics selection'
)

assert.match(
  shippingWorkspace,
  /if \(!shippingBatch \|\| !selectedOptionId\)[\s\S]*请先选择物流方案/,
  'issuing must be blocked until one logistics option is selected'
)

assert.match(
  shippingWorkspace,
  /issueShippingBatch\(shippingBatch\.id, selectedOptionId\)[\s\S]*已下发发货单和装箱单/,
  'final logistics submission must use one atomic issue command'
)

assert.match(
  costComparison,
  /title: '整批重量'[\s\S]*title: '整批体积'[\s\S]*title: '整批费用'[\s\S]*选择此方案[\s\S]*全部物流方案/,
  'cost comparison must expose batch metrics, total costs, and an explicit option action'
)

assert.match(
  costDrawer,
  /物流方案费用对比[\s\S]*selectionLocked=\{batch\.status === 'OUTBOUND_CREATED'\}/,
  'issued logistics plans must remain visible but locked in the cost drawer'
)

assert.match(
  planPanel,
  /暂无发货申请单，请先在仓管 APP 发起/,
  'dispatch request creation must remain APP-only'
)

assert.doesNotMatch(
  `${planPanel}\n${planDetail}`,
  /生成物流计划|选择物流渠道|同步发货单/,
  'web must not expose retired manual generation or sync actions'
)

assert.match(
  workbench,
  /key: 'packing-list'[\s\S]*label: buildTabLabel\('发货执行'[\s\S]*<WarehousePackingListPanel key=\{packingListRefreshKey\} \/>/,
  'warehouse dispatch workbench must expose APP-submitted packing execution'
)

assert.match(
  packingListPanel,
  /loadShippingBatches\([\s\S]*loadPackingLists\(/,
  'packing execution must read shipping batches and APP packing lists'
)

assert.doesNotMatch(
  packingListPanel,
  /createPackingList\(|createOutboundOrders\(|selectShippingOption\(|生成装箱单/,
  'web packing execution must remain read-only'
)

assert.match(
  dispatchApi,
  /export function issueShippingBatch\(batchId: string, optionId: string\)[\s\S]*\/shipping-batches\/\$\{encodeURIComponent\(batchId\)\}\/issue/,
  'warehouse dispatch API must expose the atomic issuing command'
)

assert.match(
  dispatchApi,
  /export function loadShippingBatches\(/,
  'warehouse dispatch API must expose shipping-batch history loading'
)
