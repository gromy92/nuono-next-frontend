import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const pageSource = readFileSync(join(root, 'src/features/competitor-analysis/CompetitorAnalysisPage.tsx'), 'utf8')
const apiSource = readFileSync(join(root, 'src/features/competitor-analysis/api.ts'), 'utf8')

assert.match(apiSource, /type CompetitorWatchProductCreateInput = \{[\s\S]*productSiteOfferId\?: string/)
assert.match(apiSource, /type CompetitorWatchProductCreateInput = \{[\s\S]*partnerSku\?: string/)
assert.match(
  apiSource,
  /Boolean\(item\.productSiteOfferId \|\| item\.partnerSku\)/,
  'baseline options should keep partnerSku-only rows instead of requiring productSiteOfferId'
)

assert.doesNotMatch(
  pageSource,
  /!product\.productSiteOfferId\s*\|\|\s*!hasValidSelfNoonCode\(product\)/,
  'creating a watch product must not require productSiteOfferId when partnerSku is available'
)
assert.match(pageSource, /!\(product\.partnerSku \|\| product\.productSiteOfferId\)/)
assert.match(pageSource, /partnerSku:\s*product\.partnerSku/)
