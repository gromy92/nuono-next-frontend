import assert from 'node:assert/strict'
import {
  applyAllProductImageAiSuggestions,
  applyProductImageAiSuggestionField,
  normalizeProductImageAiSuggestion
} from './aiExtractionDiff'

const profile = {
  titleEn: 'Existing title',
  titleAr: 'عنوان حالي',
  specSummary: 'Existing spec',
  heroSellingPoints: ['Existing point'],
  sizeSection: { attributesText: 'Existing size' },
  packageList: { attributesText: 'Existing package' },
  untouched: 'keep me'
}

const suggestion = normalizeProductImageAiSuggestion({
  titleEn: '5 Pieces Double Sided Adhesive Packaging Tape Set (10mm x 10m)',
  titleAr: '5 قطع مجموعة شريط لاصق مزدوج الجوانب للتغليف مع تفاصيل إضافية',
  specSummary: '5 Pieces · 10mm × 10m',
  heroSellingPoints: ['Strong adhesive', 'Easy to use'],
  sizeText: '10mm × 10m',
  packageText: '5 rolls'
})

assert.equal(suggestion.titleEn, 'Double Sided Adhesive Packaging Tape Set')

const acceptedOne = applyProductImageAiSuggestionField(profile, suggestion, 'titleEn')
assert.equal(acceptedOne.titleEn, suggestion.titleEn)
assert.equal(acceptedOne.specSummary, profile.specSummary)
assert.equal(acceptedOne.sizeSection.attributesText, profile.sizeSection.attributesText)
assert.equal(acceptedOne.untouched, 'keep me')

const acceptedAll = applyAllProductImageAiSuggestions(profile, suggestion)
assert.equal(acceptedAll.specSummary, '5 Pieces · 10mm × 10m')
assert.deepEqual(acceptedAll.heroSellingPoints, ['Strong adhesive', 'Easy to use'])
assert.equal(acceptedAll.packageList.attributesText, '5 rolls')

const acceptedPartial = applyAllProductImageAiSuggestions(profile, { titleEn: 'Short suggestion' })
assert.equal(acceptedPartial.titleEn, 'Short suggestion')
assert.equal(acceptedPartial.specSummary, profile.specSummary)
assert.deepEqual(acceptedPartial.heroSellingPoints, profile.heroSellingPoints)
