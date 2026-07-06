import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProductListFilters, ProductListRowPayload } from './types';
import {
  PRODUCT_OPERATION_STAGE_OPTIONS,
  normalizeProductOperationStageCode,
  productOperationStageMeta
} from './utils/operationStage';
import { filterAndSortProductListItems } from './utils/productListFilters';

const productManagementDir = dirname(fileURLToPath(import.meta.url));

function source(path: string) {
  return readFileSync(join(productManagementDir, path), 'utf8');
}

assert.deepEqual(
  PRODUCT_OPERATION_STAGE_OPTIONS.map((option) => option.value),
  ['TESTING', 'STABLE', 'WATCH', 'CLEARANCE'],
  'operation stage options must stay on the agreed four operations stages'
);

assert.equal(productOperationStageMeta('TESTING').label, '测试新品');
assert.equal(productOperationStageMeta('STABLE').label, '稳定销售');
assert.equal(productOperationStageMeta('WATCH').label, '观察调整');
assert.equal(productOperationStageMeta('CLEARANCE').label, '清仓');
assert.equal(normalizeProductOperationStageCode(' stable '), 'STABLE');
assert.equal(normalizeProductOperationStageCode('unknown'), undefined);

const baseFilters: ProductListFilters = {
  skuQuery: '',
  titleQuery: '',
  brandQuery: '',
  issueFilter: 'all',
  liveFilter: 'all',
  syncFilter: 'all',
  stockFilter: 'all',
  operationStageFilter: 'CLEARANCE'
};

const items: ProductListRowPayload[] = [
  {
    skuParent: 'Z-A',
    partnerSku: 'PSKU-A',
    operationStageCode: 'CLEARANCE',
    siteLabels: ['AE'],
    liveStatuses: [],
    issueTags: []
  },
  {
    skuParent: 'Z-B',
    partnerSku: 'PSKU-B',
    operationStageCode: 'STABLE',
    siteLabels: ['AE'],
    liveStatuses: [],
    issueTags: []
  },
  {
    skuParent: 'Z-C',
    partnerSku: 'PSKU-C',
    siteLabels: ['AE'],
    liveStatuses: [],
    issueTags: []
  }
];

assert.deepEqual(
  filterAndSortProductListItems({
    filters: baseFilters,
    sortKey: 'lastSync',
    sourceItems: items,
    uiStates: {},
    usingMockProductList: false
  }).map((item) => item.partnerSku),
  ['PSKU-A'],
  'operation stage filter must match product_site_offer stage from the current store site row'
);

assert.deepEqual(
  filterAndSortProductListItems({
    filters: { ...baseFilters, operationStageFilter: 'unset' },
    sortKey: 'lastSync',
    sourceItems: items,
    uiStates: {},
    usingMockProductList: false
  }).map((item) => item.partnerSku),
  ['PSKU-C'],
  'unset operation stage filter must show rows whose stage has not been assigned'
);

assert.match(source('./api.ts'), /\/api\/product-master\/operation-stage/);
assert.doesNotMatch(source('./productListColumns.tsx'), /key: 'operationStage'/);
assert.match(source('./components/ProductListIdentityCells.tsx'), /OperationStageCell/);
assert.match(source('./components\/ProductCatalogFilterBar.tsx'), /operationStageFilter/);
assert.match(source('./hooks\/useProductOperationStage.ts'), /updateProductOperationStage/);
