import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const listCellSource = readFileSync(
  join(root, 'src/features/product-management/components/ProductListIdentityCells.tsx'),
  'utf8'
)
const hoverSource = readFileSync(join(root, 'src/features/product-keywords/ProductKeywordListHoverPopover.tsx'), 'utf8')

assert.match(listCellSource, /ProductKeywordListHoverPopover/)
assert.match(listCellSource, /partnerSku=\{record\.partnerSku\}/)
assert.match(hoverSource, /Popover/)
assert.match(hoverSource, /fetchProductKeywordProduct/)
assert.match(hoverSource, /onOpenChange/)
assert.match(hoverSource, /data-testid="product-keyword-list-hover"/)
assert.match(hoverSource, /const label = '关键词'/)
assert.doesNotMatch(hoverSource, /关键词 \$\{panel\.keywords\.length\}/)
assert.match(hoverSource, /function keywordStatusLabel/)
assert.match(hoverSource, /function keywordIntentLabel/)
assert.match(hoverSource, /keywordStatusLabel\(keyword\.status\)/)
assert.match(hoverSource, /keywordIntentLabel\(tag\)/)
assert.match(hoverSource, /已启用/)
assert.match(hoverSource, /广告搜索词/)
assert.match(hoverSource, /核心词/)
assert.match(hoverSource, /标题目标词/)
assert.match(hoverSource, /竞品跟踪词/)
assert.match(hoverSource, /TITLE_HISTORY/)
assert.match(hoverSource, /COMPETITOR_KEYWORD/)
assert.match(hoverSource, /ADS_QUERY/)
