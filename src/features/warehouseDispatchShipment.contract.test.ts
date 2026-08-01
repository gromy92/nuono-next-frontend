import { strict as assert } from 'node:assert';
import { dispatchContractSources as sources } from './warehouseDispatchContractSources';
import { requireShippingBatchForPlan } from './warehouse-dispatch/shippingBatchScopeDomain';
import type { DispatchPlan, ShippingBatch } from './warehouse-dispatch/types';

const scopedPlan = { id: 'plan-a', ownerUserId: 307 } as DispatchPlan;
const scopedBatch = {
  id: 'batch-a', dispatchPlanId: 'plan-a', ownerUserId: 307
} as ShippingBatch;
assert.equal(requireShippingBatchForPlan(scopedPlan, scopedBatch), scopedBatch);
assert.throws(
  () => requireShippingBatchForPlan(scopedPlan, { ...scopedBatch, dispatchPlanId: 'plan-b' }),
  /不匹配/
);
assert.throws(
  () => requireShippingBatchForPlan(scopedPlan, { ...scopedBatch, ownerUserId: undefined }),
  /所属账号/
);
assert.throws(
  () => requireShippingBatchForPlan(scopedPlan, { ...scopedBatch, ownerUserId: 999 }),
  /所属账号.*不匹配/
);
assert.throws(
  () => requireShippingBatchForPlan({ ...scopedPlan, ownerUserId: undefined }, scopedBatch),
  /所属账号/
);
assert.throws(
  () => requireShippingBatchForPlan(scopedPlan, { ...scopedBatch, dispatchPlanId: undefined }),
  /不匹配/
);

assert.match(sources.workbench, /key: 'dispatch-plan'[\s\S]*buildTabLabel\('发货申请单'/);
assert.match(sources.planPanel, /ColumnsType<DispatchPlan>/);
assert.match(
  sources.planPanel,
  /title: '站点 \/ 运输方式'[\s\S]*<LogisticsPartitionTags summary=\{planPartition\(plan\)\}/
);
assert.match(sources.planPanel, /title: '整批统计'[\s\S]*重量[\s\S]*formatDispatchPlanBatchMetric[\s\S]*体积/);
assert.match(
  sources.planPanel,
  /title: '发货申请单'[\s\S]*renderDispatchStatus[\s\S]*title: '来源'[\s\S]*countPlanSourceOrders[\s\S]*countPlanStores[\s\S]*title: '商品'[\s\S]*sumPlanQuantity/
);
assert.match(sources.planPanel, /CalculatorOutlined[\s\S]*workspace\.openCostComparison\(plan\)[\s\S]*费用对比/);
assert.match(sources.planPanel, /暂无发货申请单，请先在仓管 APP 发起/);

assert.match(sources.shippingWorkspace, /selectPlan\(planId: string\)[\s\S]*setDetailOpen\(true\)[\s\S]*currentShippingBatch[\s\S]*hydrateBatch/);
assert.match(
  sources.shippingWorkspace,
  /createLatestRequestGate[\s\S]*batchRequestGateRef[\s\S]*batchRequestScopeRef/
);
assert.match(
  sources.shippingWorkspace,
  /generateLogisticsPlan[\s\S]*requestIdentity[\s\S]*isCurrentRequest[\s\S]*createShippingBatchFromDispatchPlan[\s\S]*if \(!isCurrentRequest\(\)\) return[\s\S]*requireShippingBatchForPlan\(plan, batch\)[\s\S]*setSelectedPlanId\(plan\.id\)[\s\S]*setShippingBatch\(batch\)[\s\S]*finally[\s\S]*isCurrentRequest\(\)[\s\S]*setGeneratingPlanId\(undefined\)/
);
assert.match(sources.planDetail, /title=\{plan \? `\$\{plan\.planNo\} 发货申请单详情`[\s\S]*warehouse-dispatch-plan-detail is-modal/);
assert.match(sources.costDomain, /formatDispatchPlanBatchMetric[\s\S]*待生成[\s\S]*actualWeightKg[\s\S]*volumeCbm[\s\S]*规格缺失/);
assert.match(
  sources.workbench + sources.planDetail + sources.shippingWorkspace,
  /generateLogisticsPlan[\s\S]*生成物流计划/
);
assert.match(
  sources.dispatchApi,
  /createShippingBatchFromDispatchPlan[\s\S]*dispatch-plans\/\$\{encodeURIComponent\(dispatchPlanId\)\}\/shipping-batch/
);

assert.match(sources.shippingWorkspace, /selectedRouteGroupKey/);
assert.match(sources.shippingWorkspace, /请先选择物流方案/);
assert.match(sources.planDetail, /aria-label="提交物流方案"/);
assert.match(sources.shippingWorkspace, /issueShippingBatch\(shippingBatch\.id, selectedOptionId\)/);
assert.match(sources.dispatchApi, /issueShippingBatch[\s\S]*shipping-batches\/\$\{encodeURIComponent\(batchId\)\}\/issue/);
assert.doesNotMatch(sources.planDetail + sources.shippingWorkspace, /同步发货单|selectShippingOption\(|createOutboundOrders\(/);
assert.match(sources.planDetail, /shippingBatch\.status !== 'OUTBOUND_CREATED'[\s\S]*确认物流并下发发货单/);

assert.match(sources.workbench, /key: 'packing-list'[\s\S]*buildTabLabel\('发货执行'[\s\S]*WarehousePackingListPanel/);
assert.match(sources.packingPanel, /loadShippingBatches\(/);
assert.match(sources.packingPanel, /loadPackingLists\(/);
assert.match(sources.packingPanel, /shipPackingList\(packingListId\)/);
assert.match(
  sources.packingPanel,
  /requirePackingBatchDetailsScope[\s\S]*loadOutboundOrders[\s\S]*loadPackingLists[\s\S]*requirePackingListActionScope[\s\S]*shipPackingList/
);
assert.match(sources.packingSubmissionDrawer, /确认已交货代/);
assert.doesNotMatch(sources.packingPanel, /createPackingList\(|createOutboundOrders\(|selectShippingOption\(|生成装箱单/);
assert.match(sources.dispatchApi, /loadShippingBatches\(/);
assert.match(sources.types, /currentShippingBatch\?: ShippingBatch/);
assert.match(sources.dispatchApi, /currentShippingBatch: plan\.currentShippingBatch \? mapShippingBatch/);
