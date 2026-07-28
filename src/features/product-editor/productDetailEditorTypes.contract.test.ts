import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const interfacePath = 'src/features/product-editor/productDetailEditorTypes.ts';
const oldInterfacePath = 'src/features/product-management/components/ProductDetailOfficialTabs.types.ts';
const interfaceSource = readFileSync(interfacePath, 'utf8');
const officialTabsSource = readFileSync(
  'src/features/product-management/components/ProductDetailOfficialTabs.tsx',
  'utf8'
);
const panelSource = readFileSync(
  'src/features/product-management/components/ProductDetailOfficialTabsPanel.tsx',
  'utf8'
);
const listingEditorSource = readFileSync(
  'src/features/product-listing/ProductListingDetailEditor.tsx',
  'utf8'
);

assert.equal(existsSync(oldInterfacePath), false, 'product-management must not retain the shared editor Interface');
assert.doesNotMatch(
  interfaceSource,
  /product-management|product-listing|ColumnsType|ProductListRowPayload|ProductWorkbenchActionOptions/,
  'the shared editor Interface must not depend on either host Module or deleted host-only types'
);

[
  'ProductDetailEditorHostProps',
  'ProductOfferEditorProps',
  'ProductContentEditorProps',
  'ProductSizesEditorProps',
  'ProductInsightsEditorProps'
].forEach((typeName) => {
  assert.match(interfaceSource, new RegExp(`export type ${typeName}`), `${typeName} must define a narrow editor Interface`);
});

[
  ['ProductContentTab.tsx', 'ProductContentEditorProps'],
  ['ProductSizesTab.tsx', 'ProductSizesEditorProps'],
  ['ProductInsightsTab.tsx', 'ProductInsightsEditorProps']
].forEach(([fileName, typeName]) => {
  const source = readFileSync(`src/features/product-management/components/${fileName}`, 'utf8');
  assert.match(source, new RegExp(`props: ${typeName}`), `${fileName} must consume its narrow Interface`);
  assert.doesNotMatch(source, /ProductDetailOfficialTabsProps/, `${fileName} must not consume the aggregate Interface`);
});

const offerTabSource = readFileSync('src/features/product-editor/ProductOfferTab.tsx', 'utf8');
assert.match(offerTabSource, /props: ProductOfferEditorProps/, 'Offer editor must consume its narrow Interface');
assert.doesNotMatch(offerTabSource, /product-management|product-listing/, 'Offer editor must not depend on either host Module');

assert.match(
  officialTabsSource,
  /product-editor\/productDetailEditorTypes/,
  'the tabs host must consume the product-editor Interface directly'
);
assert.match(
  officialTabsSource,
  /props: ProductDetailEditorHostProps/,
  'the tabs host must compose the narrow editor Interfaces'
);

const deadProps = [
  'productActionSubmitting',
  'activeSiteDirty',
  'activeSiteOfferCode',
  'siteOfferColumns',
  'productPlatformSignals',
  'productPlatformRejectionReasons',
  'productPlatformAffectingAttributes',
  'productRequiredAttributeCount',
  'productFilledRequiredAttributeCount',
  'productGroupMembers',
  'productCandidateGroups',
  'productListSourceItems',
  'previewProductAction',
  'setActiveSiteOfferCode',
  'addProductVariant',
  'updateProductAxes'
];

deadProps.forEach((propName) => {
  [interfaceSource, panelSource, listingEditorSource].forEach((source) => {
    assert.doesNotMatch(source, new RegExp(`\\b${propName}\\b`), `${propName} must not remain in the editor boundary`);
  });
});
