import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const historySectionPath = join(root, 'src/features/product-keywords/ProductKeywordHistorySection.tsx')
const historyDrawerPath = join(root, 'src/features/product-keywords/ProductKeywordHistoryDrawer.tsx')
const productHistoryModalSource = readFileSync(
  join(root, 'src/features/product-management/components/ProductHistoryModal.tsx'),
  'utf8'
)

assert.ok(existsSync(historySectionPath), 'keyword history section component should exist')
assert.ok(existsSync(historyDrawerPath), 'keyword history drawer component should exist')

const historySectionSource = readFileSync(historySectionPath, 'utf8')
const historyDrawerSource = readFileSync(historyDrawerPath, 'utf8')

assert.match(historySectionSource, /data-testid="product-keyword-history-section"/)
assert.match(historySectionSource, /关键词使用历史/)
assert.match(historySectionSource, /fetchProductKeywordProduct/)
assert.match(historySectionSource, /TITLE_HISTORY/)
assert.match(historySectionSource, /COMPETITOR_KEYWORD/)
assert.match(historySectionSource, /ADS_QUERY/)
assert.match(historySectionSource, /标题使用/)
assert.match(historySectionSource, /竞品出现/)
assert.match(historySectionSource, /广告搜索/)
assert.match(historyDrawerSource, /Drawer/)
assert.match(historyDrawerSource, /ProductKeywordHistorySection/)
assert.match(historyDrawerSource, /关键词历史/)
assert.match(productHistoryModalSource, /ProductKeywordHistorySection/)
assert.match(productHistoryModalSource, /productHistoryKeywordSiteCode/)
assert.match(productHistoryModalSource, /商品历史/)
