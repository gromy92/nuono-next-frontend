import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const modulePaths = [
  'ProductBasicContentPanel.tsx',
  'ProductBilingualContentEditor.tsx',
  'ProductContentFieldEditModal.tsx',
  'ProductContentTranslationSection.tsx',
  'ProductCompetitorContentSection.tsx',
  'ProductTitleKeywordPanel.tsx',
  'ProductTitleKeywordHighlights.tsx',
  'ProductContentSaveConfirmModal.tsx',
  'useProductContentFieldEditor.ts',
  'useProductTitleKeywordEditor.ts',
  'useProductTitleKeywordTranslations.ts',
  'useProductCompetitorContentEditor.ts',
  'productContentApi.ts',
  'productContentKeywordEditor.ts',
  'productKeywordChineseTranslation.ts'
];

for (const path of modulePaths) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const lineCount = source.split(/\r?\n/u).length - 1;
  assert(lineCount <= 300, `${path} should stay at or below 300 lines, got ${lineCount}`);
  assert(!source.includes('../product-management/'), `${path} should not depend on the management host`);
  assert(!source.includes('../product-listing/'), `${path} should not depend on the listing host`);
}

const removedPaths = [
  '../product-management/components/ProductBasicContentPanel.tsx',
  '../product-management/components/ProductBilingualContentEditor.tsx',
  '../product-management/productCompetitorContentApi.ts'
];
for (const path of removedPaths) {
  assert(!existsSync(fileURLToPath(new URL(path, import.meta.url))), `${path} should be removed after migration`);
}

const contentHost = readFileSync(
  new URL('../product-management/components/ProductContentTab.tsx', import.meta.url),
  'utf8'
);
assert(
  contentHost.includes("from '../../product-editor/ProductBasicContentPanel'"),
  'Product content host should consume the shared editor Interface'
);

const transport = readFileSync(new URL('./productContentApi.ts', import.meta.url), 'utf8');
assert(
  transport.includes('apiRequestJson') &&
    !transport.includes('product-management') &&
    !transport.includes('product-listing'),
  'Product content transport should be owned by the shared editor Module'
);
