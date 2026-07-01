import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const catalogTablePanel = source('./components/ProductCatalogTablePanel.tsx');
const api = source('./api.ts');
const listMutations = source('./hooks/useProductListMutations.ts');
const productSpecsPage = source('../product-specs/ProductSpecsPage.tsx');

test('product management uses partnerSku-first product identity helpers', () => {
  assert.match(
    catalogTablePanel,
    /getProductListRowIdentityKey/,
    'product list table rowKey/highlight must use the stable product identity helper'
  );

  assert.doesNotMatch(
    catalogTablePanel,
    /rowKey=\{\(record\) => record\.skuParent\}/,
    'product list table rowKey must not use current Z code as product identity'
  );

  assert.doesNotMatch(
    catalogTablePanel,
    /currentProductSkuParent === record\.skuParent/,
    'current row highlight must not use current Z code as product identity'
  );

  assert.doesNotMatch(
    listMutations,
    /item\.skuParent === summary\.skuParent/,
    'list summary merge/apply must not match only by current Z code'
  );
});

test('product specs APIs and row state prefer by-psku identity', () => {
  assert.match(
    api,
    /\/api\/product-specs\/by-psku/,
    'product specs detail/source/effective-source requests must prefer the by-psku API'
  );

  assert.match(
    api,
    /\/api\/product-logistics-profiles\/by-psku/,
    'product logistics profile requests must prefer the by-psku API'
  );

  assert.doesNotMatch(
    api,
    /partnerSku\s*\|\|\s*pskuCode|pskuCode\s*\|\|\s*partnerSku/,
    'API request builders must not treat external pskuCode as system PSKU fallback'
  );

  assert.doesNotMatch(
    productSpecsPage,
    /rowKey=\{\(row\) => String\(row\.variantId \|\|/,
    'product specs rowKey must prefer partnerSku before variantId'
  );

  assert.doesNotMatch(
    productSpecsPage,
    /const key = String\(row\.variantId\)/,
    'product specs saving key must prefer partnerSku before variantId'
  );
});
