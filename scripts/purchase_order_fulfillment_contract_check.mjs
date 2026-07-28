import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const typesSource = [
  readFileSync(resolve(root, 'src/features/purchase-order/types.ts'), 'utf8'),
  readFileSync(resolve(root, 'src/features/purchase-order/purchaseOrderLogisticsQuoteTypes.ts'), 'utf8')
].join('\n');
const apiSource = readFileSync(resolve(root, 'src/features/purchase-order/api.ts'), 'utf8');
const pageSource = readFileSync(resolve(root, 'src/features/purchase-order/PurchaseOrderPage.tsx'), 'utf8');
const itemCommandSource = readFileSync(resolve(root, 'src/features/purchase-order/model/purchaseOrderItemCommandModel.ts'), 'utf8');
const storeModelSource = readFileSync(resolve(root, 'src/features/purchase-order/model/purchaseOrderStoreModel.tsx'), 'utf8');
const uiMetaSource = readFileSync(resolve(root, 'src/features/purchase-order/model/purchaseOrderUiMeta.tsx'), 'utf8');
const purchaseOrderFeatureSource = [pageSource, itemCommandSource, storeModelSource, uiMetaSource].join('\n');
const shippingOrderFeatureDir = resolve(root, 'src/features/warehouse-dispatch/warehouse-order');
const shippingOrderPageSource = readdirSync(shippingOrderFeatureDir)
  .filter((name) => /\.(?:ts|tsx)$/.test(name) && !name.endsWith('.test.ts') && !name.endsWith('.test.tsx'))
  .map((name) => readFileSync(resolve(shippingOrderFeatureDir, name), 'utf8'))
  .join('\n');
const siteQuantityBlock = pageSource.slice(
  pageSource.indexOf('function SiteQuantityFormList'),
  pageSource.indexOf('function PskuRowsFormList')
);
const pskuRowsBlock = pageSource.slice(
  pageSource.indexOf('function PskuRowsFormList'),
  pageSource.length
);
const createStoreOptionsBlock = storeModelSource.slice(
  storeModelSource.indexOf('function buildCreateStoreOptions'),
  storeModelSource.indexOf('function getCreateStoreSiteOptions')
);

assert.match(typesSource, /export type PurchaseOrderFulfillmentType\b/);
assert.match(typesSource, /export type PurchaseOrderLogisticsQuoteSummary\b/);
assert.match(typesSource, /export type PurchaseOrderLogisticsQuoteOptions\b/);
assert.match(typesSource, /logisticsQuoteSummary\?:\s*PurchaseOrderLogisticsQuoteSummary/);
assert.match(typesSource, /fulfillmentType:\s*PurchaseOrderFulfillmentType/);
assert.match(typesSource, /fulfillmentType\?:\s*PurchaseOrderFulfillmentType/);
assert.match(purchaseOrderFeatureSource, /FULFILLMENT_TYPE_OPTIONS/);
assert.match(purchaseOrderFeatureSource, /label:\s*'货到仓库'/);
assert.match(purchaseOrderFeatureSource, /label:\s*'货到货代'/);
assert.match(shippingOrderPageSource, /导出审核单/);
assert.match(shippingOrderPageSource, /选择货代/);
assert.match(shippingOrderPageSource, /选择渠道/);
assert.match(shippingOrderPageSource, /exportTarget/);
assert.match(shippingOrderPageSource, /回传报价/);
assert.match(shippingOrderPageSource, /提交发货/);
assert.match(shippingOrderPageSource, /exportShippingOrderLogisticsQuoteReport/);
assert.match(shippingOrderPageSource, /loadShippingOrderLogisticsQuoteOptions/);
assert.match(shippingOrderPageSource, /importShippingOrderLogisticsQuoteReport/);
assert.match(shippingOrderPageSource, /submitShippingOrder/);
assert.match(pageSource, /createShippingOrder/);
assert.match(pageSource, /shippingMergeMode/);
assert.match(pageSource, /selectedShippingMergeOrderIds/);
assert.match(pageSource, /handleCreateShippingOrderFromSelection/);
assert.match(pageSource, /采购单封存后才可合并为仓库单/);
assert.match(pageSource, /已选 \{/);
assert.match(pageSource, /Checkbox/);
assert.match(apiSource, /loadPurchaseOrderLogisticsQuoteOptions/);
assert.match(apiSource, /logistics-quote-options/);
assert.match(pskuRowsBlock, /name=\{\[field\.name,\s*'fulfillmentType'\]\}/);
assert.doesNotMatch(siteQuantityBlock, /fulfillmentType/);
assert.doesNotMatch(siteQuantityBlock, /newProduct|新品/);
assert.match(itemCommandSource, /fulfillmentType:\s*normalizeFulfillmentType\(row\?\.fulfillmentType\)/);
assert.match(pageSource, /fulfillmentType:\s*normalizeFulfillmentType\(values\.fulfillmentType\)/);
assert.match(itemCommandSource, /function duplicatePskuSiteMessage/);
assert.match(itemCommandSource, /不能重复添加相同商品相同站点/);
assert.match(createStoreOptionsBlock, /storeGroupOptionLabel\(store\)/);
assert.doesNotMatch(createStoreOptionsBlock, /storeOptionLabel\(store\)/);
assert.doesNotMatch(purchaseOrderFeatureSource, /function storeOptionLabel\(/);

console.log('purchase order fulfillment contract ok');
