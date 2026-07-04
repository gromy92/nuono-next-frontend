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
assert.match(panelSource, /titleKeyword/)
assert.match(panelSource, /titleTypeLabel/)
assert.match(panelSource, /titleUsageStateLabel/)
assert.match(panelSource, /keyword\.titleTypes/)
assert.match(panelSource, /keyword\.titleUsageStates/)
assert.match(panelSource, /keyword\.competitorEvidence/)
assert.match(panelSource, /keyword\.adsEvidence/)
assert.match(panelSource, /keyword\.negativeCandidate/)
assert.match(panelSource, /adsEvidence/)
assert.match(panelSource, /competitorEvidence/)
assert.match(panelSource, /timeline/)
assert.match(panelSource, /fetchProductKeywordProduct/)
assert.match(panelSource, /流行词/)
assert.match(panelSource, /有广告证据/)
assert.match(panelSource, /有竞品证据/)
assert.doesNotMatch(panelSource, /keywordStatusLabel/)
assert.doesNotMatch(panelSource, /keywordStatusColor/)
assert.doesNotMatch(panelSource, /keyword\.status/)
assert.doesNotMatch(panelSource, /已纳入词库/)
assert.doesNotMatch(panelSource, /待确认候选/)
assert.doesNotMatch(panelSource, /已启用/)
assert.match(workbenchSource, /ProductKeywordPanel/)
