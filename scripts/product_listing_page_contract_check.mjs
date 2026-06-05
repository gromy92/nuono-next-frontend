import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname

function read(path) {
  const filePath = join(root, path)
  if (!existsSync(filePath)) {
    throw new Error(`Expected file to exist: ${path}`)
  }
  return readFileSync(filePath, 'utf8')
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`${label} should include: ${needle}`)
  }
}

function assertNotIncludes(source, needle, label) {
  if (source.includes(needle)) {
    throw new Error(`${label} should not include: ${needle}`)
  }
}

function sliceBetween(source, startNeedle, endNeedle, label) {
  const start = source.indexOf(startNeedle)
  if (start < 0) {
    throw new Error(`${label} missing start marker: ${startNeedle}`)
  }
  const end = source.indexOf(endNeedle, start + startNeedle.length)
  if (end < 0) {
    throw new Error(`${label} missing end marker: ${endNeedle}`)
  }
  return source.slice(start, end)
}

const page = read('src/features/product-listing/ProductListingPage.tsx')
const detailEditor = read('src/features/product-listing/ProductListingDetailEditor.tsx')
const adapter = read('src/features/product-listing/productDetailAdapter.ts')
const api = read('src/features/product-listing/api.ts')
const types = read('src/features/product-listing/types.ts')
const officialTabsTypes = read('src/features/product-management/components/ProductDetailOfficialTabs.types.ts')
const offerTab = read('src/features/product-management/components/ProductOfferTab.tsx')
const metadataValues = sliceBetween(
  adapter,
  'export function productListingEditorDraftToMetadataValues',
  'export function productListingEditorDraftToPayload',
  'ProductListingMetadataFormValues'
)

assertIncludes(page, 'name="storeCode" hidden', 'ProductListingPage hidden store context')
assertIncludes(page, 'name="sourceType" hidden', 'ProductListingPage hidden source context')
assertIncludes(page, 'name="sourceRefId" hidden', 'ProductListingPage hidden source context')
assertNotIncludes(page, '<Title', 'ProductListingPage top header')
assertNotIncludes(page, '未保存草稿', 'ProductListingPage top header')
assertNotIncludes(page, 'Card title="新增 PSKU"', 'ProductListingPage standalone PSKU card')
assertNotIncludes(page, 'label="新增 PSKU"', 'ProductListingPage standalone PSKU field')
assertNotIncludes(page, 'name="psku"', 'ProductListingPage standalone PSKU field')

assertIncludes(detailEditor, 'offerHeaderExtra={listingPskuEditor}', 'ProductListingDetailEditor PSKU offer slot')
assertIncludes(detailEditor, 'aria-label="新增 PSKU"', 'ProductListingDetailEditor PSKU offer input')
assertIncludes(
  detailEditor,
  'patchDraft({ psku: event.target.value })',
  'ProductListingDetailEditor PSKU offer input'
)
assertIncludes(detailEditor, 'defaultActiveKey="offer"', 'ProductListingDetailEditor defaults to Offer')
assertNotIncludes(detailEditor, 'ProductDetailSummaryBar', 'ProductListingDetailEditor screenshot summary')
assertIncludes(officialTabsTypes, 'offerHeaderExtra?: ReactNode', 'ProductDetailOfficialTabs offer extra slot')
assertIncludes(offerTab, 'offerHeaderExtra', 'ProductOfferTab offer extra slot')

for (const label of [
  '店铺编码',
  'Fulltype ID',
  '品牌编码',
  '采购单 ID',
  '采购价',
  '供应凭证',
  '供应凭证 ID',
  'FBP',
  '仓库编码',
  '仓库 ID',
  '数量'
]) {
  assertNotIncludes(page, label, 'ProductListingPage metadata form')
}

for (const implementationDetail of [
  'fetchProductListingWarehouses',
  'ProductListingWarehouseView',
  'SUPPLY_EVIDENCE_OPTIONS',
  'warehouseOptions',
  'handleWarehouseChange',
  'loadingWarehouses'
]) {
  assertNotIncludes(page, implementationDetail, 'ProductListingPage metadata form')
  assertNotIncludes(api, implementationDetail, 'Product listing API')
}

assertIncludes(
  adapter,
  "export type ProductListingMetadataFormValues = Pick<\n  ProductListingEditorDraft,\n  | 'storeCode'\n  | 'sourceType'\n  | 'sourceRefId'\n  | 'psku'\n>",
  'ProductListingMetadataFormValues'
)
for (const metadataField of [
  'idProductFullType: draft.idProductFullType',
  'productBrandCode: draft.productBrandCode',
  'purchasePrice: draft.purchasePrice',
  'supplyEvidenceType: draft.supplyEvidenceType',
  'supplyEvidenceRefId: draft.supplyEvidenceRefId',
  'optionalPurchaseOrderId: draft.optionalPurchaseOrderId',
  'warehouseId: draft.warehouseId',
  'warehouseCode: draft.warehouseCode',
  'quantity: draft.quantity'
]) {
  assertNotIncludes(metadataValues, metadataField, 'ProductListingMetadataFormValues')
}

assertNotIncludes(types, 'ProductListingWarehouseView', 'Product listing public types')

console.log('product listing page contract check passed')
