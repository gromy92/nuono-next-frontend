import { strict as assert } from 'node:assert'
import { matchGrantedMenuToWorkspaceMenuKeys } from './route-catalog/sessionAccessPolicy'
import {
  confirmDispatchTargetSource,
  dispatchApi,
  dispatchWorkbench,
  dispatchWorkbenchCss,
  readySourceCellSource,
  shippingOrderPage
} from './warehouseDispatchContractSources'

const expectedWarehouseDispatchMenuKeys = [
  'warehouse-shipping-order',
  'warehouse-logistics-bill',
  'warehouse-dispatch',
  'official-warehouse',
  'product-specs'
]

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

assert.deepEqual(
  matchGrantedMenuToWorkspaceMenuKeys({
    menuId: 9251,
    menuName: '',
    urlPath: '/api/procurement/purchase-orders/shipping-orders/1'
  }),
  expectedWarehouseDispatchMenuKeys
)
assert.deepEqual(
  matchGrantedMenuToWorkspaceMenuKeys({
    menuId: 9252,
    menuName: '',
    urlPath: '/api/procurement/purchase-orders/logistics-bills/1'
  }),
  expectedWarehouseDispatchMenuKeys
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
