import { strict as assert } from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectProductSpecEffectiveSource } from './api';

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
const historyModalActions = source('./hooks/useProductHistoryModalActions.ts');
const listMutations = source('./hooks/useProductListMutations.ts');
const localDeletion = source('./hooks/useProductLocalDeletion.ts');
const mediaAndHistoryActions = source('./hooks/useProductMediaAndHistoryActions.ts');
const mockProductActions = source('./hooks/useMockProductActions.ts');
const productIdentity = source('./utils/productIdentity.ts');
const workbenchActionSubmitter = source('./hooks/useProductWorkbenchActionSubmitter.ts');
const siteCompareModalActions = source('./hooks/useProductSiteCompareModalActions.ts');
const workspaceAccess = source('./workspaceAccess.ts');
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
  listMutations,
  /item\.skuParent [!=]== identityKey/,
  'list live-status mutations must not use current Z code as the identity key fallback'
);

assert.doesNotMatch(
  mockProductActions,
  /updateProductListUiState\(currentSkuParent,/,
  'mock product actions must update list UI state by stable product identity'
);

assert.doesNotMatch(
  workbenchActionSubmitter,
  /updateProductListUiState\(currentProductIdentityKey \|\| currentProductSkuParent,/,
  'real product action error state must not fall back to current Z code identity'
);

assert.doesNotMatch(
  productIdentity,
  /keys\.add\(\[storeCode,\s*`z:\$\{currentZCode\}`\]/,
  'product identity lookup keys must not index rows by current Z code'
);

assert.doesNotMatch(
  productIdentity,
  /return \[storeCode,\s*`z:\$\{currentZCode\}`\]/,
  'stable product keys must not use current Z code'
);

assert.doesNotMatch(
  productIdentity,
  /keys\.add\(`z:\$\{currentZCode\}`\)|keys\.add\(currentZCode\)/,
  'product identity lookup keys must not expose raw current Z code aliases'
);

assert.doesNotMatch(
  productIdentity,
  /keys\.add\(`psku:\$\{partnerSku\}`\)|keys\.add\(partnerSku\)/,
  'product identity lookup keys must not expose partnerSku aliases without store scope'
);

assert.match(
  productIdentity,
  /if \(storeCode && partnerSku\)/,
  'product identity lookup keys must require store scope for partnerSku'
);

assert.doesNotMatch(
  productIdentity,
  /currentZCode && nextZCode && currentZCode === nextZCode/,
  'stable identity comparison must not fall back to current Z code equality'
);

assert.doesNotMatch(
  productIdentity,
  /!currentStoreCode \|\| !nextStoreCode \|\| currentStoreCode === nextStoreCode/,
  'stable identity comparison must not treat missing store scope as a match'
);

assert.doesNotMatch(
  workspaceAccess,
  /getProductCurrentZCode\(currentValue\) === getProductCurrentZCode\(nextValue\)/,
  'product detail request reuse must not fall back to current Z code equality'
);

assert.match(
  mediaAndHistoryActions,
  /currentProductIdentityKey/,
  'history modal actions must receive the current stable product identity from the workspace'
);

assert.match(
  historyModalActions,
  /currentProductIdentityKey === getProductListRowIdentityKey\(record\)/,
  'history modal current-workbench reuse must match by stable product identity'
);

assert.doesNotMatch(
  historyModalActions,
  /currentProductSkuParent === record\.skuParent/,
  'history modal current-workbench reuse must not match by current Z code'
);

assert.match(
  localDeletion,
  /currentProductIdentityKey === getProductListRowIdentityKey\(record\)/,
  'local deletion must close the detail tab only when the stable product identity matches'
);

assert.doesNotMatch(
  localDeletion,
  /currentProductSkuParent === record\.skuParent/,
  'local deletion must not close the detail tab by current Z code'
);

assert.match(
  siteCompareModalActions,
  /partnerSku: record\.partnerSku/,
  'site compare modal must request workbench snapshots with system PSKU'
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
  /fetchProductVariantSpecs[\s\S]*fetchProductSpecDetail\(normalizedRequest\)/,
  'embedded product spec table fetch must use the by-psku detail API when partnerSku is present'
);

assert.match(
  api,
  /saveProductVariantSpec[\s\S]*saveProductSpecSource\([\s\S]*sourceType: 'ali1688'[\s\S]*selectProductSpecEffectiveSource/,
  'embedded Web product spec save must write the 1688 source and select it as effective when partnerSku is present'
);

assert.match(
  productSpecsPage,
  /sourceType === 'ali1688'[\s\S]*editable=\{Boolean\(editableSourceType\)\}/,
  'Web product specs page must only expose editing for the 1688 source'
);

assert.match(
  api,
  /\/api\/product-specs\/by-psku\/sources\/\$\{sourceType\}\$\{byPskuQuery\}/,
  'by-psku source save requests must carry storeCode and partnerSku query params'
);

assert.match(
  api,
  /\/api\/product-specs\/by-psku\/effective-source\$\{byPskuQuery\}/,
  'by-psku effective-source requests must carry storeCode and partnerSku query params'
);

assert.match(
  api,
  /if \(partnerSku\)[\s\S]*method: 'PUT'[\s\S]*return \(await response\.json\(\)\) as ProductVariantSpecDetailPayload/,
  'by-psku effective-source requests must use PUT'
);

assert.match(
  specTable,
  /!\(rowPartnerSku \|\| row\.variantId\)/,
  'embedded product spec table legacy fallback must allow variantId-only saves'
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

const originalFetch = globalThis.fetch;
const apiCalls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  apiCalls.push({ input, init });
  return new Response(JSON.stringify({ ready: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}) as typeof fetch;

try {
  await selectProductSpecEffectiveSource({
    storeCode: 'STR69486-NSA',
    partnerSku: 'SGGRB113',
    currentZCode: 'Z20152FFCAE5DA47AC88EZ',
    sourceId: 10
  });
  assert.equal(apiCalls[0]?.init?.method, 'PUT', 'by-psku effective-source must use PUT');
  assert.match(
    String(apiCalls[0]?.input ?? ''),
    /\/api\/product-specs\/by-psku\/effective-source\?storeCode=STR69486-NSA&partnerSku=SGGRB113/,
    'by-psku effective-source URL must include storeCode and partnerSku query params'
  );

  await selectProductSpecEffectiveSource({
    storeCode: 'STR69486-NSA',
    variantId: 123,
    currentZCode: 'Z20152FFCAE5DA47AC88EZ',
    sourceId: 11
  });
  assert.equal(apiCalls[1]?.init?.method, 'POST', 'legacy variant effective-source must continue to use POST');
  assert.match(
    String(apiCalls[1]?.input ?? ''),
    /\/api\/product-specs\/123\/effective-source/,
    'legacy variant effective-source URL must use variantId route'
  );
} finally {
  globalThis.fetch = originalFetch;
}
