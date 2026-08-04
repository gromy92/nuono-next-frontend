import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const featureDir = path.resolve('src/features/product-logistics-costs')
const pageSource = fs
  .readdirSync(featureDir)
  .filter((fileName) => /\.(ts|tsx)$/.test(fileName) && !fileName.endsWith('.test.ts'))
  .sort()
  .map((fileName) => fs.readFileSync(path.join(featureDir, fileName), 'utf8'))
  .join('\n')
const pageCss = ['ProductLogisticsCostsFilters.css', 'ProductLogisticsCostsPage.css']
  .map((fileName) => fs.readFileSync(path.join(featureDir, fileName), 'utf8'))
  .join('\n')

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
  pageSource.includes('function groupHistoryByPartnerSku') && pageSource.includes('row.batchReferenceNo'),
  'product logistics cost history list should only show batch-backed history quotes'
)

assert(
  pageSource.includes('categoryFilterOptionsFromRows') &&
    pageSource.includes('cargoCategoryCode') &&
    pageSource.includes('aria-label="类别筛选"'),
  'product logistics cost page should expose a route-linked category filter from loaded cost rows'
)

assert(
  pageSource.includes('/api/product-logistics-costs/rate-cards') &&
    pageSource.includes('rateCardOptionsFromRows') &&
    pageSource.includes('rateCards'),
  'product logistics cost page should load maintainable route category rate cards for category filter options'
)

assert(
  pageSource.includes('availableRateCards') &&
    pageSource.includes('forwarderOptionsFromRateCards') &&
    pageSource.includes('options={data.forwarderOptions}') &&
    !pageSource.includes('export const FORWARDER_OPTIONS'),
  'forwarder and transport options should come from backend rate cards instead of a fixed frontend allowlist'
)

assert(
  pageSource.includes('/api/product-logistics-costs/rate-cards/manual') &&
    pageSource.includes('维护报价') &&
    pageSource.includes('rateCardModalOpen'),
  'product logistics cost page should expose route category current quote maintenance'
)

assert(
  pageSource.includes('syncSelectedProducts') &&
    pageSource.includes('assignableSelectedRows.length') &&
    pageSource.includes('已保存线路报价，并更新') &&
    pageSource.includes('firstFormValidationMessage(error)'),
  'route category quote save should visibly handle validation and sync selected products when rows are selected'
)

const submitRateCardSource = pageSource.slice(
  pageSource.indexOf('const submitRateCard = async () =>'),
  pageSource.indexOf('return {', pageSource.indexOf('const submitRateCard = async () =>'))
)
assert(
  submitRateCardSource.includes('await data.load(data.appliedFilters)') &&
    submitRateCardSource.includes('setRateCardListModalOpen(true)') &&
    submitRateCardSource.indexOf('await data.load(data.appliedFilters)') <
      submitRateCardSource.indexOf('setRateCardListModalOpen(true)'),
  'route category quote save should refresh data and open the current rate card table as visible readback'
)

assert(
  pageSource.includes('批量设类别') && pageSource.includes('batchCategoryCode'),
  'product logistics cost page should expose a batch category selector and submit action'
)

assert(
  !pageSource.includes('product-logistics-costs-page__store') &&
    !pageSource.includes("data.currentStore?.projectName || data.currentStore?.projectCode || '当前店铺'"),
  'product logistics cost toolbar should not display the current store name or code'
)

assert(
  pageSource.includes('现有报价表') &&
    pageSource.includes('openRateCardListModal') &&
    pageSource.includes('rateCardListModalOpen') &&
    pageSource.includes('fetchRateCards(nextFilters)') &&
    pageSource.includes('dataSource={data.rateCards}') &&
    pageSource.includes('当前查询线路共') &&
    pageSource.includes('当前报价（RMB）') &&
    pageSource.includes('当前线路暂无报价'),
  'product logistics cost page should show a read-only rate card table for the selected forwarder and transport mode'
)

const rateCardListModalSource = pageSource.slice(
  pageSource.indexOf('title="现有报价表"'),
  pageSource.indexOf('title="批量维护类别"')
)
assert(
  rateCardListModalSource.includes("title: '类别说明'") &&
    rateCardListModalSource.includes('cargoCategoryDescription') &&
    !rateCardListModalSource.includes("title: '来源'") &&
    !rateCardListModalSource.includes('row.sourceReference'),
  'existing rate card table should show category descriptions and hide internal source metadata'
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
    manualQuoteModalSource.includes('onChange={mutations.handleManualQuoteCategoryChange}'),
  'manual current quote modal should choose a route category first and use the same category selector behavior as batch maintenance'
)

assert(
  pageCss.includes('.product-logistics-costs-page__batch-actions'),
  'batch category controls should have a dedicated compact layout class'
)

assert(
  pageSource.includes('copyable={{') &&
    pageSource.includes("tooltips: ['复制 PSKU', '已复制']"),
  'product logistics cost rows should expose a one-click PSKU copy action'
)

