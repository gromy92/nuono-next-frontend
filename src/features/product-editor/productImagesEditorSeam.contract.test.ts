import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const editorFiles = [
  'ProductImagesPanel.tsx',
  'ProductImageManagerDrawer.tsx',
  'ProductImageManagerList.tsx',
  'ProductImageAssetPreview.tsx',
  'ProductImageStatusTag.tsx',
  'productImageBrowserProcessing.ts',
  'productImageManagerState.ts',
  'useProductImageManagerController.ts',
  'uploadProductImageFiles.ts'
];

editorFiles.forEach((fileName) => {
  const source = readFileSync(`src/features/product-editor/${fileName}`, 'utf8');
  assert.doesNotMatch(
    source,
    /from ['"][^'"]*(?:product-management|product-listing)/,
    `${fileName} must not depend on either product editor host Module`
  );
  assert(
    source.split('\n').length <= 301,
    `${fileName} must stay at or below 300 physical lines`
  );
});

[
  'ProductImagesPanel.tsx',
  'ProductImageManagerDrawer.tsx',
  'ProductImageAssetPreview.tsx',
  'productImageManagerState.ts'
].forEach((fileName) => {
  assert.equal(
    existsSync(`src/features/product-management/components/${fileName}`),
    false,
    `product-management must not retain the shared ${fileName} Implementation`
  );
});

const panelSource = readFileSync('src/features/product-editor/ProductImagesPanel.tsx', 'utf8');
const contentTabSource = readFileSync(
  'src/features/product-management/components/ProductContentTab.tsx',
  'utf8'
);
const assetApiSource = readFileSync(
  'src/features/product-image-profile/productImageAssetApi.ts',
  'utf8'
);

assert.match(
  panelSource,
  /product-image-profile\/productImageAssetApi/,
  'the editor must use the product image asset transport Seam'
);
assert.match(
  contentTabSource,
  /product-editor\/ProductImagesPanel/,
  'the current Content host must consume the image editor through product-editor'
);
assert.doesNotMatch(
  assetApiSource,
  /product-management|product-listing/,
  'the product image asset transport must not depend on either editor host Module'
);
