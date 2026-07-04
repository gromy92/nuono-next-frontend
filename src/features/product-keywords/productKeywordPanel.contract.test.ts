import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const panelSource = readFileSync(join(root, 'src/features/product-keywords/ProductKeywordPanel.tsx'), 'utf8')
const workbenchSource = readFileSync(
  join(root, 'src/features/product-management/components/ProductDetailWorkbenchView.tsx'),
  'utf8'
)

assert.match(panelSource, /data-testid="product-keyword-panel"/)
assert.match(panelSource, /titleTarget/)
assert.match(panelSource, /adsEvidence/)
assert.match(panelSource, /competitorEvidence/)
assert.match(panelSource, /timeline/)
assert.match(panelSource, /fetchProductKeywordProduct/)
assert.match(workbenchSource, /ProductKeywordPanel/)
