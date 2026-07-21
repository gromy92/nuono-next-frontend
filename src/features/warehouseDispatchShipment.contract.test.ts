import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const featuresDir = dirname(fileURLToPath(import.meta.url))

const menuRegistry = readFileSync(join(featuresDir, 'app-shell/WorkspaceMenuRegistry.ts'), 'utf8')
const shippingOrderPage = readFileSync(join(featuresDir, 'warehouse-shipping-order/WarehouseShippingOrderPage.tsx'), 'utf8')
const packingListPanel = readFileSync(join(featuresDir, 'warehouse-dispatch/WarehousePackingListPanel.tsx'), 'utf8')
const dispatchWorkbench = readFileSync(join(featuresDir, 'warehouse-dispatch/WarehouseDispatchWorkbenchPage.tsx'), 'utf8')
const dispatchWorkbenchCss = readFileSync(join(featuresDir, 'warehouse-dispatch/WarehouseDispatchWorkbenchPage.css'), 'utf8')
const dispatchApi = readFileSync(join(featuresDir, 'warehouse-dispatch/api.ts'), 'utf8')
const confirmDispatchTargetSource = dispatchWorkbench.slice(
  dispatchWorkbench.indexOf('async function confirmDispatchTargetOverride'),
  dispatchWorkbench.indexOf('async function openLogisticsPlanModal')
)
const readySourceCellSource = dispatchWorkbench.slice(
  dispatchWorkbench.indexOf('function renderReadySourceCell'),
  dispatchWorkbench.indexOf('function renderReadyQuoteCell')
)

