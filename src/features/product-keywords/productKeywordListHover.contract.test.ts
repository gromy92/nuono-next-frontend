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
assert.match(hoverSource, /TITLE_HISTORY/)
assert.match(hoverSource, /COMPETITOR_KEYWORD/)
assert.match(hoverSource, /ADS_QUERY/)
