import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pageSource = readFileSync(join(process.cwd(), 'src/features/product-keywords/ProductKeywordDataPage.tsx'), 'utf8')

assert.match(pageSource, /data-testid="product-keyword-data-page"/)
assert.match(pageSource, /data-testid="product-keyword-store-filter"/)
assert.match(pageSource, /data-testid="product-keyword-status-filter"/)
assert.match(pageSource, /data-testid="product-keyword-table"/)
assert.match(pageSource, /OBSERVED/)
assert.match(pageSource, /ACTIVE/)
assert.match(pageSource, /titleCoverage/)
assert.match(pageSource, /competitorState/)
assert.match(pageSource, /adsState/)
