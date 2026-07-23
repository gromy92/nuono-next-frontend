import { strict as assert } from 'node:assert'
import { matchGrantedMenuToWorkspaceMenuKeys } from './route-catalog/sessionAccessPolicy'
import { dispatchContractSources } from './warehouseDispatchContractSources'

const {
  shippingOrderPage,
  workbench,
  models,
  receiptPanel,
  receiptDomain,
  readyPanel,
  readyCells,
  readyWorkspace,
  dispatchApi,
  css
} = dispatchContractSources

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
  'warehouse order flow must expose a reusable embedded panel'
)

assert.match(
  shippingOrderPage,
  /export function WarehouseShippingOrderPage\(/,
  'legacy warehouse order route must remain as a compatibility wrapper'
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
  models,
  /WarehouseDispatchTabKey =[\s\S]*'warehouse-order'[\s\S]*'receipt-list'/,
  'warehouse order must remain the first warehouse dispatch tab type'
)

assert.match(
  workbench,
  /useState<WarehouseDispatchTabKey>\('warehouse-order'\)/,
  'warehouse dispatch must open on 仓库单'
)

assert.match(
  workbench,
  /key: 'warehouse-order'[\s\S]*WarehouseShippingOrderPanel embedded[\s\S]*key: 'receipt-list'/,
  '仓库单 must be placed before 采购收货'
)

assert.doesNotMatch(
  `${workbench}\n${receiptPanel}`,
  /key: 'receipt-confirm'|收货验收|验货通过|confirmReceiptRowPassed|confirmReceipt\(/,
  'web warehouse dispatch must not expose APP receipt-confirmation actions'
)

assert.doesNotMatch(
  dispatchApi,
  /\/api\/warehouse\/dispatch\/confirmations|createFulfillmentConfirmation/,
  'web warehouse API must not expose receipt-confirmation writes'
)

assert.match(
  receiptPanel,
  /title: '未收'[\s\S]*receiptRemainingQuantity\(item\)/,
  '采购收货 must show outstanding quantities'
)

assert.match(
  receiptPanel,
  /title: '操作'[\s\S]*EyeOutlined[\s\S]*workspace\.openDetail\(order\)[\s\S]*查看详情/,
  '采购收货 must provide a visible detail action'
)

assert.match(
  receiptPanel,
  /<Drawer[\s\S]*收货详情[\s\S]*renderReceiptOrderSummary[\s\S]*<Table<PurchaseReceiptItem>[\s\S]*rowKey=\{receiptProductBusinessScopeKey\}/,
  'receipt details must be a read-only summary and product drawer'
)

assert.match(
  receiptPanel,
  /buildReceiptDetailScopeOptions[\s\S]*placeholder="搜索 PSKU \/ 商品 \/ 采购单"/,
  'receipt details must support status and product-source filtering'
)

assert.match(
  receiptDomain,
  /function receiptRemainingQuantity\(item: PurchaseReceiptItem\)[\s\S]*Math\.max\(0, item\.expectedQty - item\.receivedQty\)/,
  'outstanding receipt quantity must be expected minus received and never negative'
)

assert.match(
  css,
  /\.warehouse-dispatch-receipt-detail[\s\S]*\.warehouse-dispatch-clickable-row/,
  'receipt details and clickable rows must retain stable styling'
)

assert.match(
  workbench,
  /key: 'ship-ready'[\s\S]*label: buildTabLabel\('库存'/,
  'available goods must be presented as 库存'
)

assert.doesNotMatch(
  `${workbench}\n${readyPanel}\n${readyWorkspace}`,
  /从可发运商品创建|创建申请|createDispatchPlan\(/,
  'web inventory must not create dispatch requests'
)

assert.match(
  readyPanel,
  /workspace\.openTargetModal[\s\S]*title="调整发货目标"/,
  'inventory source rows must open the dispatch-target editor'
)

assert.match(
  readyPanel,
  /warehouse-dispatch-target-summary-psku[\s\S]*label="PSKU"[\s\S]*modal\.source\.psku/,
  'dispatch-target editing must show the full stable PSKU identity'
)

assert.match(
  css,
  /\.warehouse-dispatch-target-summary-psku \{[\s\S]*grid-column: span 2;[\s\S]*word-break: break-all;/,
  'dispatch-target PSKU must have enough width and wrap instead of ellipsizing'
)

assert.match(
  readyPanel,
  /label="原计划"[\s\S]*originalSiteCode[\s\S]*originalTransportMode[\s\S]*发货目标[\s\S]*warehouse-dispatch-target-fields/,
  'dispatch-target editing must separate the original plan from editable target fields'
)

assert.match(
  readyCells,
  /disabled=\{!source\.item\.fulfillmentBalanceId \|\| source\.item\.availableQty <= 0\}[\s\S]*修改计划/,
  'only persisted inventory sources with stock can be replanned'
)

assert.match(
  readyWorkspace,
  /updateReadyItemDispatchTarget\(source\.fulfillmentBalanceId,[\s\S]*targetSiteCode[\s\S]*targetTransportMode/,
  'inventory plan changes must persist the stable balance identity and target'
)

assert.match(
  dispatchApi,
  /type UpdateDispatchTargetPayload = \{[\s\S]*targetSiteCode: WarehouseSiteCode[\s\S]*targetTransportMode: DispatchTargetTransportMode/,
  'dispatch target payload must reject UNSPECIFIED transport at compile time'
)

assert.doesNotMatch(
  dispatchApi,
  /export function createDispatchPlan|CreateDispatchPlanPayload/,
  'web warehouse API must not expose inventory dispatch-request creation'
)