assert(
  pageSource.includes('product-logistics-costs-page__route-line') &&
    !pageSource.includes('direction="vertical" size={0} className="product-logistics-costs-page__route-cell"'),
  'site, forwarder and transport mode should render on one line'
)

const toolbarSource = pageSource.slice(
  pageSource.indexOf('className="product-logistics-costs-page__toolbar"'),
  pageSource.indexOf('className="product-logistics-costs-page__category-filters"')
)
assert(
  toolbarSource.includes('assignableSelectedRows.length') &&
    toolbarSource.includes('批量设类别'),
  'selected count and batch category action should stay on the main search toolbar row'
)

assert(
  pageSource.includes('className="product-logistics-costs-page__category-filters"') &&
    pageSource.includes('categoryFilterButtonClass') &&
    !pageSource.includes('className="product-logistics-costs-page__category-filter"'),
  'category filters should render as compact result-style buttons instead of a select'
)

const filterSummaryRowStart = pageSource.indexOf(
  'className="product-logistics-costs-page__filter-summary-row"'
)
const categoryFiltersStart = pageSource.indexOf(
  'className="product-logistics-costs-page__category-filters"',
  filterSummaryRowStart
)
const resultStatsStart = pageSource.indexOf(
  'className="product-logistics-costs-page__stats"',
  categoryFiltersStart
)
const resultStatsSource = pageSource.slice(
  resultStatsStart,
  pageSource.indexOf('</div>', resultStatsStart)
)
assert(
  filterSummaryRowStart >= 0 &&
    categoryFiltersStart > filterSummaryRowStart &&
    resultStatsStart > categoryFiltersStart &&
    pageCss.includes('.product-logistics-costs-page__filter-summary-row') &&
    pageCss.includes('flex-wrap: nowrap'),
  'category filters and result statistics should share one non-wrapping horizontal row'
)

assert(
  !resultStatsSource.includes('查询结果') &&
    resultStatsSource.includes('有数据') &&
    resultStatsSource.includes('无数据') &&
    resultStatsSource.includes("? 'ALL' : 'WITH_DATA'") &&
    resultStatsSource.includes("? 'ALL' : 'MISSING_DATA'"),
  'result statistics should only show the priced and missing toggles, with a second click restoring all rows'
)

const categoryFiltersCss = pageCss.slice(
  pageCss.indexOf('.product-logistics-costs-page__category-filters'),
  pageCss.indexOf('.product-logistics-costs-page__filter-label')
)
assert(
  categoryFiltersCss.includes('flex-wrap: wrap') &&
    !categoryFiltersCss.includes('overflow-x: auto'),
  'category filter tags should wrap onto a second row instead of using a horizontal scrollbar'
)

assert(
  pageSource.includes('categoryFilterLabel') &&
    pageSource.includes('searchMatchedRows.filter((row) => rowMatchesCategory(row, option.value)).length') &&
    pageSource.includes('全部类别 · ${searchMatchedRows.length}件'),
  'each category filter should show its route price and matching product count'
)

assert(
  pageSource.includes('option.count') &&
    pageSource.includes('product-logistics-costs-page__category-button--empty') &&
    pageCss.includes('.product-logistics-costs-page__category-button--tone-') &&
    pageCss.includes('.product-logistics-costs-page__category-button--empty'),
  'category filter tags should use distinct colors while zero-count categories stay gray'
)

assert(
  pageSource.includes('/api/product-logistics-costs/eligibility/current') &&
    pageSource.includes('/api/product-logistics-costs/current/manual-with-eligibility') &&
    pageSource.includes('货代承接状态') &&
    pageSource.includes('INQUIRY_REQUIRED') &&
    pageSource.includes('UNSUPPORTED'),
  'manual current quote should read and save the existing forwarder eligibility status'
)

assert(
  pageCss.includes('max-width: 320px') && pageCss.includes('flex: 0 1 320px'),
  'product logistics cost search should use a compact fixed maximum width'
)

assert(
  pageSource.includes('/api/product-logistics-costs/eligibility/current-list') &&
    pageSource.includes("title: '可发状态'") &&
    pageSource.includes("SUPPORTED: { label: '可发'") &&
    pageSource.includes("INQUIRY_REQUIRED: { label: '需询价'") &&
    pageSource.includes("UNSUPPORTED: { label: '不接'"),
  'product logistics cost rows should load and display the current forwarder eligibility status'
)

assert(
  pageCss.includes('.product-logistics-costs-page__route-line .product-logistics-costs-page__subtext') &&
    pageCss.includes('.product-logistics-costs-page__site-tag.ant-tag') &&
    pageCss.includes('font-size: 14px') &&
    pageCss.includes('.product-logistics-costs-page__category'),
  'route summary and category text should use the larger list typography'
)
