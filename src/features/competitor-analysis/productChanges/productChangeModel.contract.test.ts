import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import {
  buildNoonImageAssetUrl,
  buildProductChangeCompetitorCards,
  buildProductChangeRankItems,
  buildProductChangeSummary,
  formatProductChangeValue
} from './productChangeModel'
import type {
  CompetitorProductChangeGroup,
  CompetitorWatchProduct
} from '../types'

const product = {
  siteCode: 'SA',
  candidates: [{
    noonProductCode: 'ZCOMP001',
    title: 'Competitor One',
    imageUrl: 'https://example.test/one.jpg',
    canonicalUrl: 'https://www.noon.com/saudi-en/p/?o=ZCOMP001'
  }],
  keywords: [{ id: 'keyword-1', keyword: 'phone case' }],
  rankPoints: [{
    id: 'rank-1',
    keywordId: 'keyword-1',
    noonProductCode: 'ZCOMP001',
    factDate: '2026-07-27',
    rankStatus: 'ranked',
    rankNo: 12,
    rankChannel: 'organic',
    isSelf: false,
    isConfirmedCompetitor: true,
    isSponsored: false
  }]
} as CompetitorWatchProduct

const groups = [
  {
    factDate: '2026-07-28',
    noonProductCode: 'ZCOMP001',
    productName: 'Fallback name',
    subjectType: 'competitor',
    changes: [
      { fieldKey: 'price', fieldLabel: '价格', oldValue: 50, newValue: 45 },
      {
        fieldKey: 'main_image',
        fieldLabel: '主图',
        oldValue: 'catalog/product/one.jpg',
        newValue: { assetKey: 'one' }
      }
    ]
  }
] as CompetitorProductChangeGroup[]

assert.deepEqual(buildProductChangeSummary(groups), {
  changedDays: 1,
  fieldChanges: 1,
  priceChanges: 1,
  imageChanges: 0
})
const cards = buildProductChangeCompetitorCards(product, groups)
assert.equal(cards.length, 1)
assert.equal(cards[0].productName, 'Competitor One')
assert.equal(cards[0].dateGroups[0].changes[0].fieldKey, 'price')

assert.equal(
  buildNoonImageAssetUrl('catalog/product/one', 'catalog/product/two.jpg'),
  'https://f.nooncdn.com/p/catalog/product/one.jpg'
)
assert.equal(formatProductChangeValue({ amount: 45, currency: 'SAR' }), '45 SAR')
assert.deepEqual(buildProductChangeRankItems(product, 'zcomp001', '2026-07-28'), [{
  keyword: 'phone case',
  channel: '自然',
  status: '第 12 名'
}])

const pageSource = readFileSync(
  'src/features/competitor-analysis/CompetitorAnalysisPage.tsx',
  'utf8'
)
assert.doesNotMatch(
  pageSource,
  /function (?:ProductChangeModal|buildProductChangeCompetitorCards|buildNoonImageAssetUrl)\b/
)
