import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const pageSource = readFileSync(
  'src/features/competitor-analysis/CompetitorAnalysisPage.tsx',
  'utf8'
)

assert.doesNotMatch(pageSource, /from '\.\/api'/)
assert.doesNotMatch(pageSource, /fetchCompetitor/)
assert.doesNotMatch(pageSource, /const productColumns\b/)
assert.doesNotMatch(pageSource, /function (?:CandidateCard|RankHeatmap)\b/)
assert.match(pageSource, /useCompetitorProductCatalog/)
assert.match(pageSource, /useCompetitorMonitoringActions/)
assert.match(pageSource, /useCompetitorKeywordActions/)
assert.match(pageSource, /useCompetitorCandidateActions/)
assert.match(pageSource, /useCompetitorReport/)
assert.match(pageSource, /<CompetitorAnalysisOverlays\b/)
