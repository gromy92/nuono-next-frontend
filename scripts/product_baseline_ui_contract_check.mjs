import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = process.cwd();
const file = (path) => resolve(rootDir, path);
const read = (path) => readFileSync(file(path), 'utf8');

const baselineComponentPath = 'src/features/product-management/components/ProductBaselineDisplay.tsx';
assert.equal(
  existsSync(file(baselineComponentPath)),
  true,
  'ProductBaselineDisplay component file should exist'
);

const baselineComponent = read(baselineComponentPath);
for (const exportName of ['ProductImageThumb', 'ProductBaselineListCell', 'ProductBaselineHeader']) {
  assert.match(
    baselineComponent,
    new RegExp(`export function ${exportName}\\b`),
    `${exportName} should be exported from ProductBaselineDisplay`
  );
}
assert.match(
  baselineComponent,
  /fit\s*=\s*['"]contain['"]/,
  'ProductImageThumb should default to contain so product images keep their original ratio'
);
assert.match(
  baselineComponent,
  /objectFit:\s*fit/,
  'ProductImageThumb should apply objectFit from the fit prop'
);

const productListCells = read('src/features/product-management/components/ProductListIdentityCells.tsx');
assert.match(
  productListCells,
  /ProductBaselineListCell/,
  'Product list identity cell should render through ProductBaselineListCell'
);
assert.doesNotMatch(
  productListCells,
  /function ProductListThumbnail\b/,
  'Product list should not keep a local thumbnail implementation after extracting the baseline component'
);
assert.doesNotMatch(
  productListCells,
  /objectFit:\s*['"]cover['"]/,
  'Product list thumbnails should not crop product images'
);

const detailSummaryBar = read('src/features/product-management/components/ProductDetailSummaryBar.tsx');
assert.match(
  detailSummaryBar,
  /ProductBaselineHeader/,
  'Product detail summary bar should render through ProductBaselineHeader'
);
assert.match(detailSummaryBar, /summary\??:/, 'ProductDetailSummaryBar should accept a summary prop');
assert.doesNotMatch(
  detailSummaryBar,
  /currentProductSummarySurface/,
  'ProductDetailSummaryBar should not depend on the old currentProductSummarySurface prop name'
);
assert.doesNotMatch(
  detailSummaryBar,
  /productSnapshotView\?\.identity/,
  'ProductDetailSummaryBar should not read product identity fields directly from productSnapshotView'
);

const detailSummaryPanel = read('src/features/product-management/components/ProductDetailSummaryPanel.tsx');
assert.match(
  detailSummaryPanel,
  /summary=\{productDetailSummarySurface\}/,
  'ProductDetailSummaryPanel should pass the derived product baseline summary into ProductDetailSummaryBar'
);

const detailPreviewPanel = read('src/features/product-management/components/ProductDetailPreviewPanel.tsx');
assert.match(
  detailPreviewPanel,
  /ProductImageThumb/,
  'Product detail preview should use the shared product image component'
);
assert.doesNotMatch(
  detailPreviewPanel,
  /objectFit:\s*['"]cover['"]/,
  'Product detail preview should not crop product images'
);

const summaryBlocks = read('src/features/product-management/components/ProductSummaryBlocks.tsx');
assert.match(
  summaryBlocks,
  /ProductImageThumb/,
  'Product summary entries should use the shared product image component'
);
assert.doesNotMatch(
  summaryBlocks,
  /objectFit:\s*['"]cover['"]/,
  'Product summary entries should not crop product images'
);

const productInsightsTab = read('src/features/product-management/components/ProductInsightsTab.tsx');
assert.match(
  productInsightsTab,
  /ProductImageThumb/,
  'Product insights should use the shared product image component'
);
assert.doesNotMatch(
  productInsightsTab,
  /\bAvatar\b/,
  'Product insights should not use Avatar for product images because it crops rectangular product photos'
);

console.log('product baseline UI contract passed');
