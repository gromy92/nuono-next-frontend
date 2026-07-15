import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pageSource = readFileSync(new URL('./ProductListingPage.tsx', import.meta.url), 'utf8')
const taskStatusSource = readFileSync(new URL('./taskStatus.ts', import.meta.url), 'utf8')

assert(
  !pageSource.includes('点击上架会先自动保存草稿并提交 dry-run'),
  'listing page should not render the explanatory top alert'
)
assert(!pageSource.includes('message={`来源：'), 'listing page should not render the source prefill alert card')
assert(
  pageSource.includes('className="product-listing-page"'),
  'listing page should expose a stable page layout class'
)
assert(
  pageSource.includes('className="product-listing-page-actions"'),
  'listing actions should live in a stable top-right action bar'
)
assert(
  pageSource.indexOf('className="product-listing-page-actions"') < pageSource.indexOf('<ProductListingDetailEditor'),
  'listing actions should be rendered before the editor so they sit at the upper right'
)
assert(
  pageSource.includes('className="product-listing-real-run-steps-table"') &&
    pageSource.includes('tableLayout="fixed"'),
  'real-run step table should use fixed layout so long Noon references cannot cover other columns'
)
assert(
  pageSource.includes('className="product-listing-real-run-step-reference"') &&
    pageSource.includes("copyable={{ text: value") &&
    pageSource.includes("ellipsis={{ rows: 3"),
  'real-run external references should be wrapped, expandable, and copyable instead of rendered as raw long text'
)
assert(
  taskStatusSource.includes("barcode: 'Barcode'"),
  'listing validation summary should render barcode issues with a readable field label'
)
assert(
  pageSource.includes('sourcePrefillResolved && !sourcePrefill') &&
    pageSource.includes('请先选择要上架的商品') &&
    pageSource.includes('去人工选品') &&
    pageSource.includes('查看上架草稿') &&
    pageSource.includes('PRODUCT_MANUAL_SELECTION_PATH'),
  'listing direct entry should stop before rendering an unsaveable blank draft and offer closed-loop source actions'
)
