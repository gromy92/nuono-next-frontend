import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const pageSource = readFileSync(join(root, 'src/features/competitor-analysis/CompetitorAnalysisPage.tsx'), 'utf8')
const apiSource = readFileSync(join(root, 'src/features/competitor-analysis/api.ts'), 'utf8')
const typesSource = readFileSync(join(root, 'src/features/competitor-analysis/types.ts'), 'utf8')

assert.match(typesSource, /keywordNorm\?: string/)
assert.match(apiSource, /keywordNorm:\s*stringValue\(row\.keywordNorm\)/)

assert.match(pageSource, /ProductKeywordDetailDrawer/)
assert.match(pageSource, /selectedKeywordDetail/)
assert.match(pageSource, /setSelectedKeywordDetail/)
assert.match(pageSource, /onKeywordDetailOpen/)
assert.match(pageSource, /关键词详情/)
assert.match(pageSource, /competitorEvidence:\s*true/)
assert.match(pageSource, /keywordNorm:\s*keyword\.keywordNorm \|\| normalizeProductKeywordNorm\(keyword\.keyword\)/)
assert.match(pageSource, /storeCode:\s*product\.storeCode/)
assert.match(pageSource, /siteCode:\s*product\.siteCode/)
assert.match(pageSource, /partnerSku:\s*product\.partnerSku/)
