import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  formatProductValue,
  productTextInputValue
} from '../product-domain/productValueFormatting';

const editorFiles = [
  'ProductDetailOfficialTabs.tsx',
  'ProductContentTab.tsx',
  'ProductSizesTab.tsx',
  'ProductInsightsTab.tsx',
  'productSizeColumns.tsx'
];

for (const fileName of editorFiles) {
  const source = readFileSync(`src/features/product-editor/${fileName}`, 'utf8');
  assert(
    source.split(/\r?\n/u).length <= 301,
    `${fileName} must stay within the 300-line source-size policy`
  );
  assert.doesNotMatch(
    source,
    /from ['"][^'"]*(?:product-management|product-listing)/,
    `${fileName} must not depend on either product editor host Module`
  );
}

[
  'ProductDetailOfficialTabs.tsx',
  'ProductContentTab.tsx',
  'ProductSizesTab.tsx',
  'ProductInsightsTab.tsx'
].forEach((fileName) => {
  assert.equal(
    existsSync(`src/features/product-management/components/${fileName}`),
    false,
    `product-management must not retain shared editor Implementation ${fileName}`
  );
});
assert.equal(
  existsSync('src/features/product-management/columns/productSizeColumns.tsx'),
  false,
  'product-management must not retain the shared size-column Implementation'
);

const managementAdapter = readFileSync(
  'src/features/product-management/components/ProductDetailOfficialTabsPanel.tsx',
  'utf8'
);
const listingAdapter = readFileSync(
  'src/features/product-listing/ProductListingDetailEditor.tsx',
  'utf8'
);
const specsPage = readFileSync('src/features/product-specs/ProductSpecsPage.tsx', 'utf8');

assert.match(
  managementAdapter,
  /product-editor\/ProductDetailOfficialTabs/,
  'management must consume the shared editor through its host Adapter'
);
assert.match(
  listingAdapter,
  /product-editor\/ProductDetailOfficialTabs/,
  'listing must consume the same shared editor Interface'
);
assert.doesNotMatch(
  listingAdapter,
  /product-management/,
  'listing must not depend on product-management internals after editor migration'
);
assert.match(
  specsPage,
  /product-domain\/productValueFormatting/,
  'product specs must consume shared product formatting without reaching into management'
);
assert.doesNotMatch(specsPage, /product-management/, 'product specs must not depend on product-management');

assert.equal(formatProductValue(null), '-');
assert.equal(formatProductValue(['A', 2]), 'A / 2');
assert.equal(formatProductValue({ code: 'A' }), '{"code":"A"}');
assert.equal(productTextInputValue(undefined), '');
assert.equal(productTextInputValue(42), '42');
