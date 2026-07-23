import { strict as assert } from 'node:assert';
import { dispatchContractSources as sources } from './warehouseDispatchContractSources';

assert.match(sources.shippingOrderPage, /export function WarehouseShippingOrderPanel\(/);
assert.match(sources.shippingOrderPage, /export function WarehouseShippingOrderPage\(/);
assert.match(
  sources.menu,
  /keys: \['warehouse-shipping-order', 'warehouse-logistics-bill', 'warehouse-dispatch', 'official-warehouse', 'product-specs'\][\s\S]*\/api\/procurement\/purchase-orders\/shipping-orders[\s\S]*\/api\/procurement\/purchase-orders\/logistics-bills/
);

assert.match(sources.workbench, /WarehouseShippingOrderPanel embedded/);
assert.match(sources.models, /WarehouseDispatchTabKey[\s\S]*'warehouse-order'[\s\S]*'receipt-list'/);
assert.match(sources.workbench, /useState<WarehouseDispatchTabKey>\('warehouse-order'\)/);
assert.match(
  sources.workbench,
  /key: 'warehouse-order'[\s\S]*buildTabLabel\('仓库单'[\s\S]*key: 'receipt-list'[\s\S]*buildTabLabel\('采购收货'/
);
assert.doesNotMatch(sources.workbench, /收货验收|receipt-confirm/);
assert.doesNotMatch(sources.dispatchApi, /\/api\/warehouse\/dispatch\/confirmations|createFulfillmentConfirmation/);

assert.match(sources.receiptPanel, /title: '未收'[\s\S]*receiptRemainingQuantity\(item\)/);
assert.match(sources.receiptPanel, /title: '操作'[\s\S]*EyeOutlined[\s\S]*查看详情/);
assert.match(
  sources.receiptPanel,
  /<Drawer[\s\S]*收货详情[\s\S]*renderReceiptOrderSummary[\s\S]*<Table<PurchaseReceiptItem>[\s\S]*receiptProductBusinessScopeKey/
);
assert.match(sources.receiptPanel, /buildReceiptDetailScopeOptions[\s\S]*搜索 PSKU \/ 商品 \/ 采购单/);
assert.match(sources.receiptDomain, /receiptRemainingQuantity[\s\S]*Math\.max\(0, item\.expectedQty - item\.receivedQty\)/);
assert.match(sources.css, /warehouse-dispatch-receipt-detail[\s\S]*warehouse-dispatch-clickable-row/);

assert.match(sources.workbench, /key: 'ship-ready'[\s\S]*buildTabLabel\('库存'/);
assert.doesNotMatch(sources.readyPanel + sources.readyCells, /创建申请|从可发运商品创建/);
assert.match(sources.readyCells, /disabled=\{!source\.item\.fulfillmentBalanceId \|\| source\.item\.availableQty <= 0\}[\s\S]*修改计划/);
assert.match(sources.readyPanel, /title="调整发货目标"/);
assert.match(sources.readyPanel, /warehouse-dispatch-target-summary-psku[\s\S]*label="PSKU"[\s\S]*modal\.source\.psku/);
assert.match(sources.css, /warehouse-dispatch-target-summary-psku \{[\s\S]*grid-column: span 2/);
assert.match(sources.css, /warehouse-dispatch-target-summary-psku \.ant-typography \{[\s\S]*word-break: break-all/);
assert.match(sources.readyPanel, /label="原计划"[\s\S]*originalSiteCode[\s\S]*originalTransportMode/);
assert.match(sources.readyPanel, /warehouse-dispatch-target-section-title">发货目标/);
assert.match(
  sources.readyWorkspace,
  /updateReadyItemDispatchTarget\(source\.fulfillmentBalanceId[\s\S]*targetSiteCode[\s\S]*targetTransportMode/
);
assert.doesNotMatch(sources.readyWorkspace + sources.dispatchApi, /createDispatchPlan|CreateDispatchPlanPayload/);
assert.match(sources.dispatchApi, /UpdateDispatchTargetPayload[\s\S]*targetSiteCode: WarehouseSiteCode[\s\S]*targetTransportMode: DispatchTargetTransportMode/);