assert.match(
  shippingOrderPage,
  /export function WarehouseShippingOrderPanel\(/,
  'warehouse order flow must expose a reusable panel so 仓库发运 owns the primary tab'
)

assert.match(
  shippingOrderPage,
  /export function WarehouseShippingOrderPage\(/,
  'legacy warehouse order route must remain as a compatibility wrapper'
)

assert.doesNotMatch(
  shippingOrderPage,
  /key: 'shipment-order'/,
  'legacy warehouse-order page must not expose the real shipment flow after it moved back under 仓库发运'
)

assert.match(
  menuRegistry,
  /keys: \['warehouse-shipping-order', 'warehouse-logistics-bill', 'warehouse-dispatch', 'official-warehouse', 'product-specs'\][\s\S]*urlPathPrefixes: \[[\s\S]*'\/api\/procurement\/purchase-orders\/shipping-orders'[\s\S]*'\/api\/procurement\/purchase-orders\/logistics-bills'/,
  'warehouse dispatch menu permission must cover legacy warehouse-order and logistics-bill API paths'
)

assert.match(
  dispatchWorkbench,
  /import \{ WarehouseShippingOrderPanel \} from '..\/warehouse-shipping-order\/WarehouseShippingOrderPage'/,
  'warehouse dispatch workbench must embed the warehouse order panel'
)

assert.match(
  dispatchWorkbench,
  /type WarehouseDispatchTabKey = 'warehouse-order' \| 'receipt-list'/,
  'warehouse order tab must be first in the warehouse dispatch tab type'
)

assert.match(
  dispatchWorkbench,
  /const \[activeTab, setActiveTab\] = useState<WarehouseDispatchTabKey>\('warehouse-order'\)/,
  'warehouse dispatch workbench must open on 仓库单 after moving it into this page'
)

assert.match(
  dispatchWorkbench,
  /const tabItems = \[[\s\S]*key: 'warehouse-order'[\s\S]*label: buildTabLabel\('仓库单'[\s\S]*children: <WarehouseShippingOrderPanel embedded/,
  'warehouse order tab must be placed before 采购收货 in 仓库发运'
)

assert.match(
  dispatchWorkbench,
  /key: 'warehouse-order'[\s\S]*key: 'receipt-list'/,
  '仓库单 tab must be on the left of 采购收货'
)

assert.doesNotMatch(
  dispatchWorkbench,
  /key: 'receipt-confirm'[\s\S]*label: buildTabLabel\('收货验收'/,
  'warehouse dispatch workbench must hide the web 收货验收 tab for this stage'
)

assert.doesNotMatch(
  dispatchWorkbench,
  />\s*收货验收\s*<\/Button>/,
  '采购收货 list must not expose the hidden web 收货验收 action'
)

assert.doesNotMatch(
  dispatchWorkbench,
  /验货通过|confirmReceiptRowPassed|confirmReceipt\(/,
  'warehouse dispatch workbench must not expose web-side receipt confirmation actions'
)

assert.doesNotMatch(
  dispatchApi,
  /\/api\/warehouse\/dispatch\/confirmations|createFulfillmentConfirmation/,
  'warehouse dispatch web API must not expose receipt confirmation writes'
)

assert.match(
  dispatchWorkbench,
  /title: '未收'[\s\S]*receiptRemainingQuantity\(item\)/,
  '采购收货列表必须显示整张仓库单仍需收货的数量'
)

assert.match(
  dispatchWorkbench,
  /title: '操作'[\s\S]*EyeOutlined[\s\S]*查看详情/,
  '采购收货列表必须提供明确的查看详情入口'
)

assert.match(
  dispatchWorkbench,
  /<Drawer[\s\S]*收货详情[\s\S]*renderReceiptOrderSummary[\s\S]*<Table<PurchaseReceiptItem>[\s\S]*rowKey=\{receiptProductBusinessScopeKey\}/,
  '采购收货详情必须使用只读抽屉展示仓库单汇总和商品明细'
)

assert.match(
  dispatchWorkbench,
  /options=\{buildReceiptDetailScopeOptions[\s\S]*placeholder="搜索 PSKU \/ 商品 \/ 采购单"/,
  '采购收货详情必须支持按收货状态和商品来源筛选'
)

assert.match(
  dispatchWorkbench,
  /function receiptRemainingQuantity\(item: PurchaseReceiptItem\)[\s\S]*Math\.max\(0, item\.expectedQty - item\.receivedQty\)/,
  '未收数量必须按应收减已收计算并且不能为负数'
)

assert.match(
  dispatchWorkbenchCss,
  /\.warehouse-dispatch-receipt-detail[\s\S]*\.warehouse-dispatch-clickable-row/,
  '采购收货详情和可点击列表行必须有稳定布局与交互样式'
)

assert.match(
  dispatchWorkbench,
  /key: 'ship-ready'[\s\S]*label: buildTabLabel\('库存'/,
  '可发运商品 tab must be renamed to 库存'
)

assert.doesNotMatch(
  dispatchWorkbench,
  /从可发运商品创建/,
  '库存 tab must not expose the old bulk create dispatch request flow'
)

assert.match(
  dispatchWorkbench,
  /openDispatchTargetModal/,
  '库存 source override flow must open a source-level dispatch target modal'
)

assert.match(
  dispatchWorkbench,
  /title="调整发货目标"/,
  '库存 source override modal must be titled 调整发货目标'
)

assert.match(
  dispatchWorkbench,
  /className="warehouse-dispatch-target-summary-psku"[\s\S]*<Text type="secondary">PSKU<\/Text>[\s\S]*dispatchTargetModal\.source\.psku/,
  '库存 source override modal must mark PSKU separately so the full identity can be displayed'
)

assert.match(
  dispatchWorkbenchCss,
  /\.warehouse-dispatch-target-summary-psku \{[\s\S]*grid-column: span 2;/,
  '库存 source override modal PSKU column must be wide enough for full PSKU display'
)

assert.match(
  dispatchWorkbenchCss,
  /\.warehouse-dispatch-target-summary-psku \.ant-typography \{[\s\S]*overflow: visible;[\s\S]*white-space: normal;[\s\S]*word-break: break-all;/,
  '库存 source override modal PSKU text must wrap instead of ellipsizing'
)

assert.doesNotMatch(
  dispatchWorkbench,
  />\s*创建申请\s*<\/Button>/,
  '库存 rows must not expose Web-side 创建申请 because inventory dispatch requests are app-only'
)

assert.match(
  dispatchWorkbench,
  /<Text type="secondary">原计划<\/Text>[\s\S]*dispatchTargetModal\.source\.originalSiteCode[\s\S]*dispatchTargetModal\.source\.originalTransportMode/,
  '库存 source override modal must show the original source plan as 原计划 with source site and transport'
)

assert.match(
  dispatchWorkbench,
  /<Text[^>]*>发货目标<\/Text>[\s\S]*className="warehouse-dispatch-target-fields"/,
  '库存 source override modal must group editable target controls under 发货目标'
)

assert.doesNotMatch(
  confirmDispatchTargetSource,
  /createDispatchPlan/,
  '库存修改计划 must not directly create a dispatch request'
)

assert.match(
  readySourceCellSource,
  /disabled=\{!source\.item\.fulfillmentBalanceId \|\| source\.item\.availableQty <= 0\}[\s\S]*修改计划/,
  '库存 source rows must keep Web-side 修改计划'
)

assert.doesNotMatch(
  readySourceCellSource,
  /onCreatePlan|logisticsQuoteBlocking[\s\S]*创建申请/,
  '库存 source rows must not carry a Web-side create-request callback'
)

assert.match(
  confirmDispatchTargetSource,
  /updateReadyItemDispatchTarget\([\s\S]*fulfillmentBalanceId[\s\S]*targetSiteCode[\s\S]*targetTransportMode/,
  '库存修改计划 must persist fulfillmentBalanceId, targetSiteCode, and targetTransportMode through the dispatch target API'
)

assert.match(
  dispatchApi,
  /type UpdateDispatchTargetPayload = \{[\s\S]*targetSiteCode: WarehouseSiteCode[\s\S]*targetTransportMode: DispatchTargetTransportMode/,
  'UpdateDispatchTargetPayload must narrow targetTransportMode so UNSPECIFIED cannot type-check'
)

assert.doesNotMatch(
  dispatchWorkbench,
  /createReadySourceDispatchPlan|createDispatchPlan\(/,
  'Web inventory must not create dispatch requests; inventory request creation is app-only'
)

assert.doesNotMatch(
  dispatchApi,
  /export function createDispatchPlan|CreateDispatchPlanPayload/,
  'Web warehouse dispatch API must not expose inventory dispatch request creation'
)

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

assert.match(
  readFileSync(join(featuresDir, 'warehouse-dispatch/types.ts'), 'utf8'),
  /type OutboundOrderLine = \{[\s\S]*logicalStoreId\?: string[\s\S]*storeCode\?: string[\s\S]*sources: OutboundOrderLineSource\[\]/,
  'outbound order lines returned to the app flow must carry store identity and source details'
)

assert.match(
  readFileSync(join(featuresDir, 'warehouse-dispatch/types.ts'), 'utf8'),
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
  readFileSync(join(featuresDir, 'warehouse-dispatch/types.ts'), 'utf8'),
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
  readFileSync(join(featuresDir, 'warehouse-dispatch/types.ts'), 'utf8'),
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
