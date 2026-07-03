import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const featureDir = path.resolve('src/features/product-logistics-costs')
const pageSource = fs.readFileSync(path.join(featureDir, 'ProductLogisticsCostsPage.tsx'), 'utf8')
const pageCss = fs.readFileSync(path.join(featureDir, 'ProductLogisticsCostsPage.css'), 'utf8')

assert(
  pageSource.includes('/api/product-logistics-costs/current/categories/batch'),
  'batch category assignment should call the backend batch category endpoint'
)

assert(
  pageSource.includes('rowSelection=') && pageSource.includes('selectedRowKeys'),
  'product logistics cost table should support selecting rows for batch category assignment'
)

assert(
  pageSource.includes('function canAssignCategory') &&
    pageSource.includes('selectedRows.filter(canAssignCategory)') &&
    pageSource.includes('disabled: !canAssignCategory(row)') &&
    !pageSource.includes('disabled: !hasCostData(row)') &&
    !pageSource.includes('请选择已有报价数据的商品'),
  'batch category assignment should allow selecting missing-cost products so the route category rate card can create current quotes'
)

assert(
  pageSource.includes('failedImageUrls') && pageSource.includes('onError'),
  'product logistics cost product thumbnails should fall back when image URLs fail to load'
)

assert(
  pageSource.includes('function isBatchHistoryCost') && pageSource.includes('row.batchReferenceNo'),
  'product logistics cost history list should only show batch-backed history quotes'
)

assert(
  pageSource.includes('categoryFilterOptionsFromRows') &&
    pageSource.includes('cargoCategoryCode') &&
    pageSource.includes('aria-label="类别"'),
  'product logistics cost page should expose a route-linked category filter from loaded cost rows'
)

assert(
  pageSource.includes('/api/product-logistics-costs/rate-cards') &&
    pageSource.includes('rateCardOptionsFromRows') &&
    pageSource.includes('rateCards'),
  'product logistics cost page should load maintainable route category rate cards for category filter options'
)

assert(
  pageSource.includes('/api/product-logistics-costs/rate-cards/manual') &&
    pageSource.includes('维护报价') &&
    pageSource.includes('rateCardModalOpen'),
  'product logistics cost page should expose route category current quote maintenance'
)

assert(
  pageSource.includes('syncSelectedProductsAfterRateCardSave') &&
    pageSource.includes('assignableSelectedRows.length > 0') &&
    pageSource.includes('已保存线路报价，并更新') &&
    pageSource.includes('firstFormValidationMessage(error)'),
  'route category quote save should visibly handle validation and sync selected products when rows are selected'
)

assert(
  pageSource.includes('批量设类别') && pageSource.includes('batchCategoryCode'),
  'product logistics cost page should expose a batch category selector and submit action'
)

const rateCardModalSource = pageSource.slice(
  pageSource.indexOf('title="维护线路类别报价"'),
  pageSource.indexOf('title="维护当前报价"')
)
assert(
  rateCardModalSource &&
    !rateCardModalSource.includes('label="备注"') &&
    !rateCardModalSource.includes('name="remark"'),
  'route category quote modal used for batch sync should not ask for remark'
)

const manualQuoteModalSource = pageSource.slice(pageSource.indexOf('title="维护当前报价"'))
assert(
  manualQuoteModalSource.includes('handleManualQuoteCategoryChange') &&
    manualQuoteModalSource.indexOf('label="类别"') > 0 &&
    manualQuoteModalSource.indexOf('label="类别"') < manualQuoteModalSource.indexOf('label="当前报价"') &&
    manualQuoteModalSource.includes("rules={[{ required: true, message: '请选择类别' }]}") &&
    manualQuoteModalSource.includes('onChange={handleManualQuoteCategoryChange}'),
  'manual current quote modal should choose a route category first and use the same category selector behavior as batch maintenance'
)

assert(
  pageCss.includes('.product-logistics-costs-page__batch-actions'),
  'batch category controls should have a dedicated compact layout class'
)
