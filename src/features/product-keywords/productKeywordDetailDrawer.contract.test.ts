import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const detailDrawerPath = join(root, 'src/features/product-keywords/ProductKeywordDetailDrawer.tsx')

assert.ok(existsSync(detailDrawerPath), 'product keyword detail drawer should exist')

const detailDrawerSource = readFileSync(detailDrawerPath, 'utf8')
const dataPageSource = readFileSync(join(root, 'src/features/product-keywords/ProductKeywordDataPage.tsx'), 'utf8')

assert.match(detailDrawerSource, /data-testid="product-keyword-detail-drawer"/)
assert.match(detailDrawerSource, /关键词详情/)
assert.match(detailDrawerSource, /标题/)
assert.match(detailDrawerSource, /竞品/)
assert.match(detailDrawerSource, /广告/)
assert.match(detailDrawerSource, /ProductKeywordHistorySection/)
assert.match(detailDrawerSource, /有竞品证据/)
assert.match(detailDrawerSource, /无竞品证据/)
assert.match(detailDrawerSource, /有广告证据/)
assert.match(detailDrawerSource, /无广告证据/)
assert.match(detailDrawerSource, /否词候选/)
assert.match(detailDrawerSource, /核心词/)
assert.match(detailDrawerSource, /流行词/)
assert.match(detailDrawerSource, /当前已覆盖/)
assert.doesNotMatch(detailDrawerSource, /已启用/)
assert.doesNotMatch(detailDrawerSource, /\{keyword\.status\}/)
assert.doesNotMatch(detailDrawerSource, /OBSERVED/)
assert.doesNotMatch(detailDrawerSource, /ADDED/)

assert.match(dataPageSource, /ProductKeywordDetailDrawer/)
assert.match(dataPageSource, /selectedDetailKeyword/)
assert.match(dataPageSource, /setSelectedDetailKeyword\(row\)/)
assert.match(dataPageSource, />详情</)
