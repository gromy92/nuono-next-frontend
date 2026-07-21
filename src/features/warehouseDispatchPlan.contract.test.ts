import { strict as assert } from 'node:assert'
import {
  dispatchApi,
  dispatchWorkbench,
  packingListPanel
} from './warehouseDispatchContractSources'

assert.match(
  dispatchWorkbench,
  /key: 'dispatch-plan'[\s\S]*label: buildTabLabel\('发货申请单', dispatchPlans\.length, 'operations'/,
  'warehouse dispatch workbench must present dispatch plans as 发货申请单'
)

assert.match(
  dispatchWorkbench,
  /const dispatchPlanColumns: ColumnsType<DispatchPlan>/,
  'dispatch request tab must render dispatch plans through a table list'
)

assert.match(
  dispatchWorkbench,
  /title: '站点 \/ 运输方式'[\s\S]*buildPlanSiteTransportLabels\(plan\.lines\)[\s\S]*<Tag/,
  'dispatch request list must show each site and transport-mode pair instead of only a group count'
)

assert.doesNotMatch(
  dispatchWorkbench,
  /title: '物流分组'[\s\S]{0,180}buildRouteGroups\(plan\.lines\)\.length/,
  'dispatch request list must not hide site and transport mode behind an opaque logistics-group count'
)

assert.match(
  dispatchWorkbench,
  /columns=\{dispatchPlanColumns\}[\s\S]*dataSource=\{dispatchPlans\}/,
  'dispatch request tab must show all dispatch requests as the primary list'
)

assert.match(
  dispatchWorkbench,
  /const \[dispatchPlanDetailOpen, setDispatchPlanDetailOpen\] = useState\(false\)/,
  'dispatch request tab must keep explicit modal state for plan details'
)

assert.match(
  dispatchWorkbench,
  /function handleSelectDispatchPlan\(planId: string\)[\s\S]*setSelectedPlanId\(planId\)[\s\S]*setDispatchPlanDetailOpen\(true\)/,
  'dispatch request 查看明细 must select the row and open its detail modal'
)

assert.match(
  dispatchWorkbench,
  /icon=\{<EyeOutlined \/>\}[\s\S]*handleSelectDispatchPlan\(plan\.id\)[\s\S]*查看明细/,
  'dispatch request 查看明细 button must call the explicit modal handler'
)

assert.match(
  dispatchWorkbench,
  /<Modal[\s\S]*title=\{selectedPlan \? `\$\{selectedPlan\.planNo\} 发货申请单详情` : '发货申请单详情'\}[\s\S]*open=\{dispatchPlanDetailOpen\}[\s\S]*warehouse-dispatch-plan-detail is-modal/,
  'dispatch request product details and final logistics submission must render in a wide modal'
)

assert.match(
  dispatchWorkbench,
  /title: '整批重量'[\s\S]*formatDispatchPlanBatchMetric\(plan, 'weight'\)[\s\S]*title: '整批体积'[\s\S]*formatDispatchPlanBatchMetric\(plan, 'volume'\)/,
  'dispatch request list must show fail-closed whole-batch weight and volume from the batch summary'
)

assert.match(
  dispatchWorkbench,
  /title: '操作'[\s\S]*icon=\{<CalculatorOutlined \/>\}[\s\S]*openShippingCostComparison\(plan\)[\s\S]*费用对比/,
  'dispatch request list must expose cost comparison directly on each generated logistics plan'
)

assert.match(
  dispatchWorkbench,
  /async function hydrateShippingBatch\([\s\S]*loadShippingBatch\(batch\.id\)[\s\S]*purpose === 'cost'[\s\S]*setShippingCostDrawerOpen\(true\)/,
  'dispatch request list must load full shipping costs only after opening plan details or cost comparison'
)

assert.match(
  dispatchWorkbench,
  /function formatDispatchPlanBatchMetric\([\s\S]*待生成[\s\S]*batch\.actualWeightKg[\s\S]*batch\.volumeCbm[\s\S]*规格缺失/,
  'dispatch request batch metrics must distinguish not generated, incomplete specs, and complete snapshots'
)

assert.match(
  dispatchWorkbench,
  /暂无发货申请单，请先在仓管 APP 发起/,
  'dispatch request empty state must preserve the APP-only creation boundary'
)

assert.match(
  dispatchWorkbench,
  /title: '状态',[\s\S]*key: 'reviewStatus',[\s\S]*fixed: 'right'[\s\S]*scroll=\{\{ x: 1140 \}\}/,
  'cost comparison table must reserve enough horizontal width for the status and fixed action columns'
)

assert.doesNotMatch(
  dispatchWorkbench,
  /options=\{dispatchPlans\.map\(\(plan\) => \(\{ label: plan\.planNo, value: plan\.id \}\)\)\}/,
  'dispatch request tab must not use a segmented control as the primary multi-request selector'
)

assert.doesNotMatch(
  dispatchWorkbench,
  /renderSummaryGrid\(\[\s*\['来源采购单'/,
  'dispatch request detail must remove the metric cards above the line table'
)

assert.match(
  dispatchWorkbench,
  /key: 'warehouse-order'[\s\S]*label: buildTabLabel\('仓库单', 0, 'operations'/,
  'warehouse order tab must be visually marked as web-operations work'
)

assert.match(
  dispatchWorkbench,
  /warehouse-dispatch-tab-label[\s\S]*is-operations/,
  'web-operations tabs must render a distinct tab label class'
)

assert.match(
  dispatchWorkbench,
  /selectedRouteGroupKey/,
  'dispatch request page must keep an explicit selected logistics route before generating a logistics plan'
)

assert.match(
  dispatchWorkbench,
  /请先选择物流方案/,
  'dispatch request page must block logistics-plan generation until a route is selected'
)

assert.match(
  dispatchWorkbench,
  /提交物流方案/,
  'generated logistics plans must expose one explicit final submission selection'
)

assert.match(
  dispatchWorkbench,
  /key: 'packing-list'[\s\S]*label: buildTabLabel\('装箱单'[\s\S]*<WarehousePackingListPanel key=\{packingListRefreshKey\} \/>/,
  'warehouse dispatch workbench must expose packing lists submitted by the app'
)

assert.match(
  packingListPanel,
  /loadShippingBatches\(/,
  'web packing-list flow must read shipping batches submitted by warehouse app/backend'
)

assert.match(
  packingListPanel,
  /loadPackingLists\(/,
  'web packing-list flow must read app packing lists'
)

assert.doesNotMatch(
  packingListPanel,
  /createPackingList\(|createOutboundOrders\(|selectShippingOption\(|生成装箱单/,
  'web packing-list tab is read-only; dispatch request confirmation owns issuing, while app owns packing execution'
)

assert.match(
  dispatchWorkbench,
  /生成物流计划/,
  'web dispatch request page must own logistics-plan generation'
)

assert.match(
  dispatchWorkbench,
  /<Modal[\s\S]*title="选择物流渠道"[\s\S]*open=\{logisticsPlanModalOpen\}/,
  'web dispatch request page must open a logistics-channel selection modal before generating a logistics plan'
)

assert.match(
  dispatchWorkbench,
  /createShippingBatchFromDispatchPlan\(selectedPlan\.id,\s*\{[\s\S]*selectedForwarderCodes: selectedLogisticsForwarderCodes/,
  'web dispatch request page must pass selected forwarders when creating logistics-plan options'
)

assert.match(
  dispatchWorkbench,
  /logisticsPlanError[\s\S]*setLogisticsPlanError\([\s\S]*<Alert[\s\S]*message=\{logisticsPlanError\}/,
  'logistics-plan modal must keep backend failures visible instead of appearing unresponsive'
)

assert.match(
  dispatchApi,
  /type CreateShippingBatchFromDispatchPlanPayload = \{[\s\S]*selectedForwarderCodes\?: string\[\]/,
  'warehouse-dispatch API must model selected forwarders for dispatch-plan shipping batch generation'
)

assert.match(
  dispatchApi,
  /export function loadDispatchPlanShippingRouteOptions\(dispatchPlanId: string\)/,
  'warehouse-dispatch API must load active route options for the logistics-channel modal'
)

assert.match(
  dispatchWorkbench,
  /issueShippingBatch\(generatedShippingBatch\.id, selectedShippingOptionId\)/,
  'web dispatch request page must issue the selected logistics option through one recoverable backend command'
)

assert.match(
  dispatchWorkbench,
  /generatedShippingBatch\.status === 'OUTBOUND_CREATED' \? '同步发货单' : '确认物流并下发发货单'/,
  'issued batches must expose an explicit idempotent sync action instead of looking like a first-time issue'
)

assert.doesNotMatch(
  dispatchWorkbench,
  /selectShippingOption\(generatedShippingBatch\.id|createOutboundOrders\(generatedShippingBatch\.id|ensurePackingListsForOutboundOrders/,
  'web dispatch request page must not split issuing into partially committed frontend requests'
)

assert.match(
  dispatchApi,
  /export function issueShippingBatch\(batchId: string, optionId: string\)[\s\S]*\/shipping-batches\/\$\{encodeURIComponent\(batchId\)\}\/issue/,
  'warehouse-dispatch API must expose the atomic and retryable issuing command'
)

assert.match(
  dispatchApi,
  /export function loadShippingBatches\(/,
  'warehouse-dispatch API must still expose shipping batch loading for the packing-list panel'
)

assert.match(
  dispatchApi,
  /export function createShippingBatchFromDispatchPlan\(\s*dispatchPlanId: string,\s*payload: CreateShippingBatchFromDispatchPlanPayload = \{\}/,
  'warehouse-dispatch API must expose dispatch-plan to shipping-batch generation'
)
