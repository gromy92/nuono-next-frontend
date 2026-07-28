import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const editorFiles = [
  'ProductOfferTab.tsx',
  'ProductOfferMetaSection.tsx',
  'ProductOfferPricingSection.tsx',
  'ProductOfferVisibilitySection.tsx',
  'ProductDetailSection.tsx',
  'productOfferPricingPresentation.ts',
  'productOfferValues.ts'
];

editorFiles.forEach((fileName) => {
  const source = readFileSync(`src/features/product-editor/${fileName}`, 'utf8');
  assert.doesNotMatch(
    source,
    /product-management|product-listing/,
    `${fileName} must not depend on either product editor host Module`
  );
});

[
  'ProductOfferTab.tsx',
  'ProductOfferMetaSection.tsx',
  'ProductOfferPricingSection.tsx',
  'ProductOfferVisibilitySection.tsx',
  'ProductDetailSection.tsx'
].forEach((fileName) => {
  assert.equal(
    existsSync(`src/features/product-management/components/${fileName}`),
    false,
    `product-management must not retain the shared ${fileName} Implementation`
  );
});

const interfaceSource = readFileSync('src/features/product-editor/productDetailEditorTypes.ts', 'utf8');
const offerTabSource = readFileSync('src/features/product-editor/ProductOfferTab.tsx', 'utf8');
const managementPanelSource = readFileSync(
  'src/features/product-management/components/ProductDetailOfficialTabsPanel.tsx',
  'utf8'
);
const listingEditorSource = readFileSync(
  'src/features/product-listing/ProductListingDetailEditor.tsx',
  'utf8'
);

assert.match(interfaceSource, /offerStockSection\?: ReactNode/, 'stock must cross the editor Seam as a host slot');
assert.doesNotMatch(
  interfaceSource,
  /productWarehouseStockRows|hideOfferStockSection/,
  'the shared Offer Interface must not expose management-owned inventory data'
);
assert.match(offerTabSource, /\{offerStockSection \? \(/, 'Offer editor must render the optional stock slot');
assert.match(
  managementPanelSource,
  /offerStockSection=\{\s*<ProductOfferStockSection/,
  'product-management must provide its stock Adapter'
);
assert.doesNotMatch(
  listingEditorSource,
  /offerStockSection=|productWarehouseStockRows|hideOfferStockSection/,
  'product-listing must not provide unsupported stock controls'
);
