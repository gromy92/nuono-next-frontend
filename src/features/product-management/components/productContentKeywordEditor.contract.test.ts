import assert from 'node:assert/strict'
import {
  buildProductContentKeywordSaveChangeDetails,
  buildProductContentKeywordSaveChangeSummary,
  competitorMaterialsFromKeywordEvents,
  competitorSourceDisplayText,
  dedupeProductCompetitorContentTextItems,
  editableKeywordRowsFromPanel,
  noonCompetitorTextItems,
  titleKeywordChineseTranslations
} from './productContentKeywordEditor'
import { collectProductCompetitorContentTextItems } from './productCompetitorContentSources'
import type { ProductKeywordPanelView } from '../../product-keywords/types'

const panel: ProductKeywordPanelView = {
  storeCode: 'STR245027-NSA',
  siteCode: 'SA',
  partnerSku: 'CASE-001',
  keywords: [
    {
      id: 1,
      ownerUserId: 307,
      storeCode: 'STR245027-NSA',
      siteCode: 'SA',
      partnerSku: 'CASE-001',
      keyword: 'MagSafe',
      keywordNorm: 'magsafe',
      status: 'ACTIVE',
      titleTypes: ['CORE'],
      titleUsageStates: ['TITLE_TARGET']
    },
    {
      id: 2,
      ownerUserId: 307,
      storeCode: 'STR245027-NSA',
      siteCode: 'SA',
      partnerSku: 'CASE-001',
      keyword: 'random ads query',
      keywordNorm: 'random ads query',
      status: 'OBSERVED',
      adsEvidence: true
    }
  ],
  events: [
    {
      id: 91,
      ownerUserId: 307,
      storeCode: 'STR245027-NSA',
      siteCode: 'SA',
      partnerSku: 'CASE-001',
      keyword: 'MagSafe',
      keywordNorm: 'magsafe',
      sourceType: 'COMPETITOR_KEYWORD',
      eventNaturalKey: 'competitor-keyword:91',
      eventStatus: 'OBSERVED',
      occurredAt: '2026-07-07 12:00:00',
      payloadJson: JSON.stringify({
        competitorSources: [
          {
            label: 'Noon',
            url: 'https://www.noon.com/saudi-en/example/Z9F8E7D6C5/p/',
            sourceText: 'Noon MagSafe case title'
          },
          {
            label: 'Amazon SA',
            url: 'https://www.amazon.sa/dp/B0C1234567',
            sourceText: 'Amazon MagSafe case title'
          }
        ]
      })
    }
  ]
}

assert.deepEqual(editableKeywordRowsFromPanel(panel).map((row) => row.value), ['MagSafe'])

const materials = competitorMaterialsFromKeywordEvents(panel.events)
const textItems = collectProductCompetitorContentTextItems(materials, 'title', 'EN')
const noonItems = noonCompetitorTextItems(textItems)

assert.equal(textItems.length, 2)
assert.equal(noonItems.length, 1)
assert.equal(competitorSourceDisplayText(noonItems[0]), 'Noon Z9F8E7D6C5')

const duplicatedItems = dedupeProductCompetitorContentTextItems([
  noonItems[0],
  { ...noonItems[0], key: `${noonItems[0].key}-duplicate` }
])
assert.equal(duplicatedItems.length, 1)

const summary = buildProductContentKeywordSaveChangeSummary({
  fieldType: 'title',
  initialValue: 'Old title',
  draftValue: 'New title',
  rows: [
    { id: 'keyword-1', sourceKeywordId: 1, originalValue: 'MagSafe', value: 'MagSafe', competitorSourceKeys: [noonItems[0].key] },
    { id: 'manual-1', value: 'Shockproof' }
  ]
})

assert.deepEqual(summary.messages, ['确认修改标题', '确认添加竞品', '确认添加关键词'])

const details = buildProductContentKeywordSaveChangeDetails({
  fieldType: 'title',
  initialValue: 'Old title',
  draftValue: 'New title',
  rows: [
    { id: 'keyword-1', sourceKeywordId: 1, originalValue: 'MagSafe', value: 'MagSafe Pro', competitorSourceKeys: [noonItems[0].key] },
    { id: 'manual-1', value: 'Shockproof' }
  ],
  competitorLabelsByRowId: {
    'keyword-1': ['Noon Z9F8E7D6C5']
  }
})

assert.equal(details.titleBefore, 'Old title')
assert.equal(details.titleAfter, 'New title')
assert.deepEqual(details.keywordDetails, ['修改关键词：MagSafe → MagSafe Pro', '新增关键词：Shockproof'])
assert.deepEqual(details.competitorDetails, ['关键词「MagSafe Pro」添加竞品：Noon Z9F8E7D6C5'])

const descriptionSummary = buildProductContentKeywordSaveChangeSummary({
  fieldType: 'description',
  initialValue: 'Old description',
  draftValue: 'New description',
  rows: [{ id: 'manual-2', value: 'Should not count' }]
})

assert.deepEqual(descriptionSummary.messages, [])

assert.deepEqual(
  titleKeywordChineseTranslations([
    { key: 'arabic-case', label: 'جراب' },
    { key: 'arabic-magnetic', label: 'مغناطيسي' }
  ]),
  {
    'arabic-case': '保护壳',
    'arabic-magnetic': '磁吸'
  }
)

assert.deepEqual(
  titleKeywordChineseTranslations(
    [
      { key: 'arabic-case', label: 'جراب' },
      { key: 'arabic-magnetic', label: 'مغناطيسي' }
    ],
    'جراب\nمغناطيسي'
  ),
  {
    'arabic-case': '保护壳',
    'arabic-magnetic': '磁吸'
  }
)
