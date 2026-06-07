import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = process.cwd();
const file = (path) => resolve(rootDir, path);
const read = (path) => readFileSync(file(path), 'utf8');

const sharedBaselinePath = 'src/features/product-baseline/ProductBaselineDisplay.tsx';
assert.equal(
  existsSync(file(sharedBaselinePath)),
  true,
  'Shared product baseline display module should exist outside product-management'
);

const sharedBaselineComponent = read(sharedBaselinePath);
for (const exportName of ['ProductImageThumb', 'ProductBaselineIdentity', 'ProductDimensionOptionLabel']) {
  assert.match(
    sharedBaselineComponent,
    new RegExp(`export function ${exportName}\\b`),
    `${exportName} should be exported from the shared product baseline display module`
  );
}
assert.match(
  sharedBaselineComponent,
  /aspectRatio:\s*['"]3\s*\/\s*4['"]/,
  'Shared ProductImageThumb should use a vertical 3:4 frame as the product-image default'
);
assert.match(
  sharedBaselineComponent,
  /Math\.max\(visibleSrc\s*\?\s*1\s*:\s*0,\s*imageCount\)/,
  'Shared ProductImageThumb should show at least a 1-image badge when only a lead image is available'
);
assert.match(
  sharedBaselineComponent,
  /objectFit:\s*fit/,
  'Shared ProductImageThumb should drive image fitting through the shared fit prop'
);
assert.match(
  sharedBaselineComponent,
  /fit\s*=\s*['"]cover['"]/,
  'Shared ProductImageThumb should fill the 3:4 thumbnail frame by default'
);
assert.match(
  sharedBaselineComponent,
  /zIndex:\s*1/,
  'Shared ProductImageThumb count badge should stay visible over product images'
);
assert.match(
  sharedBaselineComponent,
  /showImage\s*=\s*true/,
  'Shared ProductBaselineIdentity should support product identity displays that do not have image data'
);
assert.doesNotMatch(
  sharedBaselineComponent,
  /\$\{code\.label[^`]*\$\{code\.value/,
  'Shared ProductBaselineIdentity should render ReactNode code values directly instead of stringifying them'
);
assert.match(
  sharedBaselineComponent,
  /typeof visibleTitle === ['"]string['"]/,
  'Shared ProductBaselineIdentity should not stringify ReactNode titles into image alt text'
);

const baselineComponentPath = 'src/features/product-management/components/ProductBaselineDisplay.tsx';
assert.equal(
  existsSync(file(baselineComponentPath)),
  true,
  'ProductBaselineDisplay component file should exist'
);

const baselineComponent = read(baselineComponentPath);
for (const exportName of ['ProductBaselineListCell', 'ProductBaselineHeader']) {
  assert.match(
    baselineComponent,
    new RegExp(`export function ${exportName}\\b`),
    `${exportName} should be exported from ProductBaselineDisplay`
  );
}
assert.match(
  baselineComponent,
  /from ['"]\.\.\/\.\.\/product-baseline['"]/,
  'Product management baseline display should consume the shared product baseline module'
);
assert.doesNotMatch(
  baselineComponent,
  /height\s*=\s*84/,
  'ProductImageThumb should not default to a square 84x84 thumbnail'
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
  'Product detail preview should not keep a local cover-fit override outside the shared image component'
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
  'Product summary entries should not keep a local cover-fit override outside the shared image component'
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

const baselineThumbnailConsumers = [
  ['src/features/product-management/groups/ProductGroupListPane.tsx', 'Product group list member thumbnails'],
  ['src/features/product-management/groups/ProductUngroupedPanel.tsx', 'Ungrouped product thumbnails'],
  ['src/features/product-management/groups/ProductGroupAddProductsDrawer.tsx', 'Add-to-group candidate thumbnails'],
  ['src/features/product-management/groups/ProductGroupMemberList.tsx', 'Product group member thumbnails'],
  ['src/features/product-management/groups/ProductGroupMemberEditModal.tsx', 'Product group edit summary thumbnail'],
  ['src/features/product-management/groups/ProductGroupUnlinkConfirmModal.tsx', 'Product group unlink confirmation thumbnail'],
  ['src/features/product-management/components/ProductVariantSpecModal.tsx', 'Product variant spec header thumbnail'],
  ['src/features/product-management/components/ProductSiteCompareModal.tsx', 'Product site compare header thumbnail'],
  ['src/features/product-management/components/ProductHistoryModal.helpers.tsx', 'Product history header thumbnail']
];

for (const [path, label] of baselineThumbnailConsumers) {
  const source = read(path);
  assert.match(source, /ProductImageThumb/, `${label} should use the shared product image component`);
}

const profitCalculatorPage = read('src/features/profit-calculator/ProfitCalculatorPage.tsx');
assert.doesNotMatch(
  profitCalculatorPage,
  /function ProfitProductThumbnail\b/,
  'Profit calculator should not keep a local thumbnail implementation after extracting the baseline component'
);
assert.match(
  profitCalculatorPage,
  /from ['"]\.\.\/product-baseline['"]/,
  'Profit calculator product identity should use the shared product baseline module'
);
assert.doesNotMatch(
  profitCalculatorPage,
  /objectFit:\s*['"]cover['"]/,
  'Profit calculator thumbnails should not keep a local cover-fit override outside the shared image component'
);

const productSpecsPage = read('src/features/product-specs/ProductSpecsPage.tsx');
assert.match(
  productSpecsPage,
  /from ['"]\.\.\/product-baseline['"]/,
  'Product specs page should use the shared product baseline module'
);
assert.doesNotMatch(
  productSpecsPage,
  /function ProductThumb\b/,
  'Product specs page should not keep a local product thumbnail implementation'
);
assert.doesNotMatch(
  productSpecsPage,
  /objectFit:\s*['"]cover['"]/,
  'Product specs page product thumbnails should not keep a local cover-fit override outside the shared image component'
);

const salesAnalyticsPage = read('src/features/sales-analytics/SalesAnalyticsPage.tsx');
assert.match(
  salesAnalyticsPage,
  /from ['"]\.\.\/product-baseline['"]/,
  'Sales analytics product display should use the shared product baseline module'
);
assert.doesNotMatch(
  salesAnalyticsPage,
  /function ProductImage\b/,
  'Sales analytics should not keep a local product image implementation'
);
assert.doesNotMatch(
  salesAnalyticsPage,
  /objectFit:\s*['"]cover['"]/,
  'Sales analytics product thumbnails should not keep a local cover-fit override outside the shared image component'
);

const productGalleryActions = read('src/features/product-management/hooks/useProductGalleryActions.ts');
assert.match(
  productGalleryActions,
  /applyProductListSummary\(payload\.listSummary\)/,
  'Product list gallery hydration should apply list summaries so image counts update after detail fetch'
);
assert.doesNotMatch(
  productGalleryActions,
  /openProductGallery\(galleryImages[\s\S]*?if \(galleryImages\.length > 1/,
  'Product list gallery should not open a single-image gallery before attempting detail hydration'
);

const operationConfigVersionLibrary = read('src/features/operations-config/OperationConfigVersionLibraryPage.tsx');
assert.match(
  operationConfigVersionLibrary,
  /ProductDimensionOptionLabel/,
  'Operations config product dimension picker should use the shared dimension option label component'
);

const salesForecastPage = read('src/features/sales-forecast/SalesForecastPage.tsx');
assert.match(
  salesForecastPage,
  /from ['"]\.\.\/product-baseline['"]/,
  'Sales forecast product identity displays should use the shared product baseline module'
);
assert.match(
  salesForecastPage,
  /showImage=\{false\}/,
  'Sales forecast should use image-less product baseline identity because the API does not provide product images'
);

const productListMutations = read('src/features/product-management/hooks/useProductListMutations.ts');
assert.match(
  productListMutations,
  /function summaryAppliesToListStore\b/,
  'Product list summary mutations should guard by the current list store'
);
assert.match(
  productListMutations,
  /function summaryAppliesToListItem\b/,
  'Product list summary mutations should guard by the row reference store'
);
assert.match(
  productListMutations,
  /summaryAppliesToListStore\(summary,\s*currentValue\.data\.storeCode\)/,
  'Product list summary mutations should skip summaries from another store'
);
assert.match(
  productListMutations,
  /summaryAppliesToListItem\(item,\s*summary\)/,
  'Product list summary mutations should not merge a row using skuParent alone'
);
assert.doesNotMatch(
  productListMutations,
  /if\s*\(\s*item\.skuParent\s*!==\s*summary\.skuParent\s*\)/,
  'Product list summary mutations should not match rows only by skuParent'
);

console.log('product baseline UI contract passed');
