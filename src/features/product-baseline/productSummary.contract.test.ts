import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildNoonProductUrl,
  buildProductSummarySurfaceFromListItem,
  mergeGalleryImageUrls,
  productSummaryPrimarySite,
  productSyncStatusMeta
} from './productSummary';

const row = {
  skuParent: 'Z123',
  currentZCode: 'Z123',
  partnerSku: 'PSKU-123',
  title: 'Paper Notes',
  imageUrl: 'https://f.nooncdn.com/p/pzsku/asset.jpg?width=800',
  galleryImages: [
    'https://f.nooncdn.com/p/pzsku/asset.jpg?width=200',
    'https://f.nooncdn.com/p/pzsku/second.jpg'
  ],
  maintenanceEnabled: false,
  siteLabels: ['SA'],
  liveStatuses: [],
  issueTags: []
};

const summary = buildProductSummarySurfaceFromListItem(row);
assert.equal(summary.partnerSku, 'PSKU-123');
assert.equal(summary.maintenanceEnabled, false);
assert.equal(summary.galleryImages.length, 2);
assert.equal(productSummaryPrimarySite(summary), 'SA');
assert.equal(
  buildNoonProductUrl(summary),
  'https://www.noon.com/saudi-en/paper-notes/Z123/p/'
);

assert.deepEqual(
  mergeGalleryImageUrls(
    '/original/pzsku/550e8400-e29b-41d4-a716-446655440000.jpg?width=100',
    '/pzsku/550e8400-e29b-41d4-a716-446655440000.jpg?width=800'
  ),
  ['/original/pzsku/550e8400-e29b-41d4-a716-446655440000.jpg?width=100']
);
assert.deepEqual(productSyncStatusMeta('conflict'), {
  label: '本地草稿',
  color: 'processing'
});

const source = (path: string) => readFileSync(resolve(path), 'utf8');
const productWorkspaceNavigation = source('src/features/product-management/hooks/useProductWorkspaceNavigation.tsx');
const profitCalculator = source('src/features/profit-calculator/ProfitCalculatorPage.tsx');

assert.match(productWorkspaceNavigation, /from ['"]\.\.\/\.\.\/product-baseline['"]/);
assert.doesNotMatch(productWorkspaceNavigation, /product-management\/utils/);
assert.match(profitCalculator, /from ['"]\.\.\/product-baseline['"]/);
assert.doesNotMatch(profitCalculator, /product-management\/(?:components|utils)/);
assert.equal(
  existsSync(resolve('src/features/product-management/components/ProductBaselineDisplay.tsx')),
  false
);
assert.equal(
  existsSync(resolve('src/features/product-management/utils/productSourceType.ts')),
  false
);
