import assert from 'node:assert/strict';
import {
  matchingCompetitorsForKeyword,
  mergeAiSuggestedKeywordRows,
  productTitleContainsKeyword,
  sharedAiTitleKeywords,
  withAutomaticKeywordCompetitorMatches
} from './productKeywordCompetitorMatching'
import type { ProductCompetitorContentTextItem } from './productCompetitorContentSources'

const competitors: ProductCompetitorContentTextItem[] = [
  {
    key: 'noon-magnetic',
    text: 'Magnetic Case for iPhone 17 Pro Max Compatible with MagSafe',
    source: { label: 'Noon', platform: 'noon', displayCode: 'ZMAGNETIC' }
  },
  {
    key: 'noon-clear',
    text: 'Clear Protective Cover for iPhone 17 Pro Max',
    source: { label: 'Noon', platform: 'noon', displayCode: 'ZCLEAR' }
  },
  {
    key: 'noon-unrelated',
    text: 'Ceramic Bedside Table Lamp',
    source: { label: 'Noon', platform: 'noon', displayCode: 'ZLAMP' }
  }
]

const productTitle = 'Magnetic Case for iPhone 17 Pro Max with MagSafe'

assert.equal(productTitleContainsKeyword(productTitle, 'iPhone 17 Pro Max'), true)
assert.equal(productTitleContainsKeyword(productTitle, 'iPhone 17 Pro'), true)
assert.equal(productTitleContainsKeyword(productTitle, 'Phone 17 Pro'), false)
assert.equal(productTitleContainsKeyword(productTitle, 'Lamp'), false)

assert.deepEqual(
  matchingCompetitorsForKeyword(productTitle, 'MagSafe', competitors).map((item) => item.key),
  ['noon-magnetic'],
  'A competitor is eligible only when the same keyword exists in both product and competitor titles'
)
assert.deepEqual(
  matchingCompetitorsForKeyword(productTitle, 'Clear', competitors),
  [],
  'A keyword present only in the competitor title must not create an association'
)

const automaticRows = withAutomaticKeywordCompetitorMatches([
  { id: 'magsafe', value: 'MagSafe' },
  { id: 'iphone', value: 'iPhone 17 Pro Max' },
  { id: 'clear', value: 'Clear' }
], productTitle, competitors)

assert.deepEqual(automaticRows[0].competitorSourceKeys, ['noon-magnetic'])
assert.deepEqual(automaticRows[1].competitorSourceKeys, ['noon-magnetic', 'noon-clear'])
assert.deepEqual(automaticRows[2].competitorSourceKeys, [])

const aiRows = mergeAiSuggestedKeywordRows(
  [{ id: 'existing', value: 'MagSafe' }],
  ['magsafe', 'iPhone 17 Pro Max', 'Lamp']
)
assert.deepEqual(aiRows.map((row) => row.value), ['MagSafe', 'iPhone 17 Pro Max', 'Lamp'])
assert.equal(aiRows[1].automatic, true, 'AI suggestions should stay observed instead of becoming manual active keywords')

assert.deepEqual(
  sharedAiTitleKeywords(productTitle, ['MagSafe', 'iPhone 17 Pro Max', 'Clear', 'Lamp'], competitors),
  [
    { key: 'magsafe', label: 'MagSafe', competitorCount: 1 },
    { key: 'iphone 17 pro max', label: 'iPhone 17 Pro Max', competitorCount: 2 }
  ],
  'AI keywords shown as shared must pass the same two-title matching rule'
)
