import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

function readSource(relativePath) {
  return readFileSync(path.resolve(root, relativePath), 'utf8');
}

function assertIncludes(source, expected, context) {
  assert(source.includes(expected), `${context} must include ${expected}`);
}

function assertExcludes(source, unexpected, context) {
  assert(!source.includes(unexpected), `${context} must not include ${unexpected}`);
}

const offerMeta = readSource('src/features/product-management/components/ProductOfferMetaSection.tsx');
const draftMutations = readSource('src/features/product-management/hooks/useProductDraftMutations.ts');
const sizesTab = readSource('src/features/product-management/components/ProductSizesTab.tsx');
const sizeColumns = readSource('src/features/product-management/columns/productSizeColumns.tsx');
const officialTabs = readSource('src/features/product-management/components/ProductDetailOfficialTabs.tsx');
const writeCoverage = readSource('src/features/product-management/utils/writeCoverage.ts');

assertIncludes(offerMeta, 'LOCAL_BARCODE_ATTRIBUTE_CODE', 'Barcode fallback attribute code');
assertIncludes(offerMeta, '!Boolean(item.localOnly)', 'Official Barcode attribute detection');
assertIncludes(offerMeta, "updateProductAttributeField(barcodeAttributeCode, 'commonValue'", 'Barcode draft attribute update');
assertExcludes(offerMeta, 'disabled={!canAddBarcode}', 'Barcode local draft input/button');
assertIncludes(draftMutations, 'didUpdateAttribute', 'Draft attribute upsert');
assertIncludes(draftMutations, 'nextAttributes.push', 'Draft attribute upsert');
assertIncludes(draftMutations, 'localOnly: normalizedCode === LOCAL_BARCODE_ATTRIBUTE_CODE', 'Local Barcode draft marker');

assertIncludes(writeCoverage, 'isReadonlyNoonAttributeCode', 'Barcode publish blocker');
assertIncludes(writeCoverage, "normalized.includes('barcode')", 'Barcode publish blocker');
assertIncludes(writeCoverage, '尺码新增、删除或 Child SKU 变更当前没有 Noon 写回适配', 'Child SKU publish blocker');

assertIncludes(sizesTab, 'ProductDetailSection title="Sizes"', 'Sizes tab');
assertExcludes(sizesTab, 'addProductVariant', 'Sizes structure create action');
assertIncludes(sizeColumns, 'disabled', 'Sizes delete action');
assertIncludes(officialTabs, 'label: <ProductDetailTabLabel title="Sizes" />', 'Sizes tab count-free label');

console.log('product Barcode/Sizes contract check passed');
