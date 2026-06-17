import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const typesSource = readFileSync(resolve(root, 'src/features/purchase-order/types.ts'), 'utf8');
const pageSource = readFileSync(resolve(root, 'src/features/purchase-order/PurchaseOrderPage.tsx'), 'utf8');
const siteQuantityBlock = pageSource.slice(
  pageSource.indexOf('function SiteQuantityFormList'),
  pageSource.indexOf('function PskuRowsFormList')
);
const pskuRowsBlock = pageSource.slice(
  pageSource.indexOf('function PskuRowsFormList'),
  pageSource.indexOf('function createEmptyPskuEntry')
);
const createStoreOptionsBlock = pageSource.slice(
  pageSource.indexOf('function buildCreateStoreOptions'),
  pageSource.indexOf('function getCreateStoreSiteOptions')
);

assert.match(typesSource, /export type PurchaseOrderFulfillmentType\b/);
assert.match(typesSource, /fulfillmentType:\s*PurchaseOrderFulfillmentType/);
assert.match(typesSource, /fulfillmentType\?:\s*PurchaseOrderFulfillmentType/);
assert.match(pageSource, /FULFILLMENT_TYPE_OPTIONS/);
assert.match(pageSource, /label:\s*'货到仓库'/);
assert.match(pageSource, /label:\s*'货到货代'/);
assert.match(pskuRowsBlock, /name=\{\[field\.name,\s*'fulfillmentType'\]\}/);
assert.doesNotMatch(siteQuantityBlock, /fulfillmentType/);
assert.doesNotMatch(siteQuantityBlock, /newProduct|新品/);
assert.match(pageSource, /fulfillmentType:\s*normalizeFulfillmentType\(row\?\.fulfillmentType\)/);
assert.match(pageSource, /fulfillmentType:\s*normalizeFulfillmentType\(values\.fulfillmentType\)/);
assert.match(pageSource, /function duplicatePskuSiteMessage/);
assert.match(pageSource, /不能重复添加相同商品相同站点/);
assert.match(createStoreOptionsBlock, /storeGroupOptionLabel\(store\)/);
assert.doesNotMatch(createStoreOptionsBlock, /storeOptionLabel\(store\)/);
assert.doesNotMatch(pageSource, /function storeOptionLabel\(/);

console.log('purchase order fulfillment contract ok');
