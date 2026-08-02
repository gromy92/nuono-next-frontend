import { strict as assert } from 'node:assert';
import { dispatchContractSources as sources } from './warehouseDispatchContractSources';

assert.match(
  sources.types,
  /OutboundOrderLine[\s\S]*logicalStoreId\?: string[\s\S]*storeCode\?: string[\s\S]*sources: OutboundOrderLineSource\[\]/
);
assert.match(
  sources.types,
  /PackingList[\s\S]*boxes: PackingBox\[\][\s\S]*PackingBox[\s\S]*status: string[\s\S]*lengthCm\?: string[\s\S]*grossWeightKg\?: string[\s\S]*items: PackingBoxItem\[\]/
);
assert.match(
  sources.dispatchApi,
  /ApiOutboundOrderLine[\s\S]*logicalStoreId\?: number \| string[\s\S]*sourceStoreCode\?: string[\s\S]*sources\?: ApiOutboundOrderLineSource\[\]/
);
assert.match(
  sources.dispatchApi,
  /ApiOutboundOrderLine[\s\S]*targetForwarderName\?: string[\s\S]*cargoCategoryName\?: string[\s\S]*packingGroupName\?: string/
);
assert.match(sources.workbench, /buildTabLabel\('发货执行', 0\)/);
assert.match(sources.packingPanel, /title: '总体积'/);
assert.match(sources.packingPanel, /title: '总毛重'/);
assert.match(sources.packingPanel, /title: '箱数'/);
assert.match(sources.packingPanel, /title: '商品数'/);
assert.match(sources.packingPanel, /title: '件数'/);
assert.match(sources.packingPanel, /title: '计划物流数'/);
assert.match(sources.packingPanel, /查看装箱详情/);
assert.match(sources.packingPanel, /导出装箱单/);
assert.match(sources.dispatchApi, /shipping-batches\/\$\{encodeURIComponent\(batchId\)\}\/packing-list-export/);
assert.match(sources.dispatchApi, /forwarderCode: string; routeCode: string/);
assert.match(sources.packingExportModal, /选择货代/);
assert.match(sources.packingExportModal, /选择渠道/);
assert.match(sources.packingExportDomain, /targetForwarderCode[\s\S]*routeCode/);
assert.match(sources.packingPanel, /onRow=\{\(batch\)/);
assert.match(
  sources.types,
  /ShippingBatch[\s\S]*optionCount: number[\s\S]*packingListCount: number[\s\S]*boxCount: number[\s\S]*packedQuantity: number[\s\S]*grossWeightKg\?: number/
);
assert.match(sources.packingSubmissionDrawer, /APP 装箱详情/);
assert.match(sources.packingSubmissionDrawer, /formatBoxSpec\(box\)/);
assert.match(
  sources.dispatchApi,
  /ApiPackingList[\s\S]*boxes\?: ApiPackingBox\[\][\s\S]*ApiPackingBox[\s\S]*status\?: string[\s\S]*lengthCm\?: string[\s\S]*items\?: ApiPackingBoxItem\[\]/
);
assert.match(sources.dispatchApi, /sources: \(line\.sources \|\| \[\]\)\.map\(mapOutboundOrderLineSource\)/);
assert.match(sources.dispatchApi, /boxes: \(packingList\.boxes \|\| \[\]\)\.map\(mapPackingBox\)/);
assert.match(
  sources.types,
  /ShippingSuggestionLine[\s\S]*rawBillableQuantity\?: number[\s\S]*minimumBillableUnit\?: number[\s\S]*freightAmount\?: number[\s\S]*costComponents: ShippingCostComponent\[\]/
);
assert.match(
  sources.dispatchApi,
  /costComponents: \(option\.costComponents \|\| \[\]\)\.map\(mapShippingCostComponent\)[\s\S]*lines: \(option\.lines \|\| \[\]\)\.map\(mapShippingSuggestionLine\)/
);
