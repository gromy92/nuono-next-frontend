import { strict as assert } from 'node:assert';
import { dispatchContractSources as sources } from './warehouseDispatchContractSources';

assert.match(sources.costDrawer, /title="物流方案费用对比"[\s\S]*ShippingOptionComparison[\s\S]*ShippingCostBreakdown/);
assert.match(sources.costDrawer, /warehouse-dispatch-cost-drawer-footer[\s\S]*最终物流方案[\s\S]*方案已锁定[\s\S]*confirmOutbound/);
assert.match(sources.costComparison, /整批重量[\s\S]*整批体积[\s\S]*整批费用/);
assert.match(sources.costComparison, /全部物流方案/);
assert.match(sources.costComparison, /onSelect\(option\.id\)[\s\S]*选择此方案[\s\S]*onView\(option\.id\)[\s\S]*查看明细/);
assert.match(sources.costComparison, /defaultExpandAllRows: false[\s\S]*rowExpandable: isCombinationShippingOption[\s\S]*ShippingForwarderBreakdown/);
assert.match(sources.shippingWorkspace, /selectOptionFromComparison[\s\S]*OUTBOUND_CREATED[\s\S]*setSelectedOptionId[\s\S]*setCostDetailOptionId/);

assert.match(
  sources.costBreakdown,
  /\{option\.optionName\} 方案明细[\s\S]*整批重量[\s\S]*整批体积[\s\S]*整批费用[\s\S]*整批费用组成[\s\S]*逐商品费用/
);
assert.match(sources.costBreakdown, /最低计费[\s\S]*minimumBillableUnit/);
assert.match(sources.costBreakdown, /warehouse-dispatch-product-cost-components[\s\S]*formatShippingComponentCalculation/);
assert.match(sources.forwarderBreakdown, /货代 \/ 线路[\s\S]*PSKU[\s\S]*商品数量[\s\S]*实际重量[\s\S]*体积[\s\S]*计费重量[\s\S]*货代费用[\s\S]*费用组成/);
assert.match(sources.costDomain, /buildShippingForwarderCostBreakdowns[\s\S]*targetForwarderCode[\s\S]*pskuCount[\s\S]*actualWeightKg[\s\S]*volumeCbm[\s\S]*pendingAmountLineCount/);
assert.match(sources.costDomain, /LAST_MILE[\s\S]*FBN_DELIVERY[\s\S]*送仓费[\s\S]*WAREHOUSE_PICKING[\s\S]*拣货费[\s\S]*WAREHOUSE_INBOUND[\s\S]*上架费/);

assert.match(sources.costComparison + sources.costBreakdown, /tableLayout="fixed"/);
assert.doesNotMatch(sources.costComparison + sources.costBreakdown, /scroll=\{\{ x:/);
assert.match(sources.css, /warehouse-dispatch-cost-drawer-shell \.ant-drawer-body[\s\S]*overflow-x: hidden/);
assert.match(sources.css, /warehouse-dispatch-cost-summary[\s\S]*warehouse-dispatch-forwarder-breakdown[\s\S]*warehouse-dispatch-forwarder-cost-components[\s\S]*warehouse-dispatch-product-cost-components/);
assert.match(sources.css, /warehouse-dispatch-plan-layout\.is-generated[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
