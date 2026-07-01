import { strict as assert } from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const productManagementDir = dirname(fileURLToPath(import.meta.url));
const repoFeatureDir = join(productManagementDir, '..');

function source(path: string) {
  return readFileSync(join(productManagementDir, path), 'utf8');
}

function featureSource(path: string) {
  return readFileSync(join(repoFeatureDir, path), 'utf8');
}

function readProductManagementSources(dir = productManagementDir): Array<{ path: string; source: string }> {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return readProductManagementSources(path);
    }
    if (!/\.(ts|tsx)$/.test(entry.name) || entry.name.endsWith('.contract.test.ts')) {
      return [];
    }
    return [{ path: relative(productManagementDir, path), source: readFileSync(path, 'utf8') }];
  });
}

const productManagementSources = readProductManagementSources();
const allProductManagementSource = productManagementSources.map((item) => item.source).join('\n');
const catalogTablePanel = source('./components/ProductCatalogTablePanel.tsx');
const api = source('./api.ts');
const listMutations = source('./hooks/useProductListMutations.ts');
const productSpecsPage = featureSource('product-specs/ProductSpecsPage.tsx');
const specTable = source('./components/ProductVariantSpecTable.tsx');
const specModal = source('./components/ProductVariantSpecModal.tsx');
const noonLinks = source('./utils/noonLinks.ts');

assert.match(
  allProductManagementSource,
  /getProductStableIdentityKey|getProductListRowIdentityKey|isSameStableProductIdentity/,
  'product-management must use shared partnerSku-first identity helpers'
);

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

assert.doesNotMatch(
  allProductManagementSource,
  /partnerSku\s*\|\|\s*pskuCode|pskuCode\s*\|\|\s*partnerSku/,
  'product-management must not treat external pskuCode as system PSKU fallback'
);

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

assert.match(
  specTable,
  /partnerSku/,
  'embedded product spec table scope must carry partnerSku'
);

assert.match(
  specModal,
  /scope=\{\{ ownerUserId, storeCode, partnerSku, currentZCode/,
  'product spec modal must pass partnerSku and currentZCode into the spec table scope'
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

assert.match(
  noonLinks,
  /skuParent|currentZCode/,
  'Noon links should continue to use current Z code compatible fields rather than partnerSku'
);

assert.doesNotMatch(
  noonLinks,
  /encodeURIComponent\(partnerSku\)/,
  'Noon product/catalog links must not use partnerSku as the Z-code path segment'
);
