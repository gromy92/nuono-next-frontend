import assert from 'node:assert/strict'
import {
  extractSharedProductTitleKeywords,
  normalizeProductTitleKeywordInput,
  parseProductTitleKeywordInputList,
  splitProductTitleKeywordHighlights
} from './productCompetitorContentKeywords'

const sharedKeywords = extractSharedProductTitleKeywords(
  'Refined Modern Ceramic Bedside Table Lamp with Linen Shade',
  [
    'Luxury Ceramic Table Lamp with Linen Shade',
    'Modern Bedside Lamp for Bedroom Decor',
    'Unrelated storage box'
  ]
)

assert.deepEqual(
  sharedKeywords.map((keyword) => keyword.label),
  ['Modern', 'Ceramic', 'Bedside', 'Table', 'Lamp', 'Linen', 'Shade']
)
assert.equal(sharedKeywords.find((keyword) => keyword.label === 'Lamp')?.competitorCount, 2)

const phoneCaseKeywords = extractSharedProductTitleKeywords(
  'Magnetic Case For iPhone 17 Pro Max Compatible With MagSafe, Black',
  [
    'for iPhone 17 Pro Max Magnetic Case Compatible with MagSafe',
    'Black Rugged Cover for iPhone 17 Pro Max'
  ],
  { maxKeywords: 6 }
)

assert.deepEqual(
  phoneCaseKeywords.map((keyword) => keyword.label),
  ['Magnetic', 'Case', 'iPhone', '17', 'Pro', 'Max']
)

const noSharedKeywords = extractSharedProductTitleKeywords('Refined Wood Desk Organizer', [
  'Ceramic bedside lamp'
])

assert.deepEqual(noSharedKeywords, [])

assert.equal(normalizeProductTitleKeywordInput('  MagSafe!!  '), 'MagSafe')
assert.equal(normalizeProductTitleKeywordInput(' with '), '')
assert.deepEqual(
  parseProductTitleKeywordInputList('MagSafe, shockproof\nCase；iPhone 17 Pro Max\nwith'),
  ['MagSafe', 'shockproof', 'Case', 'iPhone 17 Pro Max'],
  'Manual keyword input should accept multiple comma/newline/semicolon separated keywords'
)

const highlightedTitle = 'Magnetic Case for iPhone 17 Pro Max compatible with MagSafe, black'
const highlightedParts = splitProductTitleKeywordHighlights(highlightedTitle, [
  { key: 'magsafe', label: 'magsafe', competitorCount: 2 },
  { key: 'case', label: 'Case', competitorCount: 1 }
])

assert.equal(
  highlightedParts.map((part) => part.text).join(''),
  highlightedTitle,
  'Keyword highlighting must preserve the original title text'
)
assert.deepEqual(
  highlightedParts.filter((part) => part.highlighted).map((part) => part.text),
  ['Case', 'MagSafe'],
  'Keyword highlighting should be case-insensitive while keeping original casing'
)

const overlappingHighlights = splitProductTitleKeywordHighlights('iPhone 17 Pro Max shockproof case', [
  { key: 'iphone', label: 'iPhone', competitorCount: 2 },
  { key: 'iphone 17 pro max', label: 'iPhone 17 Pro Max', competitorCount: 2 }
])

assert.deepEqual(
  overlappingHighlights.filter((part) => part.highlighted).map((part) => part.text),
  ['iPhone 17 Pro Max'],
  'Longer keyword phrases should win over nested shorter keywords'
)
